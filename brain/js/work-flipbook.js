/* work-flipbook.js — Hotel Figueroa brand book viewer (ported from Work.html).
   Re-initializable: call WorkFlipbook.init() after content is swapped in. */
(function () {
  const views = [{ type: 'single', files: [62] }];
  for (let f = 63; f < 121; f += 2) views.push({ type: 'spread', files: [f, f + 1] });
  views.push({ type: 'single', files: [121] });
  views.push({ type: 'single', files: [122] });
  const total = views.length;

  let cur = 0, flipping = false, keysBound = false;
  let viewer, spreadEl, counter;

  function src(n) { return `/img/HF/HotelFigueroa%20${n}.jpeg`; }
  function makeImg(n) { const img = document.createElement('img'); img.src = src(n); img.alt = 'Hotel Figueroa Brand Book'; return img; }

  function drawNow() {
    const v = views[cur];
    spreadEl.innerHTML = '';
    if (v.type === 'single') {
      const pg = document.createElement('div'); pg.className = 'hf-pg solo'; pg.appendChild(makeImg(v.files[0])); spreadEl.appendChild(pg);
    } else {
      const left = document.createElement('div'); left.className = 'hf-pg pair'; left.appendChild(makeImg(v.files[0]));
      const spine = document.createElement('div'); spine.className = 'hf-spine';
      const right = document.createElement('div'); right.className = 'hf-pg pair'; right.appendChild(makeImg(v.files[1]));
      spreadEl.appendChild(left); spreadEl.appendChild(spine); spreadEl.appendChild(right);
    }
    const label = cur === 0 ? 'Cover' : cur === total - 1 ? 'Back Cover' : `Spread ${cur} of ${total - 2}`;
    counter.textContent = `${label}  ·  ${cur + 1} / ${total}`;
    [cur - 1, cur + 1].forEach(i => { if (i >= 0 && i < total) views[i].files.forEach(f => { new Image().src = src(f); }); });
  }
  function flipTo(newCur, dir) {
    if (flipping || newCur === cur) return; flipping = true;
    const out = dir > 0 ? -92 : 92; const inFrom = -out; const dur = 280;
    spreadEl.style.transition = `transform ${dur}ms cubic-bezier(.5,0,.75,.2), opacity ${dur}ms ease-in`;
    spreadEl.style.transform = `translateZ(-60px) rotateY(${out}deg)`; spreadEl.style.opacity = '0';
    setTimeout(() => {
      cur = newCur; drawNow();
      spreadEl.style.transition = 'none';
      spreadEl.style.transform = `translateZ(-60px) rotateY(${inFrom}deg)`; spreadEl.style.opacity = '0';
      void spreadEl.offsetWidth;
      spreadEl.style.transition = `transform ${dur}ms cubic-bezier(.25,.8,.5,1), opacity ${dur}ms ease-out`;
      spreadEl.style.transform = 'translateZ(0) rotateY(0deg)'; spreadEl.style.opacity = '1';
      setTimeout(() => { spreadEl.style.transition = ''; flipping = false; }, dur + 20);
    }, dur);
  }
  function openViewer() {
    cur = 0; spreadEl.style.transition = ''; spreadEl.style.transform = ''; spreadEl.style.opacity = '';
    drawNow();
    viewer.classList.add('open'); requestAnimationFrame(() => viewer.classList.add('visible'));
    viewer.setAttribute('aria-hidden', 'false'); document.body.classList.add('lb-open');
  }
  function closeViewer() {
    viewer.classList.remove('open', 'visible'); viewer.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lb-open');
  }
  function step(d) { const n = Math.max(0, Math.min(total - 1, cur + d)); if (n !== cur) flipTo(n, d); }

  function init() {
    const cover = document.getElementById('hf-cover');
    viewer = document.getElementById('hf-viewer');
    if (!cover || !viewer) return;
    spreadEl = document.getElementById('hf-spread'); counter = document.getElementById('hf-counter');
    cover.addEventListener('click', openViewer);
    viewer.querySelector('.hf-close-btn').addEventListener('click', closeViewer);
    viewer.querySelector('.hf-prev').addEventListener('click', e => { e.stopPropagation(); step(-1); });
    viewer.querySelector('.hf-next').addEventListener('click', e => { e.stopPropagation(); step(1); });
    viewer.addEventListener('click', e => { if (e.target === viewer) closeViewer(); });
    if (!keysBound) {
      keysBound = true;
      document.addEventListener('keydown', e => {
        const v = document.getElementById('hf-viewer');
        if (!v || !v.classList.contains('open')) return;
        if (e.key === 'Escape') closeViewer(); else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
      });
    }
  }

  window.WorkFlipbook = { init };
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
