/* IKSTUDIOS — shared looping-carousel positioning.
   Sets each item's offset from the current one (-2…2) and its state:
   cur = sharp + full opacity · near = blurred + faded · far = hidden. */
window.IK_carousel = {
  apply: function (els, cur) {
    var n = els.length;
    els.forEach(function (el, i) {
      var d = ((i - cur) % n + n) % n;
      if (d > n / 2) d -= n;
      el.style.setProperty("--o", Math.max(-2, Math.min(2, d)));
      el.dataset.pos = d === 0 ? "cur" : (Math.abs(d) === 1 ? "near" : "far");
      el.toggleAttribute("inert", d !== 0);
      el.setAttribute("aria-hidden", d === 0 ? "false" : "true");
    });
  }
};
