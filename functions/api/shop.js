// GET /api/shop — the product list and whether online ordering is open.
import shop from "../../shop-config.js";

export function onRequestGet() {
  return new Response(JSON.stringify(shop), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
  });
}
