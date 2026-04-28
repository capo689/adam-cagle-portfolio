// js/pages/home.js
// Résumé page (index.html) scroll choreography. Uses AnimHelpers.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;

  function initHero() {
    A.heroReveal({
      name: '.hero .hero-name',
      sub:  '.hero .hero-role',
      kick: '.hero .hero-kicker'
    });

    // Right column: status pill, CTA, location stack — fades up after the title
    const meta = document.querySelector('.hero .hero-meta');
    if (meta) {
      const els = meta.querySelectorAll(':scope > *');
      gsap.set(els, { opacity: 0, y: 20 });
      gsap.to(els, {
        opacity: 1, y: 0,
        duration: 0.6, ease: 'power3.out',
        stagger: 0.08, delay: 0.7
      });
    }

    // Credentials strip below hero: each cell stagger reveal on scroll
    const creds = document.querySelectorAll('.hero-creds .cred');
    if (creds.length) {
      const strip = document.querySelector('.hero-creds');
      gsap.set(creds, { y: 40, opacity: 0 });
      gsap.to(creds, {
        y: 0, opacity: 1,
        duration: 0.6, ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: { trigger: strip, start: 'top 85%', toggleActions: 'play none none reverse' }
      });
    }
  }

  // Common section header reveal
  function revealSectionHead(section) {
    const num   = section.querySelector('.s-num');
    const title = section.querySelector('.s-title');
    if (num)   A.reveal(num,   { y: 16, duration: 0.5, start: 'top 88%' });
    if (title) A.splitReveal(title, { stagger: 0.025, start: 'top 82%' });
  }

  function initSummary() {
    const section = document.querySelectorAll('.section')[0];
    if (!section) return;
    revealSectionHead(section);
    const paras = section.querySelectorAll('.summary p');
    if (paras.length) {
      A.reveal(paras, { y: 30, duration: 0.85, stagger: 0.15, start: 'top 80%' });
    }
  }

  function initCapabilities() {
    const section = document.querySelectorAll('.section')[1];
    if (!section) return;
    revealSectionHead(section);
    const caps = section.querySelectorAll('.cap');
    if (!caps.length) return;
    const grid = section.querySelector('.caps');

    // Below 960px: keep the original 2x2 grid stagger reveal
    const wideEnoughForPin = window.matchMedia('(min-width: 961px)').matches;
    if (!wideEnoughForPin) {
      gsap.set(caps, { y: 50, opacity: 0 });
      gsap.to(caps, {
        y: 0, opacity: 1,
        duration: 0.85, ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: grid, start: 'top 78%', toggleActions: 'play none none reverse' }
      });
      return;
    }

    // Desktop: pinned stack-and-swap. Cards share the same grid cell.
    grid.classList.add('is-pinned');

    // Initial state: only the first card is visible
    gsap.set(caps, { opacity: 0, y: 40 });
    gsap.set(caps[0], { opacity: 1, y: 0 });

    const transitionDur = 0.7;
    const holdDur = 1.0;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=' + (caps.length * 100) + '%',
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    // Hold-then-swap rhythm: each transition starts after a hold
    for (let i = 1; i < caps.length; i++) {
      const startAt = (i - 1) * (transitionDur + holdDur) + holdDur;
      tl.to(caps[i - 1], {
        opacity: 0, y: -40,
        duration: transitionDur, ease: 'power2.in'
      }, startAt);
      tl.fromTo(caps[i],
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: transitionDur, ease: 'power2.out' },
        startAt + 0.18
      );
    }
  }

  function initExperience() {
    const section = document.querySelectorAll('.section')[2];
    if (!section) return;
    revealSectionHead(section);
    section.querySelectorAll('.job').forEach((job) => {
      const head = job.querySelector('.job-head');
      const org  = job.querySelector('.job-org');
      const body = job.querySelector('.job-body');
      const els  = [head, org, body].filter(Boolean);
      if (!els.length) return;
      gsap.set(els, { y: 35, opacity: 0 });
      gsap.to(els, {
        y: 0, opacity: 1,
        duration: 0.7, ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: job, start: 'top 82%', toggleActions: 'play none none reverse' }
      });
    });
  }

  function initSelectedWork() {
    const section = document.querySelectorAll('.section')[3];
    if (!section) return;
    revealSectionHead(section);

    const intro = section.querySelector('.work-intro');
    if (intro) A.reveal(intro, { y: 30, duration: 0.7, start: 'top 85%' });

    const ctas = section.querySelectorAll('.work-cta');
    if (ctas.length) A.reveal(ctas, { y: 30, duration: 0.7, stagger: 0.1, start: 'top 85%' });

    const works = section.querySelectorAll('.work');
    if (works.length) {
      const grid = section.querySelector('.works');
      gsap.set(works, { y: 50, opacity: 0 });
      gsap.to(works, {
        y: 0, opacity: 1,
        duration: 0.7, ease: 'power3.out',
        stagger: { each: 0.06, from: 'start' },
        scrollTrigger: { trigger: grid, start: 'top 80%', toggleActions: 'play none none reverse' }
      });
    }
  }

  function initAwards() {
    const section = document.querySelectorAll('.section')[4];
    if (!section) return;
    revealSectionHead(section);
    const triItems = section.querySelectorAll('.tri-item');
    if (triItems.length) {
      const tri = section.querySelector('.tri');
      gsap.set(triItems, { y: 40, opacity: 0 });
      gsap.to(triItems, {
        y: 0, opacity: 1,
        duration: 0.7, ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: tri, start: 'top 82%', toggleActions: 'play none none reverse' }
      });
    }
  }

  function init() {
    if (A.reduced) return;
    initHero();
    initSummary();
    initCapabilities();
    initExperience();
    initSelectedWork();
    initAwards();
    A.refreshOnLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
