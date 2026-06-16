// js/pages/ai-systems.js
// AI Systems page (AISystems.html) scroll choreography. Uses AnimHelpers.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;

  function initHero() {
    A.heroReveal({
      name: '.hero .hero-title',
      sub:  '.hero .hero-intro',
      kick: '.hero .hero-kicker'
    });

    const stats = document.querySelectorAll('.hero .hero-stat');
    if (stats.length) {
      gsap.set(stats, { opacity: 0, y: 18 });
      gsap.to(stats, {
        opacity: 1, y: 0,
        duration: 0.55, ease: 'power3.out',
        stagger: 0.08, delay: 0.9
      });
    }
  }

  function initTape() {
    const tape = document.querySelector('.systems-tape');
    if (!tape) return;
    A.reveal(tape, { y: 20, duration: 0.6, start: 'top 92%' });
  }

  function revealSectionHead(section) {
    const num    = section.querySelector('.s-num');
    const title  = section.querySelector('.s-title');
    const kicker = section.querySelector('.s-kicker');
    const tags   = section.querySelector('.sys-tags');
    const ctas   = section.querySelector('.cta-row');
    if (num)    A.reveal(num,    { y: 16, duration: 0.5, start: 'top 88%' });
    if (title)  A.splitReveal(title, { stagger: 0.025, start: 'top 84%' });
    if (kicker) A.reveal(kicker, { y: 22, duration: 0.7, start: 'top 84%' });
    if (tags)   A.reveal(tags,   { y: 14, duration: 0.5, start: 'top 88%' });
    if (ctas)   A.reveal(ctas,   { y: 14, duration: 0.5, start: 'top 88%' });
  }

  function initScreens(section) {
    // Image block at top of each section: .screens (multi) or .screen-full (solo)
    const screensWrap = section.querySelector('.s-body > .screens');
    if (screensWrap) {
      const imgs = screensWrap.querySelectorAll('img');
      if (imgs.length) {
        gsap.set(imgs, { y: 40, opacity: 0 });
        gsap.to(imgs, {
          y: 0, opacity: 1,
          duration: 0.85, ease: 'power3.out',
          stagger: 0.14,
          scrollTrigger: { trigger: screensWrap, start: 'top 84%', toggleActions: 'play none none reverse' }
        });
        imgs.forEach((img) => A.kenBurns(img, { trigger: img, from: 1.05 }));
      }
    }
    const solo = section.querySelector('.s-body > .screen-full');
    if (solo) {
      gsap.set(solo, { y: 40, opacity: 0 });
      gsap.to(solo, {
        y: 0, opacity: 1,
        duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: solo, start: 'top 84%', toggleActions: 'play none none reverse' }
      });
      A.kenBurns(solo, { from: 1.05 });
    }
    // Tail screens inside #supporting (kept after support-grid in some layouts)
    const tail = section.querySelector('.s-body > .support-grid ~ .screens');
    if (tail) {
      const imgs = tail.querySelectorAll('img');
      if (imgs.length) {
        gsap.set(imgs, { y: 40, opacity: 0 });
        gsap.to(imgs, {
          y: 0, opacity: 1,
          duration: 0.85, ease: 'power3.out',
          stagger: 0.14,
          scrollTrigger: { trigger: tail, start: 'top 84%', toggleActions: 'play none none reverse' }
        });
        imgs.forEach((img) => A.kenBurns(img, { trigger: img, from: 1.05 }));
      }
    }
  }

  function initMetrics(section) {
    const wrap = section.querySelector('.proj-metrics');
    if (!wrap) return;
    const cells = wrap.querySelectorAll('.pm-cell');
    if (!cells.length) return;
    gsap.set(cells, { y: 28, opacity: 0 });
    gsap.to(cells, {
      y: 0, opacity: 1,
      duration: 0.7, ease: 'power3.out',
      stagger: 0.07,
      scrollTrigger: { trigger: wrap, start: 'top 86%', toggleActions: 'play none none reverse' }
    });
  }

  function initCaseGrids(section) {
    section.querySelectorAll('.case-grid').forEach((grid) => {
      const cells = grid.querySelectorAll('.case-cell');
      if (!cells.length) return;
      gsap.set(cells, { y: 36, opacity: 0 });
      gsap.to(cells, {
        y: 0, opacity: 1,
        duration: 0.85, ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: grid, start: 'top 84%', toggleActions: 'play none none reverse' }
      });

      // Inside each cell: title-style headlines (.cc-outcome) get a soft rise
      const outcomes = grid.querySelectorAll('.cc-outcome');
      if (outcomes.length) {
        gsap.set(outcomes, { y: 14, opacity: 0 });
        gsap.to(outcomes, {
          y: 0, opacity: 1,
          duration: 0.7, ease: 'power3.out',
          stagger: 0.08, delay: 0.15,
          scrollTrigger: { trigger: grid, start: 'top 84%', toggleActions: 'play none none reverse' }
        });
      }
    });
  }

  function initNotice(section) {
    const notice = section.querySelector('.notice');
    if (notice) A.reveal(notice, { y: 20, duration: 0.6, start: 'top 86%' });
  }

  function initSupport(section) {
    const wrap = section.querySelector('.support-grid');
    if (!wrap) return;
    const cards = wrap.querySelectorAll('.support-card');
    if (!cards.length) return;
    gsap.set(cards, { y: 32, opacity: 0 });
    gsap.to(cards, {
      y: 0, opacity: 1,
      duration: 0.8, ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: { trigger: wrap, start: 'top 86%', toggleActions: 'play none none reverse' }
    });
  }

  function initSection(section) {
    revealSectionHead(section);
    initScreens(section);
    initMetrics(section);
    initCaseGrids(section);
    initNotice(section);
    initSupport(section);
  }

  function init() {
    if (A.reduced) return;
    initHero();
    initTape();
    document.querySelectorAll('.section').forEach(initSection);
    A.refreshOnLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
