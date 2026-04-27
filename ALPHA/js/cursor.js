// cursor.js
// Custom cursor + canvas particle trail for adamcagle.com ALPHA.
// Cursor element stays DOM (one node, mix-blend-mode does the work).
// Trail particles render to a single full-viewport canvas so we can run
// hundreds of them cheaply.
// Bails on touch devices, reduced-motion preference, or if GSAP is missing.

(function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof gsap === 'undefined') return;

  // ─── Cursor element (the X-ray blob) and ring sibling ───
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'cursor__label';
  cursor.appendChild(label);

  // Separate top-level ring so it stays orange (not caught in the cursor's
  // mix-blend-mode difference stacking context).
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');

  document.body.appendChild(cursor);
  document.body.appendChild(ring);
  document.body.classList.add('has-custom-cursor');

  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3' });

  // ─── Canvas trail ───
  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let vw  = window.innerWidth;
  let vh  = window.innerHeight;

  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    vw  = window.innerWidth;
    vh  = window.innerHeight;
    canvas.width  = vw * dpr;
    canvas.height = vh * dpr;
    canvas.style.width  = vw + 'px';
    canvas.style.height = vh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // ─── Accent color sampling (theme-aware) ───
  let accent = { r: 255, g: 91, b: 31 };
  function readAccent() {
    const v = getComputedStyle(document.documentElement)
                .getPropertyValue('--accent').trim();
    const m = v.match(/^#([0-9a-f]{6})$/i);
    if (m) {
      const n = parseInt(m[1], 16);
      accent = { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
    }
  }
  readAccent();
  new MutationObserver(readAccent).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme']
  });

  // ─── Particle pool ───
  const particles = [];
  const MAX_PARTICLES   = 1400;
  const SPAWN_INTERVAL  = 6;
  const PER_SPAWN       = 4;
  let lastSpawn = 0;
  let mx = -9999, my = -9999;

  function spawn(x, y) {
    for (let i = 0; i < PER_SPAWN; i++) {
      if (particles.length >= MAX_PARTICLES) break;
      // Radial emanation from cursor: every angle equally probable, low speed
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.85;
      particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r:  0.45 + Math.random() * 1.1,
        life: 0,
        maxLife: 850 + Math.random() * 950,
        bv: 0.8 + Math.random() * 0.3,
        color: null,
        decay: 0.99
      });
    }
  }

  // Public API for triggering a one-shot burst from any script.
  // Pass { rect: {top, left, width, height} } to scatter from across the
  // entire surface of an element with outward radial velocity, OR
  // pass { x, y } for a point burst.
  window.cursorBurst = function (opts) {
    opts = opts || {};
    const count = opts.count != null ? opts.count : 80;
    const rect  = opts.rect || null;
    const px0   = opts.x != null ? opts.x : window.innerWidth  / 2;
    const py0   = opts.y != null ? opts.y : window.innerHeight / 2;

    let cx, cy, halfDiag;
    if (rect) {
      cx = rect.left + rect.width  / 2;
      cy = rect.top  + rect.height / 2;
      halfDiag = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2;
    }

    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) break;

      let sx, sy, vx, vy;
      if (rect) {
        // Spawn anywhere inside the rect
        sx = rect.left + Math.random() * rect.width;
        sy = rect.top  + Math.random() * rect.height;

        // Velocity: outward from rect center, plus jitter
        let dx = sx - cx;
        let dy = sy - cy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= len; dy /= len;

        // Distance-from-center weighting: edge particles fly faster
        const distRatio = len / halfDiag;
        const speed = 2.2 + Math.random() * 6 + distRatio * 1.5;

        vx = dx * speed + (Math.random() - 0.5) * 0.6;
        vy = dy * speed + (Math.random() - 0.5) * 0.6;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.8 + Math.random() * 5.5;
        sx = px0 + (Math.random() - 0.5) * 8;
        sy = py0 + (Math.random() - 0.5) * 8;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed - 0.2;
      }

      const silver = Math.random() < 0.5;
      particles.push({
        x: sx, y: sy, vx: vx, vy: vy,
        r:  0.7 + Math.random() * 1.7,
        life: 0,
        maxLife: 700 + Math.random() * 800,
        bv: 0.85 + Math.random() * 0.25,
        color: silver ? { r: 232, g: 236, b: 242 } : null,
        decay: 0.945 + Math.random() * 0.03
      });
    }
  };

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    xTo(mx);   yTo(my);
    ringX(mx); ringY(my);

    const now = performance.now();
    if (now - lastSpawn >= SPAWN_INTERVAL) {
      lastSpawn = now;
      spawn(mx, my);
    }
  });

  // ─── Render loop on GSAP ticker ───
  let lastTime = performance.now();
  gsap.ticker.add((time) => {
    const now = time * 1000;
    const dt  = Math.min(50, now - lastTime);
    lastTime = now;

    ctx.clearRect(0, 0, vw, vh);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.decay && p.decay !== 1) {
        p.vx *= p.decay;
        p.vy *= p.decay;
      }

      const t     = p.life / p.maxLife;
      const alpha = (1 - t) * 0.9;

      const c = p.color || accent;
      const r = Math.round(c.r * p.bv);
      const g = Math.round(c.g * p.bv);
      const b = Math.round(c.b * p.bv);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
      ctx.fill();
    }
  });

  // ─── Cursor state delegation ───
  const DEFAULT_TEXT = {
    view:     'View',
    external: 'Open',
    email:    'Email',
    drag:     'Drag',
    hover:    ''
  };

  // Auto-tag existing lightbox triggers as VIEW
  document.querySelectorAll('.ad[data-gallery]:not([data-cursor])').forEach((el) => {
    el.setAttribute('data-cursor', 'view');
  });

  function bind(el) {
    const state = el.getAttribute('data-cursor');
    if (!state) return;
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('is-' + state);
      ring.classList.add('is-' + state);
      const text = el.getAttribute('data-cursor-text') || DEFAULT_TEXT[state] || '';
      label.textContent = text;
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-' + state);
      ring.classList.remove('is-' + state);
      label.textContent = '';
    });
  }

  document.querySelectorAll('[data-cursor]').forEach(bind);
})();
