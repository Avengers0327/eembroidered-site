/* ==========================================================
   Cloudflare Pages Function — /api/orders
   Saves customer orders and lets staff track them.

   Needs in Cloudflare Pages settings:
     ORDERS           KV namespace binding (Settings → Bindings)
     ADMIN_PASSWORD   the same staff password the admin page uses
   Optional:
     NOTIFY_FORM_URL  Formspree URL that emails the shop about each
                      new order ("off" disables it)
   ========================================================== */
import shop from "../../shop-config.js";
import { isStaff } from "../../lib/auth.js";

const STATUSES = ["new", "making", "ready", "done", "cancelled"];
const DEFAULT_NOTIFY = "https://formspree.io/f/xpqvvwnz";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

const str = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
const cloudUrl = (v) => {
  const s = str(v, 400);
  return /^https:\/\/res\.cloudinary\.com\//.test(s) ? s : "";
};

function cleanItem(raw) {
  const product = shop.products.find((p) => p.id === raw.productId);
  if (!product) return null;
  const sizes = {};
  let qty = 0;
  if (product.sized && raw.sizes && typeof raw.sizes === "object") {
    for (const s of shop.sizes) {
      const n = Math.max(0, Math.min(999, parseInt(raw.sizes[s], 10) || 0));
      if (n) { sizes[s] = n; qty += n; }
    }
  }
  if (!qty) qty = Math.max(1, Math.min(999, parseInt(raw.qty, 10) || 1));
  const color = shop.colors.find((c) => c.name === raw.color);
  return {
    productId: product.id,
    name: product.name,
    from: product.from,
    color: color ? color.name : "",
    qty,
    sizes,
    placement: str(raw.placement, 40),
    text: str(raw.text, 200),
    details: str(raw.details, 1000),
    designUrl: cloudUrl(raw.designUrl),
    artUrls: (Array.isArray(raw.artUrls) ? raw.artUrls : []).map(cloudUrl).filter(Boolean).slice(0, 4),
  };
}

async function newId(kv) {
  for (let i = 0; i < 8; i++) {
    const id = "EE-" + String(1000 + Math.floor(Math.random() * 9000));
    if (!(await kv.get("o:" + id))) return id;
  }
  return "EE-" + Date.now().toString().slice(-7);
}

const save = (kv, order) =>
  kv.put("o:" + order.id, JSON.stringify(order), { metadata: { s: order.status, c: order.created } });

async function notify(env, order) {
  const url = env.NOTIFY_FORM_URL || DEFAULT_NOTIFY;
  if (url === "off") return;
  const lines = order.items.map((it) => {
    const sizes = Object.entries(it.sizes).map(([s, n]) => n + " " + s).join(", ");
    return it.qty + " x " + it.name + (it.color ? " (" + it.color + ")" : "") + (sizes ? " - " + sizes : "");
  });
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: "New online order " + order.id + " - " + order.customer.name,
        order: order.id,
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        items: lines.join("\n"),
        needed_by: order.neededBy,
        notes: order.notes,
        message: "Open the Orders page on the website to see the full order.",
      }),
    });
  } catch (e) { /* the order is saved either way */ }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.ORDERS;
  if (!kv || !env.ADMIN_PASSWORD) {
    return json({ error: "setup", message: "Online orders aren't set up yet. Add the ORDERS storage and ADMIN_PASSWORD in Cloudflare Pages settings (see SETUP.md)." }, 503);
  }

  let body;
  try { body = await request.json(); } catch (e) { body = {}; }
  const staff = await isStaff(request, env);

  /* ---------- customer: place an order ---------- */
  if (body.action === "create") {
    if (!shop.open && !staff) return json({ error: "closed", message: "Online ordering isn't open yet. Please call or text (201) 916-3221." }, 403);
    if (body.hp) return json({ ok: true, id: "EE-0000" }); // honeypot: pretend it worked

    if (!staff) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const key = "rl:" + ip;
      const n = parseInt(await kv.get(key), 10) || 0;
      if (n >= 6) return json({ error: "slow", message: "That's a lot of orders in a short time. Please call us at (201) 916-3221." }, 429);
      await kv.put(key, String(n + 1), { expirationTtl: 900 });
    }

    const o = body.order || {};
    const c = o.customer || {};
    const customer = { name: str(c.name, 80), phone: str(c.phone, 30), email: str(c.email, 120) };
    const items = (Array.isArray(o.items) ? o.items : []).slice(0, 12).map(cleanItem).filter(Boolean);
    if (!customer.name) return json({ error: "bad", message: "Please enter your name." }, 400);
    if (customer.phone.replace(/\D/g, "").length < 10) return json({ error: "bad", message: "Please enter a phone number with area code so we can reach you." }, 400);
    if (!items.length) return json({ error: "bad", message: "Please add at least one item." }, 400);

    const now = new Date().toISOString();
    const order = {
      id: await newId(kv),
      created: now,
      status: "new",
      source: staff ? "staff" : "web",
      customer,
      neededBy: str(o.neededBy, 20),
      notes: str(o.notes, 1500),
      items,
      staffNote: "",
      history: [{ at: now, status: "new" }],
    };
    await save(kv, order);
    context.waitUntil(notify(env, order));
    return json({ ok: true, id: order.id });
  }

  /* ---------- everything below is staff only ---------- */
  if (!staff) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return json({ error: "auth", message: "Wrong password." }, 401);
  }

  if (body.action === "check") return json({ ok: true });

  if (body.action === "list") {
    const cutoff = Date.now() - 45 * 864e5; // finished orders drop off the board after 45 days
    const keys = [];
    let cursor;
    do {
      const page = await kv.list({ prefix: "o:", cursor });
      keys.push(...page.keys);
      cursor = page.list_complete ? null : page.cursor;
    } while (cursor && keys.length < 2000);

    const wanted = keys.filter((k) => {
      const m = k.metadata || {};
      const finished = m.s === "done" || m.s === "cancelled";
      return !finished || !m.c || new Date(m.c).getTime() > cutoff;
    });
    const orders = (await Promise.all(wanted.map((k) => kv.get(k.name, "json")))).filter(Boolean);
    orders.sort((a, b) => new Date(b.created) - new Date(a.created));
    return json({ orders });
  }

  if (body.action === "update") {
    const order = await kv.get("o:" + str(body.id, 20), "json");
    if (!order) return json({ error: "missing", message: "That order couldn't be found." }, 404);
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) return json({ error: "bad", message: "Unknown status." }, 400);
      if (order.status !== body.status) {
        order.status = body.status;
        order.history = (order.history || []).concat({ at: new Date().toISOString(), status: body.status }).slice(-30);
      }
    }
    if (body.staffNote !== undefined) order.staffNote = str(body.staffNote, 1500);
    if (body.price !== undefined) order.price = str(body.price, 20);
    await save(kv, order);
    return json({ ok: true, order });
  }

  return json({ error: "bad", message: "Unknown action." }, 400);
}

export function onRequest() {
  return json({ error: "method" }, 405);
}
