/* ============================================================
   IKSTUDIOS — Voice demo reels
   Vertical looping carousel (previous above, next below) with a custom
   audio player per reel: waveform timeline you can scrub, play/pause,
   go to start / end, and step-through fast-forward / rewind:
     fast-forward  click: 2× → 4× → back to 1×
     rewind        click: 0.75× → 0.5× → 0.25× → back to 1×
   The current speed is shown. Nothing plays until the visitor presses play.
   ============================================================ */
(function () {
  var DATA = window.IK_VOICE || [], stack = document.getElementById("vstack");
  if (!stack || !DATA.length) return;

  var FF = [2, 4], RW = [0.75, 0.5, 0.25];

  var I = {
    start: '<path d="M6 5h2v14H6zM20 5.5v13L9.5 12z"/>',
    rw: '<path d="M11 6v12L2.5 12zM21.5 6v12L13 12z"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    pause: '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>',
    ff: '<path d="M13 6v12l8.5-6zM2.5 6v12L11 12z"/>',
    end: '<path d="M16 5h2v14h-2zM4 5.5v13L14.5 12z"/>'
  };
  var svg = function (k) { return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + I[k] + "</svg>"; };
  var btn = function (a, label, cls) {
    return '<button type="button" class="vbtn ' + (cls || "") + '" data-a="' + a + '" aria-label="' + label + '" title="' + label + '">' + svg(a) + "</button>";
  };
  function fmt(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

  var audio = new Audio();
  audio.preload = "none";
  var st = { mode: "play", i: 0, spd: 1, seekT: 0, rw: 0, was: false, raf: 0 };   // mode: play | ff | rw
  var cur = 0;

  var cards = DATA.map(function (r) {
    var el = document.createElement("article");
    el.className = "vcard cs";
    el.setAttribute("aria-label", r.title);
    el.innerHTML = '<div class="vposter"><h2></h2></div><div class="vplayer">' +
      '<canvas class="vwave" tabindex="0" role="slider" aria-label="Timeline — drag to scrub"></canvas>' +
      '<div class="vtime mono"><span data-t="cur">0:00</span><span class="vrate" data-t="rate" aria-live="polite"></span><span>' + fmt(r.dur) + "</span></div>" +
      '<div class="vctrl">' + btn("start", "Go to start") + btn("rw", "Rewind — click to step through speeds") + btn("play", "Play", "vplay") +
      btn("ff", "Fast-forward — click to speed up") + btn("end", "Go to end") + "</div></div>";
    el.querySelector("h2").textContent = r.title;
    stack.appendChild(el);
    return {
      el: el, d: r, cv: el.querySelector("canvas"), t: el.querySelector("[data-t=cur]"), rate: el.querySelector("[data-t=rate]"),
      pl: el.querySelector(".vplay"), ff: el.querySelector("[data-a=ff]"), rw: el.querySelector("[data-a=rw]")
    };
  });

  /* ---- state helpers ---- */
  var C = function () { return cards[cur]; };
  var dur = function () { return C().d.dur; };
  function loaded() { return audio.getAttribute("data-id") === C().d.id; }
  function ensureSrc() {
    if (!loaded()) { audio.src = C().d.src; audio.setAttribute("data-id", C().d.id); }
  }
  function pos() { return loaded() && audio.readyState > 0 ? audio.currentTime : st.seekT; }
  function seek(t) {
    t = Math.min(Math.max(0, t), dur());
    st.seekT = t; ensureSrc();
    try { audio.currentTime = t; } catch (e) {}
  }

  /* ---- drawing ---- */
  function draw(card, p) {
    var cv = card.cv, w = cv.clientWidth, h = cv.clientHeight, dpr = window.devicePixelRatio || 1;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var c = cv.getContext && cv.getContext("2d");
    if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    var P = card.d.peaks, n = P.length, bw = w / n, g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#0084ff"); g.addColorStop(1, "#543ad6");
    for (var i = 0; i < n; i++) {
      var bh = Math.max(3, P[i] * h * 0.92);
      c.fillStyle = (i + 0.5) / n <= p ? g : "rgba(255,255,255,.26)";
      c.fillRect(i * bw + bw * 0.18, (h - bh) / 2, bw * 0.64, bh);
    }
    if (p > 0) { c.fillStyle = "#fff"; c.fillRect(Math.min(w - 2, Math.max(0, p * w - 1)), 0, 2, h); }
  }
  function ui() {
    var card = C(), p = pos(), d = dur(), running = !audio.paused || st.mode === "rw";
    var label = st.mode === "ff" ? st.spd + "×" : st.mode === "rw" ? "◀ " + st.spd + "×" : (!audio.paused ? "1×" : "");
    var tt = fmt(p);
    if (card.tt !== tt) { card.tt = tt; card.t.textContent = tt; }
    if (card.rl !== label) { card.rl = label; card.rate.textContent = label; }   // current speed readout
    card.ff.dataset.rate = st.mode === "ff" ? st.spd + "×" : "";   // …and a badge on the active button
    card.rw.dataset.rate = st.mode === "rw" ? st.spd + "×" : "";
    draw(card, d ? p / d : 0);
    card.cv.setAttribute("aria-valuemin", "0"); card.cv.setAttribute("aria-valuemax", Math.round(d)); card.cv.setAttribute("aria-valuenow", Math.round(p));
    // Only touch the button when its state CHANGES. (Re-creating the icon ~60×/s while playing swallowed
    // the click on Pause: mouse-down and mouse-up landed on different, replaced elements.)
    var ico = running ? "pause" : "play";
    if (card.ico !== ico) {
      card.ico = ico;
      card.pl.innerHTML = svg(ico);
      card.pl.setAttribute("aria-label", running ? "Pause" : "Play");
      card.pl.setAttribute("title", running ? "Pause" : "Play");
    }
    card.ff.setAttribute("aria-pressed", st.mode === "ff");
    card.rw.setAttribute("aria-pressed", st.mode === "rw");
  }
  function loop() { st.raf = 0; ui(); if (!audio.paused || st.mode === "rw") st.raf = requestAnimationFrame(loop); }
  function kick() { if (!st.raf) st.raf = requestAnimationFrame(loop); }

  /* ---- transport ---- */
  function stopRw() { if (st.rw) { clearInterval(st.rw); st.rw = 0; } }
  function normal() { stopRw(); st.mode = "play"; st.i = 0; st.spd = 1; audio.playbackRate = 1; }
  function doPlay() {
    ensureSrc();
    var p = audio.play(); if (p && p.catch) p.catch(function () {});
    kick();
  }
  var actions = {
    play: function () {
      if (st.mode !== "play") { normal(); if (audio.paused) doPlay(); return ui(); }
      if (audio.paused || audio.ended) { if (pos() >= dur() - 0.05) seek(0); doPlay(); }
      else audio.pause();
      ui();
    },
    ff: function () {                                  // 2× → 4× → back to 1×
      var next = st.mode === "ff" ? st.i + 1 : 0;
      if (next >= FF.length) { normal(); return ui(); }
      stopRw(); st.mode = "ff"; st.i = next; st.spd = FF[next]; audio.playbackRate = st.spd;
      if (audio.paused) { if (pos() >= dur() - 0.05) seek(0); doPlay(); }
      ui();
    },
    rw: function () {                                  // 0.75× → 0.5× → 0.25× (silent scan backwards) → back to 1×
      var next = st.mode === "rw" ? st.i + 1 : 0;
      if (next >= RW.length) { normal(); if (audio.paused) doPlay(); return ui(); }
      if (st.mode !== "rw") { st.was = !audio.paused; audio.pause(); audio.playbackRate = 1; }
      stopRw(); st.mode = "rw"; st.i = next; st.spd = RW[next];
      st.rw = setInterval(function () {
        var t = pos() - 0.1 * st.spd;
        if (t <= 0) { seek(0); normal(); if (st.was) doPlay(); }      // reached the start
        else seek(t);
        ui();
      }, 100);
      kick(); ui();
    },
    start: function () { seek(0); ui(); },
    end: function () { seek(dur() - 0.05); ui(); }
  };

  ["play", "pause", "seeked", "loadedmetadata"].forEach(function (ev) { audio.addEventListener(ev, ui); });
  audio.addEventListener("play", kick);
  audio.addEventListener("ended", function () { normal(); ui(); });

  stack.addEventListener("click", function (e) {
    var b = e.target.closest("button"), card = b && b.closest(".vcard");
    if (!b || card !== C().el || !b.dataset.a) return;
    actions[b.dataset.a]();
  });

  /* ---- scrubbing the timeline ---- */
  cards.forEach(function (card, i) {
    var cv = card.cv;
    function scrub(e) {
      var r = cv.getBoundingClientRect();
      seek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * dur()); ui();
    }
    cv.addEventListener("pointerdown", function (e) {
      if (i !== cur) return;
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      scrub(e); cv.onpointermove = scrub;
    });
    ["pointerup", "pointercancel"].forEach(function (ev) { cv.addEventListener(ev, function () { cv.onpointermove = null; }); });
    cv.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { seek(pos() - 5); ui(); e.preventDefault(); }
      else if (e.key === "ArrowRight") { seek(pos() + 5); ui(); e.preventDefault(); }
    });
  });

  /* ---- browsing the reels (loops; always starts paused at 0:00) ---- */
  function go(i) {
    var n = cards.length; i = ((i % n) + n) % n;
    if (i === cur) return;
    audio.pause(); normal(); st.seekT = 0;
    audio.removeAttribute("src"); audio.removeAttribute("data-id");
    try { audio.load(); } catch (e) {}
    ui();                         // reset the card we're leaving
    cur = i; window.IK_carousel.apply(cards.map(function (c) { return c.el; }), cur); ui();
  }
  document.getElementById("vprev").addEventListener("click", function () { go(cur - 1); });   // up = previous (above)
  document.getElementById("vnext").addEventListener("click", function () { go(cur + 1); });   // down = next (below)
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") { go(cur - 1); e.preventDefault(); }
    else if (e.key === "ArrowDown") { go(cur + 1); e.preventDefault(); }
  });
  window.addEventListener("resize", function () { cards.forEach(function (c) { draw(c, c === C() ? pos() / dur() : 0); }); });

  window.IK_carousel.apply(cards.map(function (c) { return c.el; }), cur);
  ui(); cards.forEach(function (c) { draw(c, 0); });
})();
