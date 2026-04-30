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

  function ensureSlabs() {
    var wrap = document.getElementById('barba-slabs');
    if (wrap) return wrap;
    wrap = document.createElement('div');
    wrap.id = 'barba-slabs';
    wrap.className = 'barba-slabs';
    wrap.setAttribute('aria-hidden', 'true');
    var i;
    for (i = 0; i < 4; i++) {
      var b = document.createElement('div');
      b.className = 'barba-band b-' + i;
      wrap.appendChild(b);
    }
    var label = document.createElement('div');
    label.id = 'barba-label';
    label.className = 'barba-label';
    wrap.appendChild(label);
    document.body.appendChild(wrap);
    return wrap;
  }

  var LABELS = {
    home:      'Résumé.',
    portfolio: 'Portfolio.',
    agents:    'AI Agents.',
    books:     'Books.',
  };

  function resetSlabs() {
    if (!window.gsap) return;
    var gsap = window.gsap;
    // Reset bands to off-screen (alternating sides) and label hidden.
    gsap.set('.barba-band.b-0, .barba-band.b-2', { xPercent: -101 });
    gsap.set('.barba-band.b-1, .barba-band.b-3', { xPercent:  101 });
    gsap.set('#barba-label', { autoAlpha: 0, y: 24 });
    var wrap = document.getElementById('barba-slabs');
    if (wrap) wrap.classList.remove('is-active');
  }

  function slabLeave(toNamespace) {
    if (!window.gsap) return;
    var gsap = window.gsap;
    var wrap = ensureSlabs();
    wrap.classList.add('is-active');

    // Reset state defensively so a half-finished previous nav doesn't
    // leave bands mid-screen.
    gsap.set('.barba-band.b-0, .barba-band.b-2', { xPercent: -101 });
    gsap.set('.barba-band.b-1, .barba-band.b-3', { xPercent:  101 });

    var label = document.getElementById('barba-label');
    if (label) label.textContent = LABELS[toNamespace] || '';
    gsap.set(label, { autoAlpha: 0, y: 24 });

    var tl = gsap.timeline();
    // Bands sweep in toward 0% with a small staggered delay.
    tl.to('.barba-band', {
      xPercent: 0,
      duration: 0.6,
      ease: 'power3.inOut',
      stagger: { each: 0.06, from: 'random' },
    }, 0);
    // Label rises into place once the bands are mostly closed.
    tl.to(label, {
      autoAlpha: 1,
      y: 0,
      duration: 0.45,
      ease: 'power3.out',
    }, 0.32);
    return tl;
  }

  function slabEnter(nextContainer) {
    if (!window.gsap) return;
    var gsap = window.gsap;
    var label = document.getElementById('barba-label');

    var tl = gsap.timeline({
      onComplete: function () {
        // Reset for next nav.
        gsap.set('.barba-band.b-0, .barba-band.b-2', { xPercent: -101 });
        gsap.set('.barba-band.b-1, .barba-band.b-3', { xPercent:  101 });
        gsap.set(label, { autoAlpha: 0, y: 24 });
        var wrap = document.getElementById('barba-slabs');
        if (wrap) wrap.classList.remove('is-active');
      },
    });

    // Subtle zoom-in + blur-clear on the new container as bands clear.
    if (nextContainer) {
      tl.fromTo(nextContainer,
        { autoAlpha: 0, scale: 1.02, filter: 'blur(3px)' },
        { autoAlpha: 1, scale: 1,    filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' },
        0
      );
    }
    // Label fades up and out.
    tl.to(label, {
      autoAlpha: 0,
      y: -24,
      duration: 0.32,
      ease: 'power2.in',
    }, 0);
    // Bands sweep OUT toward the opposite side from where they came in,
    // so the screen cleanly clears.
    tl.to('.barba-band.b-0, .barba-band.b-2', {
      xPercent: 101,
      duration: 0.6,
      ease: 'power3.inOut',
      stagger: 0.05,
    }, 0.18);
    tl.to('.barba-band.b-1, .barba-band.b-3', {
      xPercent: -101,
      duration: 0.6,
      ease: 'power3.inOut',
      stagger: 0.05,
    }, 0.18);
    return tl;
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
            name: 'editorial',
            leave: function (data) { return slabLeave(data.next.namespace); },
            enter: function (data) { return slabEnter(data.next.container); },
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
