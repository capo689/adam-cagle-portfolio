// js/pages/ssia-whitepaper.js
// SSIA white paper page. Subtle reveals tuned to the technical doc tone.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;
  if (A.reduced) return;

  function initMasthead() {
    const masthead = document.querySelector('.masthead');
    if (masthead) {
      const cells = masthead.querySelectorAll(':scope > *');
      gsap.set(cells, { opacity: 0, y: 14 });
      gsap.to(cells, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.08, delay: 0.1 });
    }
    const title = document.querySelector('.title-block');
    if (title) {
      gsap.set(title, { opacity: 0, y: 26 });
      gsap.to(title, { opacity: 1, y: 0, duration: 0.85, delay: 0.45, ease: 'power3.out' });
    }
  }

  function initSection(section) {
    const header = section.querySelector('.section-header');
    if (header) {
      const parts = header.querySelectorAll(':scope > *');
      if (parts.length) {
        gsap.set(parts, { opacity: 0, y: 14 });
        gsap.to(parts, {
          opacity: 1, y: 0,
          duration: 0.6, ease: 'power3.out',
          stagger: 0.07,
          scrollTrigger: { trigger: header, start: 'top 86%', toggleActions: 'play none none reverse' }
        });
      }
    }

    // Paragraphs, lists, callouts, flow blocks, figures, captions
    const blocks = section.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > .callout, :scope > .flow-block, :scope > .figure, :scope > .figure-caption');
    if (blocks.length) {
      gsap.set(blocks, { opacity: 0, y: 22 });
      gsap.to(blocks, {
        opacity: 1, y: 0,
        duration: 0.7, ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: { trigger: section, start: 'top 82%', toggleActions: 'play none none reverse' }
      });
    }

    // Metrics row
    const metrics = section.querySelector('.metrics');
    if (metrics) {
      const cells = metrics.querySelectorAll('.metric');
      if (cells.length) {
        gsap.set(cells, { opacity: 0, y: 22 });
        gsap.to(cells, {
          opacity: 1, y: 0,
          duration: 0.6, ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: metrics, start: 'top 84%', toggleActions: 'play none none reverse' }
        });
      }
    }
  }

  function init() {
    initMasthead();
    document.querySelectorAll('section').forEach(initSection);
    A.refreshOnLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
