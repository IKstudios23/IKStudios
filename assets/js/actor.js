/* IKSTUDIOS — Actor landing: tall vertical headshot reel (loops forever) */
(function () {
  var el = document.getElementById("headshots");
  if (!el) return;
  var C = (window.IK_CONFIG && window.IK_CONFIG.actor) || {};
  var list = (C.headshots && C.headshots.length) ? C.headshots : [
    "assets/img/actor/headshot-01.jpg", "assets/img/actor/headshot-02.jpg", "assets/img/actor/headshot-03.jpg",
    "assets/img/actor/headshot-04.jpg", "assets/img/actor/headshot-05.jpg", "assets/img/actor/headshot-06.jpg"];
  var half = list.slice();
  while (half.length < 10) half = half.concat(list);          // enough frames per loop to fill a tall page
  var strip = document.createElement("div");
  strip.className = "strip";
  strip.style.animationDuration = (half.length * 9) + "s";    // slower with more photos
  half.concat(half).forEach(function (src) {                  // doubled = seamless loop
    var f = document.createElement("div"), img = new Image();
    f.className = "frame";
    img.alt = ""; img.decoding = "async";
    img.onload = function () { img.classList.add("is-loaded"); };
    img.src = src;
    if (img.complete) img.classList.add("is-loaded");
    f.appendChild(img); strip.appendChild(f);
  });
  el.appendChild(strip);
})();
