// page-transitions.js
// Slab replaced by native View Transitions API (@view-transition in nav.css).
// This file only keeps the sessionStorage flag that tells preloader.js to
// skip its intro animation on internal navigation.

(function () {
  const NAV_FLAG = 'site-internal-nav';
  const arrivedViaNav = sessionStorage.getItem(NAV_FLAG) === 'true';
  sessionStorage.removeItem(NAV_FLAG);

  // Expose for preloader.js
  window.__siteArrivedViaSlab = arrivedViaNav;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.button !== 0 && e.button !== undefined) return;
    const a = e.target.closest('a');
    if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const rawHref = a.getAttribute('href');
    if (!rawHref) return;
    if (rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;
    let url;
    try { url = new URL(a.href, window.location.href); } catch (err) { return; }
    if (url.origin !== window.location.origin) return;
    if (url.href === window.location.href) return;
    sessionStorage.setItem(NAV_FLAG, 'true');
  });
})();
