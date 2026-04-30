/* ──────────────────────────────────────────────────────────────────────
   fx/magnetic.js — pointer-magnet on buttons / CTAs

   Selected elements gently follow the pointer on hover. Strength 0.25
   (cursor moves 100px → element moves 25px). Eases back on leave.

   Selectors: .btn, .rail-cta, .hero-cta, .work-cta, .cta, .b-btn,
              .wp-btn, .lb-close, .hf-close-btn, [data-magnetic]
   Skip the inner .arrow / .cta-arrow / .b-icon — they get a small
   secondary follow (1.5x the host's translate) so the arrow leads
   slightly. (Optional polish handled inline.)

   Skipped on:
     - prefers-reduced-motion
     - coarse pointers (touchscreens — no hover state)
   ────────────────────────────────────────────────────────────────────── */

(function () {
  var SELECTOR = [
    '.btn',
    '.rail-cta',
    '.hero-cta',
    '.work-cta',
    '.cta',
    '.b-btn',
    '.wp-btn',
    '[data-magnetic]',
  ].join(',');

  var STRENGTH = 0.25;     // host translate ratio
  var ARROW_BOOST = 1.6;   // arrow / icon translate, relative to host

  function bind(el, gsap) {
    var arrow = el.querySelector('.arrow, .cta-arrow, .b-icon');
    var qx = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
    var qy = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
    var ax = arrow ? gsap.quickTo(arrow, 'x', { duration: 0.5, ease: 'power3.out' }) : null;
    var ay = arrow ? gsap.quickTo(arrow, 'y', { duration: 0.5, ease: 'power3.out' }) : null;

    function move(e) {
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      var dx = (e.clientX - cx) * STRENGTH;
      var dy = (e.clientY - cy) * STRENGTH;
      qx(dx); qy(dy);
      if (ax) { ax(dx * ARROW_BOOST); ay(dy * ARROW_BOOST); }
    }
    function reset() {
      qx(0); qy(0);
      if (ax) { ax(0); ay(0); }
    }

    el.addEventListener('mouseenter', move);
    el.addEventListener('mousemove',  move);
    el.addEventListener('mouseleave', reset);
  }

  function init() {
    if (!window.gsap) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    var els = document.querySelectorAll(SELECTOR);
    if (!els.length) return;
    Array.prototype.forEach.call(els, function (el) { bind(el, window.gsap); });
  }

  if (window.SiteFX) {
    window.SiteFX.register('magnetic', { init: init });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
