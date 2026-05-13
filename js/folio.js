// folio.js — Reader-dock + progress bar for /writing-samples/* pages.
// Pages are .folio-page (data-page="N"). Builds numbered dots, wires prev/next,
// tracks active page via IntersectionObserver, slides the dock in past the hero,
// and fills the thin top progress bar from scroll position.

(function () {
  const pages = Array.from(document.querySelectorAll('.folio-page'));
  if (!pages.length) return;
  const TOTAL = pages.length;

  const dock      = document.getElementById('reader-dock');
  const dockPages = document.getElementById('dock-pages');
  const dockPrev  = document.getElementById('dock-prev');
  const dockNext  = document.getElementById('dock-next');
  const rpbFill   = document.querySelector('.reader-progress-bar .rpb-fill');

  let activePage = 1;

  // Build numbered dots
  if (dockPages) {
    for (let i = 1; i <= TOTAL; i++) {
      const b = document.createElement('button');
      b.className = 'dock-dot';
      b.type = 'button';
      b.dataset.target = String(i);
      b.setAttribute('aria-label', 'Go to folio ' + i);
      b.textContent = String(i).padStart(2, '0');
      b.addEventListener('click', function () { scrollToPage(i); });
      dockPages.appendChild(b);
    }
  }

  function setActive(n) {
    if (n === activePage) return;
    activePage = n;
    if (dockPrev) dockPrev.disabled = (n <= 1);
    if (dockNext) dockNext.disabled = (n >= TOTAL);
    if (dockPages) {
      dockPages.querySelectorAll('.dock-dot').forEach(function (d) {
        d.classList.toggle('is-active', Number(d.dataset.target) === n);
      });
    }
    pages.forEach(function (p) {
      p.classList.toggle('is-active', Number(p.dataset.page) === n);
    });
  }

  function scrollToPage(n) {
    const el = document.getElementById('folio-' + n);
    if (!el) return;
    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
    const top = el.getBoundingClientRect().top + window.pageYOffset - (headerH + 24);
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  if (dockPrev) dockPrev.addEventListener('click', function () {
    if (activePage > 1) scrollToPage(activePage - 1);
  });
  if (dockNext) dockNext.addEventListener('click', function () {
    if (activePage < TOTAL) scrollToPage(activePage + 1);
  });

  // Keyboard navigation (←/→ outside form fields)
  document.addEventListener('keydown', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowRight' && activePage < TOTAL) { e.preventDefault(); scrollToPage(activePage + 1); }
    if (e.key === 'ArrowLeft'  && activePage > 1)     { e.preventDefault(); scrollToPage(activePage - 1); }
  });

  // Pick most-visible folio for the active state
  const visibility = new Map();
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      visibility.set(Number(e.target.dataset.page), e.intersectionRatio);
    });
    let best = 1, bestRatio = -1;
    visibility.forEach(function (ratio, page) {
      if (ratio > bestRatio) { bestRatio = ratio; best = page; }
    });
    if (bestRatio > 0.02) setActive(best);
  }, { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-15% 0px -25% 0px' });

  pages.forEach(function (p) { io.observe(p); });
  setActive(1);

  // Dock visibility + reading progress bar
  // Show the dock once the first folio is in view (i.e., user has scrolled past the hero).
  let visible = false;
  function getShowThreshold() {
    const first = document.getElementById('folio-1');
    if (!first) return 240;
    return first.getBoundingClientRect().top + window.pageYOffset - window.innerHeight * 0.7;
  }

  function updateChrome() {
    const y   = window.scrollY || window.pageYOffset || 0;
    const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    const ratio = Math.max(0, Math.min(1, y / max));
    if (rpbFill) rpbFill.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';

    const shouldShow = y > getShowThreshold();
    if (shouldShow !== visible) {
      visible = shouldShow;
      if (dock) dock.classList.toggle('is-visible', shouldShow);
    }
  }

  window.addEventListener('scroll', updateChrome, { passive: true });
  window.addEventListener('resize', updateChrome);
  updateChrome();
})();
