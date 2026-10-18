/* ==========================================================
   Cloudflare Pages Function — /api/photos
   Lets the admin page list and delete gallery photos.

   Needs these environment variables in Cloudflare Pages
   (Settings → Variables and Secrets, set as "Secret"):
     ADMIN_PASSWORD         password for the admin page
     CLOUDINARY_API_KEY     Cloudinary → Settings → API Keys
     CLOUDINARY_API_SECRET  same place
   Optional:
     CLOUDINARY_CLOUD_NAME  defaults to the one in gallery-config.js
     GALLERY_TAG            defaults to "ourwork"

   The API secret never leaves Cloudflare — the browser only
   ever sends the admin password.
   ========================================================== */

const DEFAULT_CLOUD = "kgmzbdgl";
const DEFAULT_TAG = "ourwork";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function digest(algo, text) {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Compare hashes rather than raw strings so timing doesn't leak the password.
async function passwordOk(given, expected) {
  const a = await digest("SHA-256", given || "");
  const b = await digest("SHA-256", expected);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function onRequestPost({ request, env }) {
  const cloud = env.CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUD;
  const tag = env.GALLERY_TAG || DEFAULT_TAG;
  const key = env.CLOUDINARY_API_KEY;
  const secret = env.CLOUDINARY_API_SECRET;

  if (!env.ADMIN_PASSWORD || !key || !secret) {
    return json({ error: "setup", message: "The admin page isn't set up yet. Add ADMIN_PASSWORD, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Cloudflare Pages settings." }, 503);
  }

  if (!(await passwordOk(request.headers.get("X-Admin-Password"), env.ADMIN_PASSWORD))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return json({ error: "auth", message: "Wrong password." }, 401);
  }

  let body;
  try { body = await request.json(); } catch (e) { body = {}; }

  if (body.action === "list") {
    const url = `https://api.cloudinary.com/v1_1/${cloud}/resources/image/tags/${encodeURIComponent(tag)}?max_results=500`;
    const r = await fetch(url, { headers: { Authorization: "Basic " + btoa(key + ":" + secret) } });
    if (!r.ok) return json({ error: "cloudinary", message: "Couldn't load photos (" + r.status + ")." }, 502);
    const data = await r.json();
    const photos = (data.resources || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((p) => ({
        id: p.public_id,
        created: p.created_at,
        thumb: `https://res.cloudinary.com/${cloud}/image/upload/c_fill,w_300,h_300,f_auto,q_auto/v${p.version}/${p.public_id}.${p.format}`,
      }));
    return json({ photos });
  }

  if (body.action === "delete") {
    const id = String(body.id || "");
    if (!id || id.length > 300) return json({ error: "bad", message: "Missing photo id." }, 400);

    const timestamp = Math.floor(Date.now() / 1000);
    // Cloudinary signature: params sorted alphabetically, joined with &, secret appended.
    const signature = await digest("SHA-1", `invalidate=true&public_id=${id}&timestamp=${timestamp}${secret}`);
    const form = new FormData();
    form.append("public_id", id);
    form.append("invalidate", "true");
    form.append("timestamp", String(timestamp));
    form.append("api_key", key);
    form.append("signature", signature);

    const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, { method: "POST", body: form });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.result !== "ok") {
      return json({ error: "cloudinary", message: "Couldn't delete that photo (" + (data.result || r.status) + ")." }, 502);
    }
    return json({ ok: true });
  }

  if (body.action === "check") return json({ ok: true });

  return json({ error: "bad", message: "Unknown action." }, 400);
}

export function onRequest() {
  return json({ error: "method" }, 405);
}
