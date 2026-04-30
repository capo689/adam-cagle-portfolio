/* ──────────────────────────────────────────────────────────────────────
   fx/lightbox.js — image-grid zoom view (Portfolio + Agents)

   Picks up every .ad[data-gallery] tile and groups them into galleries
   by the data-gallery value. Clicking a tile opens #lightbox at that
   tile's index inside its gallery. Prev/next walk that gallery only.
   ESC closes. Arrows navigate. Backdrop click closes. Body scroll
   locks while open. Lenis pauses while open.

   Caption:
     .lb-cap-l = "GALLERY · 02 / 07"  (accent, mono caps)
     .lb-cap-r = meta from the tile's .overlay-inner second span
                 (mono caps)

   Markup the lightbox expects (already shipped in Portfolio.html and
   Agents.html):
     <div id="lightbox" aria-hidden="true">
       <button class="lb-close">✕</button>
       <button class="lb-nav lb-prev">←</button>
       <button class="lb-nav lb-next">→</button>
       <figure class="lb-figure">
         <img class="lb-img" alt="">
         <figcaption class="lb-cap">
           <span class="lb-cap-l"></span>
           <span class="lb-cap-r"></span>
         </figcaption>
       </figure>
     </div>

   No-op on pages without #lightbox.
   ────────────────────────────────────────────────────────────────────── */

(function () {
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function init() {
    var lb = document.getElementById('lightbox');
    if (!lb) return;

    var img      = lb.querySelector('.lb-img');
    var capL     = lb.querySelector('.lb-cap-l');
    var capR     = lb.querySelector('.lb-cap-r');
    var closeBtn = lb.querySelector('.lb-close');
    var prevBtn  = lb.querySelector('.lb-prev');
    var nextBtn  = lb.querySelector('.lb-next');

    var state = { gallery: '', items: [], idx: 0, open: false };
    var gsap = window.gsap;

    function show(idx) {
      var item = state.items[idx];
      if (!item) return;
      state.idx = idx;
      if (img) {
        img.src = item.src;
        img.alt = item.alt || '';
      }
      if (capL) capL.textContent = state.gallery.toUpperCase() + ' · ' + pad(idx + 1) + ' / ' + pad(state.items.length);
      if (capR) capR.textContent = item.meta || '';
    }

    function buildItems(galleryName) {
      var nodes = document.querySelectorAll('.ad[data-gallery="' + galleryName + '"]');
      var items = [];
      Array.prototype.forEach.call(nodes, function (el) {
        var img = el.querySelector('img');
        var spans = el.querySelectorAll('.overlay-inner span');
        var meta = spans.length > 1 ? spans[spans.length - 1].textContent.trim() : '';
        items.push({
          src: img ? img.currentSrc || img.src : '',
          alt: img ? img.alt : '',
          meta: meta,
        });
      });
      return items;
    }

    function open(galleryName, startIdx) {
      state.gallery = galleryName;
      state.items = buildItems(galleryName);
      if (!state.items.length) return;
      show(Math.max(0, Math.min(startIdx, state.items.length - 1)));

      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lb-open');
      window.__lenis && window.__lenis.stop();
      state.open = true;

      if (gsap) {
        gsap.fromTo(lb,  { autoAlpha: 0 },  { autoAlpha: 1, duration: 0.25, ease: 'power2.out' });
        gsap.fromTo(img, { scale: 0.96 },   { scale: 1,     duration: 0.4,  ease: 'power3.out' });
      }
    }

    function close() {
      function finalize() {
        lb.classList.remove('open');
        lb.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lb-open');
        window.__lenis && window.__lenis.start();
        state.open = false;
        if (gsap) gsap.set(lb, { autoAlpha: '' }); // clear inline
      }
      if (gsap) {
        gsap.to(lb, { autoAlpha: 0, duration: 0.2, ease: 'power2.in', onComplete: finalize });
      } else {
        finalize();
      }
    }

    function navigate(dir) {
      if (!state.open || !state.items.length) return;
      var n = state.items.length;
      show(((state.idx + dir) % n + n) % n);
      if (gsap && img) {
        gsap.fromTo(img, { autoAlpha: 0.4, scale: 0.985 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power2.out' });
      }
    }

    // Bind tile clicks (delegated so future-loaded grids work too).
    // Two trigger shapes:
    //   .ad[data-gallery="X"] — the tile IS in the gallery, opens at its own data-index
    //   [data-lightbox="X"]   — a cover-plate trigger; opens gallery X at its data-index
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest && e.target.closest('[data-lightbox]');
      if (trigger) {
        e.preventDefault();
        var galleryName = trigger.getAttribute('data-lightbox');
        var idxAttr = trigger.getAttribute('data-index');
        var idx = idxAttr === null ? 0 : parseInt(idxAttr, 10) || 0;
        open(galleryName, idx);
        return;
      }
      var tile = e.target.closest && e.target.closest('.ad[data-gallery]');
      if (!tile) return;
      e.preventDefault();
      var galleryName2 = tile.getAttribute('data-gallery');
      var idxAttr2 = tile.getAttribute('data-index');
      var idx2 = idxAttr2 === null ? 0 : parseInt(idxAttr2, 10) || 0;
      open(galleryName2, idx2);
    });

    closeBtn && closeBtn.addEventListener('click', close);
    prevBtn  && prevBtn.addEventListener('click',  function () { navigate(-1); });
    nextBtn  && nextBtn.addEventListener('click',  function () { navigate(1);  });

    // Backdrop click closes (only when click lands on the dialog itself).
    lb.addEventListener('click', function (e) {
      if (e.target === lb) close();
    });

    // Keyboard.
    document.addEventListener('keydown', function (e) {
      if (!state.open) return;
      if (e.key === 'Escape')     { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); navigate(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1);  }
    });
  }

  if (window.SiteFX) {
    window.SiteFX.register('lightbox', { init: init, owns: ['#lightbox', '.ad[data-gallery]'] });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
