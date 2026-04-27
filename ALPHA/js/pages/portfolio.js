// js/pages/portfolio.js
// Portfolio-specific animations. Phase 1: title-card reveal.
// Bails on prefers-reduced-motion, missing GSAP, or missing SplitText.

(function () {
  if (typeof gsap === 'undefined') return;
  if (typeof SplitText === 'undefined') return;

  gsap.registerPlugin(SplitText);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    const hero    = document.querySelector('.hero');
    const heroName = document.querySelector('.hero .hero-name');
    const heroSub  = document.querySelector('.hero .hero-role');
    const heroKick = document.querySelector('.hero .hero-kicker');
    if (!heroName) return;

    // Reduced-motion: just show, no animation
    if (reduced) {
      if (heroKick) heroKick.style.opacity = 1;
      heroName.style.opacity = 1;
      if (heroSub) heroSub.style.opacity = 1;
      return;
    }

    // Hide until ready (anti-FOUC). Set in JS so static HTML still works
    // for non-JS readers and reduced-motion users.
    gsap.set([heroKick, heroName, heroSub].filter(Boolean), { opacity: 0 });

    // Wait for fonts before splitting so character positions are accurate
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
      .then(() => {
        const split = new SplitText(heroName, {
          type: 'chars,lines',
          mask: 'lines',
          linesClass: 'split-line',
          charsClass: 'split-char'
        });

        // Reveal kicker first, then chars rising, then sub fading in
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (heroKick) {
          tl.fromTo(heroKick,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.6 },
            0.15
          );
        }

        gsap.set(heroName, { opacity: 1 });
        gsap.set(split.chars, { yPercent: 110 });

        tl.to(split.chars, {
          yPercent: 0,
          duration: 1.0,
          stagger: 0.022
        }, 0.25);

        if (heroSub) {
          tl.fromTo(heroSub,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.7 },
            '-=0.3'
          );
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
