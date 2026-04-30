/* ──────────────────────────────────────────────────────────────────────
   barba-init.js — Barba.js v2 page transitions (instant swap stage)

   This is round 5i-2a: the engine boots and pages swap via AJAX, but
   without a transition (instant). Round 5i-2b will add per-plugin
   re-init hooks so hero-reveal / section-reveal / hf-viewer / studio.js
   bind to the new container after each enter. Round 5i-3 layers the
   slab/dissolve transition on top.

   For now, on each enter we:
     - Reset Lenis scroll to 0 (or window.scrollTo as fallback)
     - Update .nav-link.is-active in site-shell from data-barba-namespace
     - Kill ScrollTriggers pointing at removed elements, then refresh
     - Emit page:enter / page:leave on SiteFX

   prevent rules: anchors, mailto/tel, target=_blank, download, and
   binary asset URLs all bypass Barba and load natively.
   ────────────────────────────────────────────────────────────────────── */

(function () {
  var NS_TO_FILE = {
    home:      'index.html',
    portfolio: 'Portfolio.html',
    agents:    'Agents.html',
    books:     'Books.html',
  };

  function shouldPrevent(opts) {
    var href = (opts.href || (opts.el && opts.el.getAttribute('href')) || '').trim();
    if (!href) return true;
    if (href.charAt(0) === '#') return true;
    if (/^(mailto|tel|javascript):/i.test(href)) return true;
    if (opts.el && (opts.el.target === '_blank' || opts.el.hasAttribute('download'))) return true;
    if (/\.(pdf|zip|jpe?g|png|webp|svg|gif|mp4|mp3|wav)(\?|$)/i.test(href)) return true;
    return false;
  }

  function updateActiveNav(namespace) {
    var fileName = NS_TO_FILE[namespace] || '';
    var links = document.querySelectorAll('.rail-nav .nav-link, .mob-nav .nav-link');
    Array.prototype.forEach.call(links, function (a) {
      var href = (a.getAttribute('href') || '').toLowerCase();
      a.classList.toggle('is-active', !!fileName && href === fileName.toLowerCase());
    });
  }

  function refreshScroll() {
    if (window.__lenis && typeof window.__lenis.scrollTo === 'function') {
      window.__lenis.scrollTo(0, { immediate: true, force: true });
    } else {
      window.scrollTo(0, 0);
    }
    if (window.ScrollTrigger) {
      window.ScrollTrigger.getAll().forEach(function (st) {
        if (st.trigger && !document.contains(st.trigger)) st.kill();
      });
      window.ScrollTrigger.refresh();
    }
  }

  // Swap the per-page stylesheet (css/pages/X.css) on navigation.
  // Barba v2 only swaps the container, not <head>, so without this each
  // page would render under whatever pages CSS was first loaded.
  // Returns a Promise that resolves when the new stylesheet has loaded
  // (or fails) so we can hold the new container until styles are ready.
  function swapPageStylesheet(nextHTML) {
    return new Promise(function (resolve) {
      var newDoc;
      try { newDoc = new DOMParser().parseFromString(nextHTML, 'text/html'); }
      catch (e) { resolve(); return; }

      var newLink = newDoc.querySelector('link[rel="stylesheet"][href*="css/pages/"]');
      var oldLink = document.querySelector('link[rel="stylesheet"][href*="css/pages/"]');
      var newHref = newLink && newLink.getAttribute('href');
      var oldHref = oldLink && oldLink.getAttribute('href');

      if (!newHref || newHref === oldHref) { resolve(); return; }

      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = newHref;
      link.addEventListener('load', function () {
        if (oldLink) oldLink.parentNode.removeChild(oldLink);
        resolve();
      });
      link.addEventListener('error', function () {
        if (oldLink) oldLink.parentNode.removeChild(oldLink);
        resolve();
      });
      document.head.appendChild(link);
    });
  }

  function init() {
    if (!window.barba) {
      console.warn('[barba-init] Barba not loaded; native page loads will be used');
      return;
    }

    window.barba.init({
      prevent: shouldPrevent,
      transitions: [{
        name: 'instant',
        // No leave/enter animation yet — just swap. Slab/dissolve in 5i-3.
      }],
    });

    window.barba.hooks.beforeLeave(function (data) {
      if (window.SiteFX) {
        window.SiteFX.emit('page:leave', {
          from: data.current.namespace,
          container: data.current.container,
        });
      }
    });

    // Swap per-page stylesheet before the new container renders so we
    // don't get a flash of incorrect styling.
    window.barba.hooks.beforeEnter(function (data) {
      return swapPageStylesheet(data.next.html);
    });

    window.barba.hooks.afterEnter(function (data) {
      var ns = data.next.namespace;
      updateActiveNav(ns);
      refreshScroll();

      // Update <html> document title is handled by Barba automatically
      // (it swaps the <head>'s <title>).

      // Mark preloader as 'shown' on first navigation so it doesn't
      // re-fire on subsequent enters into the home page.
      try { sessionStorage.setItem('alpha-preloaded', '1'); } catch (e) {}

      if (window.SiteFX) {
        window.SiteFX.emit('page:enter', {
          from: data.current && data.current.namespace,
          to: ns,
          container: data.next.container,
        });
      }
    });
  }

  if (window.SiteFX) {
    window.SiteFX.register('barba', { init: init });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
