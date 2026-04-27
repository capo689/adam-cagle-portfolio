// js/pages/agents-lightbox.js
// Cinematic lightbox for Agents.html. Same fold/recede choreography as
// Portfolio. Galleries are page-specific (SSIA, Book, AuScan, BEEF, Music).

(function () {
  if (typeof gsap === 'undefined') return;

  const galleries = {
    ssia: [
      { src: 'agents/ssia-vrt-dashboard.png',  hl: 'VRT Dashboard.',   meta: 'SSIA · Vertiv · Morning Run' },
      { src: 'agents/ssia-vrt-graphs.png',     hl: 'VRT Signals.',     meta: 'SSIA · Vertiv · Regime Graphs' },
      { src: 'agents/ssia-crdo-dashboard.png', hl: 'CRDO Dashboard.',  meta: 'SSIA · Credo · Morning Run' },
      { src: 'agents/ssia-crdo-graphs.png',    hl: 'CRDO Signals.',    meta: 'SSIA · Credo · Regime Graphs' }
    ],
    book: [
      { src: 'agents/book-agent.png', hl: 'Book Agent.', meta: 'KDP · Closed Loop · Five Channels' }
    ],
    auscan: [
      { src: 'agents/auscan-dashboard.png', hl: 'AuScan Dashboard.', meta: 'AuScan · Prospectivity Grid' },
      { src: 'agents/auscan-report.png',    hl: 'Field Report.',     meta: 'AuScan · Harney County · Oregon' }
    ],
    beef: [
      { src: 'agents/beef-dashboard.png', hl: 'BEEF Dashboard.', meta: 'BEEF · 68 Assets · Daily Brief' }
    ],
    music: [
      { src: 'agents/music-agent.png', hl: 'Music Agent.', meta: 'Closed Loop · Multi-DSP' }
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
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lb-open');
    gsap.set(lb, { opacity: 0 });
    gsap.set(lbImg, { opacity: 0 });
    gsap.set([lbCapL, lbCapR, btnClose, btnPrev, btnNext], { opacity: 0 });

    lbImg.src = item.src;
    lbImg.alt = item.hl;

    srcImg.style.opacity = '0';
    state.hiddenImg = srcImg;

    const clone = makeFlyingClone(srcImg, {
      top: startRect.top, left: startRect.left,
      width: startRect.width, height: startRect.height
    }, 9995);

    if (pageEl) {
      gsap.to(pageEl, {
        scale: 0.93, filter: 'blur(10px)',
        duration: 0.7, ease: 'power2.out'
      });
    }
    gsap.to(lb, { opacity: 1, duration: 0.45, ease: 'power2.out' });

    imageReady(lbImg).then(() => {
      const tgt = lbImg.getBoundingClientRect();
      const tgtRect = (tgt && tgt.width > 0 && tgt.height > 0)
        ? { top: tgt.top, left: tgt.left, width: tgt.width, height: tgt.height }
        : targetRect(srcImg.naturalWidth, srcImg.naturalHeight);
      runFoldTimeline(clone, tgtRect);
    });
  }

  function runFoldTimeline(clone, tgt) {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(lbImg, { opacity: 0, x: 0, y: 0, scale: 1, filter: 'none', rotationX: 0, z: 0 });
        gsap.to(lbImg, { opacity: 1, duration: 0.22, ease: 'sine.out' });
        gsap.to(clone, {
          opacity: 0, duration: 0.22, ease: 'sine.out',
          onComplete: () => { clone.remove(); state.animating = false; }
        });
      }
    });

    gsap.set(clone, {
      transformPerspective: 1300,
      transformStyle: 'preserve-3d',
      transformOrigin: '50% 100%'
    });

    tl.to(clone, { rotationX: -5, scale: 1.02, duration: 0.28, ease: 'sine.in' });

    tl.to(clone, {
      top: tgt.top, left: tgt.left, width: tgt.width, height: tgt.height,
      rotationX: 22, z: 220, scale: 1,
      duration: 0.78, ease: 'power3.inOut',
      boxShadow: '0 40px 90px rgba(0,0,0,0.55)'
    }, '<+0.24');

    tl.to(clone, { rotationX: 0, z: 0, duration: 0.7, ease: 'expo.out' }, '>-0.32');

    tl.to(clone, { filter: 'blur(2.2px)', duration: 0.32, ease: 'sine.inOut' }, '<-0.78');
    tl.to(clone, { filter: 'blur(0px)', duration: 0.55, ease: 'sine.out' }, '>-0.15');

    tl.fromTo([lbCapL, lbCapR],
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.06 }, '-=0.4');
    tl.to([btnClose, btnPrev, btnNext],
      { opacity: 1, duration: 0.3, ease: 'power2.out' }, '<+0.05');
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

  function close() {
    if (state.animating) return;
    state.animating = true;
    const tile = findTile(state.gal, state.idx);
    const tileImg = tile ? tile.querySelector('img') : null;

    gsap.to([btnClose, btnPrev, btnNext, lbCapL, lbCapR],
      { opacity: 0, y: 8, duration: 0.22, ease: 'power2.in' });

    function finish() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lb-open');
      gsap.set([lb, lbImg, lbCapL, lbCapR, btnClose, btnPrev, btnNext], { clearProps: 'all' });
      if (state.hiddenImg) {
        state.hiddenImg.style.opacity = '';
        state.hiddenImg = null;
      }
      document.querySelectorAll('.ad img[style*="opacity: 0"]').forEach((img) => {
        img.style.opacity = '';
      });
      state.sourceEl = null;
      state.animating = false;
    }

    if (pageEl) {
      gsap.to(pageEl, { scale: 1, filter: 'blur(0px)', duration: 0.55, ease: 'power2.out' });
    }

    if (tileImg) {
      const lbRect  = lbImg.getBoundingClientRect();
      const tgtRect = tileImg.getBoundingClientRect();
      const clone = makeFlyingClone(lbImg, {
        top: lbRect.top, left: lbRect.left,
        width: lbRect.width, height: lbRect.height
      }, 9996);
      gsap.set(lbImg, { opacity: 0 });
      tileImg.style.opacity = '0';

      const tl = gsap.timeline({
        onComplete: () => { tileImg.style.opacity = ''; clone.remove(); finish(); }
      });
      tl.to(clone, { filter: 'blur(2.5px)', duration: 0.18, ease: 'power2.in' });
      tl.to(clone, {
        top: tgtRect.top, left: tgtRect.left, width: tgtRect.width, height: tgtRect.height,
        boxShadow: '0 0 0 rgba(0,0,0,0)',
        duration: 0.65, ease: 'power3.inOut'
      }, '<');
      tl.to(clone, { filter: 'blur(0px)', duration: 0.3, ease: 'power2.out' }, '>-0.2');
      gsap.to(lb, { opacity: 0, duration: 0.55, delay: 0.1, ease: 'power2.in' });
    } else {
      gsap.to(lbImg, { opacity: 0, scale: 0.94, duration: 0.35, ease: 'power2.in' });
      gsap.to(lb, { opacity: 0, duration: 0.45, ease: 'power2.in', onComplete: finish });
    }
  }

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

    gsap.to([lbCapL, lbCapR], { opacity: 0, y: -8, duration: 0.18, ease: 'power2.in' });
    gsap.fromTo([lbCapL, lbCapR],
      { y: 8 },
      { opacity: 1, y: 0, duration: 0.32, delay: 0.4, ease: 'power2.out', stagger: 0.04 });
  }

  // Wiring
  document.querySelectorAll('.ad[data-gallery]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      open(el.dataset.gallery, parseInt(el.dataset.index || '0', 10), el);
    });
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
