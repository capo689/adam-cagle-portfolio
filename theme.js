(function () {
  var stored = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', stored);

  // Swap theme-aware images and links to match active theme.
  function syncThemeAssets() {
    var theme = document.documentElement.getAttribute('data-theme');
    var neonAttr = theme === 'light' ? 'data-neon-light' : 'data-neon-dark';
    document.querySelectorAll('img[data-neon-dark][data-neon-light]').forEach(function (img) {
      var next = img.getAttribute(neonAttr);
      if (next && img.getAttribute('src') !== next) img.setAttribute('src', next);
    });

    var hrefAttr = theme === 'light' ? 'data-theme-href-light' : 'data-theme-href-dark';
    document.querySelectorAll('a[data-theme-href-dark][data-theme-href-light]').forEach(function (link) {
      var next = link.getAttribute(hrefAttr);
      if (next && link.getAttribute('href') !== next) link.setAttribute('href', next);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    syncThemeAssets();
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      syncThemeAssets();
    });
  });
})();
