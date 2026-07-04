/* ============================================================
   IKSTUDIOS — Shared behaviour (all pages)
   ============================================================ */
(function () {
  /* current year in footer */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  /* mark the active nav link */
  var path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav__links a[data-page]").forEach(function (a) {
    if (a.getAttribute("data-page") === path) a.setAttribute("aria-current", "page");
  });

  /* subtle nav change once you scroll */
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () {
      nav.style.background = window.scrollY > 12 ? "rgba(0,0,0,.82)" : "rgba(0,0,0,.55)";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* scroll-reveal for elements marked .reveal */
  var items = document.querySelectorAll(".reveal");
  if (items.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  /* home only: once you've scrolled to the bottom, a further scroll
     down flows straight into the About page */
  var heroEl = document.querySelector(".hero");
  if (heroEl) {
    window.scrollTo(0, 0);                        // always start at the top of the hero
    var wentAbout = false;
    var readyAt = Date.now() + 500;              // ignore any stray scroll right after load
    var atEnd = function () {
      return (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 8);
    };
    var goAbout = function () {
      if (wentAbout || Date.now() < readyAt) return;
      wentAbout = true;
      window.location.href = "about.html";
    };
    window.addEventListener("wheel", function (e) {
      if (e.deltaY > 6 && atEnd()) goAbout();
    }, { passive: true });
    var tY = null;
    window.addEventListener("touchstart", function (e) { tY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener("touchmove", function (e) {
      if (tY !== null && (tY - e.touches[0].clientY) > 26 && atEnd()) goAbout(); // swipe up = scroll down
    }, { passive: true });
    window.addEventListener("keydown", function (e) {
      if ((e.key === "PageDown" || e.key === "ArrowDown" || e.key === " " || e.code === "Space") && atEnd()) goAbout();
    });
  }
})();
