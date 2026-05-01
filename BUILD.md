# BUILD SPEC — adamcagle.com

A complete technical reference for building sites to this stack. Provide this document alongside an HTML or PDF design spec; the AI should be able to produce a fully-functioning site matching all behaviour described below.

---

## 1. STACK OVERVIEW

| Layer | Tool | Version | Source |
|-------|------|---------|--------|
| Animation engine | GSAP | 3.13.0 | jsDelivr CDN |
| Scroll-based animation | GSAP ScrollTrigger | 3.13.0 (plugin) | jsDelivr CDN |
| Text splitting | GSAP SplitText | 3.13.0 (plugin) | jsDelivr CDN |
| Flip animations | GSAP Flip | 3.13.0 (plugin) | jsDelivr CDN (Portfolio only) |
| Smooth scroll | Lenis | 1.1.20 | jsDelivr CDN |
| Nav / shell | Custom Elements v1 | — | `site-shell.js` (local) |
| Lightbox | Custom (GSAP-driven) | — | `js/pages/*-lightbox.js` (local) |
| Preloader | Custom (GSAP + CSS mask) | — | `js/preloader.js` (local) |
| Cursor | Custom (GSAP + Canvas) | — | `js/cursor.js` (local) |
| Theme switching | CSS variables + localStorage | — | `theme.js` (local) |
| Markup | Semantic HTML5, no framework | — | — |
| Build step | None | — | All scripts loaded deferred |

No bundler, no framework, no build step. Everything is vanilla JS loaded as deferred `<script>` tags.

---

## 2. FILE STRUCTURE

```
/
├── index.html              ← Résumé
├── Portfolio.html
├── Agents.html
├── Books.html
├── Studio.html
├── theme.css               ← Light-mode overrides + theme toggle CSS (global)
├── nav.css                 ← Header rail, mobile nav, footer, SplitText line fix (global)
├── site-shell.js           ← <site-header> and <site-footer> custom elements
├── theme.js                ← Theme toggle click handler
├── css/
│   ├── cursor.css          ← Custom cursor + canvas trail styling
│   └── preloader.css       ← Preloader overlay + neon + mask
├── js/
│   ├── cursor.js           ← Cursor DOM element + particle canvas
│   ├── smooth-scroll.js    ← Lenis instance + GSAP ticker sync
│   ├── animations.js       ← AnimHelpers namespace (shared primitives)
│   ├── preloader.js        ← First-load neon flicker + mask reveal
│   └── pages/
│       ├── home.js
│       ├── portfolio.js
│       ├── portfolio-lightbox.js
│       ├── agents.js
│       ├── agents-lightbox.js
│       ├── books.js
│       └── studio.js
└── img/
    ├── neon-bluex.png      ← Neon sign (lit state)
    ├── neon-off-bluex.png  ← Neon sign (off state)
    └── ads/                ← Campaign images (webp + jpg)
```

---

## 3. HTML PAGE TEMPLATE

Every page follows this exact shell. Swap the page-specific values marked in `[brackets]`.

```html
<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>[Page Title]</title>

<!-- Theme bootstrap: runs before paint to prevent flash of wrong theme -->
<script>document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||'dark');</script>

<link rel="icon" type="image/png" href="img/cross.png">

<!-- SEO / OG / Twitter cards here -->

<!-- Structured Data (Person schema on home; adapt per page) -->
<script type="application/ld+json">{ ... }</script>

<!-- Fonts (preconnect first, then full CSS) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=[FONTS]&display=swap" rel="stylesheet">

<!-- Stylesheets (order matters) -->
<link rel="stylesheet" href="theme.css">
<link rel="stylesheet" href="nav.css">
<link rel="stylesheet" href="css/cursor.css">
<link rel="stylesheet" href="css/preloader.css">
<!-- page-specific inline <style> block with CSS custom properties goes here -->

<!-- Shell (must load before GSAP so custom elements parse before scripts run) -->
<script src="site-shell.js" defer></script>

<!-- CDN: GSAP core + plugins -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js" defer></script>
<!-- Add Flip only on pages that use lightbox reverse-animations: -->
<!-- <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Flip.min.js" defer></script> -->

<!-- CDN: Lenis smooth scroll -->
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js" defer></script>

<!-- Local JS: core layer -->
<script src="js/cursor.js" defer></script>
<script src="js/smooth-scroll.js" defer></script>
<script src="js/animations.js" defer></script>
<script src="js/preloader.js" defer></script>

<!-- Local JS: page-specific (last) -->
<script src="js/pages/[page].js" defer></script>
<script src="js/pages/[page]-lightbox.js" defer></script><!-- if page has lightbox -->
</head>

<body>
<!-- site-header injects .rail + .mob-nav, active attr sets highlighted nav item -->
<site-header active="[resume|portfolio|agents|books]"></site-header>

<noscript>
  <!-- Fallback nav (plain HTML) for no-JS users -->
</noscript>

<div class="page">
  <!-- All page content goes here -->
</div>

<site-footer></site-footer>

<script src="theme.js"></script><!-- runs after body for toggle wiring -->
</body>
</html>
```

### CSS Custom Properties (per-page inline `<style>`)

Every page declares its own design tokens in an inline `<style>` block inside `<head>`. Do not include fonts or palette choices here — that belongs to the design spec. Structure:

```css
:root {
  --bg:      [base background];
  --bg-soft: [slightly lifted background for cards/panels];
  --fg:      [primary text];
  --fg-2:    [secondary text, ~70% opacity];
  --fg-3:    [tertiary text, ~45% opacity];
  --rule:    [border/divider at ~18% opacity];
  --rule-2:  [hairline divider at ~10% opacity];
  --accent:  [brand colour used for links, hover states, progress bar];
  --sans:    [sans-serif font stack];
  --mono:    [monospace font stack];
  --italic:  [italic serif font stack];
}
```

`theme.css` overrides the above for light mode using `html[data-theme="light"]` selectors (higher specificity wins over `:root`).

---

## 4. HEADER & FOOTER

Both are implemented as Custom Elements v1 in `site-shell.js`. They render by replacing themselves with injected HTML — no shadow DOM, no encapsulation.

### `<site-header active="[key]">`

**Rendered output:**

```html
<header class="rail" data-active="[key]">
  <a href="index.html" class="rail-brand" data-cursor="hover">Adam R. Cagle</a>
  <nav class="rail-nav">
    <a href="index.html"     class="nav-link [is-active]" data-cursor="hover">Résumé</a>
    <a href="Portfolio.html" class="nav-link [is-active]" data-cursor="hover">Portfolio</a>
    <a href="Agents.html"    class="nav-link [is-active]" data-cursor="hover">AI Agents</a>
    <a href="Books.html"     class="nav-link [is-active]" data-cursor="hover">Books</a>
  </nav>
  <div class="rail-right">
    <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
      <span class="toggle-icon">&#x25D0;</span><span class="toggle-pill"></span>
    </button>
    <a class="rail-cta" href="mailto:[EMAIL]" data-cursor="email" data-cursor-text="Hello">
      Get in touch <span class="arrow">&rarr;</span>
    </a>
    <button class="hamburger" id="hamburger" aria-label="Open menu">
      <span></span><span></span><span></span>
    </button>
  </div>
  <span class="rail-progress" aria-hidden="true"></span>
</header>

<div class="mob-nav" id="mob-nav">
  <button class="mob-close" id="mob-close" aria-label="Close menu">&times; close</button>
  <nav><!-- same nav-links as above --></nav>
  <a class="mob-cta" href="mailto:[EMAIL]">Get in touch &rarr;</a>
</div>
```

**Nav keys:** `resume` → `index.html`, `portfolio` → `Portfolio.html`, `agents` → `Agents.html`, `books` → `Books.html`.

**Behaviours wired in `connectedCallback`:**
- Hamburger opens `.mob-nav` by adding `.open`, sets `body overflow: hidden`
- Clicking `.mob-close`, clicking the overlay, or clicking a nav link closes it
- Scroll listener: adds `.is-shrunk` to `.rail` after 80px scroll (height collapses from `--rail-h` to `--rail-h-shrunk`)
- Scroll progress: sets CSS var `--scroll-progress` as `(scrollY / maxScrollY * 100)%` on `.rail`; the `.rail-progress` hairline reads it

**Internal nav flag:** `site-shell.js` also listens for clicks on same-origin links and sets `sessionStorage.setItem('site-internal-nav', 'true')` so the preloader knows to skip on the destination page.

### `<site-footer>`

**Rendered output:**

```html
<footer class="foot">
  <div class="left">Adam R. Cagle</div>
  <div class="center">&copy; 2026</div>
  <div class="right"><a href="mailto:[EMAIL]">[EMAIL]</a></div>
</footer>
```

### Header / Footer CSS (from `nav.css`)

```css
:root {
  --rail-h:        72px;
  --rail-h-shrunk: 52px;
  --rail-pad-x:    32px;
}

.rail {
  position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  display: grid;
  grid-template-columns: minmax(auto, 1fr) auto minmax(auto, 1fr);
  align-items: center;
  gap: 32px;
  padding: 0 var(--rail-pad-x);
  height: var(--rail-h);
  background: linear-gradient(180deg, rgba(15,15,14,0.96), rgba(15,15,14,0.78) 70%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: height .35s cubic-bezier(.2,.7,.2,1);
}
.rail.is-shrunk { height: var(--rail-h-shrunk); }

/* Nav links draw underline left-to-right on hover */
.nav-link {
  position: relative; padding: 4px 0;
  transition: color .25s;
}
.nav-link::after {
  content: '';
  position: absolute; left: 0; right: 0; bottom: 0; height: 1px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform .35s cubic-bezier(.2,.7,.2,1);
}
.nav-link:hover::after,
.nav-link.is-active::after { transform: scaleX(1); }

/* Scroll progress hairline */
.rail-progress {
  position: absolute; bottom: 0; left: 0;
  height: 1px;
  background: var(--accent);
  width: var(--scroll-progress, 0%);
  opacity: 0; transition: opacity .25s; pointer-events: none;
}
.rail.is-shrunk .rail-progress { opacity: 1; }

/* Mobile: hide rail-nav and CTA, show hamburger */
@media (max-width: 900px) {
  .rail { grid-template-columns: 1fr auto; padding: 0 22px; }
  .rail-nav { display: none; }
  .rail-cta { display: none; }
  .hamburger { display: flex; }
}

/* Mobile overlay */
.mob-nav {
  position: fixed; inset: 0; z-index: 200;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none; transition: opacity .3s;
}
.mob-nav.open { opacity: 1; pointer-events: all; }

/* Footer */
.foot {
  padding: 36px 0 56px; border-top: 1px solid var(--rule);
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;
}
@media (max-width: 640px) {
  .foot { grid-template-columns: 1fr; text-align: center; }
}

/* SplitText line-mask fix: prevents descender clipping on tight line-heights */
.split-line {
  padding-bottom: 0.18em;
  margin-bottom: -0.1em;
}
```

---

## 5. SMOOTH SCROLL (`js/smooth-scroll.js`)

Lenis instance wired to the GSAP ticker so ScrollTrigger positions stay accurate.

```js
const lenis = new Lenis({
  duration: 1.15,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  smoothTouch: false,
  wheelMultiplier: 1,
  touchMultiplier: 2,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

// Smooth-scroll in-page anchors with 80px offset for the fixed nav
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const target = document.querySelector(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  lenis.scrollTo(target, { offset: -80 });
});

// Pause when a lightbox or modal is open (body.lb-open class)
new MutationObserver(() => {
  document.body.classList.contains('lb-open') ? lenis.stop() : lenis.start();
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });

window.lenis = lenis; // exposed for external control
```

**Bail conditions:** `prefers-reduced-motion: reduce`, Lenis not loaded, GSAP not loaded.

---

## 6. ANIMATION HELPERS (`js/animations.js`)

Shared primitives exposed as `window.AnimHelpers`. All functions bail silently if GSAP / ScrollTrigger / SplitText are unavailable.

```js
gsap.registerPlugin(SplitText);
gsap.registerPlugin(ScrollTrigger);

const A = window.AnimHelpers = {};
A.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### `A.reveal(target, opts)`

Generic stagger fade-up bound to scroll visibility.

```js
// target: Element | NodeList | Element[]
// opts:
//   y        — start offset in px (default 50)
//   duration — seconds (default 0.85)
//   ease     — GSAP ease string (default 'power3.out')
//   stagger  — seconds between each element (default 0)
//   start    — ScrollTrigger start (default 'top 82%')
//   trigger  — override trigger element (default first element)

gsap.set(els, { y: opts.y ?? 50, opacity: 0 });
gsap.to(els, {
  y: 0, opacity: 1,
  duration: opts.duration || 0.85,
  ease: opts.ease || 'power3.out',
  stagger: opts.stagger || 0,
  scrollTrigger: {
    trigger: trigger,
    start: opts.start || 'top 82%',
    toggleActions: 'play none none reverse'
  }
});
```

### `A.splitReveal(target, opts)`

SplitText characters rise from below a line mask (masking creates the "type appearing" effect).

```js
// opts: duration (0.95), stagger (0.025), start ('top 82%')

const split = new SplitText(target, {
  type: 'chars,lines',
  mask: 'lines',
  linesClass: 'split-line',  // .split-line CSS fix in nav.css prevents descender clip
  charsClass: 'split-char'
});
gsap.set(split.chars, { yPercent: 110 });
gsap.to(split.chars, {
  yPercent: 0,
  duration: opts.duration || 0.95,
  ease: 'power3.out',
  stagger: opts.stagger || 0.025,
  scrollTrigger: { trigger: target, start: opts.start || 'top 82%', toggleActions: 'play none none reverse' }
});
return split;
```

### `A.kenBurns(target, opts)`

Image starts slightly zoomed in (~6%) and eases to 1:1 scale on scroll entry.

```js
// opts: from (1.06), trigger

gsap.fromTo(target,
  { scale: opts.from || 1.06 },
  { scale: 1, duration: 1.4, ease: 'power2.out',
    scrollTrigger: { trigger, start: 'top 80%', toggleActions: 'play none none reverse' }
  });
```

### `A.parallax(target, opts)`

Scrub-tied vertical drift.

```js
// opts: distance (-60), scrub (0.6), trigger

gsap.to(target, {
  y: opts.distance ?? -60,
  ease: 'none',
  scrollTrigger: {
    trigger: opts.trigger || target,
    start: 'top bottom', end: 'bottom top',
    scrub: opts.scrub ?? 0.6
  }
});
```

### `A.heroReveal(config)`

Choreographed hero entrance: kicker fade → name SplitText rise → sub fade. Waits for `document.fonts.ready` so SplitText measures lines on final layout.

```js
// config: { name: '.hero-name', sub: '.hero-sub', kick: '.hero-kicker' }

const split = new SplitText(heroName, { type: 'chars,lines', mask: 'lines', ... });
const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

// kicker: 0.15s delay, from y:12 opacity:0
tl.fromTo(heroKick, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.15);

// name chars: stagger 0.022, 1.0s, yPercent 110→0
gsap.set(split.chars, { yPercent: 110 });
tl.to(split.chars, { yPercent: 0, duration: 1.0, stagger: 0.022 }, 0.25);

// sub: overlaps end of name, from y:16 opacity:0
tl.fromTo(heroSub, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.3');
```

### `A.refreshOnLoad()`

Calls `ScrollTrigger.refresh()` on both `load` and `document.fonts.ready` so triggers land on the final post-font layout.

---

## 7. PAGE ANIMATION PATTERN

Each page has a corresponding `js/pages/[page].js` that calls `AnimHelpers` primitives in a structured `init()` function. The pattern is consistent:

```js
(function () {
  const A = window.AnimHelpers;
  if (!A) return;

  function init() {
    if (A.reduced) return; // respect prefers-reduced-motion

    initHero();
    initSection1();
    initSection2();
    // ...
    A.refreshOnLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

### Section head reveal pattern (reused on every page)

```js
function revealSectionHead(section) {
  const num   = section.querySelector('.s-num');
  const title = section.querySelector('.s-title');
  if (num)   A.reveal(num,        { y: 16, duration: 0.5, start: 'top 88%' });
  if (title) A.splitReveal(title, { stagger: 0.025, start: 'top 82%' });
}
```

### Grid stagger pattern

```js
gsap.set(items, { y: 50, opacity: 0 });
gsap.to(items, {
  y: 0, opacity: 1,
  duration: 0.85, ease: 'power3.out',
  stagger: { each: 0.12, from: 'start' },
  scrollTrigger: { trigger: grid, start: 'top 78%', toggleActions: 'play none none reverse' }
});
```

---

## 8. PRELOADER (`js/preloader.js` + `css/preloader.css`)

First-load only — skipped on internal navigation (sessionStorage flag `site-internal-nav`).

### Flow

1. Build a fixed overlay `#preloader.preloader` (black, z-index 9999), insert as first child of body. Add `body.preloader-active` (sets `overflow: hidden`).
2. Pre-load both neon PNG images before starting.
3. Find the page's resting neon image via `[data-preloader-target]` or fallback selectors. Wait for it to decode and lay out.
4. Position `.preloader__neon` exactly over the page's resting neon (same `top/left/width/height`). Set `--reveal-x` / `--reveal-y` CSS vars to the neon's center point.
5. Run **flicker sequence**: a timed sequence of swapping `img.src` between off and on PNGs:
   ```
   off 360ms → on 55ms → off 90ms → on 45ms → off 130ms → on 35ms → off 70ms → on 480ms (settle)
   ```
6. After settling, add `.preloader--revealing`. Animate `--hole` from 0 → 150 over 1.35s (`power3.inOut`) via GSAP. The CSS mask expands a soft-edged transparent disc from the neon's center.
7. On complete, add `.preloader--gone` (fades to opacity 0 over 250ms), then remove from DOM.

### CSS Mask Mechanism

```css
.preloader--revealing {
  --soft: 3; /* soft-edge width as percent */
  mask-image: radial-gradient(
    circle at var(--reveal-x) var(--reveal-y),
    transparent calc((var(--hole) - var(--soft)) * 1%),
    black       calc(var(--hole) * 1%)
  );
}
```

`--hole` is a unitless number animated from 0 → 150. At 0 the overlay is fully opaque. At 150 the transparent circle extends beyond the viewport edges.

### Neon image markup

```html
<img class="preloader__neon" src="img/neon-off-bluex.png" data-state="off" alt="">
```

The preloader loads `img/neon-bluex.png` (on) and `img/neon-off-bluex.png` (off). The page's resting neon should also use `neon-bluex.png` so they register pixel-for-pixel.

Mark the page's resting neon with `data-preloader-target` to give the preloader an explicit hook:

```html
<img src="img/neon-bluex.png" data-preloader-target alt="">
```

**Bail conditions:** already run (element exists), arrived via internal nav (sessionStorage), `prefers-reduced-motion` (shows immediately, skips flicker).

---

## 9. CUSTOM CURSOR (`js/cursor.js` + `css/cursor.css`)

**Bail conditions:** `(pointer: coarse)` (touch device), `prefers-reduced-motion: reduce`, GSAP not loaded.

### DOM elements created

```html
<div class="cursor" aria-hidden="true"></div>       <!-- the dot -->
<div class="cursor-ring" aria-hidden="true"></div>  <!-- the ring -->
<canvas class="cursor-canvas" aria-hidden="true"></canvas> <!-- particle trail -->
```

`body.has-custom-cursor` is added when active; CSS hides the native cursor.

### Cursor motion

```js
const xTo = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3' });
const yTo = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3' });
// ring uses same settings

window.addEventListener('mousemove', (e) => {
  xTo(e.clientX); yTo(e.clientY);
  ringX(e.clientX); ringY(e.clientY);
  // also spawns canvas particles every 6ms
});
```

### Cursor states (via `data-cursor` attribute)

Add `data-cursor="[state]"` to any element. The cursor and ring gain `.is-[state]` on `mouseenter`:

| `data-cursor` value | Cursor size | Behaviour |
|---------------------|-------------|-----------|
| `view` | 96px | White, `mix-blend-mode: difference` |
| `drag` | 96px | White, `mix-blend-mode: difference` |
| `external` | 84px | White, `mix-blend-mode: difference` |
| `email` | 84px | White, `mix-blend-mode: difference` |
| `hover` | 36px | White, `mix-blend-mode: difference` |

Default state: 14px filled circle in `--accent` colour.

All `.ad[data-gallery]` elements are automatically given `data-cursor="view"` by cursor.js.

### Canvas particle trail

- Full-viewport canvas, `mix-blend-mode: screen` (dark mode) or `multiply` (light mode)
- HiDPI-aware: `canvas.width = vw * devicePixelRatio`
- Pool: max 1400 particles; spawn 4 per every 6ms of mouse movement
- Each particle: random radial angle, speed 0.2–1.05, radius 0.45–1.55px, lifetime 850–1800ms, decay 0.99 per frame
- Color: reads `--accent` from CSS and updates on `data-theme` change via MutationObserver

### `window.cursorBurst(opts)`

One-shot particle explosion from any script:

```js
window.cursorBurst({
  rect: element.getBoundingClientRect(), // scatter across an element's surface
  count: 80                               // default 80
});
// OR
window.cursorBurst({ x: 400, y: 300, count: 60 });
```

---

## 10. LIGHTBOX (`js/pages/portfolio-lightbox.js` / `agents-lightbox.js`)

Both lightboxes share identical architecture. One instance per page.

### Required HTML (add inside `.page`)

```html
<div id="lightbox" class="lb" aria-hidden="true">
  <img class="lb-img" src="" alt="">
  <div class="lb-chrome">
    <div class="lb-cap-l"></div>
    <div class="lb-cap-r"></div>
    <button class="lb-close" aria-label="Close">&times;</button>
    <button class="lb-prev"  aria-label="Previous">&#8592;</button>
    <button class="lb-next"  aria-label="Next">&#8594;</button>
  </div>
</div>
```

### Gallery data structure

```js
const galleries = {
  'gallery-name': [
    { src: 'img/ads/image.webp', hl: 'Headline.', meta: 'Campaign Name · Detail' },
    ...
  ]
};
```

### Triggering an image

```html
<div class="ad" data-gallery="gallery-name" data-index="0">
  <img src="img/ads/image.webp" alt="">
</div>
```

### Open animation: Cinematic fold

1. The `.page` wrapper recedes: `scale(0.93)`, `filter: blur(10px)`, 0.7s
2. Backdrop fades in: `#lightbox` opacity 0 → 1
3. Source image is hidden (`opacity: 0`); a flying clone is positioned over it
4. Clone animates to fullscreen via a 3-phase GSAP timeline:
   - **Anticipation:** `rotationX: -5`, `scale: 1.02` (0.28s, `sine.in`)
   - **Fold out:** clone travels to target rect, `rotationX: 22`, `z: 220`, `boxShadow` grows (0.78s, `power3.inOut`); motion blur `blur(2.2px)` runs simultaneously
   - **Unfold flat:** `rotationX: 0`, `z: 0` (0.7s, `expo.out`)
5. Caption and chrome fade in last (0.45s)

```js
gsap.set(clone, {
  transformPerspective: 1300,
  transformStyle: 'preserve-3d',
  transformOrigin: '50% 100%'  // hinge from bottom edge
});
```

### Close animation

Reverse of open: chrome fades, flying clone animates back to the source tile's current rect, `.page` returns to `scale(1)`, `blur(0)`.

### Prev / Next: 3D card flip

```js
// Outgoing: x ±32vw, rotationY ±16°, blur(6px), opacity 0, 0.45s power2.in
// Incoming: starts on opposite side pre-rotated, settles to x:0 rotationY:0 blur(0) opacity:1, 0.65s power3.out
```

### Keyboard

- `Escape` → close
- `ArrowLeft` → prev
- `ArrowRight` → next
- Click outside image → close

### Body state

`body.lb-open` is added when lightbox opens and removed on close. `smooth-scroll.js` watches this class to pause/resume Lenis.

---

## 11. DATA ATTRIBUTES REFERENCE

| Attribute | Value | Where used | Effect |
|-----------|-------|------------|--------|
| `data-theme` | `dark` / `light` | `<html>` | Activates CSS variable overrides in `theme.css` |
| `data-cursor` | `view / drag / external / email / hover` | Any element | Cursor enters named state on hover |
| `data-cursor-text` | string | Any element with `data-cursor` | Optional tooltip text |
| `data-preloader-target` | (no value) | Page neon `<img>` | Gives preloader explicit landing target |
| `data-gallery` | gallery name string | `.ad` elements | Links image to a gallery array in lightbox JS |
| `data-index` | integer | `.ad` elements | Index into gallery array |
| `data-active` | nav key string | `.rail` (set by site-shell) | Marks active state on nav rail |

---

## 12. ACCESSIBILITY REQUIREMENTS

| Feature | Implementation |
|---------|---------------|
| Reduced motion | All GSAP animations bail if `matchMedia('prefers-reduced-motion: reduce').matches`. Preloader skips flicker. Lenis skips entirely. |
| Touch devices | Custom cursor (`pointer: coarse`) and canvas trail hidden |
| ARIA | Preloader, cursor, canvas: `aria-hidden="true"`. Lightbox: `aria-hidden` toggled on open/close. Hamburger: `aria-label` |
| Noscript | Each page includes a `<noscript>` block with plain HTML navigation |
| Semantic markup | `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<article>` used correctly |
| Focus management | Native browser focus; no custom focus traps |
| Keyboard | Lightbox: Escape / ArrowLeft / ArrowRight fully wired |

---

## 13. THEME SYSTEM

Theme is stored in `localStorage` as `theme` (`dark` or `light`).

**Anti-flash bootstrap** (inline, before any CSS loads):
```html
<script>document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||'dark');</script>
```

**Switching** (`theme.js`, runs at end of `<body>`):
```js
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#theme-toggle');
  if (!btn) return;
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});
```

**CSS overrides** (`theme.css`) use `html[data-theme="light"]` selectors which have higher specificity than `:root`, so they win regardless of file load order.

`html { scrollbar-gutter: stable; }` is set in `theme.css` to prevent viewport-width jumps when `overflow: hidden` is applied (preloader, lightbox).

---

## 14. SCROLL TRIGGER DEFAULTS

All scroll-triggered animations use these consistent settings unless noted otherwise:

```js
scrollTrigger: {
  trigger: element,
  start: 'top 82%',           // fires when element top crosses 82% down from viewport top
  toggleActions: 'play none none reverse'  // plays on enter, reverses on leave-back
}
```

Trigger thresholds by element type:
- Hero elements: immediate (no ScrollTrigger; timeline plays on page load)
- Section numbers / small labels: `top 88%`
- Section titles (SplitText): `top 82%`
- Body paragraphs: `top 80%`
- Cards / grid items: `top 78%`
- Images (KenBurns): `top 80%`

---

## 15. SCRIPT LOADING RULES

1. The inline theme setter must be the **first script in `<head>`** — no exceptions. It prevents flash of wrong theme.
2. `site-shell.js` must be **deferred** and come before GSAP so the custom elements are defined before any animation script tries to query `.rail` or `.foot`.
3. GSAP and its plugins load **before** Lenis (Lenis's GSAP integration requires GSAP to exist).
4. `smooth-scroll.js`, `cursor.js`, `animations.js` load **after** GSAP + Lenis.
5. Page-specific JS loads **last**.
6. `theme.js` loads at **end of body** (not in head) so `#theme-toggle` exists when the listener is added.
7. All CDN scripts and local scripts use `defer` — they execute in source order after DOM parsing.

---

## 16. PERFORMANCE NOTES

- All scripts: `defer` — zero render-blocking
- Canvas HiDPI: `canvas.width = vw * devicePixelRatio`; transform scaled to match
- Particle pool capped at 1400; pooled spawn prevents GC spikes
- `gsap.quickTo()` for cursor — avoids creating tween objects on every mousemove
- `ScrollTrigger.refresh()` called on both `window load` and `document.fonts.ready` to catch post-font layout shifts
- `gsap.ticker.lagSmoothing(0)` — prevents GSAP from compressing missed frames into one large jump (keeps scroll feel linear)
- Lightbox images: flying clone reuses the `src` already in the DOM; no extra network request
- `will-change: transform` on cursor and `.barba-band` elements only (CSS hint, not overused)

---

## 17. BUILDING A NEW PAGE

Given a design spec (HTML or PDF):

1. Copy the HTML template from Section 3. Set the correct `active` attribute and `<title>`.
2. Write the `:root` CSS custom properties in the inline `<style>` block per the design's token system.
3. Build page HTML inside `<div class="page">`. Use semantic section structure with `.s-num` / `.s-title` heading patterns for section headers.
4. For any image gallery, add `data-gallery="[name]" data-index="[n]"` to clickable `.ad` elements and add the matching gallery array to the lightbox JS file.
5. For the preloader to land correctly, add `data-preloader-target` to the hero neon image.
6. Create `js/pages/[page].js`: wire `AnimHelpers` calls to the page's DOM selectors. Follow the `init()` pattern: guard with `if (A.reduced) return;`, call `A.refreshOnLoad()` at the end.
7. Add `data-cursor="[state]"` attributes to interactive elements per the table in Section 11.
8. No additional CSS files are needed for most pages — the token system in the inline `<style>` block combined with the global sheets handles all structural styling.
