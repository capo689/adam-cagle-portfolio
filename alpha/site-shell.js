// site-shell.js (ALPHA)
// Nav: Resume, Product & Campaign Work, AI Writing Systems, Brand Voice Systems, Contact.
// Books moved to footer as "Selected Writing".

(function () {
  const NAV = [
    { key: 'resume',      href: 'Resume.html',     label: 'Resume'                  },
    { key: 'work',        href: 'Work.html',        label: 'Product & Campaign Work' },
    { key: 'ai-writing',  href: 'AIWriting.html',   label: 'AI Writing Systems'      },
    { key: 'brand-voice', href: 'BrandVoice.html',  label: 'Brand Voice Systems'     },
    { key: 'contact',     href: 'Contact.html',     label: 'Contact'                 }
  ];
  const EMAIL   = 'adamrcagle@gmail.com';
  const LINKEDIN = 'https://www.linkedin.com/in/adam-r-cagle-3b723a3/';

  function navLinks(active) {
    return NAV.map(function (i) {
      var cls = 'nav-link' + (i.key === active ? ' is-active' : '');
      return '<a href="' + i.href + '" class="' + cls + '" data-cursor="hover">' + i.label + '</a>';
    }).join('');
  }

  function inject(host, html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    host.replaceWith.apply(host, Array.from(tpl.content.children));
  }

  var SiteHeader = (function (_super) {
    function SiteHeader() { return _super !== null && _super.apply(this, arguments) || this; }
    SiteHeader.prototype.connectedCallback = function () {
      var active = this.getAttribute('active') || '';
      var html =
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

      var hb = document.getElementById('hamburger');
      var mn = document.getElementById('mob-nav');
      var cl = document.getElementById('mob-close');
      if (hb && mn) {
        var close = function () { mn.classList.remove('open'); document.body.style.overflow = ''; };
        hb.addEventListener('click', function () { mn.classList.add('open'); document.body.style.overflow = 'hidden'; });
        if (cl) cl.addEventListener('click', close);
        mn.addEventListener('click', function (e) { if (e.target === mn) close(); });
        mn.querySelectorAll('nav a').forEach(function (a) { a.addEventListener('click', close); });
      }

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
    };
    return SiteHeader;
  }(HTMLElement));

  var SiteFooter = (function (_super) {
    function SiteFooter() { return _super !== null && _super.apply(this, arguments) || this; }
    SiteFooter.prototype.connectedCallback = function () {
      inject(this,
'<footer class="foot">' +
  '<div class="foot-brand">' +
    '<div class="foot-name">Adam R. Cagle</div>' +
    '<div class="foot-loc">Bend, Oregon &middot; <a href="mailto:' + EMAIL + '">' + EMAIL + '</a></div>' +
    '<div class="foot-social"><a href="' + LINKEDIN + '" target="_blank" rel="noopener">LinkedIn</a> &middot; <span>&copy; 2026</span></div>' +
  '</div>' +
  '<nav class="foot-nav">' +
    '<a href="Resume.html">Resume</a>' +
    '<a href="Work.html">Product &amp; Campaign Work</a>' +
    '<a href="AIWriting.html">AI Writing Systems</a>' +
    '<a href="BrandVoice.html">Brand Voice Systems</a>' +
    '<a href="Books.html">Selected Writing</a>' +
    '<a href="Contact.html">Contact</a>' +
    '<a href="mailto:' + EMAIL + '">Email</a>' +
    '<a href="' + LINKEDIN + '" target="_blank" rel="noopener">LinkedIn</a>' +
  '</nav>' +
'</footer>');
    };
    return SiteFooter;
  }(HTMLElement));

  customElements.define('site-header', SiteHeader);
  customElements.define('site-footer', SiteFooter);

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
