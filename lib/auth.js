/* Staff sign-in shared by the Pages Functions.
   A signed-in device carries an HttpOnly cookie holding an HMAC of the
   staff password, so changing ADMIN_PASSWORD signs every device out.
   No secrets live in this file. */

export const COOKIE = "ee_staff";

async function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function token(password) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return "v1." + await hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("ee-staff-session")));
}

function same(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha(text) {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text || "")));
}

export async function passwordOk(given, env) {
  if (!given || !env.ADMIN_PASSWORD) return false;
  return same(await sha(given), await sha(env.ADMIN_PASSWORD));
}

function readCookie(request) {
  const m = (request.headers.get("Cookie") || "").match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([^;]+)"));
  return m ? m[1] : "";
}

// Signed in = valid cookie, or the password sent in the X-Admin-Password header.
export async function isStaff(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const c = readCookie(request);
  if (c && same(c, await token(env.ADMIN_PASSWORD))) return true;
  return passwordOk(request.headers.get("X-Admin-Password"), env);
}

export async function loginCookie(env) {
  return `${COOKIE}=${await token(env.ADMIN_PASSWORD)}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`;
}

export const logoutCookie = `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
