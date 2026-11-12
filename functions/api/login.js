// POST /api/login  { password }  → signs this device in (sets a cookie)
// POST /api/login  { logout: true } → signs it out
import { passwordOk, loginCookie, logoutCookie } from "../../lib/auth.js";

function json(body, status, cookie) {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(JSON.stringify(body), { status: status || 200, headers });
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { body = {}; }

  if (body.logout) return json({ ok: true }, 200, logoutCookie);

  if (!env.ADMIN_PASSWORD) {
    return json({ error: "setup", message: "Staff sign-in isn't set up yet. Add ADMIN_PASSWORD in Cloudflare Pages settings (see SETUP.md)." }, 503);
  }
  if (!(await passwordOk(body.password, env))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return json({ error: "auth", message: "That password isn't right. Try again." }, 401);
  }
  return json({ ok: true }, 200, await loginCookie(env));
}

export function onRequest() {
  return json({ error: "method" }, 405);
}
