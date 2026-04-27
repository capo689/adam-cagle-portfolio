// site-shell.js (ALPHA)
// Editorial nav rebuild: brand + running head, numbered Roman/italic stacked
// links, status pill, CTA, theme toggle. Scroll-shrink and progress hairline.

(function () {
  const NAV = [
    { key: 'resume',    href: 'index.html',     label: 'Résumé',    italic: 'résumé'    },
    { key: 'portfolio', href: 'Portfolio.html', label: 'Portfolio', italic: 'portfolio' },
    { key: 'agents',    href: 'Agents.html',    label: 'Agents',    italic: 'agents'    },
    { key: 'books',     href: 'Books.html',     label: 'Books',     italic: 'books'     }
  ];
  const EMAIL = 'adamrcagle@gmail.com';

  function navLinks(active, mobile) {
    return NAV.map((i, n) => {
      const num = String(n + 1).padStart(2, '0');
      const isActive = i.key === active;
      const cls = 'nav-link' + (isActive ? ' is-active' : '');
      return (
        '<a href="' + i.href + '" class="' + cls + '"' +
        (mobile ? '' : ' data-cursor="hover"') + '>' +
          (mobile ? '' : '<span class="nav-link__num">' + num + '</span>') +
          '<span class="nav-link__stack">' +
            '<span class="nav-link__roman">' + i.label + '<span class="dot">.</span></span>' +
            '<span class="nav-link__italic">' + i.italic + '<span class="dot">.</span></span>' +
          '</span>' +
        '</a>'
      );
    }).join('');
  }

  function brandHTML(active) {
    const item = NAV.find((i) => i.key === active);
    const head = item
      ? '<span class="rail-runninghead"><span class="arrow">&#x25B8;</span><em>' + item.italic + '</em><span class="dot">.</span></span>'
      : '';
    return (
      '<a href="index.html" class="rail-brand" data-cursor="hover">' +
        '<span class="rail-brand__name">Adam R. Cagle<span class="dot">.</span></span>' +
        head +
      '</a>'
    );
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
  '<div class="rail-left">' + brandHTML(active) + '</div>' +
  '<nav class="rail-nav">' + navLinks(active, false) + '</nav>' +
  '<div class="rail-right">' +
    '<span class="rail-status" aria-label="Available for work"><i></i>Available</span>' +
    '<a class="rail-cta" href="mailto:' + EMAIL + '" data-cursor="email" data-cursor-text="Hello">' +
      'Get in touch <span class="arrow">&rarr;</span>' +
    '</a>' +
    '<button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">' +
      '<span class="toggle-icon">&#x25D0;</span><span class="toggle-pill"></span>' +
    '</button>' +
    '<button class="hamburger" id="hamburger" aria-label="Open menu">' +
      '<span></span><span></span><span></span>' +
    '</button>' +
  '</div>' +
  '<span class="rail-progress" aria-hidden="true"></span>' +
'</header>' +
'<div class="mob-nav" id="mob-nav">' +
  '<button class="mob-close" id="mob-close" aria-label="Close menu">&times; close</button>' +
  '<nav>' + navLinks(active, true) + '</nav>' +
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
        const y       = window.pageYOffset || document.documentElement.scrollTop || 0;
        const max     = (document.documentElement.scrollHeight - window.innerHeight) || 1;
        const ratio   = Math.max(0, Math.min(1, y / max));
        const shrunk  = y > 80;
        rail.classList.toggle('is-shrunk', shrunk);
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
})();
