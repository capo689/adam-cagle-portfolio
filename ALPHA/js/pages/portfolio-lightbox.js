// js/pages/portfolio-lightbox.js
// Cinematic lightbox for Portfolio.html.
//
// On click:
//   1) Clone the clicked ad image, position it over the original.
//   2) The .page wrapper recedes (scale + blur) so the image owns focus.
//   3) Backdrop fades in.
//   4) Clone takes a small anticipation pop, then breaks forward to fullscreen
//      with a hint of motion blur, settling sharp.
//   5) Caption + chrome arrive late.
//
// On close: reverse, with the image flying back to whichever ad in the grid
// matches the current image.
//
// Prev / next: motion-blur slide swap.
//
// Bails silently if GSAP failed to load.

(function () {
  if (typeof gsap === 'undefined') return;

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
    filekeepers: [
      { src: 'ads/FileKeepers_SPACE1.jpg',  hl: 'Space.', meta: 'FileKeepers · Room 1' },
      { src: 'ads/FileKeepers_SPACE12.jpg', hl: 'Space.', meta: 'FileKeepers · Room 2' },
      { src: 'ads/FileKeepers_SPACE13.jpg', hl: 'Space.', meta: 'FileKeepers · Room 3' },
      { src: 'ads/FileKeepers_SPACE14.jpg', hl: 'Space.', meta: 'FileKeepers · Room 4' }
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
  const lbImg    = lb.querySelector('.lb-img');
  const lbCapL   = lb.querySelector('.lb-cap-l');
  const lbCapR   = lb.querySelector('.lb-cap-r');
  const btnClose = lb.querySelector('.lb-close');
  const btnPrev  = lb.querySelector('.lb-prev');
  const btnNext  = lb.querySelector('.lb-next');

  const pageEl = document.querySelector('.page');
  const state  = { gal: null, idx: 0, sourceEl: null, hiddenImg: null, animating: false };

  function setText(idx) {
    const arr = galleries[state.gal];
    if (!arr) return;
    const it = arr[idx];
    lbCapL.textContent = it.hl;
    lbCapR.textContent = it.meta + '  ·  ' + (idx + 1) + ' / ' + arr.length;
  }

  function imageReady(img) {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => { img.onload = null; img.onerror = null; resolve(); };
      img.onload = done; img.onerror = done;
    });
  }

  function findTile(gal, idx) {
    const sel = '.ad[data-gallery="' + gal + '"][data-index="' + idx + '"]';
    return document.querySelector(sel);
  }

  // Compute centered, viewport-padded target rect for an image of given aspect
  function targetRect(naturalW, naturalH) {
    const padX = 60, padY = 100;
    const maxW = window.innerWidth  - padX * 2;
    const maxH = window.innerHeight - padY * 2;
    const ratio = (naturalW && naturalH) ? naturalW / naturalH : (16 / 10);
    let w = maxW, h = maxW / ratio;
    if (h > maxH) { h = maxH; w = maxH * ratio; }
    return {
      left: (window.innerWidth  - w) / 2,
      top:  (window.innerHeight - h) / 2,
      width: w, height: h
    };
  }

  function makeFlyingClone(srcImg, rect, z) {
    const clone = document.createElement('img');
    clone.src = srcImg.src;
    clone.alt = srcImg.alt || '';
    Object.assign(clone.style, {
      position: 'fixed',
      top:    rect.top    + 'px',
      left:   rect.left   + 'px',
      width:  rect.width  + 'px',
      height: rect.height + 'px',
      objectFit: 'cover',
      margin: 0,
      pointerEvents: 'none',
      zIndex: String(z || 9995),
      willChange: 'transform, filter, width, height, top, left',
      borderRadius: getComputedStyle(srcImg).borderRadius || '0',
      boxShadow: '0 0 0 rgba(0,0,0,0)'
    });
    document.body.appendChild(clone);
    return clone;
  }

  // ─── OPEN: BREAKTHROUGH ───
  function open(gal, idx, sourceEl) {
    if (state.animating) return;
    state.animating = true;
    state.gal = gal;
    state.idx = idx;
    state.sourceEl = sourceEl;
    setText(idx);

    const item = galleries[gal][idx];
    const srcImg = sourceEl ? (sourceEl.querySelector('img') || sourceEl) : null;

    if (!srcImg || typeof srcImg.getBoundingClientRect !== 'function') {
      simpleOpen(item.src);
      return;
    }

    const startRect = srcImg.getBoundingClientRect();

    // Show lb container but transparent and image hidden so the clone owns the screen
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lb-open');
    gsap.set(lb, { opacity: 0 });
    gsap.set(lbImg, { opacity: 0 });
    gsap.set([lbCapL, lbCapR, btnClose, btnPrev, btnNext], { opacity: 0 });

    // Set the lb-img src up-front so it lays out at its natural position;
    // we will use that exact rect as the clone's target so the swap is seamless.
    lbImg.src = item.src;
    lbImg.alt = item.hl;

    // Hide the source image so the clone is the only copy on screen.
    // Track it so close() can guarantee its restoration even if the user
    // navigates away from the original tile via prev/next.
    srcImg.style.opacity = '0';
    state.hiddenImg = srcImg;

    // Build the flying clone at the source position
    const clone = makeFlyingClone(srcImg, {
      top: startRect.top, left: startRect.left,
      width: startRect.width, height: startRect.height
    }, 9995);

    // Recede the page behind: scale + blur
    if (pageEl) {
      gsap.to(pageEl, {
        scale: 0.93,
        filter: 'blur(10px)',
        duration: 0.7,
        ease: 'power2.out'
      });
    }

    // Backdrop fade
    gsap.to(lb, { opacity: 1, duration: 0.45, ease: 'power2.out' });

    // Wait for the lb-img to finish laying out, then capture its actual rect
    imageReady(lbImg).then(() => {
      // Force a reflow read so the rect is post-layout
      const tgt = lbImg.getBoundingClientRect();
      // Fall back to a computed rect if lb-img has zero size for any reason
      const tgtRect = (tgt && tgt.width > 0 && tgt.height > 0)
        ? { top: tgt.top, left: tgt.left, width: tgt.width, height: tgt.height }
        : targetRect(srcImg.naturalWidth, srcImg.naturalHeight);

      runFoldTimeline(clone, tgtRect);
    });
  }

  function runFoldTimeline(clone, tgt) {
    // Master timeline: anticipation, then 3D fold to fullscreen
    const tl = gsap.timeline({
      onComplete: () => {
        // Crossfade: lb-img sits at the same rect as the clone, so a quick
        // opacity swap masks any subpixel or box-shadow / background
        // difference between the animated clone and the styled lb-img.
        gsap.set(lbImg, { opacity: 0, x: 0, y: 0, scale: 1, filter: 'none', rotationX: 0, z: 0 });
        gsap.to(lbImg, { opacity: 1, duration: 0.22, ease: 'sine.out' });
        gsap.to(clone, {
          opacity: 0,
          duration: 0.22,
          ease: 'sine.out',
          onComplete: () => {
            clone.remove();
            state.animating = false;
          }
        });
      }
    });

    // Establish 3D context. Hinge from the bottom edge so the top of the
    // image is what tilts forward toward the viewer.
    gsap.set(clone, {
      transformPerspective: 1300,
      transformStyle: 'preserve-3d',
      transformOrigin: '50% 100%'
    });

    // Anticipation: top edge tips slightly AWAY from viewer (negative rotationX)
    tl.to(clone, {
      rotationX: -5,
      scale: 1.02,
      duration: 0.28,
      ease: 'sine.in'
    });

    // Fold out: top tilts forward, while traveling to center and growing.
    // The travel and the tilt-forward run together.
    tl.to(clone, {
      top:    tgt.top,
      left:   tgt.left,
      width:  tgt.width,
      height: tgt.height,
      rotationX: 22,
      z: 220,
      scale: 1,
      duration: 0.78,
      ease: 'power3.inOut',
      boxShadow: '0 40px 90px rgba(0,0,0,0.55)'
    }, '<+0.24');

    // Unfold flat: rotationX back to 0, z back to 0, settling sharp.
    // expo.out for a very gentle arrival, no jerk before final position.
    tl.to(clone, {
      rotationX: 0,
      z: 0,
      duration: 0.7,
      ease: 'expo.out'
    }, '>-0.32');

    // Subtle motion blur during the fold travel
    tl.to(clone, {
      filter: 'blur(2.2px)',
      duration: 0.32,
      ease: 'sine.inOut'
    }, '<-0.78');

    tl.to(clone, {
      filter: 'blur(0px)',
      duration: 0.55,
      ease: 'sine.out'
    }, '>-0.15');

    // Chrome late: caption + close + arrows
    tl.fromTo([lbCapL, lbCapR],
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.06 },
      '-=0.4');
    tl.to([btnClose, btnPrev, btnNext],
      { opacity: 1, duration: 0.3, ease: 'power2.out' },
      '<+0.05');
  }

  function simpleOpen(src) {
    lbImg.src = src;
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lb-open');
    gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    gsap.fromTo(lbImg, { opacity: 0, scale: 0.92 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out',
        onComplete: () => { state.animating = false; } });
  }

  // ─── CLOSE: REVERSE BREAKTHROUGH ───
  function close() {
    if (state.animating) return;
    state.animating = true;
    const tile = findTile(state.gal, state.idx);
    const tileImg = tile ? tile.querySelector('img') : null;

    // Fade chrome
    gsap.to([btnClose, btnPrev, btnNext, lbCapL, lbCapR],
      { opacity: 0, y: 8, duration: 0.22, ease: 'power2.in' });

    function finish() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lb-open');
      gsap.set([lb, lbImg, lbCapL, lbCapR, btnClose, btnPrev, btnNext], { clearProps: 'all' });
      // Restore the originally hidden source image (covers Clink, HF, and
      // any non-grid trigger that does not have a matching tile to flip back to)
      if (state.hiddenImg) {
        state.hiddenImg.style.opacity = '';
        state.hiddenImg = null;
      }
      // Safety net: any .ad image we may have nudged
      document.querySelectorAll('.ad img[style*="opacity: 0"]').forEach((img) => {
        img.style.opacity = '';
      });
      state.sourceEl = null;
      state.animating = false;
    }

    // Restore page from receded state
    if (pageEl) {
      gsap.to(pageEl, {
        scale: 1, filter: 'blur(0px)',
        duration: 0.55, ease: 'power2.out'
      });
    }

    if (tileImg) {
      const lbRect   = lbImg.getBoundingClientRect();
      const tgtRect  = tileImg.getBoundingClientRect();

      // Build clone at lb-img position
      const clone = makeFlyingClone(lbImg, {
        top: lbRect.top, left: lbRect.left,
        width: lbRect.width, height: lbRect.height
      }, 9996);

      gsap.set(lbImg, { opacity: 0 });
      tileImg.style.opacity = '0';

      const tl = gsap.timeline({
        onComplete: () => {
          tileImg.style.opacity = '';
          clone.remove();
          finish();
        }
      });

      tl.to(clone, {
        filter: 'blur(2.5px)',
        duration: 0.18,
        ease: 'power2.in'
      });

      tl.to(clone, {
        top:    tgtRect.top,
        left:   tgtRect.left,
        width:  tgtRect.width,
        height: tgtRect.height,
        boxShadow: '0 0 0 rgba(0,0,0,0)',
        duration: 0.65,
        ease: 'power3.inOut'
      }, '<');

      tl.to(clone, {
        filter: 'blur(0px)',
        duration: 0.3,
        ease: 'power2.out'
      }, '>-0.2');

      gsap.to(lb, { opacity: 0, duration: 0.55, delay: 0.1, ease: 'power2.in' });
    } else {
      gsap.to(lbImg, { opacity: 0, scale: 0.94, duration: 0.35, ease: 'power2.in' });
      gsap.to(lb, { opacity: 0, duration: 0.45, ease: 'power2.in', onComplete: finish });
    }
  }

  // ─── PREV / NEXT: motion-blur slide swap ───
  function step(direction) {
    if (state.animating) return;
    const arr = galleries[state.gal];
    if (!arr) return;
    state.animating = true;
    const newIdx = (state.idx + direction + arr.length) % arr.length;
    const offset = direction > 0 ? -window.innerWidth * 0.25 : window.innerWidth * 0.25;

    gsap.to(lbImg, {
      x: offset, opacity: 0, filter: 'blur(8px)',
      duration: 0.32, ease: 'power3.in',
      onComplete: () => {
        state.idx = newIdx;
        const item = arr[newIdx];
        lbImg.src = item.src;
        lbImg.alt = item.hl;
        setText(newIdx);
        imageReady(lbImg).then(() => {
          gsap.set(lbImg, { x: -offset, filter: 'blur(8px)', opacity: 0 });
          gsap.to(lbImg, {
            x: 0, opacity: 1, filter: 'blur(0px)',
            duration: 0.5, ease: 'power3.out',
            onComplete: () => { state.animating = false; }
          });
        });
      }
    });

    // Caption swap timed with the slide
    gsap.to([lbCapL, lbCapR], {
      opacity: 0, y: -8, duration: 0.18, ease: 'power2.in'
    });
    gsap.fromTo([lbCapL, lbCapR],
      { y: 8 },
      { opacity: 1, y: 0, duration: 0.32, delay: 0.4, ease: 'power2.out', stagger: 0.04 });
  }

  // ─── Wiring ───
  document.querySelectorAll('.ad[data-gallery]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      open(el.dataset.gallery, parseInt(el.dataset.index || '0', 10), el);
    });
  });

  const clinkCover = document.getElementById('clink-cover');
  if (clinkCover) clinkCover.addEventListener('click', (e) => {
    e.preventDefault();
    open('clink', 4, clinkCover);
  });

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
