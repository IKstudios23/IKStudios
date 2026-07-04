/* ============================================================
   IKSTUDIOS — Film reel
   Builds the moving 70mm rolls (2 on the home page, 1 on inner pages).
   • Pulls a RANDOM selection of photos from across the whole Flickr
     library (not just the most recent) when Flickr is enabled.
   • When a page has more than one roll, each roll is given a DIFFERENT
     set of pictures.
   Source priority:  Flickr → config.photos → placeholders.
   Uses JSONP so it works on a plain static host (no CORS issues).
   ============================================================ */
(function () {
  var reels = document.querySelectorAll("[data-reel]");
  if (!reels.length) return;

  var CFG = window.IK_CONFIG || {};
  var FRAME_TARGET = 23; // frames when nothing is configured (placeholders)

  /* camera icon shown in each frame while photos load (and as a fallback) */
  var PH_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4.5 8h2.4l1.05-1.68A1 1 0 0 1 8.85 5.85h6.3a1 1 0 0 1 .85.47L17 8h2.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-8A1.5 1.5 0 0 1 4.5 8Z"/>' +
    '<circle cx="12" cy="13" r="3.3"/></svg>';

  /* ---- Fisher–Yates shuffle (in place) ---- */
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---- split a pool across N rolls so each roll shows different pics ---- */
  function distribute(pool, n) {
    var buckets = [], i;
    for (i = 0; i < n; i++) buckets.push([]);
    if (!pool.length || n <= 0) return buckets;
    var s = shuffle(pool.slice());
    s.forEach(function (u, k) { buckets[k % n].push(u); });   // round-robin = disjoint sets
    for (i = 0; i < n; i++) if (!buckets[i].length) buckets[i] = pool.slice(); // tiny pool fallback
    return buckets.map(function (b) { return shuffle(b); });
  }

  /* ---- build one strip (its frames duplicated x2 for a seamless loop) ---- */
  function buildStrip(urls) {
    urls = (urls || []).filter(Boolean);
    var strip = document.createElement("div");
    strip.className = "strip";

    var placeholderHTML = function () {
      return '<span class="frame__ph">' + PH_ICON + "</span>";
    };
    var makeFrame = function (url) {
      var f = document.createElement("div");
      f.className = "frame";
      f.innerHTML = placeholderHTML();               // camera shows immediately
      if (url) {
        var img = document.createElement("img");
        img.loading = "lazy"; img.decoding = "async"; img.alt = "";
        img.addEventListener("load", function () { img.classList.add("is-loaded"); });
        img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); }; // keep camera on error
        img.src = url;
        f.appendChild(img);                          // photo fades in on top when ready
      }
      return f;
    };

    // show all available photos (min 10, max 28), looping to fill
    var frames = urls.length ? Math.min(Math.max(urls.length, 10), 28) : FRAME_TARGET;
    var list = [];
    for (var i = 0; i < frames; i++) list.push(urls.length ? urls[i % urls.length] : null);
    list.concat(list).forEach(function (u) { strip.appendChild(makeFrame(u)); });
    return strip;
  }

  function paint(pool) {
    var buckets = distribute((pool || []).filter(Boolean), reels.length);
    reels.forEach(function (reel, i) {
      reel.innerHTML = "";
      reel.appendChild(buildStrip(buckets[i]));
    });
  }

  /* ---- JSONP helper ---- */
  function jsonp(url) {
    return new Promise(function (resolve, reject) {
      var cb = "ikjsonp_" + Math.random().toString(36).slice(2);
      var timer = setTimeout(function () { cleanup(); reject(new Error("timeout")); }, 8000);
      function cleanup() { clearTimeout(timer); delete window[cb]; if (s.parentNode) s.parentNode.removeChild(s); }
      window[cb] = function (data) { cleanup(); resolve(data); };
      var s = document.createElement("script");
      s.onerror = function () { cleanup(); reject(new Error("network")); };
      s.src = url + (url.indexOf("?") > -1 ? "&" : "?") + "jsoncallback=" + cb;
      document.head.appendChild(s);
    });
  }

  function flickrURL(method, params) {
    var base = "https://api.flickr.com/services/rest/?method=" + method +
      "&api_key=" + encodeURIComponent(CFG.flickr.apiKey) +
      "&format=json&nojsoncallback=0";
    for (var k in params) base += "&" + k + "=" + encodeURIComponent(params[k]);
    return base;
  }

  /* ---- Flickr: resolve user, then pull a RANDOM spread across the library ---- */
  function resolveUser() {
    var fk = CFG.flickr;
    if (!fk.userUrl) return Promise.resolve(null);
    return jsonp(flickrURL("flickr.urls.lookupUser", { url: fk.userUrl }))
      .then(function (r) { return r && r.user && r.user.id; });
  }

  function loadFlickr() {
    var fk = CFG.flickr;
    var want = fk.count || FRAME_TARGET;
    var SIZES = "url_z,url_c,url_m,url_n,url_l";

    return resolveUser().then(function (userId) {
      if (!userId) throw new Error("no user");
      var isAlbum = !!fk.albumId;
      var method = isAlbum ? "flickr.photosets.getPhotos" : "flickr.people.getPublicPhotos";
      function call(page, per) {
        var params = isAlbum
          ? { photoset_id: fk.albumId, user_id: userId, extras: SIZES, per_page: per, page: page }
          : { user_id: userId, extras: SIZES, per_page: per, page: page };
        return jsonp(flickrURL(method, params)).then(function (r) { return isAlbum ? r.photoset : r.photos; });
      }

      // probe for the total number of photos
      return call(1, 1).then(function (info) {
        var total = parseInt(info && info.total, 10) || 0;
        if (total <= 0) throw new Error("empty");
        if (total <= want) {                       // small library → take them all
          return call(1, want).then(function (i2) { return i2.photo || []; });
        }
        var PER = 12;
        var totalPages = Math.ceil(total / PER);
        var need = Math.min(totalPages, Math.ceil(want / PER) + 3);
        var all = []; for (var p = 1; p <= totalPages; p++) all.push(p);
        var pages = shuffle(all).slice(0, need);    // random pages from across the whole library
        return Promise.all(pages.map(function (pg) {
          return call(pg, PER).then(function (i) { return i.photo || []; });
        })).then(function (chunks) {
          return chunks.reduce(function (acc, c) { return acc.concat(c); }, []);
        });
      });
    }).then(function (photos) {
      var urls = (photos || []).map(function (p) {
        return p.url_z || p.url_c || p.url_m || p.url_n || p.url_l;
      }).filter(Boolean);
      urls = shuffle(urls);
      if (!urls.length) throw new Error("no urls");
      return urls.slice(0, want);
    });
  }

  /* ---- decide the source ---- */
  var configured = (CFG.photos || []).filter(Boolean);

  if (CFG.flickr && CFG.flickr.enabled &&
      CFG.flickr.apiKey && CFG.flickr.apiKey.indexOf("YOUR_") !== 0) {
    paint(null);                                     // camera in every frame while Flickr loads
    loadFlickr()
      .then(function (urls) { paint(urls); })        // swap in the random Flickr spread once ready
      .catch(function () { paint(configured.length ? configured : null); }); // only fall back if Flickr fails
  } else {
    paint(configured.length ? configured : null);
  }
})();
