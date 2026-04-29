// js/pages/agents.js
// Agents page scroll choreography. Same campaign template as Portfolio.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;

  function revealCampaignHead(section) {
    const sectLabel = section.querySelector('.sect-label');
    const sectHead  = section.querySelector('.sect-head');
    const meta      = section.querySelector('.c-meta');
    if (sectLabel) A.reveal(sectLabel, { y: 24, duration: 0.6, start: 'top 88%' });
    if (sectHead)  A.splitReveal(sectHead, { stagger: 0.028, start: 'top 82%' });
    if (meta)      A.reveal(meta, { y: 36, duration: 0.85, start: 'top 80%' });
  }

  function initHero() {
    A.heroReveal({
      name: '.hero .hero-name',
      sub:  '.hero .hero-role',
      kick: '.hero .hero-kicker'
    });

    // The stat row on the right
    const statRow = document.querySelector('.hero .hero-stat-row');
    if (statRow) {
      const stats = statRow.querySelectorAll('.hero-stat');
      gsap.set(statRow, { opacity: 0, y: 20 });
      gsap.to(statRow, { opacity: 1, y: 0, duration: 0.6, delay: 0.7, ease: 'power3.out' });
      if (stats.length) {
        gsap.set(stats, { opacity: 0, y: 8 });
        gsap.to(stats, {
          opacity: 1, y: 0,
          duration: 0.4, ease: 'power3.out',
          stagger: 0.06, delay: 0.85
        });
      }
    }
  }

  function initAgent(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    revealCampaignHead(section);

    // Image grid (any of g-1, g-2, g-4)
    const ads = section.querySelectorAll('.c-body .ad-grid .ad');
    if (ads.length) {
      const grid = section.querySelector('.c-body .ad-grid');
      gsap.set(ads, { y: 50, opacity: 0 });
      gsap.to(ads, {
        y: 0, opacity: 1,
        duration: 0.9, ease: 'power3.out',
        stagger: 0.14,
        scrollTrigger: { trigger: grid, start: 'top 78%', toggleActions: 'play none none reverse' }
      });
      ads.forEach((ad) => {
        const img = ad.querySelector('img');
        if (img) A.kenBurns(img, { trigger: ad, from: 1.05 });
      });
    }

    // Pull quote block
    const pull = section.querySelector('.pull');
    if (pull) A.reveal(pull, { y: 50, duration: 0.9, start: 'top 82%' });

    // White paper button (only on SSIA, but harmless if absent)
    const wpBtn = section.querySelector('.wp-btn');
    if (wpBtn) A.reveal(wpBtn, { y: 16, duration: 0.5, start: 'top 88%' });
  }

  function init() {
    if (A.reduced) return;
    initHero();
    initAgent('ssia');
    initAgent('book-agent');
    initAgent('auscan');
    initAgent('beef');
    initAgent('music-agent');
    A.refreshOnLoad();
  }

  window.initAgentsPage = init;

  function isMyPage() {
    const c = document.querySelector('[data-barba-namespace]');
    return c && c.dataset.barbaNamespace === 'agents';
  }

  if (isMyPage()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
