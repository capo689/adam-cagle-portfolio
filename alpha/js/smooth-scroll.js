// smooth-scroll.js
// Lenis wired to GSAP ticker so ScrollTrigger updates stay in sync.
// Bails on prefers-reduced-motion.
// Bails if Lenis or GSAP failed to load.
// Exposes window.lenis for anchor-link helpers and lightbox stop/start.

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof Lenis === 'undefined' || typeof gsap === 'undefined') return;

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  });

  // Keep ScrollTrigger in sync if it is loaded
  if (typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Smooth-scroll any in-page anchor link by default
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -80 });
  });

  // Pause/resume hooks for lightboxes and modal viewers.
  // Existing inline scripts on Portfolio toggle body.lb-open when their
  // overlays open, so we can mirror that here without touching those scripts.
  const overlayObserver = new MutationObserver(() => {
    if (document.body.classList.contains('lb-open')) {
      lenis.stop();
    } else {
      lenis.start();
    }
  });
  overlayObserver.observe(document.body, {
    attributes: true, attributeFilter: ['class']
  });

  window.lenis = lenis;
})();
