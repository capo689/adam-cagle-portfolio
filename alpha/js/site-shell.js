// js/site-shell.js
// <site-header> custom element. Renders the rail nav, theme toggle, mobile
// hamburger overlay, and scroll-shrink/progress hairline. Reads the active
// page from its `active` attribute (resume | portfolio | agents | books | studio).
//
// <site-footer> custom element renders the centered ©/email line.

(function () {
  const NAV = [
    { key: 'resume',    href: 'index.html',     label: 'Résumé' },
    { key: 'portfolio', href: 'Portfolio.html', label: 'Portfolio' },
    { key: 'agents',    href: 'Agents.html',    label: 'AI Agents' },
    { key: 'books',     href: 'Books.html',     label: 'Books' }
  ];
  const EMAIL = 'adamrcagle@gmail.com';

  function navLinks(active) {
    return NAV.map(function (i) {
      const cls = 'nav-link' + (i.key === active ? ' is-active' : '');
      return '<a href="' + i.href + '" class="' + cls + '">' + i.label + '</a>';
    }).join('');
  }

  // Replace the placeholder element with the rendered DOM.
  function inject(host, html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    host.replaceWith.apply(host, tpl.content.children);
  }

  // ─── HEADER ────────────────────────────────────────────────────────
  class SiteHeader extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute('active') || '';
      const html =
        '<header class="rail" data-active="' + active + '">' +
          '<a href="index.html" class="rail-brand">Adam R. Cagle</a>' +
          '<nav class="rail-nav">' + navLinks(active) + '</nav>' +
          '<div class="rail-right">' +
            '<button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">' +
              '<span class="toggle-icon">&#x25D0;</span>' +
              '<span class="toggle-pill"></span>' +
            '</button>' +
            '<a class="rail-cta" href="mailto:' + EMAIL + '">' +
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

      bindHamburger();
      bindRailScroll();
    }
  }

  function bindHamburger() {
    const hb = document.getElementById('hamburger');
    const mn = document.getElementById('mob-nav');
    const cl = document.getElementById('mob-close');
    if (!hb || !mn) return;

    function open()  { mn.classList.add('open');    document.body.style.overflow = 'hidden'; }
    function close() { mn.classList.remove('open'); document.body.style.overflow = ''; }

    hb.addEventListener('click', open);
    if (cl) cl.addEventListener('click', close);
    mn.addEventListener('click', function (e) { if (e.target === mn) close(); });
    mn.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', close);
    });
  }

  function bindRailScroll() {
    const rail = document.querySelector('.rail');
    if (!rail) return;

    function update() {
      const y     = window.pageYOffset || document.documentElement.scrollTop || 0;
      const max   = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      const ratio = Math.max(0, Math.min(1, y / max));
      rail.classList.toggle('is-shrunk', y > 80);
      rail.style.setProperty('--scroll-progress', (ratio * 100).toFixed(2) + '%');
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  // ─── FOOTER ────────────────────────────────────────────────────────
  class SiteFooter extends HTMLElement {
    connectedCallback() {
      const year = new Date().getFullYear();
      const html =
        '<footer class="foot">' +
          '<div class="left">Adam R. Cagle</div>' +
          '<div class="center">&copy; ' + year + '</div>' +
          '<div class="right"><a href="mailto:' + EMAIL + '">' + EMAIL + '</a></div>' +
        '</footer>';
      inject(this, html);
    }
  }

  if (!customElements.get('site-header')) customElements.define('site-header', SiteHeader);
  if (!customElements.get('site-footer')) customElements.define('site-footer', SiteFooter);
})();
