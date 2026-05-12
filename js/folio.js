// folio.js — Shared folio reader behavior for /writing-samples/* pages.
// Reads TOTAL pages from the count of .folio-page elements. Adds progress
// rail dots, mobile chips, prev/next controls, and IntersectionObserver-driven
// active-page tracking.

(function () {
  const pages = Array.from(document.querySelectorAll('.folio-page'));
  if (!pages.length) return;
  const TOTAL = pages.length;

  const rail    = document.getElementById('progress-rail');
  const chips   = document.getElementById('mobile-chips');
  const current = document.getElementById('rb-current');
  const total   = document.getElementById('rb-total');
  const prevBtn = document.getElementById('rb-prev');
  const nextBtn = document.getElementById('rb-next');

  let activePage = 1;

  if (total) total.textContent = TOTAL;

  // Build rail dots
  if (rail) {
    for (let i = 1; i <= TOTAL; i++) {
      const b = document.createElement('button');
      b.className = 'pr-dot';
      b.type = 'button';
      b.dataset.target = String(i);
      b.setAttribute('aria-label', 'Go to folio page ' + i);
      b.innerHTML = '<span class="marker"></span><span>' + String(i).padStart(2, '0') + '</span>';
      b.addEventListener('click', function () { scrollToPage(i); });
      rail.appendChild(b);
    }
  }

  // Build mobile chips
  if (chips) {
    for (let i = 1; i <= TOTAL; i++) {
      const b = document.createElement('button');
      b.className = 'mc-chip';
      b.type = 'button';
      b.dataset.target = String(i);
      b.textContent = 'Folio ' + i;
      b.addEventListener('click', function () { scrollToPage(i); });
      chips.appendChild(b);
    }
  }

  function setActive(n) {
    if (n === activePage) return;
    activePage = n;
    if (current) current.textContent = n;
    if (prevBtn) prevBtn.disabled = (n <= 1);
    if (nextBtn) nextBtn.disabled = (n >= TOTAL);
    document.querySelectorAll('.pr-dot').forEach(function (d) {
      d.classList.toggle('is-active', Number(d.dataset.target) === n);
    });
    document.querySelectorAll('.mc-chip').forEach(function (d) {
      d.classList.toggle('is-active', Number(d.dataset.target) === n);
    });
    pages.forEach(function (p) {
      p.classList.toggle('is-active', Number(p.dataset.page) === n);
    });
  }

  function scrollToPage(n) {
    const el = document.getElementById('folio-' + n);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.pageYOffset - 110;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { if (activePage > 1) scrollToPage(activePage - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { if (activePage < TOTAL) scrollToPage(activePage + 1); });

  // Keyboard navigation: left/right arrows when reader is in view
  document.addEventListener('keydown', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowRight' && activePage < TOTAL) { e.preventDefault(); scrollToPage(activePage + 1); }
    if (e.key === 'ArrowLeft'  && activePage > 1)     { e.preventDefault(); scrollToPage(activePage - 1); }
  });

  // IntersectionObserver: pick most-visible folio
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
})();
