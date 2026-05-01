/* ──────────────────────────────────────────────────────────────────────
   fx/section-reveal.js — fade-up on every content block as it scrolls in

   Two-track strategy so content can NEVER end up stuck at autoAlpha:0
   if a ScrollTrigger batch fails to fire:

     1. At init, partition matching elements by viewport position.
     2. Already-visible elements: gsap.from() animates them in
        immediately (guaranteed reveal even if ScrollTrigger is broken).
     3. Off-screen elements: locked at y:24/autoAlpha:0 and revealed by
        ScrollTrigger.batch onEnter.

   Plus a safety-net timeout: 1500ms after init, anything still locked
   gets force-released. Prevents permanent invisibility under any
   ScrollTrigger / scroller misconfiguration.

   Honors prefers-reduced-motion (skips entirely; elements stay in
   final state).
   ────────────────────────────────────────────────────────────────────── */

(function () {
  var SELECTORS = [
    '.section',
    '.campaign',
    '.book',
    '.pull',
    '.quote',
    '.synopsis',
    '.cap',
    '.job',
    '.work',
    '.tri-item',
    '.cred',
    '.hl-tile',
    '.verb-col',
    '.sm-arch-cell',
    '.ad-grid',
  ];

  function init(scope) {
    if (typeof window.gsap !== 'object' || !window.gsap || !window.ScrollTrigger) {
      console.warn('[section-reveal] GSAP/ScrollTrigger not loaded; skipping reveals');
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    window.SiteFX && window.SiteFX.emit('scrolltrigger:ready');

    var root = scope || document;
    var els = Array.prototype.slice.call(root.querySelectorAll(SELECTORS.join(',')));
    if (!els.length) return;

    // Partition by current viewport position.
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var visible = [];
    var offscreen = [];
    els.forEach(function (el) {
      var top = el.getBoundingClientRect().top;
      // "In view" = element top is above 88% line of viewport (matches our trigger)
      if (top < vh * 0.88) visible.push(el);
      else offscreen.push(el);
    });

    // Already-visible: animate from hidden state immediately. Even if
    // ScrollTrigger never fires, these get revealed.
    if (visible.length) {
      gsap.from(visible, {
        y: 24,
        autoAlpha: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.05,
      });
    }

    // Off-screen: lock + ScrollTrigger.batch reveal.
    if (offscreen.length) {
      gsap.set(offscreen, { y: 24, autoAlpha: 0 });
      ScrollTrigger.batch(offscreen, {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, {
            y: 0,
            autoAlpha: 1,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.08,
            overwrite: 'auto',
          });
        },
      });
    }

    // Refresh after fonts/images settle so triggers land on final layout.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); }, { once: true });

    // Safety net: 1500ms after init, force-reveal anything still hidden.
    // Catches edge cases where ScrollTrigger doesn't fire (e.g., scroller
    // misconfig, batch race conditions).
    setTimeout(function () {
      offscreen.forEach(function (el) {
        if (parseFloat(gsap.getProperty(el, 'autoAlpha')) < 0.5) {
          gsap.to(el, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' });
        }
      });
    }, 1500);
  }

  if (window.SiteFX) {
    window.SiteFX.register('section-reveal', { init: init });
    window.SiteFX.on('page:enter', function (data) {
      if (data && data.container) init(data.container);
    });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
