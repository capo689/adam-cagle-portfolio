// page-transitions.js
// Through-black fade transition for multi-page navigation.
// On link click: full-screen overlay fades to opaque, then navigates.
// On new page: overlay starts opaque and fades out after fonts are ready.

(function () {
  const NAV_FLAG = 'site-internal-nav';
  const arrivedViaNav = sessionStorage.getItem(NAV_FLAG) === 'true';
  sessionStorage.removeItem(NAV_FLAG);

  // Expose for preloader.js — preloader skips its intro on internal nav
  window.__siteArrivedViaSlab = arrivedViaNav;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const FADE_OUT_MS = 400;  // old page → black
  const FADE_IN_MS  = 600;  // black → new page

  function getBg() {
    return document.documentElement.getAttribute('data-theme') === 'light'
      ? '#f4efe7' : '#0f0f0e';
  }

  const overlay = document.createElement('div');
  overlay.id = 'pt-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9998',
    'pointer-events:none', 'opacity:0', 'will-change:opacity',
    'background:' + getBg()
  ].join(';');

  if (arrivedViaNav) {
    // Start fully opaque — page is hidden until fonts/layout settle
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    document.body.appendChild(overlay);

    if (reducedMotion) {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    } else {
      // Wait for fonts, then ease out
      const ready = document.fonts ? document.fonts.ready : Promise.resolve();
      ready.then(function () {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            overlay.style.transition = 'opacity ' + FADE_IN_MS + 'ms cubic-bezier(0,0,0.2,1)';
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
          });
        });
      });
    }
  } else {
    document.body.appendChild(overlay);
  }

  // Keep overlay color in sync with theme toggles
  new MutationObserver(function () {
    overlay.style.background = getBg();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  if (reducedMotion) return;

  document.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.button !== 0 && e.button !== undefined) return;
    var a = e.target.closest('a');
    if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var rawHref = a.getAttribute('href');
    if (!rawHref) return;
    if (rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;
    var url;
    try { url = new URL(a.href, window.location.href); } catch (err) { return; }
    if (url.origin !== window.location.origin) return;
    if (url.href === window.location.href) return;

    e.preventDefault();
    sessionStorage.setItem(NAV_FLAG, 'true');

    // Fade to black, then navigate
    overlay.style.transition = 'opacity ' + FADE_OUT_MS + 'ms cubic-bezier(0.4,0,1,1)';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';

    var dest = a.href;
    setTimeout(function () {
      window.location.href = dest;
    }, FADE_OUT_MS + 40);
  });
})();
