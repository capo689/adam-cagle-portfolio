/* ──────────────────────────────────────────────────────────────────────
   preloader.js — first-load reveal on home only

   Behavior:
     - Runs only when sessionStorage('alpha-preloaded') is unset AND the
       page is the home page (detected by presence of .hero-neon, which
       is unique to index.html).
     - Sets window.__preloaderActive = true synchronously at script load
       so hero-reveal.js (which loads after) knows to wait for the
       'preloader:done' event before choreographing the hero.
     - Builds .preloader overlay, animates: neon fade-in 0.7s →
       hold 0.6s → curtain slides up 0.7s power3.inOut.
     - Sets the session flag and emits 'preloader:done' on SiteFX when
       the curtain has cleared.

   On reduced motion: shows the overlay briefly (0.4s fade), no movement.
   On JS-less pages: this script does nothing, page loads instantly.
   ────────────────────────────────────────────────────────────────────── */

(function () {
  // Synchronous gate — runs at script-eval time, before hero-reveal init.
  var isHome = !!document.querySelector('.hero-neon');
  var alreadyShown = false;
  try { alreadyShown = !!sessionStorage.getItem('alpha-preloaded'); } catch (e) {}

  if (!isHome || alreadyShown) {
    // Skip entirely. Don't set the active flag — hero-reveal plays normally.
    return;
  }

  // Lock scroll right away so even before init() the page can't shift.
  document.documentElement.classList.add('is-preloading');
  window.__preloaderActive = true;

  function buildOverlay() {
    var overlay = document.createElement('div');
    overlay.className = 'preloader';
    overlay.setAttribute('aria-hidden', 'true');
    var img = document.createElement('img');
    img.src = 'img/neon-bluex.png';
    img.alt = '';
    img.className = 'preloader-art';
    overlay.appendChild(img);
    document.body.insertBefore(overlay, document.body.firstChild);
    return { overlay: overlay, img: img };
  }

  function done(overlay) {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.documentElement.classList.remove('is-preloading');
    window.__preloaderActive = false;
    try { sessionStorage.setItem('alpha-preloaded', '1'); } catch (e) {}
    if (window.SiteFX) window.SiteFX.emit('preloader:done');
  }

  function init() {
    var built = buildOverlay();
    var overlay = built.overlay;
    var img = built.img;

    var gsap = window.gsap;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!gsap || reduce) {
      // Quick non-animated cleanup: brief CSS fade, then remove.
      img.style.opacity = '1';
      img.style.transform = 'scale(1)';
      overlay.style.transition = 'opacity 0.4s ease';
      // give layout a tick, then fade out
      requestAnimationFrame(function () {
        setTimeout(function () {
          overlay.style.opacity = '0';
          setTimeout(function () { done(overlay); }, 420);
        }, reduce ? 200 : 600);
      });
      return;
    }

    var tl = gsap.timeline();
    tl.to(img, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power3.out' })
      .addLabel('hold', '+=0.6')
      .to(img, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 'hold')
      .to(overlay, {
        yPercent: -100,
        duration: 0.7,
        ease: 'power3.inOut',
        onComplete: function () { done(overlay); },
      }, 'hold+=0.15');
  }

  if (window.SiteFX) {
    window.SiteFX.register('preloader', { init: init, owns: ['.preloader'] });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
