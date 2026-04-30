// page-transitions.js (ALPHA)
// Visual page transition removed. The only thing kept here is the
// sessionStorage flag that tells preloader.js to skip its neon-flicker
// intro when arriving via an internal nav click — without the flag,
// every link would trigger the full preloader animation on the next page.

(function () {
  const NAV_FLAG = 'site-internal-nav';
  const arrivedViaNav = sessionStorage.getItem(NAV_FLAG) === 'true';
  sessionStorage.removeItem(NAV_FLAG);

  // Expose for preloader.js
  window.__siteArrivedViaSlab = arrivedViaNav;

  // Set the flag on any internal link click so the next page knows
  // to skip the preloader. No visual transition — page navigates normally.
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
    sessionStorage.setItem(NAV_FLAG, 'true');
  });
})();
