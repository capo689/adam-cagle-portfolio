// site-shell.js (ALPHA)
// Nav: Resume | Portfolio (mega) | AI Systems | Writing Samples | Contact

(function () {
  const NAV = [
    { key: 'resume',           href: '/alpha/Resume.html',         label: 'Resume'          },
    { key: 'portfolio',        href: null,                          label: 'Portfolio',  hasMega: true },
    { key: 'ai-writing',       href: '/alpha/AIWriting.html',       label: 'AI Systems'      },
    { key: 'writing-samples',  href: '/alpha/WritingSamples.html',  label: 'Writing Samples' },
    { key: 'contact',          href: '/alpha/Contact.html',         label: 'Contact'         }
  ];

  const PORTFOLIO = [
    {
      href:    '/alpha/Work.html',
      img:     'images/poolsup.png',
      imgAlt:  'Product & Campaign Work · selected campaigns by Adam R. Cagle',
      eyebrow: 'Campaigns · Product Storytelling · Launches',
      title:   'Product &amp; Campaign Work',
      desc:    'Selected work across tech, hospitality, gaming, and consumer brands. The line, the strategy, and the system behind it.'
    },
    {
      href:    '/alpha/BrandVoice.html',
      img:     'img/HF/HotelFigueroa%2062.jpeg',
      imgAlt:  'Brand Voice Systems · Hotel Figueroa brand book by Agency689',
      eyebrow: 'Brand Books · Voice Architecture · Editorial Governance',
      title:   'Brand Voice Systems',
      desc:    'How voice gets built, documented, governed, and extended across teams, channels, and AI workflows.'
    }
  ];

  const EMAIL    = 'adamrcagle@gmail.com';
  const LINKEDIN = 'https://www.linkedin.com/in/adam-r-cagle-3b723a3/';

  function isPortfolioActive(active) {
    return active === 'work' || active === 'brand-voice' || active === 'portfolio';
  }

  function megaCards() {
    return PORTFOLIO.map(function (p) {
      return (
        '<a href="' + p.href + '" class="mega-card" data-cursor="hover">' +
          '<div class="mega-img"><img src="' + p.img + '" alt="' + p.imgAlt + '" loading="lazy"></div>' +
          '<div class="mega-eyebrow">' + p.eyebrow + '</div>' +
          '<div class="mega-title">' + p.title + '</div>' +
          '<div class="mega-desc">' + p.desc + '</div>' +
        '</a>'
      );
    }).join('');
  }

  function desktopNav(active) {
    var portActive = isPortfolioActive(active);
    return NAV.map(function (i) {
      if (i.hasMega) {
        return (
          '<div class="nav-mega-wrap">' +
            '<button class="nav-mega-btn' + (portActive ? ' is-active' : '') + '" ' +
                    'id="mega-trigger" aria-expanded="false" aria-haspopup="true">' +
              'Portfolio <span class="mega-caret" aria-hidden="true">&#9660;</span>' +
            '</button>' +
            '<div class="mega-menu" id="mega-portfolio" role="region" aria-label="Portfolio">' +
              '<div class="mega-inner">' + megaCards() + '</div>' +
            '</div>' +
          '</div>'
        );
      }
      var cls = 'nav-link' + (i.key === active ? ' is-active' : '');
      return '<a href="' + i.href + '" class="' + cls + '" data-cursor="hover">' + i.label + '</a>';
    }).join('');
  }

  function mobileNav(active) {
    var portActive = isPortfolioActive(active);
    return NAV.map(function (i) {
      if (i.hasMega) {
        var mobCards = PORTFOLIO.map(function (p) {
          return (
            '<a href="' + p.href + '" class="mob-mega-link">' +
              '<div class="mob-mega-title">' + p.title + '</div>' +
              '<div class="mob-mega-sub">' + p.eyebrow + '</div>' +
            '</a>'
          );
        }).join('');
        return (
          '<div class="mob-mega-wrap">' +
            '<button class="mob-mega-btn' + (portActive ? ' is-active' : '') + '" id="mob-mega-btn">' +
              'Portfolio <span class="mega-caret" aria-hidden="true">&#9660;</span>' +
            '</button>' +
            '<div class="mob-mega-panel" id="mob-mega-panel">' + mobCards + '</div>' +
          '</div>'
        );
      }
      var cls = 'nav-link' + (i.key === active ? ' is-active' : '');
      return '<a href="' + i.href + '" class="' + cls + '">' + i.label + '</a>';
    }).join('');
  }

  function inject(host, html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    host.replaceWith(...tpl.content.children);
  }

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      var active = this.getAttribute('active') || '';
      var html =
'<header class="rail" data-active="' + active + '">' +
  '<a href="/alpha/" class="rail-brand" data-cursor="hover">Adam R. Cagle</a>' +
  '<nav class="rail-nav">' + desktopNav(active) + '</nav>' +
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
  '<nav>' + mobileNav(active) + '</nav>' +
  '<a class="mob-cta" href="mailto:' + EMAIL + '">Get in touch &rarr;</a>' +
'</div>';

      inject(this, html);

      // ── Hamburger / mobile menu ──
      var hb = document.getElementById('hamburger');
      var mn = document.getElementById('mob-nav');
      var cl = document.getElementById('mob-close');
      if (hb && mn) {
        var closeMenu = function () { mn.classList.remove('open'); document.body.style.overflow = ''; };
        hb.addEventListener('click', function () { mn.classList.add('open'); document.body.style.overflow = 'hidden'; });
        if (cl) cl.addEventListener('click', closeMenu);
        mn.addEventListener('click', function (e) { if (e.target === mn) closeMenu(); });
        mn.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
      }

      // ── Desktop mega menu: hover open/close ──
      var trigger = document.getElementById('mega-trigger');
      var menu    = document.getElementById('mega-portfolio');
      if (trigger && menu) {
        var hideTimer = null;
        var openMega = function () {
          clearTimeout(hideTimer);
          trigger.setAttribute('aria-expanded', 'true');
          menu.classList.add('open');
        };
        var closeMega = function () {
          hideTimer = setTimeout(function () {
            trigger.setAttribute('aria-expanded', 'false');
            menu.classList.remove('open');
          }, 120);
        };
        trigger.addEventListener('mouseenter', openMega);
        trigger.addEventListener('mouseleave', closeMega);
        menu.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
        menu.addEventListener('mouseleave', closeMega);
        // keyboard accessibility
        trigger.addEventListener('focus', openMega);
        trigger.addEventListener('blur', closeMega);
      }

      // ── Mobile portfolio expand ──
      var mobBtn   = document.getElementById('mob-mega-btn');
      var mobPanel = document.getElementById('mob-mega-panel');
      if (mobBtn && mobPanel) {
        mobBtn.addEventListener('click', function () {
          var open = mobPanel.classList.toggle('open');
          var caret = mobBtn.querySelector('.mega-caret');
          if (caret) caret.style.transform = open ? 'rotate(180deg)' : '';
        });
      }

      // ── Scroll shrink + progress ──
      var rail = document.querySelector('.rail');
      if (!rail) return;
      function update() {
        var y     = window.pageYOffset || document.documentElement.scrollTop || 0;
        var max   = (document.documentElement.scrollHeight - window.innerHeight) || 1;
        var ratio = Math.max(0, Math.min(1, y / max));
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
          '<a href="/alpha/AIWriting.html">AI Systems</a>' +
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
