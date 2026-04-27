// cursor.js
// Custom cursor for adamcagle.com ALPHA. Reads data-cursor on hover targets to
// switch states. Bails on touch devices, reduced-motion preference, or if GSAP
// has not loaded.

(function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof gsap === 'undefined') return;

  // Build the cursor element
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.className = 'cursor__label';
  cursor.appendChild(label);
  document.body.appendChild(cursor);
  document.body.classList.add('has-custom-cursor');

  // Smooth lag via GSAP quickTo
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3' });

  // Sparkle trail. Throttle spawns so we do not flood the DOM.
  const SPARKLE_INTERVAL = 35;
  let lastSparkle = 0;

  function spawnSparkle(x, y) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    document.body.appendChild(s);

    const angle = Math.random() * Math.PI * 2;
    const dist  = 18 + Math.random() * 42;
    const dx    = Math.cos(angle) * dist;
    const dy    = Math.sin(angle) * dist;
    const size  = 0.6 + Math.random() * 1.6;
    const dur   = 0.55 + Math.random() * 0.5;

    gsap.set(s, { x: x, y: y, opacity: 0, scale: 0 });
    const tl = gsap.timeline({ onComplete: () => s.remove() });
    tl.to(s, { opacity: 1, scale: size, duration: 0.12, ease: 'power2.out' })
      .to(s, {
        x: x + dx,
        y: y + dy,
        opacity: 0,
        scale: 0.1,
        duration: dur,
        ease: 'power1.in'
      });
  }

  window.addEventListener('mousemove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);

    const now = performance.now();
    if (now - lastSparkle > SPARKLE_INTERVAL) {
      lastSparkle = now;
      spawnSparkle(e.clientX, e.clientY);
    }
  });

  // Default label per state if data-cursor-text is absent
  const DEFAULT_TEXT = {
    view:     'View',
    external: 'Open',
    email:    'Email',
    drag:     'Drag',
    hover:    ''
  };

  // Auto-tag existing lightbox triggers as VIEW so we do not have to touch
  // every individual .ad markup
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
