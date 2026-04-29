// page-transitions.js
// Slab wipe between ALPHA pages. On internal link click: a black slab wipes
// up from the bottom over ~650ms, then navigates. On arrival the slab is
// pre-positioned covering the viewport and wipes off the top.
//
// Sets window.__siteArrivedViaSlab synchronously so the preloader (loaded
// after this script) can decide to skip itself for internal navigation.

(function () {
  // sessionStorage flag survives a page navigation within the same tab
  const NAV_FLAG = 'site-internal-nav';
  const arrivedViaSlab = sessionStorage.getItem(NAV_FLAG) === 'true';
  sessionStorage.removeItem(NAV_FLAG);

  // Expose for preloader.js
  window.__siteArrivedViaSlab = arrivedViaSlab;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function makeSlab(state) {
    const slab = document.createElement('div');
    slab.className = 'transition-slab' + (state ? ' is-' + state : '');
    slab.setAttribute('aria-hidden', 'true');
    document.body.appendChild(slab);
    return slab;
  }

  function init() {
    // If we arrived via internal nav, the slab starts covering and wipes off the top
    if (arrivedViaSlab) {
      const slab = makeSlab('covering');
      // Force a reflow, then transition off the top
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Drop the no-transition modifier so the leaving animation runs
          slab.classList.remove('is-covering');
          slab.classList.add('is-leaving');
          slab.addEventListener('transitionend', () => slab.remove(), { once: true });
        });
      });
    }

    // Hijack same-origin internal link clicks
    document.addEventListener('click', (e) => {
      // Respect modifier keys and non-left clicks
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0 && e.button !== undefined) return;

      const a = e.target.closest('a');
      if (!a) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      if (a.getAttribute('data-no-transition') !== null) return;

      const rawHref = a.getAttribute('href');
      if (!rawHref) return;
      if (rawHref.startsWith('#')) return;
      if (rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;

      let url;
      try {
        url = new URL(a.href, window.location.href);
      } catch (err) {
        return;
      }
      if (url.origin !== window.location.origin) return;

      // Don't transition to the same URL
      if (url.href === window.location.href) return;

      e.preventDefault();

      const slab = makeSlab();
      // Two rAF so the initial transform paints before the transition starts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          slab.classList.add('is-rising');
          slab.addEventListener('transitionend', (ev) => {
            if (ev.propertyName !== 'transform') return;
            sessionStorage.setItem(NAV_FLAG, 'true');
            window.location.href = url.href;
          }, { once: true });
        });
      });
    });
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
