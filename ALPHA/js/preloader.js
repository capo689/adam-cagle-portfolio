// preloader.js
// First-load overlay. Black background, neon sign starts off, flickers
// on/off a few times, settles lit, then a soft-edged circular hole expands
// from the neon outward to reveal the page.
//
// Reduced-motion: skip the flicker and reveal animation, fade out fast.

(function () {
  // Inject the markup as the first element in body so it's covering everything
  // before any other paint can happen. Idempotent: bails if already present.
  if (document.getElementById('preloader')) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function build() {
    if (document.getElementById('preloader')) return;
    document.body.classList.add('preloader-active');

    const el = document.createElement('div');
    el.id = 'preloader';
    el.className = 'preloader';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<img class="preloader__neon" src="neon_off.png" data-state="off" alt="">';
    document.body.insertBefore(el, document.body.firstChild);
    return el;
  }

  function preloadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = img.onerror = () => resolve();
      img.src = src;
    });
  }

  function preloadHeroImages() {
    // Pick up the first few visible images on the page so the reveal lands on
    // a real, decoded layout rather than blank slots
    const imgs = Array.from(document.images).slice(0, 8);
    return Promise.all(imgs.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((res) => {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true });
      });
    }));
  }

  function dismiss(el) {
    el.classList.add('preloader--gone');
    setTimeout(() => {
      document.body.classList.remove('preloader-active');
      el.remove();
    }, 350);
  }

  function run(el) {
    const neon = el.querySelector('.preloader__neon');
    const usingGsap = typeof gsap !== 'undefined';

    if (reduced) {
      // Skip flicker + reveal. Just show the lit neon for a beat, fade out.
      neon.src = 'neonx.png';
      neon.dataset.state = 'on';
      setTimeout(() => dismiss(el), 600);
      return;
    }

    // Pre-decode both versions so the flicker has zero load-flicker
    Promise.all([preloadImage('neon_off.png'), preloadImage('neonx.png'), preloadHeroImages()])
      .then(() => {
        // Flicker schedule (ms): off, on, off, on, off, on (settle)
        // Each entry is { state: 'on' | 'off', hold: ms }
        const sequence = [
          { state: 'off', hold: 380 },  // start dim
          { state: 'on',  hold: 70  },  // brief flash
          { state: 'off', hold: 110 },
          { state: 'on',  hold: 50  },
          { state: 'off', hold: 220 },
          { state: 'on',  hold: 60  },
          { state: 'off', hold: 70  },
          { state: 'on',  hold: 1   }   // final settle (continues into hold)
        ];

        let acc = 0;
        sequence.forEach((step) => {
          setTimeout(() => {
            neon.src = step.state === 'on' ? 'neonx.png' : 'neon_off.png';
            neon.dataset.state = step.state;
          }, acc);
          acc += step.hold;
        });

        // After the last step settles on, hold briefly, then run the reveal
        const settleHold = 460;
        setTimeout(() => {
          if (usingGsap) {
            gsap.to(el, {
              '--hole': 150,
              duration: 1.35,
              ease: 'power3.inOut',
              onComplete: () => dismiss(el)
            });
          } else {
            // Fallback: animate via CSS transition by frame-stepping the var
            const start = performance.now();
            const dur = 1300;
            function step(now) {
              const t = Math.min(1, (now - start) / dur);
              // ease-in-out cubic
              const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
              el.style.setProperty('--hole', String(eased * 150));
              if (t < 1) requestAnimationFrame(step);
              else dismiss(el);
            }
            requestAnimationFrame(step);
          }
        }, acc + settleHold);
      });
  }

  function start() {
    const el = build();
    if (!el) return;
    run(el);
  }

  if (document.body) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start);
  }
})();
