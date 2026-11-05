/* ============================================================
   IKSTUDIOS — Creator page
   Lazy-loads each platform preview when it scrolls into view.
   Every card keeps a styled "open on <platform>" placeholder
   that shows until the live embed renders (or if it's blocked).
   Handles/IDs live in creator.html as data- attributes.
   ============================================================ */
(function () {
  var boxes = document.querySelectorAll(".prev[data-embed]");
  if (!boxes.length) return;

  var ok = function (v) { return v && v.indexOf("YOUR_") < 0; };
  var live = function (el) { el.classList.add("is-live"); };
  var loaded = {};
  function script(src) {
    if (loaded[src]) return; loaded[src] = 1;
    var s = document.createElement("script"); s.async = true; s.src = src; document.body.appendChild(s);
  }
  function watch(el) {                       // hide placeholder once the widget injects its iframe
    var mo = new MutationObserver(function () {
      if (el.querySelector("iframe")) { live(el); mo.disconnect(); }
    });
    mo.observe(el, { childList: true, subtree: true });
  }
  function frame(el, src, title) {
    var f = document.createElement("iframe");
    f.src = src; f.title = title; f.loading = "lazy";
    f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");   // YouTube error 153 = embed sent no referrer
    f.allow = "encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true;
    f.addEventListener("load", function () { live(el); });
    el.appendChild(f);
  }

  function ytReady(cb) {                     // YouTube's player API (loaded once)
    if (window.YT && window.YT.Player) return cb();
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (prev) prev(); cb(); };
    script("https://www.youtube.com/iframe_api");
  }

  var AUTO_MS = 4000;                        // every 4 seconds the next item slides in … until the visitor takes over

  // One-at-a-time slider shared by the TikTok and X cards: slides sideways, prev/next arrows,
  // dots (or a "3 / 40" counter when there are lots). Only the current item is ever loaded.
  // Auto-swap (o.auto ms): runs by itself until the visitor clicks an arrow/dot, taps the card,
  // or plays a video — then it stays on manual control for the rest of the visit.
  function div(c) { var d = document.createElement("div"); d.className = c; return d; }
  function slider(el, n, o) {
    var cur = 0, view = div("tkview"), track = div("tktrack"), bar = div("tkbar"), slides = [], dots = [], count = null;
    var manual = false, hold = false, timer = null;
    function stop() { manual = true; clearInterval(timer); timer = null; }                  // visitor took over → no more auto-swap
    for (var k = 0; k < n; k++) { var sd = div("tkslide " + (o.cls || "")); track.appendChild(sd); slides.push(sd); }
    function btn(label, txt, fn) {
      var b = document.createElement("button"); b.type = "button"; b.className = "tkbtn";
      b.setAttribute("aria-label", label); b.textContent = txt;
      b.addEventListener("click", function () { stop(); fn(); }); return b;
    }
    function go(i, auto) {
      var old = cur; cur = ((i % n) + n) % n;
      slides[cur].textContent = ""; o.mount(cur, slides[cur], !!auto);   // always a fresh item: right autoplay setting, starts from the beginning
      track.style.transform = "translateX(" + (-100 * cur) + "%)";        // slide sideways
      if (count) count.textContent = (cur + 1) + " / " + n;
      dots.forEach(function (d, j) { d.classList.toggle("on", j === cur); });
      if (old !== cur) setTimeout(function () { if (old !== cur) slides[old].textContent = ""; }, 850);   // free the one we left
    }
    bar.appendChild(btn("Previous", "‹", function () { go(cur - 1, false); }));
    if (n > 12) { count = document.createElement("span"); count.className = "tkcount"; bar.appendChild(count); }
    else for (var j = 0; j < n; j++) (function (j) {
      var d = document.createElement("button"); d.type = "button"; d.className = "tkdot";
      d.setAttribute("aria-label", "Item " + (j + 1));
      d.addEventListener("click", function () { stop(); go(j, false); });
      bar.appendChild(d); dots.push(d);
    })(j);
    bar.appendChild(btn("Next", "›", function () { go(cur + 1, false); }));
    view.appendChild(track); view.appendChild(bar); el.appendChild(view);
    if (o.auto && n > 1 && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      timer = setInterval(function () {
        var r = el.getBoundingClientRect();
        if (manual || hold || document.hidden || r.bottom < 0 || r.top > window.innerHeight) return;   // paused while hovering, tab hidden or off-screen
        go(cur + 1, false);
      }, o.auto);
      el.addEventListener("mouseenter", function () { hold = true; });
      el.addEventListener("mouseleave", function () { hold = false; });
      el.addEventListener("focusin", function () { hold = true; });
      el.addEventListener("focusout", function () { hold = false; });
      el.addEventListener("pointerdown", stop, true);                  // any tap/click on the card (links, scrolling a long tweet…)
      window.addEventListener("blur", function () {                    // a click INSIDE an embedded player/tweet moves focus into its iframe
        setTimeout(function () { var a = document.activeElement; if (a && a.tagName === "IFRAME" && el.contains(a)) stop(); }, 0);
      });
    }
    return { go: go, cur: function () { return cur; }, slides: slides, stop: stop };
  }

  var load = {
    youtube: function (el) {                 // uploads playlist = newest video first
      if (!ok(el.dataset.id)) return;
      var host = document.createElement("div"); el.appendChild(host);
      ytReady(function () {
        var vars = { listType: "playlist", list: "UU" + el.dataset.id.slice(2), rel: 0, modestbranding: 1, playsinline: 1 };
        if (/^https?:/.test(location.origin)) vars.origin = location.origin;    // tells YouTube which site is embedding
        new window.YT.Player(host, {
          host: "https://www.youtube-nocookie.com", width: "100%", height: "100%", playerVars: vars,
          events: {
            onReady: function () { live(el); },
            onError: function (e) {                                              // YouTube refused → show the link card instead of an error box
              if (window.console) console.warn("YouTube player error " + e.data + " (101/150 = embedding switched off for that video · 153 = site not identified · 100 = video not found)");
              [].forEach.call(el.querySelectorAll("iframe"), function (f) { f.parentNode.removeChild(f); });
              el.classList.remove("is-live");
            }
          }
        });
      });
    },
    instagram: function (el) {
      if (!ok(el.dataset.handle)) return;
      frame(el, "https://www.instagram.com/" + el.dataset.handle + "/embed", "Instagram feed @" + el.dataset.handle);
    },
    tiktok: function (el) {            // your chosen videos: one at a time, slides sideways when one ends, loops forever
      var vids = ((window.IK_CONFIG && window.IK_CONFIG.tiktokVideos) || []).map(function (u) {
        var m = /\/(?:video|photo)\/(\d+)/.exec(u); return m && { url: u, id: m[1] };
      }).filter(Boolean);
      if (!vids.length) return;        // none chosen yet → the link card stays
      var sl = slider(el, vids.length, {
        cls: "tkslide--v", auto: AUTO_MS,
        mount: function (i, slide, auto) {          // TikTok's official embed player; autoplay only after a video finished
          var f = document.createElement("iframe");
          f.src = "https://www.tiktok.com/player/v1/" + vids[i].id + "?autoplay=" + (auto ? 1 : 0) + "&loop=0&rel=0&description=0&music_info=0";
          f.allow = "autoplay; fullscreen; encrypted-media"; f.title = "TikTok video " + (i + 1);
          f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
          f.addEventListener("load", function () { live(el); });
          slide.appendChild(f);
        }
      });
      window.addEventListener("message", function (e) {                  // player says "video ended" → next one (last → back to first)
        if (String(e.origin).indexOf("tiktok.com") < 0) return;
        var d = e.data; if (typeof d === "string") { try { d = JSON.parse(d); } catch (x) { return; } }
        if (!d || d["x-tiktok-player"] !== true || d.type !== "onStateChange") return;
        var f = sl.slides[sl.cur()].querySelector("iframe");
        if (!f || e.source !== f.contentWindow) return;
        if (d.value === 1) sl.stop();                                      // visitor pressed play → manual control from here
        else if (d.value === 0) sl.go(sl.cur() + 1, true);
      });
      sl.go(0, false);
    },
    x: function (el) {                 // your chosen tweets (config.tweets): one at a time, rotating on its own
      var tw = (window.IK_CONFIG && window.IK_CONFIG.tweets) || [];
      if (!tw.length || !window.IK_fillTweet) return;   // none added yet → the link card stays
      var sl = slider(el, tw.length, {
        cls: "tkslide--x", auto: AUTO_MS,
        mount: function (i, slide) {
          var o = typeof tw[i] === "string" ? { url: tw[i] } : tw[i];
          var wrap = document.createElement("div"); wrap.className = "tweetwrap";
          var a = document.createElement("a"); a.className = "frame frame--tweet tweetcard";      // backup card (always works)
          a.href = o.url; a.target = "_blank"; a.rel = "noopener noreferrer";
          window.IK_fillTweet(a, { tweet: true, href: o.url, text: o.text || "" });
          var bq = document.createElement("blockquote"); bq.className = "twitter-tweet";          // X's own embed (shows photos/video)
          bq.setAttribute("data-theme", "dark"); bq.setAttribute("data-dnt", "true"); bq.setAttribute("data-conversation", "none");
          var l = document.createElement("a"); l.href = o.url.replace("//x.com/", "//twitter.com/"); bq.appendChild(l);
          wrap.appendChild(a); wrap.appendChild(bq); slide.appendChild(wrap);
          var mo = new MutationObserver(function () {                                              // X rendered it → hide the backup card
            if (wrap.querySelector("iframe")) { wrap.classList.add("has-embed"); mo.disconnect(); }
          });
          mo.observe(wrap, { childList: true, subtree: true });
          if (window.twttr && window.twttr.widgets) window.twttr.widgets.load(slide);              // widgets.js already running → render this one now
        }
      });
      sl.go(0, false); live(el); script("https://platform.twitter.com/widgets.js");
    }
  };

  function mount(el) { var fn = load[el.dataset.embed]; if (fn) fn(el); }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); mount(e.target); } });
    }, { rootMargin: "300px 0px" });
    boxes.forEach(function (b) { io.observe(b); });
  } else { boxes.forEach(mount); }
})();
