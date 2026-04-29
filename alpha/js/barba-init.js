// js/barba-init.js
// Barba.js + GSAP page transitions for adamcagle.com (alpha sandbox).
//
// Slab-wipe transition: opaque panel slides up from bottom to cover the
// outgoing page, Barba swaps the data-barba container, panel continues
// sliding up off the top to reveal the new page.
//
// Lifecycle:
// - leave: kill ScrollTriggers, stop Lenis, slide slab up to cover
// - after content swap: scroll to top, run new page's namespace init
// - enter: slide slab off the top, restart Lenis

(function () {
  if (typeof barba === 'undefined') return;
  if (typeof gsap === 'undefined') return;

  // Inject the slab once
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

  // Map Barba namespace -> page init function name on window
  const NAMESPACE_INITS = {
    home: 'initHomePage',
    agents: 'initAgentsPage',
    books: 'initBooksPage',
    portfolio: 'initPortfolioPage',
    studio: 'initStudioPage'
  };

  // Map Barba namespace -> the corresponding href in the nav
  const NAMESPACE_HREF = {
    home: 'index.html',
    agents: 'Agents.html',
    books: 'Books.html',
    portfolio: 'Portfolio.html'
  };

  function killAllScrollTriggers() {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    }
  }

  // Lightbox init functions per namespace (only Agents and Portfolio)
  const NAMESPACE_LIGHTBOXES = {
    agents: 'initAgentsLightbox',
    portfolio: 'initPortfolioLightbox'
  };

  function runPageInit(namespace) {
    const fnName = NAMESPACE_INITS[namespace];
    if (fnName && typeof window[fnName] === 'function') {
      try { window[fnName](); } catch (e) { console.error('[barba] init error:', e); }
    }
    const lbName = NAMESPACE_LIGHTBOXES[namespace];
    if (lbName && typeof window[lbName] === 'function') {
      try { window[lbName](); } catch (e) { console.error('[barba] lightbox init error:', e); }
    }
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }

  function updateNavActive(namespace) {
    const targetHref = NAMESPACE_HREF[namespace];
    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === targetHref);
    });
  }

  // Lenis smooth scroll: pause/resume during transition
  function lenisStop()  { if (window.lenis && window.lenis.stop)  window.lenis.stop(); }
  function lenisStart() { if (window.lenis && window.lenis.start) window.lenis.start(); }
  function lenisToTop() {
    if (window.lenis && window.lenis.scrollTo) {
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }

  barba.init({
    debug: false,
    timeout: 5000,
    transitions: [
      {
        name: 'slab-wipe',
        sync: false,

        async leave(data) {
          killAllScrollTriggers();
          lenisStop();
          await gsap.fromTo(slab,
            { yPercent: 100 },
            { yPercent: 0, duration: 0.55, ease: 'power3.inOut' }
          );
        },

        async enter(data) {
          lenisToTop();
          updateNavActive(data.next.namespace);
          runPageInit(data.next.namespace);
          await gsap.to(slab, {
            yPercent: -100,
            duration: 0.55,
            ease: 'power3.inOut',
            delay: 0.05
          });
          // Reset slab off-screen below for next leave
          gsap.set(slab, { yPercent: 100 });
          lenisStart();
        }
      }
    ]
  });

  // Defensive: if a transition errors out, make sure the slab can't stay covering
  barba.hooks.afterLeave(function () {
    // intentional no-op — leave promise already resolved
  });
})();
