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

  // Tiny particle trail. Higher density, smaller dots.
  const SPARKLE_INTERVAL = 10;
  let lastSparkle = 0;

  function spawnSparkle(x, y) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    document.body.appendChild(s);

    const jx   = (Math.random() - 0.5) * 8;
    const dy   = 6 + Math.random() * 14;
    const size = 0.55 + Math.random() * 0.7;
    const dur  = 0.45 + Math.random() * 0.35;

    gsap.set(s, { x: x, y: y, opacity: 0.85, scale: size });
    gsap.to(s, {
      x: x + jx,
      y: y + dy,
      opacity: 0,
      duration: dur,
      ease: 'power1.out',
      onComplete: () => s.remove()
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
