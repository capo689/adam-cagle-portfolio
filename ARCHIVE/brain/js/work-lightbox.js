// work-lightbox.js — cinematic ad lightbox (ported from Work.html).
// Re-initializable: call WorkLightbox.init() after content is swapped in.
// Bails silently if GSAP failed to load.

(function () {
  if (typeof gsap === 'undefined') { window.WorkLightbox = { init: function () {} }; return; }

  const galleries = {
    traveler: [
      { src: 'img/ads/traveler-road.webp',             hl: 'The Road.',                     meta: 'Escape Mk III · 25 Years' },
      { src: 'img/ads/traveler-sonic-bloom.webp',      hl: 'Sonic Bloom.',                  meta: 'Redlands Concert · Forest' },
      { src: 'img/ads/traveler-jungle.webp',           hl: 'Hey Jungle, Welcome to Me.',    meta: 'Vaibrant Electric · Tropical' },
      { src: 'img/ads/traveler-greatness.jpg',         hl: 'Next Stop, Greatness.',         meta: 'Ultra-Light · Subway' },
      { src: 'img/ads/traveler-force.webp',            hl: 'A Force of Nature.',            meta: 'Vaibrant Teal Burst · Tempest' },
      { src: 'img/ads/traveler-flying-solo.webp',      hl: 'Flying Solo.',                  meta: 'Ultra-Light · Cockpit' },
      { src: 'img/ads/traveler-endless-strummer.webp', hl: 'Endless Strummer.',             meta: 'Redlands Mini · Surf' }
    ],
    sunset: [
      { src: 'img/ads/sunset-legendary-nights.webp',   hl: 'Yes, that beautiful.',                                  meta: 'Sunset Marquis' },
      { src: 'img/ads/sunset-yes-that-beautiful.jpg',  hl: 'Legendary Nights Begin at Sunset.',                    meta: 'Sunset Marquis' },
      { src: 'img/ads/ACM-Awards-2025.jpg',            hl: "Sure, it's California, but it's the southern part.",   meta: 'ACM Awards Guide' },
      { src: 'img/ads/SMBrochure.jpg',                 hl: 'Unique. Even by Hollywood standards.',                 meta: 'GDS One-Sheet' }
    ],
    killer: [
      { src: 'img/ads/killer-sniper.webp?v=2026',  hl: 'Warrior.', meta: 'Killer NIC K1' },
      { src: 'img/ads/killer-mage.webp?v=2026',    hl: 'Mage.',    meta: 'Killer NIC K1' },
      { src: 'img/ads/killer-warrior.webp?v=2026', hl: 'Sniper.',  meta: 'Killer NIC K1' }
    ],
    filekeepers: [
      { src: 'img/ads/FileKeepers_SPACE1.jpg',  hl: 'Space.', meta: 'FileKeepers · Room 1' },
      { src: 'img/ads/FileKeepers_SPACE12.jpg', hl: 'Space.', meta: 'FileKeepers · Room 2' },
      { src: 'img/ads/FileKeepers_SPACE13.jpg', hl: 'Space.', meta: 'FileKeepers · Room 3' },
      { src: 'img/ads/FileKeepers_SPACE14.jpg', hl: 'Space.', meta: 'FileKeepers · Room 4' }
    ],
    navis: [
      { src: 'img/ads/navis-grm.jpg',           hl: 'GRM.',                                            meta: 'Guest Relationship Management' },
      { src: 'img/ads/navis-mightier.jpg',      hl: 'The phone is mightier than the mouse.',           meta: '46% vs 2% Conversion' },
      { src: 'img/ads/navis-most-powerful.jpg', hl: 'The most powerful booking engine in the world.',  meta: 'Hospitality is a people business' },
      { src: 'img/ads/navis-traffic.jpg',       hl: "Traffic doesn't make reservations.",             meta: 'Guests do' }
    ],
    clink: [
      { src: 'img/CLINK/ws-panel_0000_homepage.jpg',                                                          hl: 'Homepage.',  meta: 'Clink Hostels' },
      { src: 'img/CLINK/ws-panel_0001_screencapture-clinkhostels-clink78-2023-09-13-09_58_23.jpg',            hl: 'Clink78.',   meta: 'London' },
      { src: 'img/CLINK/ws-panel_0002_screencapture-clinkhostels-clink261-2023-09-13-09_57_53.jpg',           hl: 'Clink261.',  meta: 'London' },
      { src: 'img/CLINK/ws-panel_0003_screencapture-clinkhostels-london-2023-09-13-09_53_57.jpg',             hl: 'London.',    meta: 'Clink Hostels' },
      { src: 'img/CLINK/ws-panel_0004_screencapture-clinkhostels-amsterdam-2023-09-13-09_54_23.jpg',          hl: 'Amsterdam.', meta: 'Clink Hostels' },
      { src: 'img/CLINK/ws-panel_0005_screencapture-clinkhostels-dublin-2023-09-13-09_56_27.jpg',             hl: 'Dublin.',    meta: 'Clink Hostels' },
      { src: 'img/CLINK/ws-panel_0006_screencapture-clinkhostels-groups-2023-09-13-09_56_05.jpg',             hl: 'Groups.',    meta: 'Clink Hostels' },
      { src: 'img/CLINK/ws-panel_0007_screencapture-clinkhostels-category-offers-2023-09-13-09_55_39.jpg',    hl: 'Offers.',    meta: 'Clink Hostels' },
      { src: 'img/CLINK/ws-panel_0008_screencapture-clinkhostels-category-city-tips-2023-09-13-09_57_06.jpg', hl: 'City Tips.', meta: 'Clink Hostels' }
    ]
  };

  let lb, lbImg, lbCapL, lbCapR, btnClose, btnPrev, btnNext;
  const state = { gal: null, idx: 0, hiddenImg: null, animating: false };
  let keysBound = false;

  function setText(idx) {
    const arr = galleries[state.gal]; if (!arr) return;
    const it = arr[idx];
    lbCapL.textContent = it.hl;
    lbCapR.textContent = it.meta + '  ·  ' + (idx + 1) + ' / ' + arr.length;
  }
  function imageReady(img) {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => { const d = () => { img.onload = null; img.onerror = null; resolve(); }; img.onload = d; img.onerror = d; });
  }
  function findTile(gal, idx) { return document.querySelector('.ad[data-gallery="' + gal + '"][data-index="' + idx + '"]'); }
  function makeFlyingClone(srcImg, rect, z) {
    const clone = document.createElement('img');
    clone.src = srcImg.src; clone.alt = srcImg.alt || '';
    Object.assign(clone.style, {
      position: 'fixed', top: rect.top + 'px', left: rect.left + 'px',
      width: rect.width + 'px', height: rect.height + 'px', objectFit: 'cover',
      margin: 0, pointerEvents: 'none', zIndex: String(z || 9995),
      willChange: 'transform, filter, width, height, top, left',
      borderRadius: getComputedStyle(srcImg).borderRadius || '0', boxShadow: '0 0 0 rgba(0,0,0,0)'
    });
    document.body.appendChild(clone); return clone;
  }

  function open(gal, idx, sourceEl) {
    if (state.animating) return;
    state.animating = true; state.gal = gal; state.idx = idx; setText(idx);
    const item = galleries[gal][idx];
    const srcImg = sourceEl ? (sourceEl.querySelector('img') || sourceEl) : null;
    if (!srcImg || typeof srcImg.getBoundingClientRect !== 'function') { simpleOpen(item.src); return; }
    const startRect = srcImg.getBoundingClientRect();
    const pageEl = document.querySelector('.work__scene');
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.classList.add('lb-open');
    gsap.set(lb, { opacity: 0 }); gsap.set(lbImg, { opacity: 0 });
    gsap.set([lbCapL, lbCapR, btnClose, btnPrev, btnNext], { opacity: 0 });
    lbImg.src = item.src; lbImg.alt = item.hl;
    srcImg.style.opacity = '0'; state.hiddenImg = srcImg;
    const clone = makeFlyingClone(srcImg, { top: startRect.top, left: startRect.left, width: startRect.width, height: startRect.height }, 9995);
    if (pageEl) gsap.to(pageEl, { scale: 0.93, filter: 'blur(10px)', duration: 0.7, ease: 'power2.out' });
    gsap.to(lb, { opacity: 1, duration: 0.45, ease: 'power2.out' });
    imageReady(lbImg).then(() => {
      const tgt = lbImg.getBoundingClientRect();
      const tgtRect = (tgt && tgt.width > 0) ? { top: tgt.top, left: tgt.left, width: tgt.width, height: tgt.height }
        : { top: 100, left: 60, width: window.innerWidth - 120, height: window.innerHeight - 200 };
      runFold(clone, tgtRect, pageEl);
    });
  }
  function runFold(clone, tgt, pageEl) {
    const tl = gsap.timeline({ onComplete: () => {
      gsap.set(lbImg, { opacity: 0, x: 0, y: 0, scale: 1, filter: 'none', rotationX: 0, z: 0 });
      gsap.to(lbImg, { opacity: 1, duration: 0.22, ease: 'sine.out' });
      gsap.to(clone, { opacity: 0, duration: 0.22, ease: 'sine.out', onComplete: () => { clone.remove(); state.animating = false; } });
    }});
    gsap.set(clone, { transformPerspective: 1300, transformStyle: 'preserve-3d', transformOrigin: '50% 100%' });
    tl.to(clone, { rotationX: -5, scale: 1.02, duration: 0.28, ease: 'sine.in' });
    tl.to(clone, { top: tgt.top, left: tgt.left, width: tgt.width, height: tgt.height, rotationX: 22, z: 220, scale: 1, duration: 0.78, ease: 'power3.inOut', boxShadow: '0 40px 90px rgba(0,0,0,0.55)' }, '<+0.24');
    tl.to(clone, { rotationX: 0, z: 0, duration: 0.7, ease: 'expo.out' }, '>-0.32');
    tl.to(clone, { filter: 'blur(2.2px)', duration: 0.32, ease: 'sine.inOut' }, '<-0.78');
    tl.to(clone, { filter: 'blur(0px)', duration: 0.55, ease: 'sine.out' }, '>-0.15');
    tl.fromTo([lbCapL, lbCapR], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.06 }, '-=0.4');
    tl.to([btnClose, btnPrev, btnNext], { opacity: 1, duration: 0.3, ease: 'power2.out' }, '<+0.05');
  }
  function simpleOpen(src) {
    lbImg.src = src; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.classList.add('lb-open');
    gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    gsap.fromTo(lbImg, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', onComplete: () => { state.animating = false; } });
  }
  function close() {
    if (state.animating) return; state.animating = true;
    const pageEl = document.querySelector('.work__scene');
    const tile = findTile(state.gal, state.idx);
    const tileImg = tile ? tile.querySelector('img') : null;
    gsap.to([btnClose, btnPrev, btnNext, lbCapL, lbCapR], { opacity: 0, y: 8, duration: 0.22, ease: 'power2.in' });
    function finish() {
      lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lb-open');
      gsap.set([lb, lbImg, lbCapL, lbCapR, btnClose, btnPrev, btnNext], { clearProps: 'all' });
      if (state.hiddenImg) { state.hiddenImg.style.opacity = ''; state.hiddenImg = null; }
      document.querySelectorAll('.ad img[style*="opacity: 0"]').forEach((img) => { img.style.opacity = ''; });
      state.animating = false;
    }
    if (pageEl) gsap.to(pageEl, { scale: 1, filter: 'blur(0px)', duration: 0.55, ease: 'power2.out' });
    if (tileImg) {
      const lbRect = lbImg.getBoundingClientRect(); const tgtRect = tileImg.getBoundingClientRect();
      const clone = makeFlyingClone(lbImg, { top: lbRect.top, left: lbRect.left, width: lbRect.width, height: lbRect.height }, 9996);
      gsap.set(lbImg, { opacity: 0 }); tileImg.style.opacity = '0';
      const tl = gsap.timeline({ onComplete: () => { tileImg.style.opacity = ''; clone.remove(); finish(); } });
      tl.to(clone, { filter: 'blur(2.5px)', duration: 0.18, ease: 'power2.in' });
      tl.to(clone, { top: tgtRect.top, left: tgtRect.left, width: tgtRect.width, height: tgtRect.height, boxShadow: '0 0 0 rgba(0,0,0,0)', duration: 0.65, ease: 'power3.inOut' }, '<');
      tl.to(clone, { filter: 'blur(0px)', duration: 0.3, ease: 'power2.out' }, '>-0.2');
      gsap.to(lb, { opacity: 0, duration: 0.55, delay: 0.1, ease: 'power2.in' });
    } else {
      gsap.to(lbImg, { opacity: 0, scale: 0.94, duration: 0.35, ease: 'power2.in' });
      gsap.to(lb, { opacity: 0, duration: 0.45, ease: 'power2.in', onComplete: finish });
    }
  }
  function step(direction) {
    if (state.animating) return; const arr = galleries[state.gal]; if (!arr) return;
    state.animating = true;
    const newIdx = (state.idx + direction + arr.length) % arr.length;
    const isNext = direction > 0;
    const exitX = isNext ? -window.innerWidth * 0.32 : window.innerWidth * 0.32;
    const exitRotY = isNext ? -16 : 16; const enterX = isNext ? window.innerWidth * 0.32 : -window.innerWidth * 0.32; const enterRotY = isNext ? 16 : -16;
    gsap.set(lbImg, { transformPerspective: 1400, transformOrigin: '50% 50%', transformStyle: 'preserve-3d' });
    gsap.to(lbImg, { x: exitX, rotationY: exitRotY, opacity: 0, filter: 'blur(6px)', duration: 0.45, ease: 'power2.in', onComplete: () => {
      state.idx = newIdx; const item = arr[newIdx]; lbImg.src = item.src; lbImg.alt = item.hl; setText(newIdx);
      imageReady(lbImg).then(() => {
        gsap.set(lbImg, { x: enterX, rotationY: enterRotY, opacity: 0, filter: 'blur(6px)' });
        gsap.to(lbImg, { x: 0, rotationY: 0, opacity: 1, filter: 'blur(0px)', duration: 0.65, ease: 'power3.out', onComplete: () => { gsap.set(lbImg, { clearProps: 'transform,filter' }); state.animating = false; } });
      });
    }});
    gsap.to([lbCapL, lbCapR], { opacity: 0, y: -8, duration: 0.22, ease: 'power2.in' });
    gsap.fromTo([lbCapL, lbCapR], { y: 8 }, { opacity: 1, y: 0, duration: 0.36, delay: 0.55, ease: 'power2.out', stagger: 0.04 });
  }

  function init() {
    lb = document.getElementById('lightbox'); if (!lb) return;
    lbImg = lb.querySelector('.lb-img'); lbCapL = lb.querySelector('.lb-cap-l'); lbCapR = lb.querySelector('.lb-cap-r');
    btnClose = lb.querySelector('.lb-close'); btnPrev = lb.querySelector('.lb-prev'); btnNext = lb.querySelector('.lb-next');
    document.querySelectorAll('.ad[data-gallery]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); open(el.dataset.gallery, parseInt(el.dataset.index || '0', 10), el); });
    });
    const clinkCover = document.getElementById('clink-cover');
    if (clinkCover) clinkCover.addEventListener('click', (e) => { e.preventDefault(); open('clink', 4, clinkCover); });
    if (btnClose) btnClose.addEventListener('click', close);
    if (btnPrev) btnPrev.addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
    if (btnNext) btnNext.addEventListener('click', (e) => { e.stopPropagation(); step(1); });
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    if (!keysBound) {
      keysBound = true;
      document.addEventListener('keydown', (e) => {
        const cur = document.getElementById('lightbox');
        if (!cur || !cur.classList.contains('open')) return;
        if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
      });
    }
  }

  window.WorkLightbox = { init };
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
