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

  window.addEventListener('mousemove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
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
