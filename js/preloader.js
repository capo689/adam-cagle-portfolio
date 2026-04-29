// preloader.js
// First-load overlay. Black background, neon sign starts off, flickers
// on/off a few times, settles lit, then a soft-edged circular hole expands
// from the neon's resting position outward to reveal the page.
//
// The sign positions itself at the page's actual neon image element (querying
// by data-preloader-target or fallback selectors). On the resume page that
// puts it at the bottom-left of the hero, exactly where the page's neon will
// be after reveal. On other pages it falls back to centered.

(function () {
  if (document.getElementById('preloader')) return;

  // Skip the preloader on internal nav (the slab transition handles arrival)
  if (window.__siteArrivedViaSlab) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Both themes currently use the blue neon PNG set; the theme-conditional
  // glow color is handled in preloader.css.
  const NEON_ON  = 'img/neon-blue-web.png';
  const NEON_OFF = 'img/neon-blueoff-web.png';

  function build() {
    if (document.getElementById('preloader')) return;
    document.body.classList.add('preloader-active');
    const el = document.createElement('div');
    el.id = 'preloader';
    el.className = 'preloader';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<img class="preloader__neon" src="' + NEON_OFF + '" data-state="off" alt="">';
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

  // Find the page's resting neon element so the preloader can land on it.
  // Prefers an explicit [data-preloader-target] hook; falls back to common
  // selectors. Returns the element or null.
  function findTarget() {
    return document.querySelector('[data-preloader-target]')
        || document.querySelector('.hero img[src*="neon_on"]')
        || document.querySelector('.hero img[src*="neon-blue-web"]')
        || document.querySelector('img[src*="neon_on"]')
        || document.querySelector('img[src*="neon-blue-web"]')
        || null;
  }

  // Wait for the target image to lay out so its bounding rect is real.
  function waitForLayout(target) {
    if (!target) return Promise.resolve();
    return new Promise((resolve) => {
      function check() {
        const r = target.getBoundingClientRect();
        if (r && r.width > 0 && r.height > 0) {
          resolve(r);
        } else {
          requestAnimationFrame(check);
        }
      }
      // Trigger after fonts and target image both decode
      const imgReady = (target.tagName === 'IMG' && !target.complete)
        ? new Promise((r) => { target.addEventListener('load', r, { once: true }); target.addEventListener('error', r, { once: true }); })
        : Promise.resolve();
      const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
      Promise.all([imgReady, fontsReady]).then(check);
    });
  }

  function placeNeon(el, rect) {
    const neon = el.querySelector('.preloader__neon');
    if (!rect) {
      // No target. Stay centered (default CSS).
      neon.dataset.ready = 'true';
      el.style.setProperty('--reveal-x', '50%');
      el.style.setProperty('--reveal-y', '50%');
      return;
    }
    // Position the preloader neon on top of the page's neon, same size
    Object.assign(neon.style, {
      top: rect.top + 'px',
      left: rect.left + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      maxWidth: 'none',
      transform: 'none'
    });
    neon.dataset.ready = 'true';
    // Reveal expands from the center of the target
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    el.style.setProperty('--reveal-x', cx + 'px');
    el.style.setProperty('--reveal-y', cy + 'px');
  }

  function dismiss(el) {
    el.classList.add('preloader--gone');
    setTimeout(() => {
      document.body.classList.remove('preloader-active');
      el.remove();
    }, 350);
  }

  function runFlicker(neon, onDone) {
    const sequence = [
      { state: 'off', hold: 380 },
      { state: 'on',  hold: 70  },
      { state: 'off', hold: 110 },
      { state: 'on',  hold: 50  },
      { state: 'off', hold: 220 },
      { state: 'on',  hold: 60  },
      { state: 'off', hold: 70  },
      { state: 'on',  hold: 460 } // settle hold
    ];
    let acc = 0;
    sequence.forEach((step, i) => {
      setTimeout(() => {
        neon.src = step.state === 'on' ? NEON_ON : NEON_OFF;
        neon.dataset.state = step.state;
        if (i === sequence.length - 1) {
          setTimeout(onDone, step.hold);
        }
      }, acc);
      acc += step.hold;
    });
  }

  function runReveal(el, onDone) {
    if (typeof gsap !== 'undefined') {
      gsap.to(el, {
        '--hole': 150,
        duration: 1.35,
        ease: 'power3.inOut',
        onComplete: onDone
      });
      return;
    }
    const start = performance.now();
    const dur = 1300;
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      el.style.setProperty('--hole', String(eased * 150));
      if (t < 1) requestAnimationFrame(step);
      else onDone();
    }
    requestAnimationFrame(step);
  }

  function run(el) {
    const neon = el.querySelector('.preloader__neon');

    if (reduced) {
      neon.src = NEON_ON;
      neon.dataset.state = 'on';
      neon.dataset.ready = 'true';
      setTimeout(() => dismiss(el), 600);
      return;
    }

    Promise.all([preloadImage(NEON_OFF), preloadImage(NEON_ON)])
      .then(() => {
        // Wait for layout to find the target, then position the neon there
        const ready = (document.readyState === 'complete' || document.readyState === 'interactive')
          ? Promise.resolve()
          : new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }));

        ready.then(() => {
          const target = findTarget();
          waitForLayout(target).then((rect) => {
            placeNeon(el, rect);
            runFlicker(neon, () => {
              runReveal(el, () => dismiss(el));
            });
          });
        });
      });
  }

  function start() {
    const el = build();
    if (!el) return;
    run(el);
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
