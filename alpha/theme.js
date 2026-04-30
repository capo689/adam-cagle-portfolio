// theme.js — light/dark theme toggle, persisted in localStorage.
// The actual theme is applied via inline <script> in <head> before paint
// to avoid a flash; this file binds the toggle button.

(function () {
  const STORAGE_KEY = 'theme';

  function setTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    try { localStorage.setItem(STORAGE_KEY, name); } catch (e) {}
  }

  function bindToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindToggle);
  } else {
    bindToggle();
  }
})();
