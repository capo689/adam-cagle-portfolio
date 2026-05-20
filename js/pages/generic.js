// js/pages/generic.js
// Fallback scroll choreography for pages that don't ship their own
// page-specific script. Auto-detects common hero + section markup
// patterns and wires AnimHelpers to them.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;
  if (A.reduced) return;

  function pickHeroSelectors() {
    const hero = document.querySelector('.hero');
    if (!hero) return null;
    const name = hero.querySelector('.hero-title, .hero-name');
    if (!name) return null;
    const kick = hero.querySelector('.hero-kicker');
    const sub  = hero.querySelector('.hero-intro, .hero-sub, .hero-role');
    return { hero, name, kick, sub };
  }

  function initHero() {
    const sel = pickHeroSelectors();
    if (!sel) return;
    A.heroReveal({
      name: '.' + (sel.name.className.split(/\s+/).find((c) => /^hero-(title|name)$/.test(c)) || 'hero-title'),
      sub:  sel.sub  ? ('.' + (sel.sub.className.split(/\s+/).find((c) => /^hero-(intro|sub|role)$/.test(c)) || 'hero-intro')) : null,
      kick: sel.kick ? '.hero-kicker' : null
    });

    // Hero meta column / stat row, if present
    const meta = sel.hero.querySelector('.hero-meta, .hero-stat-row, .hero-secondary, .hero-cta-text, .hero-toc');
    if (meta) {
      const els = meta.children.length ? Array.from(meta.children) : [meta];
      gsap.set(els, { opacity: 0, y: 18 });
      gsap.to(els, {
        opacity: 1, y: 0,
        duration: 0.55, ease: 'power3.out',
        stagger: 0.07, delay: 0.85
      });
    }
  }

  function initSection(section) {
    // Section header bits
    const num    = section.querySelector('.s-num, .section-num, .sect-label');
    const title  = section.querySelector('.s-title, .section-title, .sect-head');
    const kicker = section.querySelector('.s-kicker, .section-tag, .c-meta');
    if (num)    A.reveal(num,    { y: 16, duration: 0.5, start: 'top 88%' });
    if (title)  A.splitReveal(title, { stagger: 0.025, start: 'top 84%' });
    if (kicker) A.reveal(kicker, { y: 22, duration: 0.7, start: 'top 84%' });

    // Common body buckets
    const buckets = [
      { sel: '.proj-metrics .pm-cell',   group: '.proj-metrics',   y: 28, stagger: 0.07, start: 'top 86%' },
      { sel: '.case-grid .case-cell',    group: '.case-grid',      y: 36, stagger: 0.1,  start: 'top 84%' },
      { sel: '.support-grid .support-card', group: '.support-grid', y: 32, stagger: 0.09, start: 'top 86%' },
      { sel: '.summary p',               group: '.summary',        y: 28, stagger: 0.12, start: 'top 82%' },
      { sel: '.ad-grid .ad',             group: '.ad-grid',        y: 50, stagger: 0.14, start: 'top 78%' },
      { sel: '.cred',                    group: '.hero-creds',     y: 36, stagger: 0.06, start: 'top 85%' },
      { sel: '.toc-item, .toc-row',      group: '.toc, .hero-toc', y: 18, stagger: 0.05, start: 'top 88%' },
      { sel: '.cap-row, .capability',    group: '.capabilities',   y: 30, stagger: 0.08, start: 'top 84%' },
      { sel: '.contact-cell',            group: '.contact-grid',   y: 24, stagger: 0.08, start: 'top 86%' },
      { sel: '.bf-row, .best-fit p',     group: '.best-fit',       y: 22, stagger: 0.07, start: 'top 86%' },
      { sel: '.ws-card, .ws-item',       group: '.ws-list',        y: 28, stagger: 0.08, start: 'top 84%' }
    ];
    buckets.forEach(({ sel, group, y, stagger, start }) => {
      const wrap = section.querySelector(group);
      if (!wrap) return;
      const cells = wrap.querySelectorAll(sel);
      if (!cells.length) return;
      gsap.set(cells, { y, opacity: 0 });
      gsap.to(cells, {
        y: 0, opacity: 1,
        duration: 0.8, ease: 'power3.out',
        stagger,
        scrollTrigger: { trigger: wrap, start, toggleActions: 'play none none reverse' }
      });
    });

    // Loose image blocks: .screens, .screen-full
    section.querySelectorAll('.screens').forEach((wrap) => {
      const imgs = wrap.querySelectorAll('img');
      if (!imgs.length) return;
      gsap.set(imgs, { y: 40, opacity: 0 });
      gsap.to(imgs, {
        y: 0, opacity: 1,
        duration: 0.85, ease: 'power3.out',
        stagger: 0.14,
        scrollTrigger: { trigger: wrap, start: 'top 84%', toggleActions: 'play none none reverse' }
      });
      imgs.forEach((img) => A.kenBurns(img, { trigger: img, from: 1.05 }));
    });
    section.querySelectorAll('.screen-full').forEach((img) => {
      gsap.set(img, { y: 40, opacity: 0 });
      gsap.to(img, {
        y: 0, opacity: 1,
        duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: img, start: 'top 84%', toggleActions: 'play none none reverse' }
      });
      A.kenBurns(img, { from: 1.05 });
    });

    // Pull quotes / callouts
    const pull = section.querySelector('.pull, .callout, .notice');
    if (pull) A.reveal(pull, { y: 24, duration: 0.7, start: 'top 86%' });
  }

  function init() {
    initHero();
    document.querySelectorAll('.section').forEach(initSection);
    A.refreshOnLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
