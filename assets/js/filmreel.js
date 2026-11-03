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
  var FRAME_TARGET = 23;
  var N_STREAMS = 3, N_UPLOADS = 5, MAX_VIDEOS = 8;   // YouTube thumbnails in the reels: 3 live streams + 5 latest videos

  /* camera icon shown in each frame while photos load (and as a fallback) */
  var PH_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4.5 8h2.4l1.05-1.68A1 1 0 0 1 8.85 5.85h6.3a1 1 0 0 1 .85.47L17 8h2.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-8A1.5 1.5 0 0 1 4.5 8Z"/>' +
    '<circle cx="12" cy="13" r="3.3"/></svg>';

  /* messages in the browser console (press F12) so problems are easy to spot */
  function log(m) { if (window.console && console.info) console.info("[IK] " + m); }
  function warn(m) { if (window.console && console.warn) console.warn("[IK] " + m); }

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

  /* ---- items: a plain URL string, or { src | yt, href, title } ---- */
  function norm(x) { return typeof x === "string" ? { src: x } : x; }
  function vid(id, title) { return { yt: id, href: "https://www.youtube.com/watch?v=" + id, title: title || "Watch on YouTube" }; }
  function srcOf(it, wide) {
    return it.yt ? "https://i.ytimg.com/vi/" + it.yt + (wide ? "/hqdefault.jpg" : "/mqdefault.jpg") : it.src;
  }

  /* ---- tweet card: text comes from X's public oEmbed (JSONP), cached per tweet ---- */
  function fillTweet(f, it) {
    var m = /(?:twitter|x)\.com\/([^\/]+)\/status/.exec(it.href || "");
    f.innerHTML = '<div class="tw"><svg class="tw__x" viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 2H21.5l-7.5 8.57L23 22h-6.9l-5.4-7.06L4.5 22H1.24l8.02-9.17L1 2h7.08l4.88 6.45L18.24 2Zm-1.2 18h1.9L7.05 3.9H5.02l12.02 16.1Z"/></svg><p class="tw__t"></p><span class="tw__h"></span></div>';
    f.querySelector(".tw__h").textContent = (m ? "@" + m[1] + " \u00b7 " : "") + "View on X \u2197";
    var t = f.querySelector(".tw__t");
    var put = function (txt) { t.textContent = txt || "View this post on X"; };
    if (it.text) return put(it.text);
    it._p = it._p || jsonp("https://publish.twitter.com/oembed?omit_script=1&dnt=true&url=" + encodeURIComponent(it.href), "callback")
      .then(function (r) {
        var p = new DOMParser().parseFromString(r.html || "", "text/html").querySelector("p");
        it.text = p ? p.textContent : ""; return it.text;
      }).catch(function () { return ""; });
    it._p.then(put);
  }

  window.IK_fillTweet = fillTweet;   // reused by the Creator page's X card

  /* ---- build one strip (its frames duplicated x2 for a seamless loop) ---- */
  function buildStrip(items, wide, links) {
    items = (items || []).filter(Boolean);
    var strip = document.createElement("div");
    strip.className = "strip";
    var makeFrame = function (it) {
      var isLink = links && it && it.href;
      var f = document.createElement(isLink ? "a" : "div");
      f.className = "frame" + (it && it.yt ? " frame--video" : "") + (it && it.tweet ? " frame--tweet" : "");
      if (isLink) {
        f.href = it.href; f.target = "_blank"; f.rel = "noopener noreferrer";
        f.title = it.title || ""; f.setAttribute("aria-label", it.title || "Open");
      }
      if (it && it.tweet) { fillTweet(f, it); return f; }
      f.innerHTML = '<span class="frame__ph">' + PH_ICON + "</span>";   // camera shows immediately
      if (it) {
        var img = document.createElement("img");
        img.loading = "lazy"; img.decoding = "async"; img.alt = "";
        img.addEventListener("load", function () { img.classList.add("is-loaded"); });
        img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
        img.src = srcOf(it, wide);
        f.appendChild(img);
      }
      return f;
    };
    var frames = wide && items.length ? 28 : (items.length ? Math.min(Math.max(items.length, 10), 28) : FRAME_TARGET);   // wide = vertical reel (needs to be tall)
    var list = [];
    for (var i = 0; i < frames; i++) list.push(items.length ? items[i % items.length] : null);
    list.concat(list).forEach(function (u) { strip.appendChild(makeFrame(u)); });
    return strip;
  }

  /* modes (data-reel="…"):  photos = Flickr (default) · mix = Flickr + videos + social · videos = YouTube only */
  var state = { flickr: null, videos: [], social: [], tweets: [] };
  var modeOf = function (r) { return r.getAttribute("data-reel") || "photos"; };
  function poolFor(m, n) {
    if (m === "videos") return state.videos;
    if (state.flickr === null) return [];                       // still loading → cameras
    if (m !== "mix") return state.flickr;
    var extra = [].concat(state.videos, state.social, state.tweets);   // always included
    return extra.concat(shuffle(state.flickr.slice()).slice(0, Math.max(0, 28 * n - extra.length)));
  }
  function paint(only) {
    var groups = {};
    reels.forEach(function (r) { (groups[modeOf(r)] = groups[modeOf(r)] || []).push(r); });
    Object.keys(groups).forEach(function (m) {
      if (only && m !== only) return;
      var g = groups[m], b = distribute(poolFor(m, g.length), g.length);
      g.forEach(function (r, i) {
        r.innerHTML = "";
        r.appendChild(buildStrip(b[i], r.classList.contains("reel--v"), r.hasAttribute("data-links")));
      });
    });
  }
  function timeout(p, ms) { return Promise.race([p, new Promise(function (res) { setTimeout(res, ms); })]); }

  /* ---- JSONP helper ---- */
  function jsonp(url, param) {
    return new Promise(function (resolve, reject) {
      var cb = "ikjsonp_" + Math.random().toString(36).slice(2);
      var timer = setTimeout(function () { cleanup(); reject(new Error("timeout")); }, 8000);
      function cleanup() { clearTimeout(timer); delete window[cb]; if (s.parentNode) s.parentNode.removeChild(s); }
      window[cb] = function (data) { cleanup(); resolve(data); };
      var s = document.createElement("script");
      s.onerror = function () { cleanup(); reject(new Error("network")); };
      s.src = url + (url.indexOf("?") > -1 ? "&" : "?") + (param || "jsoncallback") + "=" + cb;
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
    if (fk.nsid) return Promise.resolve(fk.nsid);           // known ID → skip the lookup
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
        var PER = 20;
        var totalPages = Math.ceil(total / PER);
        var need = Math.min(totalPages, Math.ceil(want / PER) + 1);
        var all = []; for (var p = 1; p <= totalPages; p++) all.push(p);
        var pages = shuffle(all).slice(0, need);    // random pages from across the whole library
        return Promise.all(pages.map(function (pg) {
          return call(pg, PER).then(function (i) { return i.photo || []; });
        })).then(function (chunks) {
          return chunks.reduce(function (acc, c) { return acc.concat(c); }, []);
        });
      });
    }).then(function (photos) {
      var base = (fk.userUrl || "https://www.flickr.com/photos/").replace(/\/?$/, "/");
      var urls = (photos || []).map(function (p) {
        var s = p.url_z || p.url_c || p.url_m || p.url_n || p.url_l;
        return s && { src: s, href: base + p.id, title: p.title || "Photo on Flickr" };
      }).filter(Boolean);
      urls = shuffle(urls);
      if (!urls.length) throw new Error("no urls");
      return urls.slice(0, want);
    });
  }

  /* ---- decide the sources ---- */
  var configured = (CFG.photos || []).filter(Boolean).map(norm);
  var hasMode = function (test) { return Array.prototype.some.call(reels, function (r) { return test(modeOf(r)); }); };
  var needFlickr = hasMode(function (m) { return m !== "videos"; });
  var needVideos = hasMode(function (m) { return m !== "photos"; });
  var needSocial = hasMode(function (m) { return m === "mix"; });
  var YT_URL = "https://www.youtube.com/@ikstudios23";

  function loadVideos() {
    var baked = (CFG.videos || []).map(function (v) { return vid(v.id, v.title); });   // optional hand-picked videos (config.videos)
    var uniq = function (list) { var seen = {}; return list.filter(function (v) { return !seen[v.yt] && (seen[v.yt] = 1); }); };
    var merge = function (live) { state.videos = uniq(baked.concat(live)).slice(0, MAX_VIDEOS); };
    merge([]);
    var cid = CFG.youtubeChannelId, KEY = "ik_vids_v3";
    var done = function () {
      if (!state.videos.length) {   // nothing available → local photos that link to the channel
        warn("No YouTube thumbnails could be loaded — check the messages above, or list videos in config.js → videos.");
        state.videos = configured.slice(0, MAX_VIDEOS).map(function (p) { return { src: p.src, href: YT_URL, title: "IKstudios on YouTube" }; });
      }
    };
    if (!needVideos || !cid) { done(); return Promise.resolve(); }
    try {   // remembered for 3h so the services aren't called on every page view
      var c = JSON.parse(localStorage.getItem(KEY) || "null");
      if (c && c.v && c.v.length && Date.now() - c.t < 3 * 3600 * 1000) { merge(c.v); log("YouTube thumbnails: " + state.videos.length + " (remembered from earlier visit)"); done(); return Promise.resolve(); }
    } catch (e) {}

    /* Two independent ways to read YouTube's public feed, tried in turn */
    var fromItems = function (items) {
      var out = (items || []).map(function (it) { var m = /[?&]v=([\w-]{11})/.exec(it.link || ""); return m && vid(m[1], it.title); }).filter(Boolean);
      if (!out.length) throw new Error("no videos in answer"); return out;
    };
    var viaRss2json = function (rss) {
      return timeout(fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rss))
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d.status && d.status !== "ok") throw new Error(d.message || d.status); return fromItems(d.items); }), 6000)
        .then(function (x) { if (!x) throw new Error("timed out"); return x; });
    };
    var viaProxy = function (rss) {
      return timeout(fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(rss))
        .then(function (r) { return r.text(); })
        .then(function (xml) {
          var doc = new DOMParser().parseFromString(xml, "text/xml");
          return fromItems([].map.call(doc.getElementsByTagName("entry"), function (e) {
            var id = e.getElementsByTagName("yt:videoId")[0], t = e.getElementsByTagName("title")[0];
            return { link: id ? "https://www.youtube.com/watch?v=" + id.textContent.trim() : "", title: t && t.textContent };
          }));
        }), 6000).then(function (x) { if (!x) throw new Error("timed out"); return x; });
    };
    var feed = function (q) {      // → newest-first list, or [] if both services fail
      var rss = "https://www.youtube.com/feeds/videos.xml?" + q;
      return viaRss2json(rss)
        .catch(function (e) { warn("YouTube (" + q.split("=")[0] + ") via rss2json failed: " + (e && e.message) + " → trying backup service"); return viaProxy(rss); })
        .catch(function (e) { warn("YouTube (" + q.split("=")[0] + ") backup service failed too: " + (e && e.message)); return []; });
    };

    var tail = cid.slice(2);   // YouTube's auto playlists: UULV = live streams, UULF = regular videos
    return Promise.all([feed("playlist_id=UULV" + tail), feed("playlist_id=UULF" + tail)]).then(function (r) {
      var streams = uniq(r[0]), uploads = uniq(r[1]);
      var short = streams.length < N_STREAMS || uploads.length < N_UPLOADS;
      return (short ? feed("channel_id=" + cid) : Promise.resolve([])).then(function (all) {
        var isStream = {}; streams.forEach(function (s) { isStream[s.yt] = 1; });
        var ups = uniq(uploads.concat(all.filter(function (v) { return !isStream[v.yt]; })));   // whole-channel feed minus streams = regular uploads
        var U = ups.slice(0, N_UPLOADS), St = streams.slice(0, N_STREAMS), live = U.concat(St);
        if (live.length < MAX_VIDEOS) live = uniq(live.concat(ups, streams, all)).slice(0, MAX_VIDEOS);   // top up if a group came back short
        if (live.length) {
          log("YouTube thumbnails: " + U.length + " latest videos + " + St.length + " live streams");
          try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), v: live })); } catch (e) {}
        }
        merge(live);
      });
    }).then(done);
  }

  function loadSocial() {
    state.social = (CFG.social || []).map(norm);
    state.tweets = (CFG.tweets || []).map(function (t) {
      var o = typeof t === "string" ? { url: t } : t;
      return { tweet: true, href: o.url, text: o.text || "" };
    });
    var feeds = CFG.instagramFeeds || [];
    if (!needSocial || !feeds.length) return Promise.resolve();
    return timeout(Promise.all(feeds.map(function (u) {
      return fetch(u).then(function (r) { return r.json(); }).then(function (d) {
        var posts = Array.isArray(d) ? d : (d.posts || []);
        return posts.map(function (p) {
          var s = (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) || p.thumbnailUrl || p.mediaUrl;
          return s && { src: s, href: p.permalink, title: "View on Instagram" };
        }).filter(Boolean);
      }).catch(function () { return []; });
    })), 6000).then(function (all) {
      (all || []).forEach(function (a) { state.social = state.social.concat(a); });
    }).catch(function () {});
  }

  /* Flickr's public feed: no API key needed (latest ~20 photos). Used if the key is missing or no longer works. */
  function loadFlickrFeed() {
    var fk = CFG.flickr;
    if (!fk || !fk.nsid) return Promise.reject(new Error("no nsid"));
    var base = (fk.userUrl || "https://www.flickr.com/photos/").replace(/\/?$/, "/");
    return jsonp("https://www.flickr.com/services/feeds/photos_public.gne?format=json&id=" + encodeURIComponent(fk.nsid))
      .then(function (r) {
        var urls = ((r && r.items) || []).map(function (it) {
          var m = it.media && it.media.m;
          return m && { src: m.replace(/_m\.(jpg|jpeg|png|gif)$/i, "_z.$1"), href: it.link || base, title: it.title || "Photo on Flickr" };
        }).filter(Boolean);
        if (!urls.length) throw new Error("empty feed");
        return shuffle(urls).slice(0, fk.count || FRAME_TARGET);
      });
  }

  /* Built-in library (flickr-snapshot.js) → real photos from your whole Flickr, no key needed */
  var fk0 = CFG.flickr || {};
  var hasKey = fk0.apiKey && fk0.apiKey.indexOf("YOUR_") !== 0;
  var userBase = (fk0.userUrl || "https://www.flickr.com/photos/vtkrrishblazephotography/").replace(/\/?$/, "/");
  var snap = (window.IK_FLICKR_SNAPSHOT || []).map(function (p) {
    return { src: "https://live.staticflickr.com/" + p + "_z.jpg", href: userBase + p.split("/")[1].split("_")[0] + "/", title: "Photo on Flickr" };
  });
  var uniq = function (list) { var seen = {}; return list.filter(function (x) { return !seen[x.src] && (seen[x.src] = 1); }); };
  var ft, fallbackPool = function () { return snap.length ? snap : configured; };
  if (needFlickr) {
    var tries = fk0.enabled
      ? (hasKey ? loadFlickr() : Promise.reject(new Error("no API key")))
          .then(function (L) { log("Flickr API: " + L.length + " random photos pulled from your whole photostream"); return L; })
          .catch(function (e) { warn("Flickr API unavailable (" + (e && e.message) + ") → trying Flickr's public feed (newest ~20 photos)"); return loadFlickrFeed(); })
      : Promise.reject(new Error("Flickr switched off in config.js"));
    ft = timeout(tries, 8000).then(function (L) {
      if (L && L.length) state.flickr = L.map(norm);
      else { warn("Flickr didn't answer → using the built-in library of " + snap.length + " photos"); state.flickr = fallbackPool(); }
    }).catch(function (e) { warn("Flickr failed (" + (e && e.message) + ") → using the built-in library of " + snap.length + " photos"); state.flickr = fallbackPool(); });
  } else { state.flickr = configured; ft = Promise.resolve(); }

  paint();                                                           // cameras while loading
  ft.then(function () { paint("photos"); });                         // photos show as soon as Flickr answers
  var vt = loadVideos().then(function () { paint("videos"); });
  var soc = loadSocial();
  var extras = Promise.all([vt, soc]);
  var sizeKey = function () { return state.videos.length + ":" + state.social.length + ":" + state.tweets.length; };
  var mixDone = false, mixKey = "";
  Promise.all([ft, timeout(extras, 2500)]).then(function () { paint("mix"); mixDone = true; mixKey = sizeKey(); });   // don't wait long for videos/social
  extras.then(function () { if (mixDone && sizeKey() !== mixKey) { paint("mix"); mixKey = sizeKey(); } });             // late arrivals → one refresh
})();
