// js/pages/portfolio.js
// Portfolio-specific animations.
// - Title-card reveal on the hero
// - Per-project scroll-driven reveals for Traveler, Sunset, Killer, Hotel
//   Figueroa, Clink Hostels, plus the closer
// Bails on prefers-reduced-motion, missing GSAP, missing SplitText, or
// missing ScrollTrigger.

(function () {
  if (typeof gsap === 'undefined') return;
  if (typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Helpers ───
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
      duration: opts.duration || 0.85,
      ease: opts.ease || 'power3.out',
      stagger: opts.stagger || 0,
      scrollTrigger: {
        trigger: trigger,
        start: opts.start || 'top 82%',
        toggleActions: 'play none none reverse'
      }
    });
  }

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

  // Subtle parallax. Drift y over the duration the trigger is in view.
  function parallax(target, opts) {
    if (typeof ScrollTrigger === 'undefined') return;
    opts = opts || {};
    const trigger = opts.trigger || target;
    gsap.to(target, {
      y: opts.distance != null ? opts.distance : -60,
      ease: 'none',
      scrollTrigger: {
        trigger: trigger,
        start: 'top bottom',
        end:   'bottom top',
        scrub: opts.scrub != null ? opts.scrub : 0.6
      }
    });
  }

  // Ken-burns: image starts slightly scaled up, eases down to 1 as it enters
  function kenBurns(target, opts) {
    if (typeof ScrollTrigger === 'undefined') return;
    opts = opts || {};
    const trigger = opts.trigger || target;
    gsap.fromTo(target,
      { scale: opts.from || 1.08 },
      {
        scale: 1,
        duration: 1.4,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: trigger,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }

  // Common project header reveal: label + SplitText title + meta sidebar
  function revealProjectHead(section) {
    const label = section.querySelector('.sect-label');
    const title = section.querySelector('.sect-head');
    const meta  = section.querySelector('.c-meta');

    if (label) reveal(label, { y: 24, duration: 0.6, start: 'top 88%' });
    if (title) splitReveal(title, { stagger: 0.028, start: 'top 82%' });
    if (meta)  reveal(meta,  { y: 36, duration: 0.85, start: 'top 80%' });
  }

  // ─── Hero ───
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
            0.15);
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
            '-=0.3');
        }
      });
  }

  // ─── 01 Traveler Guitar ───
  function initTraveler() {
    const section = document.getElementById('traveler');
    if (!section) return;
    revealProjectHead(section);

    // Hero ad (The Road) full-bleed
    const heroAd = section.querySelector('.ad-grid.g-1 .ad');
    if (heroAd) {
      reveal(heroAd, { y: 60, duration: 1.0, start: 'top 78%' });
      const img = heroAd.querySelector('img');
      if (img) kenBurns(img, { trigger: heroAd, from: 1.06 });
    }

    // Pull body
    const pull1 = section.querySelector('.c-body > .pull');
    if (pull1) reveal(pull1, { y: 50, duration: 0.85 });

    // 3-col grid of 6 ads
    const gridAds = section.querySelectorAll('.ad-grid.g-3 .ad');
    if (gridAds.length) {
      const grid = section.querySelector('.ad-grid.g-3');
      gsap.set(gridAds, { y: 50, opacity: 0 });
      gsap.to(gridAds, {
        y: 0, opacity: 1,
        duration: 0.85, ease: 'power3.out',
        stagger: { each: 0.08, from: 'start' },
        scrollTrigger: {
          trigger: grid, start: 'top 78%',
          toggleActions: 'play none none reverse'
        }
      });
      // Each image gets a subtle ken-burns
      gridAds.forEach((ad) => {
        const img = ad.querySelector('img');
        if (img) kenBurns(img, { trigger: ad, from: 1.05 });
      });
    }

    // Headline tile grid (the index)
    const hlTiles = section.querySelectorAll('.hl-grid .hl-tile');
    if (hlTiles.length) {
      const hlGrid = section.querySelector('.hl-grid');
      gsap.set(hlTiles, { y: 30, opacity: 0 });
      gsap.to(hlTiles, {
        y: 0, opacity: 1,
        duration: 0.6, ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: hlGrid, start: 'top 82%',
          toggleActions: 'play none none reverse'
        }
      });
    }
  }

  // ─── 02 Sunset Marquis ───
  function initSunset() {
    const section = document.getElementById('sunset');
    if (!section) return;
    revealProjectHead(section);

    // Movement labels (I, II, III, IV) fade in as you reach them
    section.querySelectorAll('.sm-mvmt').forEach((mvmt) => {
      reveal(mvmt, { y: 20, duration: 0.6, start: 'top 88%' });
    });

    // Each sm-pair: ad + pull reveal together, with ad slightly leading
    section.querySelectorAll('.sm-pair').forEach((pair) => {
      const ad   = pair.querySelector('.ad');
      const pull = pair.querySelector('.pull');
      if (ad) {
        reveal(ad, { y: 50, duration: 0.9, start: 'top 80%', trigger: pair });
        const img = ad.querySelector('img');
        if (img) kenBurns(img, { trigger: pair, from: 1.06 });
      }
      if (pull) {
        gsap.set(pull, { y: 60, opacity: 0 });
        gsap.to(pull, {
          y: 0, opacity: 1,
          duration: 0.95, ease: 'power3.out',
          delay: 0.12,
          scrollTrigger: {
            trigger: pair, start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        });
      }
    });

    // Architecture cells (Cavatina, LIVE@SunsetMarquis) stagger in
    const archCells = section.querySelectorAll('.sm-arch .sm-arch-cell');
    if (archCells.length) {
      const arch = section.querySelector('.sm-arch');
      gsap.set(archCells, { y: 50, opacity: 0 });
      gsap.to(archCells, {
        y: 0, opacity: 1,
        duration: 0.9, ease: 'power3.out',
        stagger: 0.18,
        scrollTrigger: {
          trigger: arch, start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });
    }

    // The "live in the wild" SunsetMarquis.com link tile
    const smSite = section.querySelector('.sm-site');
    if (smSite) {
      reveal(smSite, { y: 60, duration: 1.0, start: 'top 78%' });
      const img = smSite.querySelector('img');
      if (img) kenBurns(img, { trigger: smSite, from: 1.05 });
    }
  }

  // ─── 03 Killer NIC ───
  function initKillerNetwork() {
    const section = document.getElementById('killer');
    if (!section) return;
    revealProjectHead(section);

    const ads = section.querySelectorAll('.ad-grid.g-3 .ad');
    const verbs = section.querySelectorAll('.verbs .v, .verbs .kill, .verbs .class');
    const verbsContainer = section.querySelector('.verbs');
    const pull = section.querySelector('.pull');

    if (ads.length) {
      const adGrid = section.querySelector('.ad-grid.g-3');
      gsap.set(ads, { y: 60, opacity: 0 });
      gsap.to(ads, {
        y: 0, opacity: 1,
        duration: 1.0, ease: 'power3.out',
        stagger: 0.18,
        scrollTrigger: {
          trigger: adGrid, start: 'top 75%',
          toggleActions: 'play none none reverse'
        }
      });
      ads.forEach((ad) => {
        const img = ad.querySelector('img');
        if (img) kenBurns(img, { trigger: ad, from: 1.08 });
      });
    }

    if (verbs.length && verbsContainer) {
      gsap.set(verbs, { y: 20, opacity: 0 });
      gsap.to(verbs, {
        y: 0, opacity: 1,
        duration: 0.5, ease: 'power2.out',
        stagger: 0.035,
        scrollTrigger: {
          trigger: verbsContainer, start: 'top 75%',
          toggleActions: 'play none none reverse'
        }
      });
    }

    if (pull) reveal(pull, { y: 50, duration: 0.9, start: 'top 82%' });
  }

  // ─── 04 Hotel Figueroa ───
  function initFigueroa() {
    const section = document.getElementById('figueroa');
    if (!section) return;
    revealProjectHead(section);

    const cover = section.querySelector('#hf-cover');
    if (cover) {
      reveal(cover, { y: 70, duration: 1.05, start: 'top 78%' });
      const img = cover.querySelector('img');
      if (img) kenBurns(img, { trigger: cover, from: 1.05 });
    }

    const pull = section.querySelector('.pull');
    if (pull) reveal(pull, { y: 50, duration: 0.9, start: 'top 82%' });
  }

  // ─── 05 Clink Hostels ───
  function initClink() {
    const section = document.getElementById('clink');
    if (!section) return;
    revealProjectHead(section);

    const cover = section.querySelector('#clink-cover');
    if (cover) {
      reveal(cover, { y: 70, duration: 1.05, start: 'top 78%' });
      const img = cover.querySelector('img');
      if (img) kenBurns(img, { trigger: cover, from: 1.05 });
    }

    const pull = section.querySelector('.pull');
    if (pull) reveal(pull, { y: 50, duration: 0.9, start: 'top 82%' });
  }

  // ─── Closer ───
  function initCloser() {
    const closer = document.querySelector('.closer');
    if (!closer) return;
    const say = closer.querySelector('.say');
    const cta = closer.querySelector('.cta');

    if (say) splitReveal(say, { stagger: 0.022, start: 'top 80%' });
    if (cta) reveal(cta, { y: 30, duration: 0.7, start: 'top 85%' });
  }

  function init() {
    if (reduced) return;
    initHero();
    initTraveler();
    initSunset();
    initKillerNetwork();
    initFigueroa();
    initClink();
    initCloser();

    // Refresh ScrollTrigger after layout settles
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
