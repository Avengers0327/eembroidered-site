/* Shared helpers for the staff pages: staying logged in, talking to the
   server, and little pop-up messages. */
(function () {
  "use strict";

  var KEY = "ee_staff_pw";

  function getPw() {
    try { return localStorage.getItem(KEY) || sessionStorage.getItem("ee_admin_pw") || ""; } catch (e) { return ""; }
  }
  function setPw(v) {
    try {
      if (v) { localStorage.setItem(KEY, v); sessionStorage.setItem("ee_admin_pw", v); }
      else { localStorage.removeItem(KEY); sessionStorage.removeItem("ee_admin_pw"); }
    } catch (e) {}
  }

  function api(path, body, pw) {
    var headers = { "Content-Type": "application/json" };
    var p = pw !== undefined ? pw : getPw();
    if (p) headers["X-Admin-Password"] = p;
    return fetch(path, { method: "POST", headers: headers, body: JSON.stringify(body) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          if (!r.ok) {
            var err = new Error(data.message || "Something went wrong. Please try again.");
            err.code = data.error || r.status;
            throw err;
          }
          return data;
        });
      }, function () {
        var err = new Error("No internet connection. Check the Wi-Fi and try again.");
        err.code = "offline";
        throw err;
      });
  }

  function toast(msg) {
    var t = document.getElementById("eeToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "eeToast"; t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove("show"); }, 3200);
  }

  function showLogin(done, message) {
    var veil = document.createElement("div");
    veil.className = "login-veil";
    veil.innerHTML =
      '<form class="login-box card">' +
        '<h1>Staff sign-in</h1>' +
        '<p>Type the staff password. You only need to do this once on this device.</p>' +
        '<div class="field"><label for="eePw">Password</label>' +
        '<input type="password" id="eePw" autocomplete="current-password" required></div>' +
        '<div class="msg-err" id="eePwMsg"></div>' +
        '<button class="bigbtn" type="submit">Sign in</button>' +
        '<p style="margin:18px 0 0;"><a href="/" style="text-decoration:underline;">← Back to the website</a></p>' +
      '</form>';
    document.body.appendChild(veil);
    var input = veil.querySelector("#eePw"), msg = veil.querySelector("#eePwMsg"), btn = veil.querySelector("button");
    if (message) msg.textContent = message;
    input.focus();
    veil.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      msg.textContent = "";
      btn.disabled = true; btn.textContent = "Checking…";
      api("/api/login", { password: input.value }, "").then(function () {
        setPw(input.value);
        veil.remove();
        done();
      }).catch(function (err) {
        msg.textContent = err.message;
        btn.disabled = false; btn.textContent = "Sign in";
        input.select();
      });
    });
  }

  // The server only sends staff pages to signed-in devices, so by the time
  // this runs the person is signed in. If the session has gone stale
  // (password changed), send them back to the sign-in page.
  function requireLogin(done) {
    api("/api/login", { check: true, password: getPw() }, "").then(done, function (err) {
      if (err.code === "offline" || err.code === "setup" || !getPw()) { done(); return; }
      setPw("");
      location.href = "/staff-login?next=" + encodeURIComponent(location.pathname + location.search);
    });
  }

  function logout() {
    setPw("");
    api("/api/login", { logout: true }, "").then(go, go);
    function go() { location.href = "/"; }
  }

  window.EEStaff = { pw: getPw, api: api, toast: toast, requireLogin: requireLogin, showLogin: showLogin, logout: logout };
})();
