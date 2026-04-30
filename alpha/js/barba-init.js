// js/barba-init.js
// Barba.js + GSAP page transitions for adamcagle.com (alpha sandbox).
//
// Transition choreography:
// 1. LEAVE  (0.45s): capture rail-brand state for Flip; slab slides up to cover
// 2. Barba swaps data-barba container content
// 3. ENTER  (parallel):
//    a. Slab slides off the top (0.35s, ease-in)
//    b. Hero name begins at brand position (small, top-left corner) and
//       Flip-morphs to its natural size/position (0.75s, power3.out)
//    c. Hero kicker + role fade in after name lands (stagger 0.1s)
//    d. ScrollTrigger re-armed for all remaining sections

(function () {
  if (typeof barba === 'undefined') return;
  if (typeof gsap === 'undefined') return;

  // Register Flip if present
  if (typeof Flip !== 'undefined') gsap.registerPlugin(Flip);

  // Inject the slab once — positioned off-screen below
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

  function killAllScrollTriggers() {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    }
  }

  function runPageInit(namespace) {
    window.__barbaFlip = true; // tell heroReveal to yield
    const fnName = NAMESPACE_INITS[namespace];
    if (fnName && typeof window[fnName] === 'function') {
      try { window[fnName](); } catch (e) { console.error('[barba] init error:', e); }
    }
    window.__barbaFlip = false;

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

  function lenisStop()  { if (window.lenis && window.lenis.stop)  window.lenis.stop(); }
  function lenisStart() { if (window.lenis && window.lenis.start) window.lenis.start(); }
  function lenisToTop() {
    if (window.lenis && window.lenis.scrollTo) {
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }

  // State captured before the slab covers the page
  var prevBrandState = null;

  barba.init({
    debug: false,
    timeout: 5000,
    transitions: [
      {
        name: 'slab-flip',
        sync: false,

        async leave(data) {
          killAllScrollTriggers();
          lenisStop();

          // Capture rail-brand position before anything moves
          const brand = document.querySelector('.rail-brand');
          if (brand && typeof Flip !== 'undefined') {
            prevBrandState = Flip.getState(brand);
          }

          // Slab rises from below to cover the page
          await gsap.fromTo(slab,
            { yPercent: 100 },
            { yPercent: 0, duration: 0.45, ease: 'power3.inOut' }
          );
        },

        async enter(data) {
          lenisToTop();
          updateNavActive(data.next.namespace);

          // Run page init with __barbaFlip flag so heroReveal yields
          runPageInit(data.next.namespace);

          // Set up hero Flip if we have a brand state and a hero name
          const heroName   = document.querySelector('.hero-name');
          const heroKick   = document.querySelector('.hero .hero-kicker');
          const heroSub    = document.querySelector('.hero .hero-role, .hero .hero-sub');
          const heroMeta   = document.querySelector('.hero .hero-meta, .hero .hero-stat-row');
          const allHeroEls = [heroKick, heroSub, heroMeta].filter(Boolean);
          var hasFlip = false;

          if (prevBrandState && typeof Flip !== 'undefined' && heroName) {
            hasFlip = true;
            // Move hero name to brand position, then reveal it
            gsap.set(heroName, { opacity: 0 });
            allHeroEls.forEach(function (el) { gsap.set(el, { opacity: 0, y: 12 }); });
          }

          // Slab exits top — shorter duration so Flip is the star
          await gsap.to(slab, {
            yPercent: -100,
            duration: 0.35,
            ease: 'power2.in'
          });
          gsap.set(slab, { yPercent: 100 }); // reset for next leave
          lenisStart();

          if (hasFlip) {
            // Flip hero name from brand corner to hero position
            gsap.set(heroName, { opacity: 1 });
            Flip.from(prevBrandState, {
              targets: heroName,
              duration: 0.75,
              ease: 'power3.out',
              scale: true
            });

            // Kicker, role, meta stagger in after name starts moving
            if (allHeroEls.length) {
              gsap.to(allHeroEls, {
                opacity: 1, y: 0,
                duration: 0.5, ease: 'power3.out',
                stagger: 0.08, delay: 0.2
              });
            }

            prevBrandState = null;
          }
        }
      }
    ]
  });
})();
