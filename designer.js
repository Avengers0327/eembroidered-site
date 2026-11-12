/* ==========================================================
   EEDesigner — the drag-and-drop product designer.
   Used by the customer order page and the staff mockup page.

   var d = EEDesigner.create(containerElement, { shape: "tshirt", color: "#FFFFFF" });
   d.setShape("hoodie"); d.setColor("#1C2B3A");
   d.hasContent(); d.getText(); d.getFiles(); d.getPlacement();
   d.exportBlob().then(function (pngBlob) { ... });
   ========================================================== */
(function () {
  "use strict";

  var W = 600, H = 680;

  // Real photos of blank white items (transparent background). The designer
  // tints the photo to the chosen colour and blends the design into the fabric.
  // area = the dotted box where the design goes, as fractions of the photo.
  var SHAPES = {
    tshirt: { src: "/mockups/tshirt.webp", area: { x: 0.30, y: 0.24, w: 0.40, h: 0.52 }, apparel: true },
    polo:   { src: "/mockups/polo.webp",   area: { x: 0.30, y: 0.34, w: 0.40, h: 0.46 }, apparel: true },
    hoodie: { src: "/mockups/hoodie.webp", area: { x: 0.30, y: 0.30, w: 0.40, h: 0.32 }, apparel: true },
    hat:    { src: "/mockups/hat.webp",    area: { x: 0.30, y: 0.22, w: 0.40, h: 0.32 } },
    tote:   { src: "/mockups/tote.webp",   area: { x: 0.22, y: 0.42, w: 0.56, h: 0.44 } },
    towel:  { src: "/mockups/towel.webp",  area: { x: 0.20, y: 0.12, w: 0.60, h: 0.42 } }
  };
  var SCALE = 1.5; // canvas pixels per design unit, for a sharp picture
  var photos = {};  // src -> { img, ready, waiting: [fn] }

  function loadPhoto(src, done) {
    var p = photos[src];
    if (!p) {
      p = photos[src] = { img: new Image(), ready: false, waiting: [] };
      p.img.onload = function () { p.ready = true; p.waiting.forEach(function (f) { f(); }); p.waiting = []; };
      p.img.src = src;
    }
    if (p.ready) done(); else p.waiting.push(done);
  }

  function layerCanvas() {
    var c = document.createElement("canvas");
    c.width = W * SCALE; c.height = H * SCALE;
    var x = c.getContext("2d");
    x.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    return { c: c, x: x };
  }

  var PLACEMENTS = [
    { id: "left", label: "Left chest", cx: 0.76, cy: 0.12, size: 0.30 },
    { id: "center", label: "Center chest", cx: 0.5, cy: 0.24, size: 0.55 },
    { id: "big", label: "Big on front", cx: 0.5, cy: 0.45, size: 0.92 }
  ];

  var FONTS = [
    { label: "Classic", css: "'Fraunces', Georgia, serif", weight: 700 },
    { label: "Plain", css: "'Inter', Arial, sans-serif", weight: 700 },
    { label: "Script", css: "'Dancing Script', 'Brush Script MT', cursive", weight: 700 }
  ];

  var INKS = ["#FFFFFF", "#1E1E1E", "#1C2B3A", "#B3261E", "#C99A44", "#2452A6", "#233D2E", "#F2A7BB"];

  var CSS =
    "@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');" +
    ".eed{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:22px;align-items:start}" +
    "@media(max-width:820px){.eed{grid-template-columns:1fr}}" +
    ".eed-stage{background:#fff;border-radius:18px;box-shadow:0 10px 30px rgba(28,43,58,.08);padding:10px;position:relative}" +
    ".eed-stage canvas{width:100%;height:auto;display:block;border-radius:12px;cursor:grab}" +
    ".eed-stage.drop{outline:4px dashed #C1613D;outline-offset:-4px}" +
    ".eed-tip{text-align:center;color:#57534A;font-size:1rem;margin:10px 4px 4px}" +
    ".eed-panel{display:flex;flex-direction:column;gap:14px}" +
    ".eed-box{background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(28,43,58,.08);padding:18px}" +
    ".eed-box h4{font-family:'Inter',sans-serif;font-size:1.05rem;margin:0 0 12px;color:#1C2B3A}" +
    ".eed-btn{font-family:'Inter',sans-serif;font-size:1.1rem;font-weight:700;border-radius:14px;border:2px solid #1C2B3A;background:#fff;color:#1C2B3A;padding:16px 14px;cursor:pointer;min-height:58px;line-height:1.2}" +
    ".eed-btn:hover{background:#F1E9DA}" +
    ".eed-btn.primary{background:#C1613D;border-color:#C1613D;color:#fff;width:100%;font-size:1.2rem;padding:20px 14px}" +
    ".eed-btn.primary:hover{background:#A64F31}" +
    ".eed-btn.on{background:#1C2B3A;color:#fff}" +
    ".eed-btn.danger{border-color:#B03A2E;color:#B03A2E}" +
    ".eed-btn:disabled{opacity:.4;cursor:default}" +
    ".eed-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px}" +
    ".eed-text{display:flex;gap:10px;margin-bottom:12px}" +
    ".eed-text input{flex:1;min-width:0;font-size:1.15rem;padding:14px;border:2px solid #D9CFBD;border-radius:12px;font-family:'Inter',sans-serif}" +
    ".eed-inks{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}" +
    ".eed-ink{width:44px;height:44px;border-radius:50%;border:3px solid #D9CFBD;cursor:pointer;padding:0}" +
    ".eed-ink.on{border-color:#C1613D;box-shadow:0 0 0 3px rgba(193,97,61,.35)}" +
    ".eed-msg{color:#B03A2E;font-weight:600;min-height:1.3em;margin-top:8px}" +
    ".eed-sub{color:#7A7365;font-size:.95rem;margin:10px 0 0}";

  function injectCss() {
    if (document.getElementById("eed-css")) return;
    var s = document.createElement("style");
    s.id = "eed-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function isDark(hex) {
    var n = parseInt(hex.replace("#", ""), 16);
    var r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) < 130;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function create(root, opts) {
    injectCss();
    opts = opts || {};
    var shapeName = SHAPES[opts.shape] ? opts.shape : "tshirt";
    var color = opts.color || "#FFFFFF";
    var layers = [];
    var files = [];
    var selected = null;
    var placement = "";
    var fontIdx = 0;
    var ink = null; // null = pick automatically from the item colour

    /* ---------- build the screen ---------- */
    root.innerHTML = "";
    var wrap = el("div", "eed");
    var stage = el("div", "eed-stage");
    var canvas = el("canvas");
    canvas.width = W * SCALE; canvas.height = H * SCALE;
    canvas.setAttribute("aria-label", "Design preview");
    var ctx = canvas.getContext("2d");
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    var tinted = layerCanvas();   // the item, in the chosen colour
    var tintedKey = "";
    var art = layerCanvas();      // the design by itself
    var worn = layerCanvas();     // the design with the fabric showing through
    stage.appendChild(canvas);
    stage.appendChild(el("p", "eed-tip", "Drag your design with your finger or mouse to move it."));

    var panel = el("div", "eed-panel");

    // 1. picture
    var boxPic = el("div", "eed-box");
    var pickBtn = el("button", "eed-btn primary", "📁 Add a logo or picture");
    pickBtn.type = "button";
    var picker = el("input");
    picker.type = "file"; picker.accept = "image/*"; picker.hidden = true;
    var picMsg = el("div", "eed-msg");
    boxPic.appendChild(pickBtn); boxPic.appendChild(picker);
    boxPic.appendChild(el("p", "eed-sub", "Or drag a picture from your computer onto the preview."));
    boxPic.appendChild(picMsg);

    // 2. words
    var boxText = el("div", "eed-box");
    boxText.appendChild(el("h4", null, "Add words (a name, a team, initials…)"));
    var textRow = el("div", "eed-text");
    var textIn = el("input");
    textIn.type = "text"; textIn.maxLength = 40; textIn.placeholder = "Type here";
    var textBtn = el("button", "eed-btn", "Add");
    textBtn.type = "button";
    textRow.appendChild(textIn); textRow.appendChild(textBtn);
    boxText.appendChild(textRow);
    var fontRow = el("div", "eed-row");
    var fontBtns = FONTS.map(function (f, i) {
      var b = el("button", "eed-btn" + (i === 0 ? " on" : ""), f.label);
      b.type = "button";
      b.style.fontFamily = f.css;
      b.addEventListener("click", function () {
        fontIdx = i;
        fontBtns.forEach(function (x, j) { x.classList.toggle("on", j === i); });
        if (selected && selected.type === "text") { selected.font = i; draw(); }
      });
      fontRow.appendChild(b);
      return b;
    });
    boxText.appendChild(fontRow);
    var inkRow = el("div", "eed-inks");
    var inkBtns = INKS.map(function (c) {
      var b = el("button", "eed-ink");
      b.type = "button"; b.style.background = c; b.title = "Letter colour";
      b.setAttribute("aria-label", "Letter colour " + c);
      b.addEventListener("click", function () {
        ink = c;
        inkBtns.forEach(function (x) { x.classList.toggle("on", x === b); });
        if (selected && selected.type === "text") { selected.color = c; draw(); }
      });
      inkRow.appendChild(b);
      return b;
    });
    boxText.appendChild(inkRow);

    // 3. where + size
    var boxPlace = el("div", "eed-box");
    boxPlace.appendChild(el("h4", null, "Where should it go?"));
    var placeRow = el("div", "eed-row");
    var placeBtns = PLACEMENTS.map(function (p) {
      var b = el("button", "eed-btn", p.label);
      b.type = "button";
      b.addEventListener("click", function () { applyPlacement(p); });
      placeRow.appendChild(b);
      return b;
    });
    boxPlace.appendChild(placeRow);

    var boxSize = el("div", "eed-box");
    boxSize.appendChild(el("h4", null, "Change the size"));
    var sizeRow = el("div", "eed-row");
    var bigger = el("button", "eed-btn", "➕ Bigger");
    var smaller = el("button", "eed-btn", "➖ Smaller");
    var remove = el("button", "eed-btn danger", "🗑 Remove");
    [bigger, smaller, remove].forEach(function (b) { b.type = "button"; sizeRow.appendChild(b); });
    boxSize.appendChild(sizeRow);
    boxSize.appendChild(el("p", "eed-sub", "Tap a picture or words on the preview first, then use these buttons."));

    panel.appendChild(boxPic); panel.appendChild(boxText);
    panel.appendChild(boxPlace); panel.appendChild(boxSize);
    wrap.appendChild(stage); wrap.appendChild(panel);
    root.appendChild(wrap);

    /* ---------- drawing ---------- */
    function shape() { return SHAPES[shapeName]; }
    function photo() { var p = photos[shape().src]; return p && p.ready ? p.img : null; }

    // Where the photo sits on the canvas (fitted, centred).
    function frame() {
      var img = photo(), pad = 26;
      var iw = img ? img.naturalWidth : 1, ih = img ? img.naturalHeight : 1;
      var k = Math.min((W - pad * 2) / iw, (H - pad * 2) / ih);
      var w = iw * k, h = ih * k;
      return { x: (W - w) / 2, y: (H - h) / 2, w: w, h: h };
    }
    // The dotted box, in canvas units.
    function area() {
      var f = frame(), a = shape().area;
      return { x: f.x + a.x * f.w, y: f.y + a.y * f.h, w: a.w * f.w, h: a.h * f.h };
    }

    // Tint the white photo: multiply keeps every fold and shadow of the fabric.
    function paintTinted() {
      var key = shapeName + color;
      if (tintedKey === key) return;
      var img = photo(), f = frame(), x = tinted.x;
      x.globalCompositeOperation = "source-over";
      x.clearRect(0, 0, W, H);
      if (!img) return;
      x.filter = "contrast(1.18)";
      x.drawImage(img, f.x, f.y, f.w, f.h);
      x.filter = "none";
      if (color.toUpperCase() !== "#FFFFFF") {
        x.globalCompositeOperation = "multiply";
        x.fillStyle = color;
        x.fillRect(0, 0, W, H);
        if (isDark(color)) { // lift dark fabric a little so folds stay visible
          x.globalCompositeOperation = "screen";
          x.globalAlpha = 0.10;
          x.drawImage(img, f.x, f.y, f.w, f.h);
          x.globalAlpha = 1;
        }
        x.globalCompositeOperation = "destination-in";
        x.drawImage(img, f.x, f.y, f.w, f.h);
        x.globalCompositeOperation = "source-over";
      }
      tintedKey = key;
    }

    function drawGarment() {
      var img = photo();
      if (!img) {
        ctx.fillStyle = "#7A7365"; ctx.font = "600 20px Inter, Arial, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Loading picture…", W / 2, H / 2);
        return;
      }
      paintTinted();
      ctx.save();
      ctx.shadowColor = "rgba(28,43,58,0.28)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8 * SCALE;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(tinted.c, 0, 0);
      ctx.restore();
    }

    // The design, pressed into the fabric: folds and weave show through it,
    // it stops at the edge of the item, and it sits slightly raised like thread.
    function drawDesign() {
      var img = photo(), f = frame();
      if (!img || !layers.length) return;
      var a = art.x, w = worn.x;
      a.clearRect(0, 0, W, H);
      layers.forEach(function (l) {
        if (l.type === "img") {
          var b = box(l);
          a.drawImage(l.img, b.x, b.y, b.w, b.h);
        } else {
          a.font = fontOf(l);
          a.textAlign = "center"; a.textBaseline = "middle";
          a.fillStyle = l.color;
          a.fillText(l.text, l.cx, l.cy);
        }
      });
      w.globalCompositeOperation = "source-over";
      w.clearRect(0, 0, W, H);
      w.save(); w.setTransform(1, 0, 0, 1, 0, 0); w.drawImage(art.c, 0, 0); w.restore();
      w.globalCompositeOperation = "multiply";       // fabric shading over the design
      w.filter = "contrast(1.35)";
      w.drawImage(img, f.x, f.y, f.w, f.h);
      w.filter = "none";
      w.globalCompositeOperation = "destination-in"; // keep only the design...
      w.save(); w.setTransform(1, 0, 0, 1, 0, 0); w.drawImage(art.c, 0, 0); w.restore();
      w.drawImage(img, f.x, f.y, f.w, f.h);          // ...and only where the item is
      w.globalCompositeOperation = "source-over";

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.38)"; ctx.shadowBlur = 2.5 * SCALE; ctx.shadowOffsetY = 1 * SCALE;
      ctx.globalAlpha = 0.97;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(worn.c, 0, 0);
      ctx.restore();
    }

    function fontOf(l) {
      var f = FONTS[l.font] || FONTS[0];
      return f.weight + " " + l.size + "px " + f.css;
    }

    function box(l) {
      if (l.type === "img") {
        var h = l.w / l.aspect;
        return { x: l.cx - l.w / 2, y: l.cy - h / 2, w: l.w, h: h };
      }
      ctx.font = fontOf(l);
      var w = ctx.measureText(l.text).width;
      return { x: l.cx - w / 2, y: l.cy - l.size * 0.6, w: w, h: l.size * 1.2 };
    }

    function draw(forExport) {
      ctx.clearRect(0, 0, W, H);
      var bg = ctx.createRadialGradient(W / 2, H * 0.45, 60, W / 2, H * 0.45, H * 0.75);
      bg.addColorStop(0, "#FBF9F5"); bg.addColorStop(1, "#E4DDD0");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      drawGarment();
      drawDesign();

      if (!forExport && photo()) {
        var a = area();
        ctx.save();
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = isDark(color) ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(a.x, a.y, a.w, a.h);
        ctx.restore();
      }

      if (!forExport && selected) {
        var s = box(selected);
        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = "#C1613D"; ctx.lineWidth = 3;
        ctx.strokeRect(s.x - 6, s.y - 6, s.w + 12, s.h + 12);
        ctx.restore();
      }
      [bigger, smaller, remove].forEach(function (b) { b.disabled = !selected; });
      placeBtns.forEach(function (b, i) { b.classList.toggle("on", placement === PLACEMENTS[i].label); });
      boxPlace.style.display = shape().apparel ? "" : "none";
      if (root._onchange) root._onchange();
    }

    function autoInk() {
      if (ink) return ink;
      return isDark(color) ? "#FFFFFF" : "#1C2B3A";
    }

    /* ---------- adding things ---------- */
    function centerOfArea() {
      var a = area();
      return { x: a.x + a.w / 2, y: a.y + a.h / 2 };
    }

    function addImage(file) {
      picMsg.textContent = "";
      if (!file) return;
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var a = area(), c = centerOfArea();
        var aspect = img.naturalWidth / img.naturalHeight;
        var w = Math.min(a.w * 0.7, a.h * 0.6 * aspect);
        var layer = { type: "img", img: img, aspect: aspect, w: w, cx: c.x, cy: a.y + (w / aspect) / 2 + a.h * 0.06 };
        layers.push(layer);
        files.push(file);
        selected = layer;
        placement = "";
        draw();
      };
      img.onerror = function () {
        picMsg.textContent = "That picture didn't work. Try a JPG or PNG, or just send it to us later.";
      };
      img.src = url;
    }

    function addText(text) {
      text = String(text || "").trim();
      if (!text) { textIn.focus(); return; }
      var a = area(), c = centerOfArea();
      var layer = { type: "text", text: text, font: fontIdx, color: autoInk(), size: 48, cx: c.x, cy: c.y };
      // shrink long words so they start inside the dotted box
      ctx.font = fontOf(layer);
      var w = ctx.measureText(text).width;
      if (w > a.w * 0.95) layer.size = Math.max(14, Math.floor(48 * (a.w * 0.95) / w));
      if (layer.size * 1.2 > a.h) layer.size = Math.floor(a.h / 1.3);
      if (layers.length) { // sit just under whatever is already there
        var low = Math.max.apply(null, layers.map(function (l) { var b = box(l); return b.y + b.h; }));
        layer.cy = Math.min(H - layer.size, low + layer.size * 0.75);
      }
      layers.push(layer);
      selected = layer;
      textIn.value = "";
      draw();
    }

    function applyPlacement(p) {
      var a = area();
      placement = p.label;
      if (!layers.length) { draw(); return; }
      // move everything together, keeping the pieces arranged as they are
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      layers.forEach(function (l) {
        var b = box(l);
        minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.w); maxY = Math.max(maxY, b.y + b.h);
      });
      var gw = maxX - minX, gcx = (minX + maxX) / 2, gcy = (minY + maxY) / 2;
      var k = (a.w * p.size) / gw;
      var tx = a.x + a.w * p.cx, ty = a.y + a.h * p.cy + ((maxY - minY) * k) / 2;
      layers.forEach(function (l) {
        l.cx = tx + (l.cx - gcx) * k;
        l.cy = ty + (l.cy - gcy) * k;
        if (l.type === "img") l.w *= k; else l.size = Math.max(8, l.size * k);
      });
      draw();
    }

    function scale(k) {
      if (!selected) return;
      if (selected.type === "img") selected.w = Math.max(24, Math.min(W * 1.2, selected.w * k));
      else selected.size = Math.max(10, Math.min(220, selected.size * k));
      placement = "";
      draw();
    }

    /* ---------- buttons ---------- */
    pickBtn.addEventListener("click", function () { picker.click(); });
    picker.addEventListener("change", function () { addImage(picker.files[0]); picker.value = ""; });
    textBtn.addEventListener("click", function () { addText(textIn.value); });
    textIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addText(textIn.value); } });
    bigger.addEventListener("click", function () { scale(1.15); });
    smaller.addEventListener("click", function () { scale(1 / 1.15); });
    remove.addEventListener("click", function () {
      if (!selected) return;
      var i = layers.indexOf(selected);
      if (selected.type === "img") {
        var n = layers.slice(0, i).filter(function (l) { return l.type === "img"; }).length;
        files.splice(n, 1);
      }
      layers.splice(i, 1);
      selected = null;
      draw();
    });

    /* ---------- dragging ---------- */
    function pos(e) {
      var r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
    }
    function hit(p) {
      for (var i = layers.length - 1; i >= 0; i--) {
        var b = box(layers[i]);
        var pad = 14; // generous, for fingers
        if (p.x >= b.x - pad && p.x <= b.x + b.w + pad && p.y >= b.y - pad && p.y <= b.y + b.h + pad) return layers[i];
      }
      return null;
    }
    var drag = null;
    canvas.addEventListener("pointerdown", function (e) {
      var p = pos(e), l = hit(p);
      selected = l;
      if (l) {
        drag = { l: l, dx: p.x - l.cx, dy: p.y - l.cy };
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        canvas.style.cursor = "grabbing";
      }
      draw();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var p = pos(e);
      drag.l.cx = Math.max(0, Math.min(W, p.x - drag.dx));
      drag.l.cy = Math.max(0, Math.min(H, p.y - drag.dy));
      placement = "";
      draw();
    });
    function endDrag() { drag = null; canvas.style.cursor = "grab"; }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    // Stop the page scrolling only when a finger lands on a design piece.
    canvas.addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      if (t && hit(pos(t))) e.preventDefault();
    }, { passive: false });

    ["dragenter", "dragover"].forEach(function (ev) {
      stage.addEventListener(ev, function (e) { e.preventDefault(); stage.classList.add("drop"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      stage.addEventListener(ev, function (e) { e.preventDefault(); stage.classList.remove("drop"); });
    });
    stage.addEventListener("drop", function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f && /^image\//.test(f.type)) addImage(f);
      else if (f) picMsg.textContent = "That file isn't a picture. Try a JPG or PNG.";
    });

    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load("700 40px 'Dancing Script'"),
        document.fonts.load("700 40px 'Fraunces'"),
        document.fonts.load("700 40px 'Inter'")
      ]).then(function () { draw(); }).catch(function () {});
    }

    draw();
    loadPhoto(shape().src, function () { draw(); });
    Object.keys(SHAPES).forEach(function (k) { loadPhoto(SHAPES[k].src, function () {}); });

    /* ---------- what the pages use ---------- */
    return {
      setShape: function (name) {
        if (!SHAPES[name] || name === shapeName) return;
        var had = photo() ? area() : null;
        shapeName = name;
        loadPhoto(shape().src, function () {
          if (shapeName !== name) return;
          var to = area();
          if (had) {
            var k = Math.min(to.w / had.w, to.h / had.h);
            layers.forEach(function (l) { // carry the design over to the new item
              l.cx = to.x + to.w / 2 + (l.cx - (had.x + had.w / 2)) * k;
              l.cy = to.y + to.h / 2 + (l.cy - (had.y + had.h / 2)) * k;
              if (l.type === "img") l.w *= k; else l.size = Math.max(10, l.size * k);
            });
          }
          placement = "";
          draw();
        });
        draw();
      },
      setColor: function (hex) {
        var before = autoInk();
        color = hex;
        var after = autoInk();
        // keep automatic lettering readable when the item colour flips light/dark
        if (!ink) layers.forEach(function (l) { if (l.type === "text" && l.color === before) l.color = after; });
        draw();
      },
      addImage: addImage,
      addText: addText,
      hasContent: function () { return layers.length > 0; },
      getText: function () {
        return layers.filter(function (l) { return l.type === "text"; }).map(function (l) { return l.text; }).join(" / ");
      },
      getFiles: function () { return files.slice(); },
      getPlacement: function () { return placement; },
      onChange: function (fn) { root._onchange = fn; },
      clear: function () { layers = []; files = []; selected = null; placement = ""; draw(); },
      exportBlob: function () {
        return new Promise(function (resolve) {
          draw(true);
          canvas.toBlob(function (b) { draw(); resolve(b); }, "image/png");
        });
      }
    };
  }

  window.EEDesigner = { create: create, shapes: Object.keys(SHAPES) };
})();
