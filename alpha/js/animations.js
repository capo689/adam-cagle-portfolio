// js/animations.js
// Shared animation primitives. Loaded by every page so individual page
// scripts can call AnimHelpers.reveal(...), .splitReveal(...), etc.
//
// Bails silently if GSAP / ScrollTrigger / SplitText aren't present.

(function () {
  if (typeof gsap === 'undefined') return;
  if (typeof SplitText !== 'undefined' && !gsap.core.Plugin?.list?.find?.((p) => p.name === 'SplitText')) {
    gsap.registerPlugin(SplitText);
  }
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
  if (typeof Flip !== 'undefined') gsap.registerPlugin(Flip);

  const ns = window.AnimHelpers = window.AnimHelpers || {};

  // Generic stagger fade-up bound to ScrollTrigger
  ns.reveal = function (target, opts) {
    if (typeof ScrollTrigger === 'undefined') return;
    opts = opts || {};
    const els = (target instanceof NodeList || Array.isArray(target))
      ? Array.from(target) : [target];
    if (!els.length) return;
    const trigger = opts.trigger || els[0];

    gsap.set(els, { y: opts.y != null ? opts.y : 50, opacity: 0 });
    gsap.to(els, {
      y: 0,
      opacity: 1,
      duration: opts.duration || 0.85,
      ease: opts.ease || 'power3.out',
      stagger: opts.stagger || 0,
      scrollTrigger: {
        trigger: trigger,
        start: opts.start || 'top 82%',
        toggleActions: 'play none none reverse'
      }
    });
  };

  // SplitText chars rising under a line mask
  ns.splitReveal = function (target, opts) {
    if (typeof SplitText === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    opts = opts || {};
    const split = new SplitText(target, {
      type: 'chars,lines',
      mask: 'lines',
      linesClass: 'split-line',
      charsClass: 'split-char'
    });
    gsap.set(split.chars, { yPercent: 110 });
    gsap.to(split.chars, {
      yPercent: 0,
      duration: opts.duration || 0.95,
      ease: 'power3.out',
      stagger: opts.stagger || 0.025,
      scrollTrigger: {
        trigger: target,
        start: opts.start || 'top 82%',
        toggleActions: 'play none none reverse'
      }
    });
    return split;
  };

  // Image starts ~5–8% scaled up, eases to 1 as it enters
  ns.kenBurns = function (target, opts) {
    if (typeof ScrollTrigger === 'undefined') return;
    opts = opts || {};
    const trigger = opts.trigger || target;
    gsap.fromTo(target,
      { scale: opts.from || 1.06 },
      {
        scale: 1,
        duration: 1.4,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: trigger,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });
  };

  // Subtle parallax. Drift y while in view, scrub-tied to scroll.
  ns.parallax = function (target, opts) {
    if (typeof ScrollTrigger === 'undefined') return;
    opts = opts || {};
    const trigger = opts.trigger || target;
    gsap.to(target, {
      y: opts.distance != null ? opts.distance : -60,
      ease: 'none',
      scrollTrigger: {
        trigger: trigger,
        start: 'top bottom',
        end:   'bottom top',
        scrub: opts.scrub != null ? opts.scrub : 0.6
      }
    });
  };

  // Hero title-card reveal: kicker fade, hero-name SplitText, sub fade.
  // Selectors are configurable so each page picks its own elements.
  ns.heroReveal = function (config) {
    if (typeof SplitText === 'undefined') return;
    // Barba handles the hero on internal navigations via Flip morph
    if (window.__barbaFlip) return;
    config = config || {};
    const heroName = document.querySelector(config.name);
    const heroSub  = config.sub  ? document.querySelector(config.sub)  : null;
    const heroKick = config.kick ? document.querySelector(config.kick) : null;
    if (!heroName) return;

    gsap.set([heroKick, heroName, heroSub].filter(Boolean), { opacity: 0 });

    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
      .then(() => {
        const split = new SplitText(heroName, {
          type: 'chars,lines',
          mask: 'lines',
          linesClass: 'split-line',
          charsClass: 'split-char'
        });

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (heroKick) {
          tl.fromTo(heroKick,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.6 },
            0.15);
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
            '-=0.3');
        }
      });
  };

  // Refresh ScrollTrigger after fonts and images settle so triggers fire
  // at the right moments
  ns.refreshOnLoad = function () {
    if (typeof ScrollTrigger === 'undefined') return;
    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  };

  ns.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
})();
