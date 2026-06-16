// js/pages/contact.js
// Contact page scroll choreography.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;

  function initHero() {
    A.heroReveal({
      name: '.hero .hero-title',
      sub:  '.hero .hero-cta-text',
      kick: '.hero .hero-kicker'
    });
  }

  function initContactBlock() {
    const block = document.querySelector('.contact-block');
    if (!block) return;
    const cells = block.querySelectorAll('.contact-cell');
    if (!cells.length) return;
    gsap.set(cells, { y: 28, opacity: 0 });
    gsap.to(cells, {
      y: 0, opacity: 1,
      duration: 0.7, ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: block, start: 'top 86%', toggleActions: 'play none none reverse' }
    });
  }

  function initBestFit() {
    const bf = document.querySelector('.best-fit');
    if (bf) A.reveal(bf, { y: 28, duration: 0.75, start: 'top 86%' });
  }

  function initEmailCta() {
    const cta = document.querySelector('.email-cta');
    if (cta) A.reveal(cta, { y: 36, duration: 0.85, start: 'top 86%' });
  }

  function init() {
    if (A.reduced) return;
    initHero();
    initContactBlock();
    initBestFit();
    initEmailCta();
    A.refreshOnLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
