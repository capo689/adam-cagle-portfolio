// js/pages/studio.js
// Studio page scroll choreography. Hero, two studio cards, banner section.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;

  function initHero() {
    A.heroReveal({
      name: '.hero .hero-name',
      sub:  '.hero .hero-role',
      kick: '.hero .hero-kicker'
    });

    // Studio cards (Agency689, Agentic689) stagger up after hero
    const cards = document.querySelectorAll('.studios .studio-card');
    if (cards.length) {
      const studios = document.querySelector('.studios');
      gsap.set(cards, { y: 60, opacity: 0 });
      gsap.to(cards, {
        y: 0, opacity: 1,
        duration: 0.85, ease: 'power3.out',
        stagger: 0.18,
        scrollTrigger: { trigger: studios, start: 'top 78%', toggleActions: 'play none none reverse' }
      });
    }
  }

  function initBanner() {
    const banner = document.querySelector('.banner-section');
    if (!banner) return;
    const label    = banner.querySelector('.banner-section-label');
    const title    = banner.querySelector('.banner-section-title');
    const meta     = banner.querySelector('.banner-section-meta');
    const wrap     = banner.querySelector('.banner-wrap');
    const controls = banner.querySelector('.banner-controls');
    const els = [label, title, meta, wrap, controls].filter(Boolean);
    if (!els.length) return;
    gsap.set(els, { y: 35, opacity: 0 });
    gsap.to(els, {
      y: 0, opacity: 1,
      duration: 0.75, ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: banner, start: 'top 78%', toggleActions: 'play none none reverse' }
    });
  }

  function initComing() {
    const coming = document.querySelector('.coming');
    if (!coming) return;
    A.reveal(coming, { y: 18, duration: 0.55, start: 'top 88%' });
  }

  function init() {
    if (A.reduced) return;
    initHero();
    initBanner();
    initComing();
    A.refreshOnLoad();
  }

  window.initStudioPage = init;

  function isMyPage() {
    const c = document.querySelector('[data-barba-namespace]');
    return c && c.dataset.barbaNamespace === 'studio';
  }

  if (isMyPage()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
