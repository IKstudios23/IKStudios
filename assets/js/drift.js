/* ============================================================
   IKSTUDIOS — Reel motion
   Moves a film-reel strip (frames duplicated x2) in a seamless loop.

   • Runs from JavaScript instead of a CSS animation, so it keeps moving
     on phones that have "Reduce Motion" / "Remove animations" switched on
     (that setting used to freeze every reel). With that setting on the reel
     drifts at half speed.
   • Horizontal when the reel is a band, vertical when it is the tall strip.
   • interactive:true (every reel except the home page): mouse wheel,
     click-and-drag, finger swipe (with momentum) and the arrow keys.
     The slow drift pauses while you browse, then eases back in on its own.
     A small "Scroll or drag" / "Swipe" hint pill tells visitors they can.

   IK_drift(strip, { interactive: true, speed: { x: px/s, y: px/s } })
   Call it AFTER the strip has been added to the page.
   Loop time (when no speed is given) comes from the CSS variable --loop
   (seconds per half-strip); --rev:1 runs the other way.
   ============================================================ */
(function () {
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  var HINT_KEY = "ik_reel_hint";

  window.IK_drift = function (strip, o) {
    o = o || {};
    var host = strip && strip.parentNode;
    if (!host) return null;

    var prev = host.__ikDrift, pos = prev ? prev.pos() : 0;      // a rebuilt strip carries on from where the old one was
    if (prev) prev.stop();

    var vertical = false, loopLen = 0, base = 0;                  // base = drift speed, px/s (signed)
    var vel = 0, extra = 0, hold = 0, dragging = false;          // vel px/s · extra = pending wheel px · hold = seconds of "browsing" pause
    var raf = 0, last = 0, visible = true, dead = false, io = null, ro = null, bound = [], hint = null;
    function on(type, fn, opt) { host.addEventListener(type, fn, opt); bound.push([type, fn, opt]); }

    function measure() {
      var st = getComputedStyle(strip);
      vertical = st.flexDirection === "column";
      var n = strip.children.length / 2, a = strip.children[0], b = strip.children[n];
      loopLen = a && b ? (vertical ? b.offsetTop - a.offsetTop : b.offsetLeft - a.offsetLeft) : 0;   // length of one half = one seamless loop
      var sp = o.speed ? (vertical ? o.speed.y : o.speed.x) : loopLen / (parseFloat(st.getPropertyValue("--loop")) || 70);
      base = sp * (st.getPropertyValue("--rev").trim() === "1" ? -1 : 1) * (mq.matches ? 0.5 : 1);
      if (o.interactive) {
        host.style.touchAction = vertical ? "pan-x" : "pan-y";   // swipe along the reel moves it; the other direction still scrolls the page
        if (hint) hint.classList.toggle("reel-hint--v", vertical);
      }
    }
    function render() {
      if (loopLen > 0) pos = ((pos % loopLen) + loopLen) % loopLen;
      strip.style.transform = vertical
        ? "translate3d(0," + (-pos).toFixed(2) + "px,0)"
        : "translate3d(" + (-pos).toFixed(2) + "px,0,0)";
    }
    function tick(t) {
      if (dead) return;
      if (!strip.isConnected) return stop();                      // strip was replaced (photos arrived) → the new one has its own driver
      raf = requestAnimationFrame(tick);
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      if (!visible || !loopLen) return;
      if (!dragging) {
        var browsing = hold > 0;
        if (browsing) hold -= dt;
        vel += ((browsing ? 0 : base) - vel) * (1 - Math.exp(-dt / (browsing ? 0.6 : 0.9)));   // glide out of a flick, ease back into the drift
        pos += vel * dt;
      }
      if (extra) {                                                // mouse-wheel travel, eased so each notch glides
        var s = Math.abs(extra) < 0.1 ? extra : extra * (1 - Math.exp(-dt / 0.09));
        pos += s; extra -= s;
      }
      render();
    }
    function stop() {
      dead = true; cancelAnimationFrame(raf); if (io) io.disconnect(); if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
      bound.forEach(function (b) { host.removeEventListener(b[0], b[1], b[2]); }); bound = [];
    }

    /* ---------- the little "you can scroll this" pill ---------- */
    function hintFor() {
      var par = host.parentNode, h = par.querySelector(".reel-hint");
      if (h) return h;
      try { if (window.sessionStorage.getItem(HINT_KEY)) return null; } catch (x) {}      // already discovered this visit
      h = document.createElement("div");
      h.className = "reel-hint"; h.setAttribute("aria-hidden", "true");
      h.innerHTML = '<span class="reel-hint__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg></span>' +
        "<span>" + (coarse ? "Swipe" : "Scroll or drag") + "</span>";
      par.appendChild(h);
      setTimeout(function () { if (!h.dataset.done) h.classList.add("on"); }, 1500);         // fades in…
      setTimeout(function () { h.classList.remove("on"); }, 14000);                         // …and away by itself
      return h;
    }
    function discovered() {                                       // they found it → hide the hint for the rest of the visit
      if (!hint || hint.dataset.done) return;
      hint.dataset.done = "1"; hint.classList.remove("on");
      try { window.sessionStorage.setItem(HINT_KEY, "1"); } catch (x) {}
    }

    if (o.interactive) {
      host.classList.add("is-browsable");
      hint = hintFor();
    }
    measure(); render();
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", measure);
    if (window.ResizeObserver) { ro = new ResizeObserver(measure); ro.observe(strip); }
    if (window.IntersectionObserver) {                             // don't animate what can't be seen
      io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; last = 0; });
      io.observe(host);
    }
    host.__ikDrift = { pos: function () { return pos; }, stop: stop };

    /* ---------- browsing: wheel · drag / swipe · keys ---------- */
    if (o.interactive) {
      var id = null, armed = false, sx = 0, sy = 0, lastC = 0, lastT = 0, justDragged = false;

      if (!host.closest('[aria-hidden="true"]')) {                // keyboard access only where the reel isn't purely decorative
        host.tabIndex = 0;
        host.setAttribute("aria-label", "Photo reel — scroll, drag or use the arrow keys to browse");
        on("keydown", function (e) {
          var k = e.key, step = 0;
          if (k === "ArrowDown" || k === "ArrowRight") step = 190; else if (k === "ArrowUp" || k === "ArrowLeft") step = -190;
          if (!step) return;
          e.preventDefault(); extra += step; hold = 1.6; discovered();
        });
      }

      on("wheel", function (e) {
        var dx = e.deltaX, dy = e.deltaY;
        if (e.deltaMode === 1) { dx *= 16; dy *= 16; } else if (e.deltaMode === 2) { dx *= host.clientWidth; dy *= host.clientHeight; }
        var d;
        if (vertical) d = Math.abs(dy) >= Math.abs(dx) ? dy : dx;               // tall reel: the wheel scrolls it
        else if (Math.abs(dx) > Math.abs(dy)) d = dx;                           // band: sideways gestures / shift+wheel move it,
        else if (e.shiftKey) d = dy;                                            // plain up/down still scrolls the page
        else return;
        e.preventDefault();
        extra += d; hold = 1.6; discovered();
      }, { passive: false });

      on("pointerdown", function (e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        armed = true; id = e.pointerId; sx = e.clientX; sy = e.clientY;          // a drag only begins after a few px, so a plain click on a photo link still works
      });
      on("pointermove", function (e) {
        if (e.pointerId !== id || !(armed || dragging)) return;
        if (!dragging) {
          var dx = e.clientX - sx, dy = e.clientY - sy, along = vertical ? dy : dx, across = vertical ? dx : dy;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
          if (e.pointerType === "touch" && Math.abs(across) > Math.abs(along)) { armed = false; return; }   // swiping the other way → let the page scroll
          dragging = true; vel = 0; extra = 0; lastC = vertical ? sy : sx; lastT = e.timeStamp;
          host.classList.add("is-drag"); discovered();
          try { host.setPointerCapture(id); } catch (x) {}
        }
        var c = vertical ? e.clientY : e.clientX, d = c - lastC, secs = Math.max(1, e.timeStamp - lastT) / 1000;
        pos -= d; render();                                                     // content follows the finger / cursor 1:1
        vel = vel * 0.55 + (-d / secs) * 0.45;                                  // smoothed speed → flick momentum on release
        lastC = c; lastT = e.timeStamp;
      });
      var end = function (e) {
        if (e && e.pointerId !== id) return;
        armed = false;
        if (!dragging) return;
        dragging = false; host.classList.remove("is-drag"); hold = 0.9;
        if (e && e.timeStamp - lastT > 90) vel = 0;                             // held still before letting go → no flick
        vel = Math.max(-3500, Math.min(3500, vel));
        justDragged = true; setTimeout(function () { justDragged = false; }, 0); // the click that follows a drag must not open a link
      };
      on("pointerup", end); on("pointercancel", end); on("lostpointercapture", end);
      on("click", function (e) { if (justDragged) { e.preventDefault(); e.stopPropagation(); } }, true);
      on("dragstart", function (e) { e.preventDefault(); });                    // no ghost-image dragging
    }
    return host.__ikDrift;
  };
})();
