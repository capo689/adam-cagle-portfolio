/* ──────────────────────────────────────────────────────────────────────
   fx/hero-reveal.js — choreographed hero entrance

   Sequence (all clamped to one timeline):
     1. .hero-kicker  fades in + slides 8px (0.5s)
     2. .hero-name    chars rise from below their line (SplitText with
                      mask:'lines'), stagger 0.025s, 0.8s, power3.out
     3. supporting bits (.hero-role, .hero-meta, .hero-sub > *,
                      .portrait-img, .hero-neon, .hero-stat-row,
                      .studios) fade up 18px (0.6s, stagger 0.06)

   SplitText is sensitive to font loading — we wait for document.fonts
   .ready before splitting so line breaks land where the visible layout
   puts them.

   Honors prefers-reduced-motion (snaps everything to final state, no
   animation).

   No conflict with section-reveal.js: hero containers are <section
   class="hero"> (not class="section"), so section-reveal's '.section'
   selector doesn't match them.
   ────────────────────────────────────────────────────────────────────── */

(function () {
  function init() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    if (typeof window.gsap !== 'object' || !window.gsap) {
      console.warn('[hero-reveal] GSAP not loaded; skipping');
      return;
    }
    var gsap = window.gsap;
    var SplitText = window.SplitText;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var kicker  = hero.querySelector('.hero-kicker');
    var name    = hero.querySelector('.hero-name');
    // Lock everything off-screen first to avoid FOUC, then play once ready.
    var supports = hero.querySelectorAll(
      '.hero-role, .hero-meta, .hero-sub > *, .portrait-img, .hero-neon, .hero-stat-row, .studios'
    );

    if (kicker)         gsap.set(kicker,   { autoAlpha: 0, y: -8 });
    if (name)           gsap.set(name,     { autoAlpha: 0 });
    if (supports.length) gsap.set(supports, { autoAlpha: 0, y: 18 });

    function play() {
      if (reduce) {
        if (kicker)         gsap.set(kicker,   { autoAlpha: 1, y: 0 });
        if (name)           gsap.set(name,     { autoAlpha: 1 });
        if (supports.length) gsap.set(supports, { autoAlpha: 1, y: 0 });
        return;
      }

      var split = null;
      if (name && SplitText) {
        // SplitText needs the element visible to measure line breaks.
        gsap.set(name, { autoAlpha: 1 });
        try {
          split = new SplitText(name, { type: 'lines,chars', mask: 'lines' });
        } catch (err) {
          console.warn('[hero-reveal] SplitText failed, falling back:', err);
          split = null;
        }
      }

      var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (kicker) {
        tl.to(kicker, { autoAlpha: 1, y: 0, duration: 0.5 }, 0);
      }

      if (split && split.chars && split.chars.length) {
        tl.from(split.chars, {
          yPercent: 110,
          autoAlpha: 0,
          duration: 0.8,
          stagger: 0.025,
        }, 0.2);
      } else if (name) {
        // Fallback: fade the whole name in.
        tl.fromTo(name, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.2);
      }

      if (supports.length) {
        tl.to(supports, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.06,
        }, 0.7);
      }
    }

    // Wait for fonts so SplitText measures lines on final layout. Then
    // either play immediately or, if the preloader is active, defer
    // until it emits 'preloader:done' so the hero choreography doesn't
    // fire underneath the curtain.
    function ready() {
      if (window.__preloaderActive && window.SiteFX) {
        window.SiteFX.on('preloader:done', play);
      } else {
        play();
      }
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(ready);
    } else {
      ready();
    }
  }

  if (window.SiteFX) {
    window.SiteFX.register('hero-reveal', { init: init, owns: ['.hero-name'] });
    // Re-run on Barba navigation. Boot-time page:enter has no container,
    // so this listener no-ops at boot.
    window.SiteFX.on('page:enter', function (data) {
      if (data && data.container) init();
    });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
