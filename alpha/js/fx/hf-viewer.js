/* ──────────────────────────────────────────────────────────────────────
   fx/hf-viewer.js — Hotel Figueroa brand-book modal viewer

   Click #hf-cover (the cover plate inside the Hotel Figueroa case
   study) to open #hf-viewer. Builds the view list dynamically:
     - single cover           (HotelFigueroa 62.jpeg)
     - paired spreads         (HotelFigueroa 63-120, two pages each)
     - single odd interior    (HotelFigueroa 121.jpeg)
     - single back cover      (HotelFigueroa 122.jpeg)

   Navigation: prev/next buttons, ←/→ arrow keys, ESC to close,
   backdrop click to close. Body scroll + Lenis pause while open.

   Animation: subtle slide-fade between views (outgoing slides toward
   exit edge + fades out; incoming slides in from opposite edge +
   fades in). The CSS already has perspective + preserve-3d on the
   spread wrapper, so we can level this up to a true 3D page-flip in
   a polish pass without re-wiring HTML.

   No-op on pages without #hf-viewer.
   ────────────────────────────────────────────────────────────────────── */

(function () {
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function src(n)  { return 'img/HF/HotelFigueroa%20' + n + '.jpeg'; }

  function buildViews() {
    var views = [{ type: 'single', files: [62] }];
    for (var f = 63; f < 121; f += 2) views.push({ type: 'spread', files: [f, f + 1] });
    views.push({ type: 'single', files: [121] });
    views.push({ type: 'single', files: [122] });
    return views;
  }

  function init() {
    var viewer  = document.getElementById('hf-viewer');
    var cover   = document.getElementById('hf-cover');
    var spread  = document.getElementById('hf-spread');
    var counter = document.getElementById('hf-counter');
    if (!viewer || !cover || !spread) return;

    var closeBtn = viewer.querySelector('.hf-close-btn');
    var prevBtn  = viewer.querySelector('.hf-prev');
    var nextBtn  = viewer.querySelector('.hf-next');

    var views = buildViews();
    var total = views.length;
    var cur = 0;
    var open = false;
    var animating = false;
    var gsap = window.gsap;

    function makeImg(n) {
      var img = document.createElement('img');
      img.src = src(n);
      img.alt = 'Hotel Figueroa Brand Book · page ' + n;
      img.loading = 'eager';
      return img;
    }

    function buildSpread(view) {
      var frag = document.createDocumentFragment();
      if (view.type === 'single') {
        var pg = document.createElement('div');
        pg.className = 'hf-pg solo';
        pg.appendChild(makeImg(view.files[0]));
        frag.appendChild(pg);
      } else {
        var left = document.createElement('div');
        left.className = 'hf-pg pair';
        left.appendChild(makeImg(view.files[0]));

        var spine = document.createElement('div');
        spine.className = 'hf-spine';

        var right = document.createElement('div');
        right.className = 'hf-pg pair';
        right.appendChild(makeImg(view.files[1]));

        frag.appendChild(left);
        frag.appendChild(spine);
        frag.appendChild(right);
      }
      return frag;
    }

    function updateCounter() {
      if (counter) counter.textContent = pad(cur + 1) + ' / ' + pad(total);
    }

    function render(direction) {
      var view = views[cur];
      if (!gsap || direction === 0 || direction === undefined) {
        spread.innerHTML = '';
        spread.appendChild(buildSpread(view));
        updateCounter();
        return;
      }
      animating = true;
      var oldChildren = Array.prototype.slice.call(spread.children);
      var slideOut = direction > 0 ? -40 : 40;
      var slideIn  = direction > 0 ? 40 : -40;

      gsap.to(oldChildren, {
        x: slideOut,
        autoAlpha: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: function () {
          spread.innerHTML = '';
          spread.appendChild(buildSpread(view));
          updateCounter();
          var newChildren = Array.prototype.slice.call(spread.children);
          gsap.fromTo(
            newChildren,
            { x: slideIn, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, duration: 0.35, ease: 'power3.out',
              onComplete: function () { animating = false; } }
          );
        },
      });
    }

    function show() {
      viewer.classList.add('open');
      // Force reflow so the .visible transition takes effect.
      // eslint-disable-next-line no-unused-expressions
      viewer.offsetHeight;
      viewer.classList.add('visible');
      viewer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lb-open');
      window.__lenis && window.__lenis.stop();
      open = true;
      cur = 0;
      render(0);
    }

    function hide() {
      viewer.classList.remove('visible');
      // Wait for opacity transition (200ms in CSS) before un-displaying.
      setTimeout(function () {
        viewer.classList.remove('open');
        viewer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lb-open');
        window.__lenis && window.__lenis.start();
        open = false;
        spread.innerHTML = '';
      }, 220);
    }

    function navigate(dir) {
      if (!open || animating) return;
      var nxt = cur + dir;
      if (nxt < 0 || nxt >= total) return;
      cur = nxt;
      render(dir);
    }

    cover.addEventListener('click', function (e) {
      e.preventDefault();
      show();
    });

    closeBtn && closeBtn.addEventListener('click', hide);
    prevBtn  && prevBtn.addEventListener('click',  function () { navigate(-1); });
    nextBtn  && nextBtn.addEventListener('click',  function () { navigate(1);  });

    // Backdrop click closes (clicks landing on the modal itself, not children).
    viewer.addEventListener('click', function (e) {
      if (e.target === viewer) hide();
    });

    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape')         { e.preventDefault(); hide(); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); navigate(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1);  }
    });
  }

  if (window.SiteFX) {
    window.SiteFX.register('hf-viewer', { init: init, owns: ['#hf-viewer', '#hf-cover'] });
    window.SiteFX.on('page:enter', function (data) {
      if (data && data.container) init();
    });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
