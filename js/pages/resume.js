// js/pages/resume.js
// Resume page scroll choreography.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;

  function initHero() {
    A.heroReveal({
      name: '.hero .hero-name',
      sub:  '.hero .hero-title-block',
      kick: '.hero .hero-kicker'
    });

    // Download buttons + contact row stagger in after the title
    const post = ['.hero .dl-row', '.hero .contact-row']
      .map((s) => document.querySelector(s)).filter(Boolean);
    if (post.length) {
      gsap.set(post, { opacity: 0, y: 18 });
      gsap.to(post, {
        opacity: 1, y: 0,
        duration: 0.6, ease: 'power3.out',
        stagger: 0.08, delay: 0.95
      });
    }
  }

  function revealHead(section) {
    const num   = section.querySelector('.s-num');
    const title = section.querySelector('.s-title');
    if (num)   A.reveal(num,   { y: 16, duration: 0.5, start: 'top 88%' });
    if (title) A.splitReveal(title, { stagger: 0.025, start: 'top 84%' });
  }

  function initSummary(section) {
    revealHead(section);
    const paras = section.querySelectorAll('.summary p');
    if (paras.length) A.reveal(paras, { y: 28, duration: 0.85, stagger: 0.14, start: 'top 82%' });
  }

  function initCapabilities(section) {
    revealHead(section);
    const wrap = section.querySelector('.caps');
    const caps = section.querySelectorAll('.cap');
    if (!wrap || !caps.length) return;
    gsap.set(caps, { y: 40, opacity: 0 });
    gsap.to(caps, {
      y: 0, opacity: 1,
      duration: 0.8, ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: wrap, start: 'top 82%', toggleActions: 'play none none reverse' }
    });
  }

  function initExperience(section) {
    revealHead(section);
    section.querySelectorAll('.job').forEach((job) => {
      const head    = job.querySelector('.job-head');
      const org     = job.querySelector('.job-org');
      const body    = job.querySelector('.job-body');
      const rosters = job.querySelectorAll('.job-roster-row');
      const top = [head, org, body].filter(Boolean);
      if (top.length) {
        gsap.set(top, { y: 32, opacity: 0 });
        gsap.to(top, {
          y: 0, opacity: 1,
          duration: 0.7, ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: job, start: 'top 84%', toggleActions: 'play none none reverse' }
        });
      }
      if (rosters.length) {
        gsap.set(rosters, { y: 20, opacity: 0 });
        gsap.to(rosters, {
          y: 0, opacity: 1,
          duration: 0.55, ease: 'power3.out',
          stagger: 0.04,
          scrollTrigger: { trigger: job.querySelector('.job-roster') || job, start: 'top 84%', toggleActions: 'play none none reverse' }
        });
      }
    });
  }

  function initAwards(section) {
    revealHead(section);
    const wrap = section.querySelector('.tri');
    const items = section.querySelectorAll('.tri-item');
    if (!wrap || !items.length) return;
    gsap.set(items, { y: 36, opacity: 0 });
    gsap.to(items, {
      y: 0, opacity: 1,
      duration: 0.75, ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: wrap, start: 'top 82%', toggleActions: 'play none none reverse' }
    });
  }

  function init() {
    if (A.reduced) return;
    initHero();
    const sections = document.querySelectorAll('.section');
    [initSummary, initCapabilities, initExperience, initAwards]
      .forEach((fn, i) => { if (sections[i]) fn(sections[i]); });
    A.refreshOnLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
