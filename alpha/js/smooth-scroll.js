/* ──────────────────────────────────────────────────────────────────────
   smooth-scroll.js — Lenis smooth scroll
   Foundational scroll baseline. Every other scroll-driven effect (GSAP
   ScrollTrigger, Barba, section-reveal, parallax) hooks into the same
   rAF loop Lenis owns.

   Exposes window.__lenis so downstream plugins can call .scrollTo(),
   .stop(), .start(), or sync ScrollTrigger via Lenis events.

   Reduced motion: if the user prefers reduced motion, we skip Lenis
   entirely and let native scroll handle the page.
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

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    window.__lenis = lenis;

    // Bridge to GSAP ScrollTrigger if it's already loaded (or once it loads).
    function bridgeScrollTrigger() {
      if (!window.ScrollTrigger) return;
      lenis.on('scroll', window.ScrollTrigger.update);
      window.ScrollTrigger.scrollerProxy(document.documentElement, {
        scrollTop: function (value) {
          if (arguments.length) lenis.scrollTo(value, { immediate: true });
          return lenis.actualScroll || window.scrollY;
        },
        getBoundingClientRect: function () {
          return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
      });
    }
    bridgeScrollTrigger();

    window.SiteFX && window.SiteFX.on('scrolltrigger:ready', bridgeScrollTrigger);
  }

  if (window.SiteFX) {
    window.SiteFX.register('smooth-scroll', { init: init });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
