// js/pages/portfolio.js
// Portfolio scroll choreography. Uses AnimHelpers from animations.js.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;

  function revealProjectHead(section) {
    const label = section.querySelector('.sect-label');
    const title = section.querySelector('.sect-head');
    const meta  = section.querySelector('.c-meta');
    if (label) A.reveal(label, { y: 24, duration: 0.6, start: 'top 88%' });
    if (title) A.splitReveal(title, { stagger: 0.028, start: 'top 82%' });
    if (meta)  A.reveal(meta,  { y: 36, duration: 0.85, start: 'top 80%' });
  }

  function initTraveler() {
    const section = document.getElementById('traveler');
    if (!section) return;
    revealProjectHead(section);

    const heroAd = section.querySelector('.ad-grid.g-1 .ad');
    if (heroAd) {
      A.reveal(heroAd, { y: 60, duration: 1.0, start: 'top 78%' });
      const img = heroAd.querySelector('img');
      if (img) A.kenBurns(img, { trigger: heroAd, from: 1.06 });
    }

    const pull1 = section.querySelector('.c-body > .pull');
    if (pull1) A.reveal(pull1, { y: 50, duration: 0.85 });

    const gridAds = section.querySelectorAll('.ad-grid.g-3 .ad');
    if (gridAds.length) {
      const grid = section.querySelector('.ad-grid.g-3');
      gsap.set(gridAds, { y: 50, opacity: 0 });
      gsap.to(gridAds, {
        y: 0, opacity: 1,
        duration: 0.85, ease: 'power3.out',
        stagger: { each: 0.08, from: 'start' },
        scrollTrigger: { trigger: grid, start: 'top 78%', toggleActions: 'play none none reverse' }
      });
      gridAds.forEach((ad) => {
        const img = ad.querySelector('img');
        if (img) A.kenBurns(img, { trigger: ad, from: 1.05 });
      });
    }

    const hlTiles = section.querySelectorAll('.hl-grid .hl-tile');
    if (hlTiles.length) {
      const hlGrid = section.querySelector('.hl-grid');
      gsap.set(hlTiles, { y: 30, opacity: 0 });
      gsap.to(hlTiles, {
        y: 0, opacity: 1,
        duration: 0.6, ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: { trigger: hlGrid, start: 'top 82%', toggleActions: 'play none none reverse' }
      });
    }
  }

  function initSunset() {
    const section = document.getElementById('sunset');
    if (!section) return;
    revealProjectHead(section);

    section.querySelectorAll('.sm-mvmt').forEach((mvmt) => {
      A.reveal(mvmt, { y: 20, duration: 0.6, start: 'top 88%' });
    });

    section.querySelectorAll('.sm-pair').forEach((pair) => {
      const ad   = pair.querySelector('.ad');
      const pull = pair.querySelector('.pull');
      if (ad) {
        A.reveal(ad, { y: 50, duration: 0.9, start: 'top 80%', trigger: pair });
        const img = ad.querySelector('img');
        if (img) A.kenBurns(img, { trigger: pair, from: 1.06 });
      }
      if (pull) {
        gsap.set(pull, { y: 60, opacity: 0 });
        gsap.to(pull, {
          y: 0, opacity: 1,
          duration: 0.95, ease: 'power3.out', delay: 0.12,
          scrollTrigger: { trigger: pair, start: 'top 80%', toggleActions: 'play none none reverse' }
        });
      }
    });

    const archCells = section.querySelectorAll('.sm-arch .sm-arch-cell');
    if (archCells.length) {
      const arch = section.querySelector('.sm-arch');
      gsap.set(archCells, { y: 50, opacity: 0 });
      gsap.to(archCells, {
        y: 0, opacity: 1,
        duration: 0.9, ease: 'power3.out',
        stagger: 0.18,
        scrollTrigger: { trigger: arch, start: 'top 80%', toggleActions: 'play none none reverse' }
      });
    }

    const smSite = section.querySelector('.sm-site');
    if (smSite) {
      A.reveal(smSite, { y: 60, duration: 1.0, start: 'top 78%' });
      const img = smSite.querySelector('img');
      if (img) A.kenBurns(img, { trigger: smSite, from: 1.05 });
    }
  }

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
        scrollTrigger: { trigger: adGrid, start: 'top 75%', toggleActions: 'play none none reverse' }
      });
      ads.forEach((ad) => {
        const img = ad.querySelector('img');
        if (img) A.kenBurns(img, { trigger: ad, from: 1.08 });
      });
    }

    if (verbs.length && verbsContainer) {
      gsap.set(verbs, { y: 20, opacity: 0 });
      gsap.to(verbs, {
        y: 0, opacity: 1,
        duration: 0.5, ease: 'power2.out',
        stagger: 0.035,
        scrollTrigger: { trigger: verbsContainer, start: 'top 75%', toggleActions: 'play none none reverse' }
      });
    }

    if (pull) A.reveal(pull, { y: 50, duration: 0.9, start: 'top 82%' });
  }

  function initFileKeepers() {
    const section = document.getElementById('filekeepers');
    if (!section) return;
    revealProjectHead(section);

    const ads = section.querySelectorAll('.ad-grid.g-2 .ad');
    if (ads.length) {
      const grid = section.querySelector('.ad-grid.g-2');
      gsap.set(ads, { y: 50, opacity: 0 });
      gsap.to(ads, {
        y: 0, opacity: 1,
        duration: 0.9, ease: 'power3.out',
        stagger: { each: 0.1, from: 'start' },
        scrollTrigger: { trigger: grid, start: 'top 78%', toggleActions: 'play none none reverse' }
      });
      ads.forEach((ad) => {
        const img = ad.querySelector('img');
        if (img) A.kenBurns(img, { trigger: ad, from: 1.06 });
      });
    }

    section.querySelectorAll('.pull').forEach((pull) => {
      A.reveal(pull, { y: 50, duration: 0.9, start: 'top 82%', trigger: pull });
    });
  }

  function initFigueroa() {
    const section = document.getElementById('figueroa');
    if (!section) return;
    revealProjectHead(section);

    const cover = section.querySelector('#hf-cover');
    if (cover) {
      A.reveal(cover, { y: 70, duration: 1.05, start: 'top 78%' });
      const img = cover.querySelector('img');
      if (img) A.kenBurns(img, { trigger: cover, from: 1.05 });
    }

    const pull = section.querySelector('.pull');
    if (pull) A.reveal(pull, { y: 50, duration: 0.9, start: 'top 82%' });
  }

  function initClink() {
    const section = document.getElementById('clink');
    if (!section) return;
    revealProjectHead(section);

    const cover = section.querySelector('#clink-cover');
    if (cover) {
      A.reveal(cover, { y: 70, duration: 1.05, start: 'top 78%' });
      const img = cover.querySelector('img');
      if (img) A.kenBurns(img, { trigger: cover, from: 1.05 });
    }

    const pull = section.querySelector('.pull');
    if (pull) A.reveal(pull, { y: 50, duration: 0.9, start: 'top 82%' });
  }

  function initCloser() {
    const closer = document.querySelector('.closer');
    if (!closer) return;
    const say = closer.querySelector('.say');
    const cta = closer.querySelector('.cta');
    if (say) A.splitReveal(say, { stagger: 0.022, start: 'top 80%' });
    if (cta) A.reveal(cta, { y: 30, duration: 0.7, start: 'top 85%' });
  }

  function init() {
    if (A.reduced) return;
    A.heroReveal({ name: '.hero .hero-name', sub: '.hero .hero-role', kick: '.hero .hero-kicker' });
    initTraveler();
    initSunset();
    initKillerNetwork();
    initFigueroa();
    initClink();
    initFileKeepers();
    initCloser();
    A.refreshOnLoad();
  }

  window.initPortfolioPage = init;

  function isMyPage() {
    const c = document.querySelector('[data-barba-namespace]');
    return c && c.dataset.barbaNamespace === 'portfolio';
  }

  if (isMyPage()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
