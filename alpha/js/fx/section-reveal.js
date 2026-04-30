/* ──────────────────────────────────────────────────────────────────────
   fx/section-reveal.js — fade-up on every content block as it scrolls in

   Picks up a broad set of structural blocks across all five pages and
   batches them into ScrollTrigger.batch(). Each block fades up 24px
   with a 0.08s stagger inside its own batch, plays once, and disposes
   its trigger to keep the page light.

   Honors prefers-reduced-motion (bails entirely, leaves elements in
   final state).

   Block selectors are intentionally inclusive so the same plugin works
   on every page without per-page wiring:
     .section          (home)
     .campaign         (portfolio, agents)
     .book             (books)
     .studio-card      (studio)
     .banner-section   (studio)
     .pull             (portfolio, agents, books)
     .quote            (books)
     .synopsis         (books)
     .cap              (home)
     .job              (home)
     .work             (home)
     .tri-item         (home)
     .cred             (home)
     .hl-tile          (portfolio)
     .verb-col         (portfolio)
     .sm-arch-cell     (portfolio)
     .ad-grid          (portfolio, agents)  — reveal as one block
   ────────────────────────────────────────────────────────────────────── */

(function () {
  var SELECTORS = [
    '.section',
    '.campaign',
    '.book',
    '.studio-card',
    '.banner-section',
    '.pull',
    '.quote',
    '.synopsis',
    '.cap',
    '.job',
    '.work',
    '.tri-item',
    '.cred',
    '.hl-tile',
    '.verb-col',
    '.sm-arch-cell',
    '.ad-grid',
  ];

  function init() {
    if (typeof window.gsap !== 'object' || !window.gsap || !window.ScrollTrigger) {
      console.warn('[section-reveal] GSAP/ScrollTrigger not loaded; skipping reveals');
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;

    gsap.registerPlugin(ScrollTrigger);

    // Tell smooth-scroll.js to bridge (it listens for this event).
    window.SiteFX && window.SiteFX.emit('scrolltrigger:ready');

    var els = document.querySelectorAll(SELECTORS.join(','));
    if (!els.length) return;

    // Lock initial state immediately so nothing flashes before its turn.
    gsap.set(els, { y: 24, autoAlpha: 0 });

    ScrollTrigger.batch(els, {
      start: 'top 88%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.08,
          overwrite: 'auto',
        });
      },
    });

    // Refresh after fonts/images settle so triggers land on final layout.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); }, { once: true });
  }

  if (window.SiteFX) {
    window.SiteFX.register('section-reveal', { init: init });
    window.SiteFX.on('page:enter', function (data) {
      if (data && data.container) init();
    });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
