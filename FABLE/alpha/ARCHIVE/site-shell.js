// site-shell.js — header/footer web components for adamcagle.com
// Renders to light DOM so existing CSS still applies.
// Each page declares its current section: <site-header active="agents"></site-header>

(function () {
  const NAV = [
    { key: 'resume',    href: 'index.html',     label: 'Résumé'    },
    { key: 'portfolio', href: 'Portfolio.html', label: 'Portfolio' },
    { key: 'agents',    href: 'Agents.html',    label: 'Agents'    },
    { key: 'books',     href: 'Books.html',     label: 'Books'     },
  ];
  const EMAIL = 'adamrcagle@gmail.com';

  function navLinks(active) {
    return NAV.map(i =>
      `<a href="${i.href}"${i.key === active ? ' class="active"' : ''}>${i.label}</a>`
    ).join('');
  }

  function inject(host, html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    host.replaceWith(...[...tpl.content.children]);
  }

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute('active') || '';
      const html = `
<header class="rail">
  <div class="left"><a href="index.html" class="brand">Adam R. Cagle</a></div>
  <nav>${navLinks(active)}</nav>
  <div class="right">
    <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme"><span class="toggle-icon">◐</span><span class="toggle-pill"></span></button>
    <a href="mailto:${EMAIL}" class="rail-email">${EMAIL}</a>
    <button class="hamburger" id="hamburger" aria-label="Open menu"><span></span><span></span><span></span></button>
  </div>
</header>
<div class="mob-nav" id="mob-nav">
  <button class="mob-close" id="mob-close" aria-label="Close menu">✕ close</button>
  <nav>${navLinks(active)}</nav>
</div>`;
      inject(this, html);

      const hb = document.getElementById('hamburger');
      const mn = document.getElementById('mob-nav');
      const cl = document.getElementById('mob-close');
      if (!hb || !mn) return;
      const close = () => { mn.classList.remove('open'); document.body.style.overflow = ''; };
      hb.addEventListener('click', () => { mn.classList.add('open'); document.body.style.overflow = 'hidden'; });
      if (cl) cl.addEventListener('click', close);
      mn.addEventListener('click', e => { if (e.target === mn) close(); });
      mn.querySelectorAll('nav a').forEach(a => a.addEventListener('click', close));
    }
  }

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      inject(this, `
<footer class="foot">
  <div class="left">Adam R. Cagle</div>
  <div class="center">© 2026</div>
  <div class="right"><a href="mailto:${EMAIL}">${EMAIL}</a></div>
</footer>`);
    }
  }

  customElements.define('site-header', SiteHeader);
  customElements.define('site-footer', SiteFooter);
})();
