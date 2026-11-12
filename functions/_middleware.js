import shop from "../shop-config.js";
import { isStaff } from "../lib/auth.js";

// Staff-only pages. The server refuses to send them unless this device is
// signed in. /order opens to everyone once shop-config.js says open: true.
const STAFF_PAGES = /^\/(staff|orders|mockup|order)(\.html)?\/?$/;

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  // Send the old pages.dev address and www to the real domain, so Google
  // only ever sees one version of the site (preview deploys are left alone).
  if (url.hostname === "eembroidered.pages.dev" || url.hostname === "www.eembroidered.com") {
    url.hostname = "eembroidered.com";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  const m = url.pathname.match(STAFF_PAGES);
  if (m && !(m[1] === "order" && shop.open && !url.searchParams.has("staff"))) {
    if (!(await isStaff(request, env))) {
      const back = url.pathname + url.search;
      return new Response(null, {
        status: 302,
        headers: { Location: "/staff-login?next=" + encodeURIComponent(back), "Cache-Control": "no-store" },
      });
    }
    const res = await next();
    const out = new Response(res.body, res);
    out.headers.set("Cache-Control", "private, no-store");
    return out;
  }

  return next();
}
