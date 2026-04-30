/* ──────────────────────────────────────────────────────────────────────
   smooth-scroll.js — Lenis smooth scroll, GSAP-integrated
   Standard Lenis+GSAP pattern: lenis updates window scroll smoothly,
   ScrollTrigger reads from window scrollY natively, gsap.ticker drives
   the rAF loop, lenis.on('scroll', ScrollTrigger.update) keeps them
   in sync. No scrollerProxy needed (and the previous one was bridging
   to a non-existent Lenis property).

   Exposes window.__lenis so downstream plugins can call .scrollTo(),
   .stop(), .start().

   Reduced motion: skip Lenis entirely, native scroll handles the page.
   ────────────────────────────────────────────────────────────────────── */

(function () {
  function init() {
    if (typeof window.Lenis !== 'function') {
      console.warn('[smooth-scroll] Lenis not loaded; falling back to native scroll');
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    var lenis = new window.Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    window.__lenis = lenis;

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;

    if (gsap && gsap.ticker) {
      // Drive Lenis from GSAP's ticker so animations and scroll stay in sync.
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      // Fallback: standalone rAF loop.
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }

    if (ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
    } else if (window.SiteFX) {
      window.SiteFX.on('scrolltrigger:ready', function () {
        if (window.ScrollTrigger) window.__lenis.on('scroll', window.ScrollTrigger.update);
      });
    }
  }

  if (window.SiteFX) {
    window.SiteFX.register('smooth-scroll', { init: init });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
