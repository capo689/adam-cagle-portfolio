// site-shell.js (ALPHA)
// Minimal editorial nav: brand, nav links, CTA, theme toggle.
// Scroll-shrink + accent progress hairline at bottom edge.

(function () {
  const NAV = [
    { key: 'resume',    href: 'index.html',     label: 'Résumé'    },
    { key: 'portfolio', href: 'Portfolio.html', label: 'Portfolio' },
    { key: 'agents',    href: 'Agents.html',    label: 'AI Agents' },
    { key: 'books',     href: 'Books.html',     label: 'Books'     }
  ];
  const EMAIL = 'adamrcagle@gmail.com';

  function navLinks(active) {
    return NAV.map((i) => {
      const cls = 'nav-link' + (i.key === active ? ' is-active' : '');
      return '<a href="' + i.href + '" class="' + cls + '" data-cursor="hover">' + i.label + '</a>';
    }).join('');
  }

  function inject(host, html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    host.replaceWith(...[...tpl.content.children]);
  }

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute('active') || '';
      const html =
'<header class="rail" data-active="' + active + '">' +
  '<a href="index.html" class="rail-brand" data-cursor="hover">Adam R. Cagle</a>' +
  '<nav class="rail-nav">' + navLinks(active) + '</nav>' +
  '<div class="rail-right">' +
    '<button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">' +
      '<span class="toggle-icon">&#x25D0;</span><span class="toggle-pill"></span>' +
    '</button>' +
    '<a class="rail-cta" href="mailto:' + EMAIL + '" data-cursor="email" data-cursor-text="Hello">' +
      'Get in touch <span class="arrow">&rarr;</span>' +
    '</a>' +
    '<button class="hamburger" id="hamburger" aria-label="Open menu">' +
      '<span></span><span></span><span></span>' +
    '</button>' +
  '</div>' +
  '<span class="rail-progress" aria-hidden="true"></span>' +
'</header>' +
'<div class="mob-nav" id="mob-nav">' +
  '<button class="mob-close" id="mob-close" aria-label="Close menu">&times; close</button>' +
  '<nav>' + navLinks(active) + '</nav>' +
  '<a class="mob-cta" href="mailto:' + EMAIL + '">Get in touch &rarr;</a>' +
'</div>';
      inject(this, html);

      // Hamburger
      const hb = document.getElementById('hamburger');
      const mn = document.getElementById('mob-nav');
      const cl = document.getElementById('mob-close');
      if (hb && mn) {
        const close = () => { mn.classList.remove('open'); document.body.style.overflow = ''; };
        hb.addEventListener('click', () => { mn.classList.add('open'); document.body.style.overflow = 'hidden'; });
        if (cl) cl.addEventListener('click', close);
        mn.addEventListener('click', (e) => { if (e.target === mn) close(); });
        mn.querySelectorAll('nav a').forEach((a) => a.addEventListener('click', close));
      }

      // Scroll-shrink + progress hairline
      const rail = document.querySelector('.rail');
      if (!rail) return;

      function update() {
        const y      = window.pageYOffset || document.documentElement.scrollTop || 0;
        const max    = (document.documentElement.scrollHeight - window.innerHeight) || 1;
        const ratio  = Math.max(0, Math.min(1, y / max));
        rail.classList.toggle('is-shrunk', y > 80);
        rail.style.setProperty('--scroll-progress', (ratio * 100).toFixed(2) + '%');
      }
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
    }
  }

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      inject(this,
'<footer class="foot">' +
  '<div class="left">Adam R. Cagle</div>' +
  '<div class="center">&copy; 2026</div>' +
  '<div class="right"><a href="mailto:' + EMAIL + '">' + EMAIL + '</a></div>' +
'</footer>');
    }
  }

  customElements.define('site-header', SiteHeader);
  customElements.define('site-footer', SiteFooter);

  // Flag internal navigation so the preloader skips on arrival
  document.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.button !== 0 && e.button !== undefined) return;
    var a = e.target.closest('a');
    if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    try {
      var url = new URL(a.href, window.location.href);
      if (url.origin === window.location.origin && url.href !== window.location.href) {
        sessionStorage.setItem('site-internal-nav', 'true');
      }
    } catch (err) {}
  });
})();
