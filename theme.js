(function () {
  var stored = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', stored);

  // Swap any [data-neon-dark]/[data-neon-light] images to match the active theme
  function syncNeon() {
    var theme = document.documentElement.getAttribute('data-theme');
    var attr = theme === 'light' ? 'data-neon-light' : 'data-neon-dark';
    document.querySelectorAll('img[data-neon-dark][data-neon-light]').forEach(function (img) {
      var next = img.getAttribute(attr);
      if (next && img.getAttribute('src') !== next) img.setAttribute('src', next);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    syncNeon();
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      syncNeon();
    });
  });
})();
