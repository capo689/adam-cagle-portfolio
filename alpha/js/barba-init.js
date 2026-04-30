// js/barba-init.js
// Barba.js + GSAP page transitions for adamcagle.com (alpha sandbox).
// Phase 1 only: simple slab-wipe. No Flip yet. Defensive against errors
// so a busted page-init never leaves the slab stuck on screen.

(function () {
  if (typeof barba === 'undefined') {
    console.warn('[barba] script not loaded');
    return;
  }
  if (typeof gsap === 'undefined') {
    console.warn('[barba] gsap not loaded');
    return;
  }

  const slab = document.createElement('div');
  slab.className = 'barba-slab';
  slab.setAttribute('aria-hidden', 'true');
  document.body.appendChild(slab);

  function syncSlabBg() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    slab.style.background = isLight ? '#f4efe7' : '#0f0f0e';
  }
  syncSlabBg();
  new MutationObserver(syncSlabBg)
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const NAMESPACE_INITS = {
    home:      'initHomePage',
    agents:    'initAgentsPage',
    books:     'initBooksPage',
    portfolio: 'initPortfolioPage',
    studio:    'initStudioPage'
  };
  const NAMESPACE_LIGHTBOXES = {
    agents:    'initAgentsLightbox',
    portfolio: 'initPortfolioLightbox'
  };
  const NAMESPACE_HREF = {
    home:      'index.html',
    agents:    'Agents.html',
    books:     'Books.html',
    portfolio: 'Portfolio.html'
  };

  function safeCall(fnName) {
    try {
      if (fnName && typeof window[fnName] === 'function') window[fnName]();
    } catch (e) { console.error('[barba] ' + fnName + ' threw:', e); }
  }

  function killAllScrollTriggers() {
    try {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
      }
    } catch (e) { console.error('[barba] kill ScrollTriggers:', e); }
  }

  function runPageInit(namespace) {
    safeCall(NAMESPACE_INITS[namespace]);
    safeCall(NAMESPACE_LIGHTBOXES[namespace]);
    try {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    } catch (e) { console.error('[barba] ScrollTrigger.refresh:', e); }
  }

  function updateNavActive(namespace) {
    try {
      const targetHref = NAMESPACE_HREF[namespace];
      document.querySelectorAll('.nav-link').forEach(function (link) {
        link.classList.toggle('is-active', link.getAttribute('href') === targetHref);
      });
    } catch (e) { console.error('[barba] updateNavActive:', e); }
  }

  function lenisStop()  { try { if (window.lenis && window.lenis.stop)  window.lenis.stop(); } catch (e) {} }
  function lenisStart() { try { if (window.lenis && window.lenis.start) window.lenis.start(); } catch (e) {} }
  function lenisToTop() {
    try {
      if (window.lenis && window.lenis.scrollTo) window.lenis.scrollTo(0, { immediate: true });
      else window.scrollTo(0, 0);
    } catch (e) { window.scrollTo(0, 0); }
  }

  barba.init({
    debug: false,
    timeout: 5000,
    transitions: [
      {
        name: 'slab-wipe',
        sync: false,

        leave: function (data) {
          killAllScrollTriggers();
          lenisStop();
          return gsap.fromTo(slab,
            { yPercent: 100 },
            { yPercent: 0, duration: 0.45, ease: 'power3.inOut' }
          );
        },

        enter: function (data) {
          lenisToTop();
          updateNavActive(data.next.namespace);
          runPageInit(data.next.namespace);
          const tl = gsap.to(slab, {
            yPercent: -100,
            duration: 0.45,
            ease: 'power3.inOut',
            delay: 0.05,
            onComplete: function () {
              gsap.set(slab, { yPercent: 100 });
              lenisStart();
            }
          });
          return tl;
        }
      }
    ]
  });

  // Safety net: if a transition stalls, force-clear the slab after 4s
  barba.hooks.after(function () {
    setTimeout(function () { gsap.set(slab, { yPercent: 100 }); lenisStart(); }, 100);
  });

  console.log('[barba] initialized');
})();
