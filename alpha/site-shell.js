// site-shell.js (ALPHA)
// Nav: Resume, Product & Campaign Work, AI Writing Systems, Brand Voice Systems, Contact.
// Books moved to footer as "Selected Writing".

(function () {
  const NAV = [
    { key: 'resume',      href: '/alpha/Resume.html',     label: 'Resume'                  },
    { key: 'work',        href: '/alpha/Work.html',        label: 'Product & Campaign Work' },
    { key: 'ai-writing',  href: '/alpha/AIWriting.html',   label: 'AI Writing Systems'      },
    { key: 'brand-voice', href: '/alpha/BrandVoice.html',  label: 'Brand Voice Systems'     },
    { key: 'contact',     href: '/alpha/Contact.html',     label: 'Contact'                 }
  ];
  const EMAIL    = 'adamrcagle@gmail.com';
  const LINKEDIN = 'https://www.linkedin.com/in/adam-r-cagle-3b723a3/';

  function navLinks(active) {
    return NAV.map((i) => {
      const cls = 'nav-link' + (i.key === active ? ' is-active' : '');
      return '<a href="' + i.href + '" class="' + cls + '" data-cursor="hover">' + i.label + '</a>';
    }).join('');
  }

  function inject(host, html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    host.replaceWith(...tpl.content.children);
  }

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute('active') || '';
      const html =
'<header class="rail" data-active="' + active + '">' +
  '<a href="/alpha/" class="rail-brand" data-cursor="hover">Adam R. Cagle</a>' +
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
  }

  const LI_ICON =
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
      '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>' +
    '</svg>';

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      inject(this,
'<footer class="foot">' +
  '<div class="foot-inner">' +

    '<div class="foot-top">' +

      '<div class="foot-col foot-col--brand">' +
        '<a href="/alpha/" class="foot-wordmark">Adam R. Cagle</a>' +
        '<p class="foot-tagline">Senior Copywriter &amp; AI Writing Systems</p>' +
        '<div class="foot-loc-row">' +
          '<span class="foot-loc">Bend, Oregon</span>' +
          '<span class="foot-sep">&middot;</span>' +
          '<span class="foot-avail">Remote &bull; Worldwide</span>' +
        '</div>' +
      '</div>' +

      '<div class="foot-col foot-col--nav">' +
        '<div class="foot-col-head">// Work</div>' +
        '<nav class="foot-nav-links">' +
          '<a href="/alpha/Resume.html">Resume</a>' +
          '<a href="/alpha/Work.html">Product &amp; Campaign Work</a>' +
          '<a href="/alpha/AIWriting.html">AI Writing Systems</a>' +
          '<a href="/alpha/BrandVoice.html">Brand Voice Systems</a>' +
          '<a href="/alpha/Books.html">Selected Writing</a>' +
        '</nav>' +
      '</div>' +

      '<div class="foot-col foot-col--contact">' +
        '<div class="foot-col-head">// Get in touch</div>' +
        '<a href="mailto:' + EMAIL + '" class="foot-email">' + EMAIL + '</a>' +
        '<a href="' + LINKEDIN + '" class="foot-li-btn" target="_blank" rel="noopener">' +
          LI_ICON +
          '<span>LinkedIn</span>' +
        '</a>' +
        '<a href="/alpha/Contact.html" class="foot-contact-link">Contact page &nbsp;&rarr;</a>' +
      '</div>' +

    '</div>' +

    '<div class="foot-bottom">' +
      '<span class="foot-copy">&copy; 2026 Adam R. Cagle. All rights reserved.</span>' +
      '<em class="foot-craft">Made with craft &amp; intent.</em>' +
    '</div>' +

  '</div>' +
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
