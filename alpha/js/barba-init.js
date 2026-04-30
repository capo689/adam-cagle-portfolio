/* ──────────────────────────────────────────────────────────────────────
   barba-init.js — Barba.js v2 page transitions

   Lifecycle:
     beforeLeave → leave (slab covers) → [Barba swaps containers] →
     beforeEnter (CSS hot-swap, scroll reset, nav update, ST refresh,
     SiteFX page:enter emit so plugins lock+queue animations while
     hidden) → enter (slab uncovers, animations are mid-play as the
     slab clears) → afterEnter (sessionStorage flag).

   prevent rules: anchors, mailto/tel, target=_blank, download, and
   binary asset URLs all bypass Barba and load natively.

   prefers-reduced-motion: instant swap, no slab.
   ────────────────────────────────────────────────────────────────────── */

(function () {
  var NS_TO_FILE = {
    home:      'index.html',
    portfolio: 'Portfolio.html',
    agents:    'Agents.html',
    books:     'Books.html',
  };

  function ensureSlab() {
    var s = document.getElementById('barba-slab');
    if (s) return s;
    s = document.createElement('div');
    s.id = 'barba-slab';
    s.className = 'barba-slab';
    s.setAttribute('aria-hidden', 'true');
    document.body.appendChild(s);
    return s;
  }

  function slabLeave() {
    if (!window.gsap) return;
    return window.gsap.fromTo(ensureSlab(),
      { yPercent: 100 },
      { yPercent: 0, duration: 0.5, ease: 'power3.inOut' }
    );
  }

  function slabEnter() {
    if (!window.gsap) return;
    var slab = document.getElementById('barba-slab');
    if (!slab) return;
    return window.gsap.fromTo(slab,
      { yPercent: 0 },
      { yPercent: -100, duration: 0.55, ease: 'power3.inOut',
        onComplete: function () {
          // Reset to below for next leave
          window.gsap.set(slab, { yPercent: 100 });
        }
      }
    );
  }

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

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.barba.init({
      prevent: shouldPrevent,
      transitions: reduceMotion
        ? [{ name: 'instant' }]
        : [{
            name: 'slab',
            leave: function () { return slabLeave(); },
            enter: function () { return slabEnter(); },
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

    // beforeEnter runs after Barba has swapped containers (old removed,
    // new added) but BEFORE the enter animation (slab uncover). Doing
    // CSS hot-swap, scroll reset, nav update, and plugin re-init here
    // keeps the visual flash hidden behind the slab.
    window.barba.hooks.beforeEnter(function (data) {
      return swapPageStylesheet(data.next.html).then(function () {
        var ns = data.next.namespace;
        updateActiveNav(ns);
        refreshScroll();
        if (window.SiteFX) {
          window.SiteFX.emit('page:enter', {
            from: data.current && data.current.namespace,
            to: ns,
            container: data.next.container,
          });
        }
      });
    });

    window.barba.hooks.afterEnter(function () {
      // Mark preloader 'shown' so it doesn't re-fire on enter back to home.
      try { sessionStorage.setItem('alpha-preloaded', '1'); } catch (e) {}
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
