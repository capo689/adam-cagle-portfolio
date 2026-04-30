/* ──────────────────────────────────────────────────────────────────────
   fx/parallax.js — scroll-scrubbed Y drift on selected images

   Each parallax element gets a ScrollTrigger that drifts it -40px
   (default) over its journey through the viewport. Soft scrub so the
   motion lags behind scroll slightly.

   Default selectors (tasteful, narrow):
     .portrait-img    (home hero)
     .hero-neon       (home hero)
     .banner-wrap     (studio banner showcase)
     .book-cover img  (books — book covers gently rise)

   Opt-in elsewhere:
     <element data-parallax>            default range -40
     <element data-parallax='-80'>      custom range in px

   Opt-out:
     <element data-parallax='off'>      skip a default-matched element

   Skipped on prefers-reduced-motion. ScrollTrigger refresh runs after
   fonts.ready so positions land on final layout.
   ────────────────────────────────────────────────────────────────────── */

(function () {
  var DEFAULT_SELECTORS = [
    '.portrait-img',
    '.hero-neon',
    '.banner-wrap',
    '.book-cover img',
  ];
  var DEFAULT_RANGE = -40;

  function rangeFor(el) {
    var attr = el.getAttribute('data-parallax');
    if (attr === 'off' || attr === 'false') return null;
    if (attr && attr !== '' && !isNaN(parseFloat(attr))) return parseFloat(attr);
    return DEFAULT_RANGE;
  }

  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    var seen = new Set();
    function bind(el) {
      if (seen.has(el)) return;
      seen.add(el);
      var range = rangeFor(el);
      if (range === null) return;
      gsap.fromTo(el,
        { y: 0 },
        {
          y: range,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
          },
        });
    }

    DEFAULT_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(bind);
    });
    document.querySelectorAll('[data-parallax]').forEach(bind);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }

  if (window.SiteFX) {
    window.SiteFX.register('parallax', { init: init });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
