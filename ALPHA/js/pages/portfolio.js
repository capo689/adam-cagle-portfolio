// js/pages/portfolio.js
// Portfolio-specific animations.
// Phase 1: title-card reveal
// Phase 2: project moments (scroll-driven)
//
// Bails on prefers-reduced-motion, missing GSAP, missing SplitText, or
// missing ScrollTrigger. Each module checks its own dependencies.

(function () {
  if (typeof gsap === 'undefined') return;
  if (typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Helper: scroll-driven reveal ───
  function reveal(target, opts) {
    if (typeof ScrollTrigger === 'undefined') return;
    opts = opts || {};
    const els = (target instanceof NodeList || Array.isArray(target))
      ? Array.from(target) : [target];
    if (!els.length) return;
    const trigger = opts.trigger || els[0];

    gsap.set(els, { y: opts.y != null ? opts.y : 50, opacity: 0 });
    gsap.to(els, {
      y: 0,
      opacity: 1,
      duration: opts.duration || 0.8,
      ease: opts.ease || 'power3.out',
      stagger: opts.stagger || 0,
      scrollTrigger: {
        trigger: trigger,
        start: opts.start || 'top 82%',
        end: opts.end || 'bottom top',
        toggleActions: 'play none none reverse'
      }
    });
  }

  // ─── Helper: SplitText chars rising under a line mask ───
  function splitReveal(target, opts) {
    if (typeof SplitText === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    opts = opts || {};
    const split = new SplitText(target, {
      type: 'chars,lines',
      mask: 'lines',
      linesClass: 'split-line',
      charsClass: 'split-char'
    });
    gsap.set(split.chars, { yPercent: 110 });
    gsap.to(split.chars, {
      yPercent: 0,
      duration: opts.duration || 0.95,
      ease: 'power3.out',
      stagger: opts.stagger || 0.025,
      scrollTrigger: {
        trigger: target,
        start: opts.start || 'top 82%',
        toggleActions: 'play none none reverse'
      }
    });
  }

  // ─── Phase 1: hero title card ───
  function initHero() {
    const heroName = document.querySelector('.hero .hero-name');
    const heroSub  = document.querySelector('.hero .hero-role');
    const heroKick = document.querySelector('.hero .hero-kicker');
    if (!heroName) return;

    gsap.set([heroKick, heroName, heroSub].filter(Boolean), { opacity: 0 });

    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
      .then(() => {
        const split = new SplitText(heroName, {
          type: 'chars,lines',
          mask: 'lines',
          linesClass: 'split-line',
          charsClass: 'split-char'
        });

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (heroKick) {
          tl.fromTo(heroKick,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.6 },
            0.15
          );
        }

        gsap.set(heroName, { opacity: 1 });
        gsap.set(split.chars, { yPercent: 110 });
        tl.to(split.chars, {
          yPercent: 0,
          duration: 1.0,
          stagger: 0.022
        }, 0.25);

        if (heroSub) {
          tl.fromTo(heroSub,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.7 },
            '-=0.3'
          );
        }
      });
  }

  // ─── Phase 2: Killer Network project moment ───
  function initKillerNetwork() {
    const section = document.getElementById('killer');
    if (!section) return;

    const label  = section.querySelector('.sect-label');
    const title  = section.querySelector('.sect-head');
    const meta   = section.querySelector('.c-meta');
    const ads    = section.querySelectorAll('.ad-grid.g-3 .ad');
    const verbs  = section.querySelectorAll('.verbs .v, .verbs .kill, .verbs .class');
    const verbsContainer = section.querySelector('.verbs');
    const pull   = section.querySelector('.pull');

    // Section label rises
    if (label) reveal(label, { y: 24, duration: 0.6, start: 'top 88%' });

    // Title splits into rising chars
    if (title) splitReveal(title, { stagger: 0.028, start: 'top 82%' });

    // Meta sidebar fades up
    if (meta) reveal(meta, { y: 36, duration: 0.8, start: 'top 80%' });

    // Triptych ads stagger in with a slight scale on the image
    if (ads.length) {
      const adGrid = section.querySelector('.ad-grid.g-3');
      gsap.set(ads, { y: 60, opacity: 0 });
      ads.forEach((ad) => {
        const img = ad.querySelector('img');
        if (img) gsap.set(img, { scale: 1.08 });
      });
      gsap.to(ads, {
        y: 0,
        opacity: 1,
        duration: 1.0,
        ease: 'power3.out',
        stagger: 0.18,
        scrollTrigger: {
          trigger: adGrid,
          start: 'top 75%',
          toggleActions: 'play none none reverse'
        }
      });
      gsap.to(ads.length ? Array.from(ads).map((a) => a.querySelector('img')).filter(Boolean) : [], {
        scale: 1,
        duration: 1.4,
        ease: 'power2.out',
        stagger: 0.18,
        scrollTrigger: {
          trigger: adGrid,
          start: 'top 75%',
          toggleActions: 'play none none reverse'
        }
      });
    }

    // Verb stack: each line rises in a quick stagger
    if (verbs.length && verbsContainer) {
      gsap.set(verbs, { y: 20, opacity: 0 });
      gsap.to(verbs, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.035,
        scrollTrigger: {
          trigger: verbsContainer,
          start: 'top 75%',
          toggleActions: 'play none none reverse'
        }
      });
    }

    // Pull body rises in
    if (pull) reveal(pull, { y: 50, duration: 0.9, start: 'top 82%' });
  }

  function init() {
    if (reduced) {
      // Nothing hidden, nothing animated
      return;
    }
    initHero();
    initKillerNetwork();

    // Refresh ScrollTrigger after layout settles (fonts, images decoded)
    if (typeof ScrollTrigger !== 'undefined') {
      window.addEventListener('load', () => ScrollTrigger.refresh());
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
