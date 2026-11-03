/* ============================================================
   IKSTUDIOS — Acting reels
   Horizontal looping carousel (previous / next arrows). Each reel opens as a
   blurred first frame with its title; press play and it clears and plays.
   Controls: play / pause (button, or click the picture), a draggable timeline,
   elapsed + total time, fullscreen. Moving to another reel pauses this one.
   Reels live in assets/js/config.js → actor.reels  { title, src, poster }
   ============================================================ */
(function () {
  var stack = document.getElementById("astack");
  if (!stack) return;
  var C = (window.IK_CONFIG && window.IK_CONFIG.actor) || {};
  var R = (C.reels || []).filter(function (r) { return r && r.src; });

  if (!R.length) {                                   // nothing added yet
    stack.innerHTML = '<p class="aempty">Reels coming soon.</p>';
    var ar = document.querySelector(".aarrows"); if (ar) ar.hidden = true;
    return;
  }

  var I = {
    play: '<path d="M8 5v14l11-7z"/>',
    pause: '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>',
    replay: '<path d="M12 5V2L7 6.5 12 11V8a5 5 0 1 1-5 5H5a7 7 0 1 0 7-8z"/>',
    full: '<path d="M4 9V4h5v2H6v3zM15 4h5v5h-2V6h-3zM4 15h2v3h3v2H4zM18 15h2v5h-5v-2h3z"/>'
  };
  var svg = function (k) { return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + I[k] + "</svg>"; };
  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

  var scrubbing = null;                              // the card whose timeline is being dragged
  window.addEventListener("pointerup", function () { scrubbing = null; });
  window.addEventListener("pointercancel", function () { scrubbing = null; });

  var cards = R.map(function (r, n) {
    var el = document.createElement("article");
    el.className = "acard cs";
    el.dataset.state = "idle";                       // idle (not started) · playing · paused · ended · error
    el.innerHTML =
      '<h2></h2>' +
      '<div class="aplayer">' +
        '<div class="aframe">' +
          '<video preload="metadata" playsinline></video>' +
          '<div class="aind" aria-hidden="true"></div>' +
          '<div class="acover">' +
            '<img alt="" decoding="async">' +
            '<span class="acover__t" aria-hidden="true"></span>' +
            '<button type="button" class="aplay" aria-label="Play">' + svg("play") + "</button>" +
            '<span class="aerr" role="status"></span>' +
          "</div>" +
        "</div>" +
        '<div class="actrl">' +
          '<button type="button" class="abtn" data-a="pp" aria-label="Play">' + svg("play") + "</button>" +
          '<span class="atime mono" data-t="cur">0:00</span>' +
          '<input class="ascrub" type="range" min="0" max="1000" step="1" value="0" aria-label="Timeline — drag to scrub">' +
          '<span class="atime mono" data-t="dur">0:00</span>' +
          '<button type="button" class="abtn" data-a="full" aria-label="Fullscreen">' + svg("full") + "</button>" +
        "</div>" +
      "</div>";

    var $ = function (s) { return el.querySelector(s); };
    var v = $("video"), pp = $("[data-a=pp]"), big = $(".aplay"), scrub = $(".ascrub"),
        tcur = $("[data-t=cur]"), tdur = $("[data-t=dur]"), player = $(".aplayer"), full = $("[data-a=full]");

    $("h2").textContent = r.title;
    $(".acover__t").textContent = r.title;
    big.setAttribute("aria-label", "Play " + r.title);
    if (r.poster) { $(".acover img").src = r.poster; v.poster = r.poster; }
    v.src = r.src;
    v.setAttribute("aria-label", r.title);

    function setState(s) {
      el.dataset.state = s;
      var playing = s === "playing";
      pp.innerHTML = svg(s === "ended" ? "replay" : playing ? "pause" : "play");
      pp.setAttribute("aria-label", playing ? "Pause" : s === "ended" ? "Replay" : "Play");
      $(".aind").innerHTML = svg(s === "ended" ? "replay" : "play");
    }
    function paint() {
      var d = v.duration || 0, t = v.currentTime || 0, p = d ? Math.min(100, t / d * 100) : 0;
      if (scrubbing !== el) scrub.value = p * 10;
      scrub.style.setProperty("--p", p + "%");
      tcur.textContent = fmt(t);
    }
    function play() {
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () { setState("paused"); });
    }
    function toggle() { if (v.paused || v.ended) play(); else v.pause(); }

    big.addEventListener("click", play);
    $(".acover").addEventListener("click", play);    // anywhere on the blurred first frame
    v.addEventListener("click", toggle);             // click the picture to play / pause
    pp.addEventListener("click", toggle);

    v.addEventListener("play", function () { setState("playing"); });
    v.addEventListener("playing", function () { setState("playing"); });
    v.addEventListener("pause", function () { if (!v.ended) setState("paused"); });
    v.addEventListener("ended", function () { setState("ended"); });
    v.addEventListener("timeupdate", paint);
    v.addEventListener("seeked", paint);
    v.addEventListener("durationchange", function () { tdur.textContent = fmt(v.duration); paint(); });
    v.addEventListener("loadedmetadata", function () { tdur.textContent = fmt(v.duration); paint(); });
    v.addEventListener("error", function () {
      setState("error"); $(".aerr").textContent = "This video couldn't be loaded.";
    });

    scrub.addEventListener("pointerdown", function () { scrubbing = el; });
    scrub.addEventListener("input", function () {    // drag / click / arrow keys on the timeline
      var d = v.duration; if (!d) return;
      v.currentTime = scrub.value / 1000 * d;
      scrub.style.setProperty("--p", scrub.value / 10 + "%");
      tcur.textContent = fmt(v.currentTime);
      if (el.dataset.state === "idle") setState("paused");   // looking around before pressing play → clear the cover
    });

    full.addEventListener("click", function () {
      var fs = document.fullscreenElement || document.webkitFullscreenElement;
      if (fs) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      if (player.requestFullscreen) player.requestFullscreen();
      else if (player.webkitRequestFullscreen) player.webkitRequestFullscreen();
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();          // iPhone Safari
    });

    stack.appendChild(el);
    return { el: el, v: v };
  });

  var cur = 0;
  function go(i) {
    var old = cards[cur];
    cur = ((i % cards.length) + cards.length) % cards.length;
    if (cards[cur] !== old && !old.v.paused) old.v.pause();   // leaving a reel pauses it
    window.IK_carousel.apply(cards.map(function (c) { return c.el; }), cur);
  }
  go(0);
  document.getElementById("aprev").addEventListener("click", function () { go(cur - 1); });
  document.getElementById("anext").addEventListener("click", function () { go(cur + 1); });
  document.addEventListener("keydown", function (e) {
    if (e.target && e.target.closest && e.target.closest(".aplayer")) return;   // arrows belong to the timeline while it has focus
    if (e.key === "ArrowLeft") go(cur - 1); else if (e.key === "ArrowRight") go(cur + 1);
  });
  if (cards.length < 2) { var a2 = document.querySelector(".aarrows"); if (a2) a2.hidden = true; }
})();
