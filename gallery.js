(function () {
  "use strict";

  var cfg = window.GALLERY_CONFIG || {};
  var grid = document.getElementById("galleryGrid");
  if (!grid) return;

  var configured = cfg.cloudName && cfg.cloudName.indexOf("PASTE_") !== 0;
  if (!configured) return; // leave the built-in photos showing

  var tag = cfg.tag || "ourwork";
  var listUrl = "https://res.cloudinary.com/" + cfg.cloudName +
                "/image/list/" + tag + ".json?t=" + Date.now();

  fetch(listUrl)
    .then(function (r) {
      if (!r.ok) throw new Error("list unavailable");
      return r.json();
    })
    .then(function (data) {
      var items = (data && data.resources) || [];
      if (!items.length) return; // keep the built-in photos

      items.sort(function (a, b) {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });

      var html = items.map(function (r) {
        var src = "https://res.cloudinary.com/" + cfg.cloudName +
                  "/image/upload/f_auto,q_auto,w_900/v" + r.version +
                  "/" + r.public_id + "." + r.format;
        return '<figure><img src="' + src + '" alt="Custom embroidery work by Everything Embroidered" loading="lazy"></figure>';
      }).join("");

      grid.innerHTML = html;
    })
    .catch(function () {
      // Network problem or listing not enabled — built-in photos stay visible.
    });
})();
