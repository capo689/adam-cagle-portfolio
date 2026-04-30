// js/barba-init.js (ALPHA · LAYER 2)
//
// Wires Barba.js into SiteFX. This layer adds clean AJAX page swaps
// with NO visual transition — just instant content replacement, with
// the lifecycle managed through SiteFX phases so future transition
// effects can hook in without colliding.
//
// Lifecycle on every navigation:
//   1. before:        SiteFX.setPhase('transitioning')
//   2. leave:         kill ScrollTriggers, stop Lenis (instant; no animation)
//   3. (Barba swaps the data-barba container content)
//   4. enter:         scroll to top, re-run the new page's init function,
//                     ScrollTrigger.refresh(), restart Lenis, update active
//                     nav link
//   5. after:         SiteFX.setPhase('idle')
//
// Future layers will register transition animations on phase:transitioning.

(function () {
  if (typeof barba === 'undefined') { console.warn('[barba] script not loaded'); return; }
  if (typeof gsap === 'undefined')  { console.warn('[barba] gsap not loaded');  return; }
  if (!window.SiteFX)               { console.warn('[barba] SiteFX not loaded'); return; }

  // ─── Maps ──────────────────────────────────────────────────────────
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
    portfolio: 'Portfolio.html',
    studio:    'Studio.html'
  };

  // ─── Helpers ───────────────────────────────────────────────────────
  function safeCall(fnName) {
    if (!fnName) return;
    const fn = window[fnName];
    if (typeof fn !== 'function') return;
    try { fn(); } catch (e) { console.error('[barba] ' + fnName + ' threw:', e); }
  }

  function killScrollTriggers() {
    try {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
      }
    } catch (e) { console.error('[barba] killScrollTriggers:', e); }
  }

  function refreshScrollTriggers() {
    try {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    } catch (e) { console.error('[barba] refreshScrollTriggers:', e); }
  }

  function lenisStop()  { try { if (window.lenis && window.lenis.stop)  window.lenis.stop();  } catch (e) {} }
  function lenisStart() { try { if (window.lenis && window.lenis.start) window.lenis.start(); } catch (e) {} }
  function scrollToTop() {
    try {
      if (window.lenis && window.lenis.scrollTo) window.lenis.scrollTo(0, { immediate: true });
      else window.scrollTo(0, 0);
    } catch (e) { window.scrollTo(0, 0); }
  }

  function updateNavActive(namespace) {
    try {
      const targetHref = NAMESPACE_HREF[namespace];
      document.querySelectorAll('.nav-link').forEach(function (link) {
        link.classList.toggle('is-active', link.getAttribute('href') === targetHref);
      });
    } catch (e) { console.error('[barba] updateNavActive:', e); }
  }

  function runPageInit(namespace) {
    safeCall(NAMESPACE_INITS[namespace]);
    safeCall(NAMESPACE_LIGHTBOXES[namespace]);
    refreshScrollTriggers();
  }

  // ─── Barba init ────────────────────────────────────────────────────
  barba.init({
    debug: false,
    timeout: 5000,
    transitions: [
      {
        name: 'instant-swap',
        sync: false,
        leave: function (data) {
          SiteFX.setPhase('transitioning');
          killScrollTriggers();
          lenisStop();
          // No visual leave animation — return resolved promise so
          // Barba immediately proceeds to the swap.
          return Promise.resolve();
        },
        enter: function (data) {
          scrollToTop();
          updateNavActive(data.next.namespace);
          runPageInit(data.next.namespace);
          lenisStart();
          // Resolve immediately — no enter animation.
          return Promise.resolve();
        }
      }
    ]
  });

  // After every transition completes, return to idle so other systems
  // know the site is settled.
  barba.hooks.after(function () {
    SiteFX.setPhase('idle');
  });

  console.log('[barba] initialized (Layer 2 — AJAX swap, no transitions)');
})();
