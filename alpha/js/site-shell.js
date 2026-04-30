/* ──────────────────────────────────────────────────────────────────────
   site-shell.js — fixed top rail + mobile menu
   Registers with SiteFX. Owns: .rail, .mob-nav.
   Renders the nav into <site-shell>, applies the active state from the
   current pathname, scroll-shrinks the rail, and toggles the mobile
   overlay. No animation library deps — plain vanilla.
   ────────────────────────────────────────────────────────────────────── */

(function () {
  var NAV = [
    { href: 'index.html',     label: 'Résumé' },
    { href: 'Portfolio.html', label: 'Portfolio' },
    { href: 'Agents.html',    label: 'AI Agents' },
    { href: 'Books.html',     label: 'Books' },
  ];

  function escape(s) { return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }

  function render(host) {
    var path = location.pathname.split('/').pop().toLowerCase() || 'index.html';
    var navHtml = NAV.map(function (item) {
      var isActive = item.href.toLowerCase() === path;
      return '<a class="nav-link' + (isActive ? ' is-active' : '') + '" href="' + item.href + '">' + escape(item.label) + '</a>';
    }).join('');

    host.innerHTML = ''
      + '<header class="rail" data-rail>'
      +   '<a class="rail-brand" href="index.html">Adam Cagle</a>'
      +   '<nav class="rail-nav" aria-label="Primary">' + navHtml + '</nav>'
      +   '<div class="rail-right">'
      +     '<button id="theme-toggle" class="theme-toggle" type="button" aria-label="Toggle theme">'
      +       '<span class="toggle-icon" aria-hidden="true">☾</span>'
      +       '<span class="toggle-pill" aria-hidden="true"></span>'
      +     '</button>'
      +     '<a class="rail-cta" href="mailto:adam@adamcagle.com">Get in touch <span class="arrow" aria-hidden="true">→</span></a>'
      +     '<button class="hamburger" type="button" aria-label="Open menu" aria-expanded="false" data-mob-open>'
      +       '<span></span><span></span><span></span>'
      +     '</button>'
      +   '</div>'
      +   '<div class="rail-progress" aria-hidden="true"></div>'
      + '</header>'
      + '<div class="mob-nav" data-mob>'
      +   '<button class="mob-close" type="button" aria-label="Close menu" data-mob-close>Close ✕</button>'
      +   '<nav aria-label="Mobile">' + navHtml + '</nav>'
      +   '<a class="mob-cta" href="mailto:adam@adamcagle.com">Get in touch →</a>'
      + '</div>';
  }

  function bindScrollShrink() {
    var rail = document.querySelector('[data-rail]');
    var progress = rail && rail.querySelector('.rail-progress');
    if (!rail) return;
    var ticking = false;
    function update() {
      var y = window.scrollY || window.pageYOffset;
      rail.classList.toggle('is-shrunk', y > 24);
      if (progress) {
        var doc = document.documentElement;
        var max = (doc.scrollHeight - window.innerHeight) || 1;
        var pct = Math.max(0, Math.min(100, (y / max) * 100));
        rail.style.setProperty('--scroll-progress', pct + '%');
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  function bindMobile() {
    var open  = document.querySelector('[data-mob-open]');
    var close = document.querySelector('[data-mob-close]');
    var mob   = document.querySelector('[data-mob]');
    if (!open || !mob) return;
    open.addEventListener('click', function () {
      mob.classList.add('open');
      open.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    });
    function shut() {
      mob.classList.remove('open');
      open.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    close && close.addEventListener('click', shut);
    mob.querySelectorAll('.nav-link, .mob-cta').forEach(function (a) {
      a.addEventListener('click', shut);
    });
  }

  function init() {
    var host = document.querySelector('site-shell');
    if (!host) {
      console.warn('[site-shell] no <site-shell> element found in DOM');
      return;
    }
    render(host);
    bindScrollShrink();
    bindMobile();
  }

  if (window.SiteFX) {
    window.SiteFX.register('site-shell', { init: init, owns: ['site-shell', '.rail', '.mob-nav'] });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
