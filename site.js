(function () {
  "use strict";

  var KEY = "ee_staff_ok";

  function password() {
    var cfg = window.GALLERY_CONFIG || {};
    return cfg.password || null;
  }

  function showButton() {
    if (document.getElementById("staffUploadBtn")) return;
    var a = document.createElement("a");
    a.id = "staffUploadBtn";
    a.href = "upload.html";
    a.textContent = "\uD83D\uDCF8 Add Photos";
    a.style.cssText =
      "position:fixed;bottom:18px;right:18px;z-index:70;" +
      "background:#C1613D;color:#fff;padding:16px 26px;border-radius:999px;" +
      "font-family:'Inter',sans-serif;font-weight:700;font-size:1rem;" +
      "box-shadow:0 8px 26px rgba(0,0,0,0.3);text-decoration:none;" +
      "transition:transform 0.2s ease, background 0.2s ease;";
    a.onmouseenter = function () { a.style.background = "#A64F31"; a.style.transform = "translateY(-2px)"; };
    a.onmouseleave = function () { a.style.background = "#C1613D"; a.style.transform = "translateY(0)"; };
    document.body.appendChild(a);
  }

  function unlock() {
    var entered = window.prompt("Staff password:");
    if (entered === null) return;
    if (password() && entered === password()) {
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
      showButton();
      window.alert("You're in! Look for the orange Add Photos button in the corner from now on.");
    } else {
      window.alert("That's not quite right. Ask whoever set this up if you're stuck.");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var unlocked = false;
    try { unlocked = localStorage.getItem(KEY) === "1"; } catch (e) {}
    if (unlocked) showButton();

    var gates = document.querySelectorAll("#staffGate, #staffGate2, .staff-gate");
    gates.forEach(function (gate) {
      gate.addEventListener("click", function (e) {
        e.preventDefault();
        unlock();
      });
    });
  });
})();
