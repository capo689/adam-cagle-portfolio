/* ──────────────────────────────────────────────────────────────────────
   theme.js — light/dark theme toggle, persisted in localStorage
   Reads the stored preference synchronously (top of <head>) so we never
   flash the wrong theme. Wires the toggle button up at boot via SiteFX.
   ────────────────────────────────────────────────────────────────────── */

(function () {
  // 1. Set theme synchronously — runs before paint to avoid FOUC.
  var stored = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', stored);

  // 2. Wire up the toggle once SiteFX is ready.
  function bind() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      window.SiteFX && window.SiteFX.emit('theme:change', { theme: next });
    });
  }

  if (window.SiteFX) {
    window.SiteFX.register('theme', { init: bind });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
