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
  const MAX_PARTICLES   = 500;
  const SPAWN_INTERVAL  = 4;
  const PER_SPAWN       = 2;
  let lastSpawn = 0;
  let mx = -9999, my = -9999;

  function spawn(x, y) {
    for (let i = 0; i < PER_SPAWN; i++) {
      if (particles.length >= MAX_PARTICLES) break;
      particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.25,
        vy: 0.05 + Math.random() * 0.25,
        r:  0.5 + Math.random() * 1.3,
        life: 0,
        maxLife: 700 + Math.random() * 700,
        // brightness multiplier so each particle is a slightly different orange
        bv: 0.75 + Math.random() * 0.3,
        color: null, // null = use accent (theme color)
        decay: 1     // no velocity decay for trail particles
      });
    }
  }

  // Public API for triggering a one-shot burst from any script.
  // Half particles inherit the accent color, half are silver, mixed sizes,
  // radial scatter with mild deceleration.
  window.cursorBurst = function (opts) {
    opts = opts || {};
    const x = opts.x != null ? opts.x : window.innerWidth  / 2;
    const y = opts.y != null ? opts.y : window.innerHeight / 2;
    const count = opts.count != null ? opts.count : 80;

    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) break;
      const angle  = Math.random() * Math.PI * 2;
      const speed  = 1.8 + Math.random() * 5.5;
      const silver = Math.random() < 0.5;
      particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.2,
        r:  0.7 + Math.random() * 1.7,
        life: 0,
        maxLife: 650 + Math.random() * 750,
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
