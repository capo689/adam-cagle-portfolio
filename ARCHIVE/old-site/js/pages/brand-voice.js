// js/pages/brand-voice.js
// Brand Voice page scroll choreography.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;

  function initHero() {
    A.heroReveal({
      name: '.hero .hero-title',
      sub:  '.hero .hero-intro',
      kick: '.hero .hero-kicker'
    });
  }

  function revealHead(section) {
    const num   = section.querySelector('.s-num');
    const title = section.querySelector('.s-title');
    if (num)   A.reveal(num,   { y: 16, duration: 0.5, start: 'top 88%' });
    if (title) A.splitReveal(title, { stagger: 0.025, start: 'top 84%' });
  }

  function initDeliverables(section) {
    revealHead(section);
    const wrap = section.querySelector('.deliverables');
    const cells = section.querySelectorAll('.deliv');
    if (!wrap || !cells.length) return;
    gsap.set(cells, { y: 32, opacity: 0 });
    gsap.to(cells, {
      y: 0, opacity: 1,
      duration: 0.65, ease: 'power3.out',
      stagger: 0.05,
      scrollTrigger: { trigger: wrap, start: 'top 84%', toggleActions: 'play none none reverse' }
    });
  }

  function initFeatured(section) {
    revealHead(section);
    const grid = section.querySelector('.fv-grid');
    if (grid) {
      const copy = grid.querySelector('.fv-copy');
      const cover = grid.querySelector('.fv-cover, .hf-cover-wrap');
      const els = [copy, cover].filter(Boolean);
      if (els.length) {
        gsap.set(els, { y: 40, opacity: 0 });
        gsap.to(els, {
          y: 0, opacity: 1,
          duration: 0.9, ease: 'power3.out',
          stagger: 0.14,
          scrollTrigger: { trigger: grid, start: 'top 80%', toggleActions: 'play none none reverse' }
        });
        if (cover) {
          const img = cover.querySelector('img');
          if (img) A.kenBurns(img, { trigger: cover, from: 1.05 });
        }
      }
    }
    const details = section.querySelector('.fv-details');
    if (details) {
      const blocks = details.querySelectorAll('.fv-detail-block');
      if (blocks.length) {
        gsap.set(blocks, { y: 28, opacity: 0 });
        gsap.to(blocks, {
          y: 0, opacity: 1,
          duration: 0.7, ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: details, start: 'top 84%', toggleActions: 'play none none reverse' }
        });
      }
    }
    const why = section.querySelector('.fv-why');
    if (why) A.reveal(why, { y: 30, duration: 0.8, start: 'top 84%' });
  }

  function initProof(section) {
    revealHead(section);
    const wrap = section.querySelector('.proof-block');
    const items = section.querySelectorAll('.proof-item');
    if (!wrap || !items.length) return;
    items.forEach((item) => {
      const left = item.querySelector('.proof-left');
      const right = item.querySelector('.proof-right');
      const parts = [left, right].filter(Boolean);
      if (!parts.length) return;
      gsap.set(parts, { y: 30, opacity: 0 });
      gsap.to(parts, {
        y: 0, opacity: 1,
        duration: 0.75, ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: item, start: 'top 84%', toggleActions: 'play none none reverse' }
      });
    });
  }

  function initContact(section) {
    revealHead(section);
    const cta = section.querySelector('.contact-cta');
    if (cta) A.reveal(cta, { y: 24, duration: 0.7, start: 'top 86%' });
  }

  function init() {
    if (A.reduced) return;
    initHero();
    const sections = document.querySelectorAll('.section');
    [initDeliverables, initFeatured, initProof, initContact]
      .forEach((fn, i) => { if (sections[i]) fn(sections[i]); });
    A.refreshOnLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
