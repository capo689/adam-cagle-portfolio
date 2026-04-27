// js/pages/portfolio-lightbox.js
// GSAP Flip-powered lightbox for Portfolio.html.
// Click an ad: the actual ad image animates from its grid position to the
// fullscreen lightbox spot. Close / Esc: it animates back to wherever the
// current image lives in the grid.
//
// Replaces the older inline lightbox script. Bails silently if GSAP or Flip
// failed to load.

(function () {
  if (typeof gsap === 'undefined') return;
  if (typeof Flip === 'undefined') return;
  gsap.registerPlugin(Flip);

  const galleries = {
    traveler: [
      { src: 'ads/traveler-road.webp',             hl: 'The Road.',                     meta: 'Escape Mk III · 25 Years' },
      { src: 'ads/traveler-sonic-bloom.webp',      hl: 'Sonic Bloom.',                  meta: 'Redlands Concert · Forest' },
      { src: 'ads/traveler-jungle.webp',           hl: 'Hey Jungle, Welcome to Me.',    meta: 'Vaibrant Electric · Tropical' },
      { src: 'ads/traveler-greatness.jpg',         hl: 'Next Stop, Greatness.',         meta: 'Ultra-Light · Subway' },
      { src: 'ads/traveler-force.webp',            hl: 'A Force of Nature.',            meta: 'Vaibrant Teal Burst · Tempest' },
      { src: 'ads/traveler-flying-solo.webp',      hl: 'Flying Solo.',                  meta: 'Ultra-Light · Cockpit' },
      { src: 'ads/traveler-endless-strummer.webp', hl: 'Endless Strummer.',             meta: 'Redlands Mini · Surf' }
    ],
    sunset: [
      { src: 'ads/sunset-legendary-nights.webp',   hl: 'Yes, that beautiful.',                                  meta: 'Sunset Marquis' },
      { src: 'ads/sunset-yes-that-beautiful.jpg',  hl: 'Legendary Nights Begin at Sunset.',                    meta: 'Sunset Marquis' },
      { src: 'ads/ACM-Awards-2025.jpg',            hl: "Sure, it's California, but it's the southern part.",   meta: 'ACM Awards Guide' },
      { src: 'ads/SMBrochure.jpg',                 hl: 'Unique. Even by Hollywood standards.',                 meta: 'GDS One-Sheet' }
    ],
    killer: [
      { src: 'ads/killer-sniper.webp?v=2026',  hl: 'Warrior.', meta: 'Killer NIC K1' },
      { src: 'ads/killer-mage.webp?v=2026',    hl: 'Mage.',    meta: 'Killer NIC K1' },
      { src: 'ads/killer-warrior.webp?v=2026', hl: 'Sniper.',  meta: 'Killer NIC K1' }
    ],
    clink: [
      { src: 'CLINK/ws-panel_0000_homepage.jpg',                                                          hl: 'Homepage.',  meta: 'Clink Hostels' },
      { src: 'CLINK/ws-panel_0001_screencapture-clinkhostels-clink78-2023-09-13-09_58_23.jpg',            hl: 'Clink78.',   meta: 'London' },
      { src: 'CLINK/ws-panel_0002_screencapture-clinkhostels-clink261-2023-09-13-09_57_53.jpg',           hl: 'Clink261.',  meta: 'London' },
      { src: 'CLINK/ws-panel_0003_screencapture-clinkhostels-london-2023-09-13-09_53_57.jpg',             hl: 'London.',    meta: 'Clink Hostels' },
      { src: 'CLINK/ws-panel_0004_screencapture-clinkhostels-amsterdam-2023-09-13-09_54_23.jpg',          hl: 'Amsterdam.', meta: 'Clink Hostels' },
      { src: 'CLINK/ws-panel_0005_screencapture-clinkhostels-dublin-2023-09-13-09_56_27.jpg',             hl: 'Dublin.',    meta: 'Clink Hostels' },
      { src: 'CLINK/ws-panel_0006_screencapture-clinkhostels-groups-2023-09-13-09_56_05.jpg',             hl: 'Groups.',    meta: 'Clink Hostels' },
      { src: 'CLINK/ws-panel_0007_screencapture-clinkhostels-category-offers-2023-09-13-09_55_39.jpg',    hl: 'Offers.',    meta: 'Clink Hostels' },
      { src: 'CLINK/ws-panel_0008_screencapture-clinkhostels-category-city-tips-2023-09-13-09_57_06.jpg', hl: 'City Tips.', meta: 'Clink Hostels' }
    ]
  };

  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const lbImg  = lb.querySelector('.lb-img');
  const lbCapL = lb.querySelector('.lb-cap-l');
  const lbCapR = lb.querySelector('.lb-cap-r');
  const btnClose = lb.querySelector('.lb-close');
  const btnPrev  = lb.querySelector('.lb-prev');
  const btnNext  = lb.querySelector('.lb-next');

  const state = { gal: null, idx: 0, sourceEl: null, animating: false };

  function setItem(gal, idx) {
    const arr = galleries[gal];
    if (!arr) return;
    const it = arr[idx];
    lbImg.src = it.src;
    lbImg.alt = it.hl;
    lbCapL.textContent = it.hl;
    lbCapR.textContent = it.meta + '  ·  ' + (idx + 1) + ' / ' + arr.length;
    state.gal = gal;
    state.idx = idx;
  }

  function imageReady(img) {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => { img.onload = null; img.onerror = null; resolve(); };
      img.onload = done; img.onerror = done;
    });
  }

  // Find the ad tile in the grid that matches the current gallery + index
  function findCurrentTile() {
    if (!state.gal) return null;
    const sel = '.ad[data-gallery="' + state.gal + '"][data-index="' + state.idx + '"]';
    return document.querySelector(sel) || state.sourceEl;
  }

  function open(gal, idx, sourceEl) {
    if (state.animating) return;
    state.animating = true;
    state.sourceEl = sourceEl;
    setItem(gal, idx);

    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lb-open');

    // Fade backdrop in. Buttons fade in slightly later.
    gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.32, ease: 'power2.out' });
    gsap.fromTo([btnClose, btnPrev, btnNext],
      { opacity: 0 },
      { opacity: 1, duration: 0.3, delay: 0.45, ease: 'power2.out' });
    gsap.fromTo([lbCapL, lbCapR],
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, delay: 0.55, ease: 'power2.out', stagger: 0.05 });

    imageReady(lbImg).then(() => {
      const sourceImg = sourceEl ? (sourceEl.querySelector('img') || sourceEl) : null;
      if (sourceImg && sourceImg.getBoundingClientRect) {
        const startState = Flip.getState(lbImg);
        Flip.fit(lbImg, sourceImg, { absolute: true });
        Flip.from(startState, {
          duration: 0.75,
          ease: 'power3.inOut',
          absolute: true,
          onComplete: () => {
            gsap.set(lbImg, { clearProps: 'all' });
            state.animating = false;
          }
        });
      } else {
        gsap.fromTo(lbImg,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out',
            onComplete: () => { state.animating = false; }
          }
        );
      }
    });
  }

  function close() {
    if (state.animating) return;
    state.animating = true;
    const tile = findCurrentTile();
    const targetImg = tile ? (tile.querySelector('img') || tile) : null;

    // Fade out chrome
    gsap.to([btnClose, btnPrev, btnNext, lbCapL, lbCapR],
      { opacity: 0, duration: 0.2, ease: 'power2.in' });

    function finish() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lb-open');
      gsap.set([lb, lbImg, lbCapL, lbCapR, btnClose, btnPrev, btnNext], { clearProps: 'all' });
      state.sourceEl = null;
      state.animating = false;
    }

    if (targetImg && targetImg.getBoundingClientRect) {
      const startState = Flip.getState(lbImg);
      Flip.fit(lbImg, targetImg, { absolute: true });
      Flip.from(startState, {
        duration: 0.55,
        ease: 'power3.inOut',
        absolute: true,
        onComplete: finish
      });
      gsap.to(lb, { opacity: 0, duration: 0.5, delay: 0.1, ease: 'power2.in' });
    } else {
      gsap.to(lbImg, { opacity: 0, scale: 0.92, duration: 0.35, ease: 'power2.in' });
      gsap.to(lb, { opacity: 0, duration: 0.4, ease: 'power2.in', onComplete: finish });
    }
  }

  function step(direction) {
    if (state.animating) return;
    const arr = galleries[state.gal];
    if (!arr) return;
    state.animating = true;
    const newIdx = (state.idx + direction + arr.length) % arr.length;
    const offset = direction > 0 ? -60 : 60;

    // Slide current image out
    gsap.to(lbImg, {
      opacity: 0, x: offset, duration: 0.22, ease: 'power2.in',
      onComplete: () => {
        setItem(state.gal, newIdx);
        imageReady(lbImg).then(() => {
          gsap.fromTo(lbImg,
            { x: -offset, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.42, ease: 'power3.out',
              onComplete: () => { state.animating = false; }
            }
          );
        });
      }
    });

    // Caption swap
    gsap.to([lbCapL, lbCapR], {
      opacity: 0, duration: 0.18, ease: 'power2.in',
      onComplete: () => {
        const item = galleries[state.gal][newIdx];
        lbCapL.textContent = item.hl;
        lbCapR.textContent = item.meta + '  ·  ' + (newIdx + 1) + ' / ' + arr.length;
        gsap.fromTo([lbCapL, lbCapR],
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' });
      }
    });
  }

  // ─── Wiring ───
  document.querySelectorAll('.ad[data-gallery]').forEach((el) => {
    el.addEventListener('click', () => {
      open(el.dataset.gallery, parseInt(el.dataset.index || '0', 10), el);
    });
  });

  const clinkCover = document.getElementById('clink-cover');
  if (clinkCover) clinkCover.addEventListener('click', () => open('clink', 4, clinkCover));

  if (btnClose) btnClose.addEventListener('click', close);
  if (btnPrev)  btnPrev.addEventListener('click',  (e) => { e.stopPropagation(); step(-1); });
  if (btnNext)  btnNext.addEventListener('click',  (e) => { e.stopPropagation(); step(1);  });
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')         close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
})();
