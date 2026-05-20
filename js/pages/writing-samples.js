// js/pages/writing-samples.js
// Writing Samples page scroll choreography.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;

  function initHero() {
    A.heroReveal({
      name: '.hero .hero-title',
      sub:  '.hero .hero-intro',
      kick: '.hero .hero-kicker'
    });
    const secondary = document.querySelector('.hero .hero-secondary');
    if (secondary) {
      gsap.set(secondary, { opacity: 0, y: 16 });
      gsap.to(secondary, { opacity: 1, y: 0, duration: 0.7, delay: 1.0, ease: 'power3.out' });
    }
  }

  function initGallery() {
    const section = document.querySelector('.gallery-section');
    if (!section) return;
    const head = section.querySelector('.gallery-head');
    if (head) A.reveal(head, { y: 22, duration: 0.6, start: 'top 88%' });

    const grid = section.querySelector('.gallery-grid');
    const cards = section.querySelectorAll('.sample-card');
    if (!grid || !cards.length) return;
    gsap.set(cards, { y: 48, opacity: 0 });
    gsap.to(cards, {
      y: 0, opacity: 1,
      duration: 0.85, ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: grid, start: 'top 80%', toggleActions: 'play none none reverse' }
    });
    cards.forEach((card) => {
      const img = card.querySelector('.sample-card-banner img');
      if (img) A.kenBurns(img, { trigger: card, from: 1.05 });
    });
  }

  function initDossier() {
    const dossier = document.querySelector('.dossier');
    if (!dossier) return;
    const media = dossier.querySelector('.dossier-media');
    const body  = dossier.querySelector('.dossier-body');
    const els = [media, body].filter(Boolean);
    if (els.length) {
      gsap.set(els, { y: 42, opacity: 0 });
      gsap.to(els, {
        y: 0, opacity: 1,
        duration: 0.9, ease: 'power3.out',
        stagger: 0.14,
        scrollTrigger: { trigger: dossier, start: 'top 80%', toggleActions: 'play none none reverse' }
      });
    }
    if (media) {
      const img = media.querySelector('img');
      if (img) A.kenBurns(img, { trigger: dossier, from: 1.05 });
    }
  }

  function initCrosslink() {
    const cross = document.querySelector('.crosslink');
    if (!cross) return;
    const parts = cross.querySelectorAll('.crosslink-line, .crosslink-links, .crosslink-btn');
    if (!parts.length) return;
    gsap.set(parts, { opacity: 0, y: 18 });
    gsap.to(parts, {
      opacity: 1, y: 0,
      duration: 0.6, ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: cross, start: 'top 86%', toggleActions: 'play none none reverse' }
    });
  }

  function init() {
    if (A.reduced) return;
    initHero();
    initGallery();
    initDossier();
    initCrosslink();
    A.refreshOnLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
