/* ──────────────────────────────────────────────────────────────────────
   js/pages/studio.js — Studio page · banner ad toggle

   Swaps the static thumbnail for the live HTML5 banner iframe and
   back. Pulled out of the inline <script> block in the live Studio
   page so it can be defer-loaded with the rest of the JS layer.
   ────────────────────────────────────────────────────────────────────── */

(function () {
  function init() {
    var wrap  = document.getElementById('banner-wrap');
    var btn   = document.getElementById('banner-btn');
    var icon  = document.getElementById('banner-icon');
    var label = document.getElementById('banner-label');
    if (!wrap || !btn) return;

    var playing = false;

    function setUI(isPlaying) {
      playing = isPlaying;
      icon.textContent  = isPlaying ? '⏸' : '▶';
      label.textContent = isPlaying ? 'Pause' : 'Play';
      btn.classList.toggle('active', isPlaying);
    }

    function showThumb() {
      var f = document.getElementById('banner-iframe');
      if (f) f.remove();
      if (!document.getElementById('banner-thumb')) {
        var img = document.createElement('img');
        img.id = 'banner-thumb';
        img.src = 'img/banners/media/fallback-image.jpg';
        img.alt = 'Sunset Marquis HTML5 banner ad · preview thumbnail';
        img.width = 728;
        img.height = 90;
        img.style.cssText = 'display:block;width:100%;height:100%;object-fit:cover;';
        wrap.appendChild(img);
      }
    }

    function showBanner() {
      var t = document.getElementById('banner-thumb');
      if (t) t.remove();
      var f = document.createElement('iframe');
      f.id = 'banner-iframe';
      f.src = 'img/banners/index.html';
      f.width = 728;
      f.height = 90;
      f.setAttribute('scrolling', 'no');
      f.setAttribute('title', 'Sunset Marquis HTML5 banner ad');
      f.style.cssText = 'display:block;border:none;background:transparent;';
      wrap.appendChild(f);
    }

    btn.addEventListener('click', function () {
      if (playing) { showThumb();  setUI(false); }
      else         { showBanner(); setUI(true);  }
    });
  }

  if (window.SiteFX) {
    window.SiteFX.register('studio-banner', { init: init, owns: ['#banner-wrap'] });
    window.SiteFX.on('page:enter', function (data) {
      if (data && data.container) init();
    });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
