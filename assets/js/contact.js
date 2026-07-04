/* ============================================================
   IKSTUDIOS — Contact form
   Sends the message to the service configured in config.js,
   which emails it to you. Shows a "Thank you!" panel on success.
   ============================================================ */
(function () {
  var form = document.getElementById("contactForm");
  if (!form) return;

  var CFG = (window.IK_CONFIG && window.IK_CONFIG.contact) || {};
  var statusEl = document.getElementById("formStatus");
  var thanks = document.getElementById("thanks");
  var btn = form.querySelector('button[type="submit"]');

  function setStatus(msg, kind) {
    statusEl.textContent = msg || "";
    statusEl.className = "form__status" + (kind ? " " + kind : "");
  }

  function notConfigured() {
    var w3 = CFG.provider === "web3forms" &&
             CFG.accessKey && CFG.accessKey.indexOf("YOUR_") !== 0;
    var fs = CFG.provider === "formspree" &&
             CFG.formspreeEndpoint && CFG.formspreeEndpoint.indexOf("http") === 0;
    return !(w3 || fs);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("", "");

    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var message = form.message.value.trim();

    if (!name || !email || !message) {
      setStatus("Please fill in every field.", "err");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("That email address doesn't look right.", "err");
      return;
    }
    if (notConfigured()) {
      setStatus("Form isn't connected yet — add your key in assets/js/config.js.", "err");
      return;
    }

    var endpoint, payload, headers = { Accept: "application/json" };

    if (CFG.provider === "web3forms") {
      endpoint = "https://api.web3forms.com/submit";
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify({
        access_key: CFG.accessKey,
        subject: CFG.subject || "New message from IKstudios.com",
        from_name: name,
        name: name,
        email: email,
        message: message
      });
    } else {
      endpoint = CFG.formspreeEndpoint;
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify({ name: name, email: email, message: message, _subject: CFG.subject });
    }

    btn.disabled = true;
    var original = btn.textContent;
    btn.textContent = "Sending…";
    setStatus("Sending your message…", "");

    fetch(endpoint, { method: "POST", headers: headers, body: payload })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }); })
      .then(function (r) {
        var success = r.ok && (r.d.success !== false);
        if (success) {
          form.style.display = "none";
          if (thanks) thanks.classList.add("show");
          form.reset();
        } else {
          setStatus((r.d && r.d.message) || "Something went wrong. Please try again.", "err");
        }
      })
      .catch(function () {
        setStatus("Couldn't reach the server. Check your connection and try again.", "err");
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = original;
      });
  });
})();
