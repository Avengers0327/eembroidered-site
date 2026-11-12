// Send the old pages.dev address and www to the real domain, so Google
// only ever sees one version of the site (preview deploys are left alone).
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === "eembroidered.pages.dev" || url.hostname === "www.eembroidered.com") {
    url.hostname = "eembroidered.com";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
