/* ──────────────────────────────────────────────────────────────────────
   cursor.js — custom cursor with state hooks

   Builds a single .cursor element, follows the pointer with GSAP's
   quickTo (0.3s power2.out smoothing). Toggles state classes:

     .is-visible — set on first mousemove, cleared on mouseleave from window
     .is-link    — host matches a hover-target selector (links, buttons,
                   gallery tiles, modal triggers)
     .is-labeled — host (or ancestor) has [data-cursor] — pill morph
                   with text from data-cursor-text or data-cursor value

   Skipped on coarse pointers (touchscreens). Reduced-motion users see
   it but without GSAP smoothing — cursor snaps to pointer position.
   ────────────────────────────────────────────────────────────────────── */

(function () {
  var LINK_SELECTOR = [
    'a',
    'button',
    '[role="button"]',
    '.ad[data-gallery]',
    '[data-lightbox]',
    '[data-magnetic]',
    '#hf-cover',
    '#clink-cover',
    'input',
    'textarea',
    'select',
    'label',
  ].join(',');

  function init() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    var cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var gsap = window.gsap;
    var qx, qy;
    if (gsap && !reduce) {
      qx = gsap.quickTo(cursor, 'x', { duration: 0.3, ease: 'power2.out' });
      qy = gsap.quickTo(cursor, 'y', { duration: 0.3, ease: 'power2.out' });
    }

    var visible = false;
    function setPos(x, y) {
      if (!visible) {
        cursor.classList.add('is-visible');
        visible = true;
      }
      if (qx) { qx(x); qy(y); }
      else { cursor.style.transform = 'translate(' + x + 'px, ' + y + 'px) translate(-50%, -50%)'; }
    }

    document.addEventListener('mousemove', function (e) {
      setPos(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      cursor.classList.remove('is-visible');
      visible = false;
    });
    document.addEventListener('mouseenter', function () {
      // Stays hidden until first move — feels right.
    });

    // Hover-state tracking via mouseover (bubbles, so we get re-evaluation
    // every time the pointer enters a new element).
    document.addEventListener('mouseover', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;

      var labeled = t.closest('[data-cursor]');
      if (labeled) {
        var label = labeled.getAttribute('data-cursor-text') || labeled.getAttribute('data-cursor') || '';
        cursor.textContent = label;
        cursor.classList.add('is-labeled');
        cursor.classList.remove('is-link');
        return;
      }

      var link = t.closest(LINK_SELECTOR);
      cursor.textContent = '';
      cursor.classList.remove('is-labeled');
      cursor.classList.toggle('is-link', !!link);
    });
  }

  if (window.SiteFX) {
    window.SiteFX.register('cursor', { init: init, owns: ['.cursor'] });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
