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

  // ─── Cursor element ───
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.className = 'cursor__label';
  cursor.appendChild(label);
  document.body.appendChild(cursor);
  document.body.classList.add('has-custom-cursor');

  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3' });

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

  // ─── Particle pool ───
  const particles = [];
  const MAX_PARTICLES   = 500;
  const SPAWN_INTERVAL  = 4;   // ms between spawn pulses
  const PER_SPAWN       = 2;   // particles emitted per pulse
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
        b: 215 + Math.floor(Math.random() * 40)
      });
    }
  }

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    xTo(mx);
    yTo(my);

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

      const t     = p.life / p.maxLife;
      const alpha = (1 - t) * 0.85;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.b + ',' + (p.b + 6) + ',' + (p.b + 14) + ',' + alpha + ')';
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
      const text = el.getAttribute('data-cursor-text') || DEFAULT_TEXT[state] || '';
      label.textContent = text;
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-' + state);
      label.textContent = '';
    });
  }

  document.querySelectorAll('[data-cursor]').forEach(bind);
})();
