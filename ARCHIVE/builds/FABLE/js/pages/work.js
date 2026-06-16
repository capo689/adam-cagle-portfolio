// js/pages/work.js
// Work / portfolio case-study page scroll choreography.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;

  function initHero() {
    A.heroReveal({
      name: '.hero .hero-title',
      sub:  '.hero .hero-intro',
      kick: '.hero .hero-kicker'
    });
    const toc = document.querySelector('.hero .hero-toc');
    if (toc) {
      const links = toc.querySelectorAll('a, button');
      if (links.length) {
        gsap.set(links, { opacity: 0, y: 14 });
        gsap.to(links, {
          opacity: 1, y: 0,
          duration: 0.5, ease: 'power3.out',
          stagger: 0.04, delay: 0.9
        });
      } else {
        gsap.fromTo(toc, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.9, ease: 'power3.out' });
      }
    }
  }

  function revealCaseHead(section) {
    const label = section.querySelector('.sect-label');
    const head  = section.querySelector('.sect-head');
    const meta  = section.querySelector('.c-meta');
    if (label) A.reveal(label, { y: 22, duration: 0.55, start: 'top 88%' });
    if (head)  A.splitReveal(head, { stagger: 0.026, start: 'top 84%' });
    if (meta)  A.reveal(meta,  { y: 34, duration: 0.85, start: 'top 82%' });
  }

  function revealCaseBody(section) {
    // case-grid (problem / insight / solution) and case-grid-2
    section.querySelectorAll('.case-grid, .case-grid-2').forEach((grid) => {
      const cells = grid.querySelectorAll('.case-cell');
      if (!cells.length) return;
      gsap.set(cells, { y: 32, opacity: 0 });
      gsap.to(cells, {
        y: 0, opacity: 1,
        duration: 0.8, ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: grid, start: 'top 84%', toggleActions: 'play none none reverse' }
      });
    });

    // Ad grids
    section.querySelectorAll('.ad-grid').forEach((grid) => {
      const ads = grid.querySelectorAll('.ad');
      if (!ads.length) return;
      gsap.set(ads, { y: 50, opacity: 0 });
      gsap.to(ads, {
        y: 0, opacity: 1,
        duration: 0.9, ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: grid, start: 'top 78%', toggleActions: 'play none none reverse' }
      });
      ads.forEach((ad) => {
        const img = ad.querySelector('img');
        if (img) A.kenBurns(img, { trigger: ad, from: 1.05 });
      });
    });

    // Pull quotes
    section.querySelectorAll('.pull').forEach((pull) => {
      A.reveal(pull, { y: 44, duration: 0.85, start: 'top 82%', trigger: pull });
    });

    // Verb blocks (Killer Network)
    const verbs = section.querySelector('.verbs');
    if (verbs) {
      const cells = verbs.querySelectorAll('.v, .kill, .class, .verb-col');
      if (cells.length) {
        gsap.set(cells, { y: 18, opacity: 0 });
        gsap.to(cells, {
          y: 0, opacity: 1,
          duration: 0.5, ease: 'power2.out',
          stagger: 0.035,
          scrollTrigger: { trigger: verbs, start: 'top 78%', toggleActions: 'play none none reverse' }
        });
      }
    }

    // Sunset Marquis movement / pair / arch
    section.querySelectorAll('.sm-mvmt').forEach((mvmt) => {
      A.reveal(mvmt, { y: 18, duration: 0.55, start: 'top 88%' });
    });
    section.querySelectorAll('.sm-pair').forEach((pair) => {
      const ad   = pair.querySelector('.ad');
      const pull = pair.querySelector('.pull');
      if (ad) {
        A.reveal(ad, { y: 44, duration: 0.85, start: 'top 80%', trigger: pair });
        const img = ad.querySelector('img');
        if (img) A.kenBurns(img, { trigger: pair, from: 1.06 });
      }
      if (pull) {
        gsap.set(pull, { y: 50, opacity: 0 });
        gsap.to(pull, {
          y: 0, opacity: 1,
          duration: 0.9, ease: 'power3.out', delay: 0.1,
          scrollTrigger: { trigger: pair, start: 'top 80%', toggleActions: 'play none none reverse' }
        });
      }
    });
    const arch = section.querySelector('.sm-arch');
    if (arch) {
      const cells = arch.querySelectorAll('.sm-arch-cell');
      if (cells.length) {
        gsap.set(cells, { y: 44, opacity: 0 });
        gsap.to(cells, {
          y: 0, opacity: 1,
          duration: 0.85, ease: 'power3.out',
          stagger: 0.15,
          scrollTrigger: { trigger: arch, start: 'top 80%', toggleActions: 'play none none reverse' }
        });
      }
    }

    // Brand-book cover viewers (Figueroa, Clink, Sunset site)
    section.querySelectorAll('.hf-cover-wrap').forEach((cover) => {
      A.reveal(cover, { y: 60, duration: 1.0, start: 'top 78%' });
      const img = cover.querySelector('img');
      if (img) A.kenBurns(img, { trigger: cover, from: 1.05 });
    });
  }

  function initAdditional(section) {
    revealCaseHead(section);
    const grid = section.querySelector('.extra-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('.extra-card');
    if (!cards.length) return;
    gsap.set(cards, { y: 36, opacity: 0 });
    gsap.to(cards, {
      y: 0, opacity: 1,
      duration: 0.75, ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: grid, start: 'top 84%', toggleActions: 'play none none reverse' }
    });
  }

  function init() {
    if (A.reduced) return;
    initHero();
    document.querySelectorAll('section.case-rich').forEach((section) => {
      if (section.id === 'additional') {
        initAdditional(section);
      } else {
        revealCaseHead(section);
        revealCaseBody(section);
      }
    });
    A.refreshOnLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
