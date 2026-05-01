# BUILD SPEC

A complete technical reference for building sites on this stack. Provide this document alongside an HTML or PDF design spec. The AI should build the full site to these architectural standards, then ask the user the setup questions in the final section before writing any site-specific implementation details.

---

## 1. STACK OVERVIEW

| Layer | Tool | Version | Source |
|-------|------|---------|--------|
| Animation engine | GSAP | 3.13.0 | jsDelivr CDN |
| Scroll-based animation | GSAP ScrollTrigger | 3.13.0 (plugin) | jsDelivr CDN |
| Text splitting | GSAP SplitText | 3.13.0 (plugin) | jsDelivr CDN |
| Flip animations | GSAP Flip | 3.13.0 (plugin) | jsDelivr CDN (lightbox pages only) |
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
├── [page].html             ← One file per page (index.html, Portfolio.html, etc.)
├── theme.css               ← Light-mode overrides + theme toggle CSS (global)
├── nav.css                 ← Header rail, mobile nav, footer, SplitText line fix (global)
├── site-shell.js           ← <site-header> and <site-footer> custom elements
├── theme.js                ← Theme toggle click handler
├── css/
│   ├── cursor.css          ← Custom cursor styling
│   └── preloader.css       ← Preloader overlay + reveal mask
├── js/
│   ├── cursor.js           ← Cursor DOM element + optional particle canvas
│   ├── smooth-scroll.js    ← Lenis instance + GSAP ticker sync
│   ├── animations.js       ← AnimHelpers namespace (shared primitives)
│   ├── preloader.js        ← First-load preloader logic
│   └── pages/
│       ├── [page].js
│       └── [page]-lightbox.js  ← Only on pages with image galleries
└── img/                    ← All site images
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

<link rel="icon" type="image/png" href="img/[favicon]">

<!-- SEO meta, Open Graph, Twitter cards -->
<!-- Structured data (JSON-LD) -->

<!-- Fonts (preconnect first, then full CSS) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=[FONTS]&display=swap" rel="stylesheet">

<!-- Stylesheets (order matters: global → component → page) -->
<link rel="stylesheet" href="theme.css">
<link rel="stylesheet" href="nav.css">
<link rel="stylesheet" href="css/cursor.css">
<link rel="stylesheet" href="css/preloader.css">

<!-- Per-page CSS tokens (inline <style> block — see Section 3a) -->
<style>
  :root { /* design tokens here */ }
</style>

<!-- Shell (before GSAP so custom elements exist before animation scripts run) -->
<script src="site-shell.js" defer></script>

<!-- CDN: GSAP core + plugins -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js" defer></script>
<!-- Flip plugin only on pages with lightbox reverse-animations: -->
<!-- <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Flip.min.js" defer></script> -->

<!-- CDN: Lenis smooth scroll -->
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js" defer></script>

<!-- Local JS: core layer (order matters) -->
<script src="js/cursor.js" defer></script>
<script src="js/smooth-scroll.js" defer></script>
<script src="js/animations.js" defer></script>
<script src="js/preloader.js" defer></script>

<!-- Local JS: page-specific (always last) -->
<script src="js/pages/[page].js" defer></script>
<script src="js/pages/[page]-lightbox.js" defer></script><!-- only if page has a gallery -->
</head>

<body>
<site-header active="[nav-key]"></site-header>

<noscript>
  <!-- Plain HTML fallback nav for no-JS users -->
</noscript>

<div class="page">
  <!-- All page content goes here -->
</div>

<site-footer></site-footer>

<script src="theme.js"></script><!-- end of body so #theme-toggle exists -->
</body>
</html>
```

### 3a. CSS Custom Properties (per-page inline `<style>`)

Every page declares design tokens in its inline `<style>` block. Colors and fonts come from the design spec — the variable names and structure are fixed:

```css
:root {
  --bg:      [base background color];
  --bg-soft: [slightly lifted background for cards and panels];
  --fg:      [primary text color];
  --fg-2:    [secondary text, ~70% opacity];
  --fg-3:    [tertiary text, ~45% opacity];
  --rule:    [border/divider at ~18% opacity];
  --rule-2:  [hairline divider at ~10% opacity];
  --accent:  [brand color — used for links, hover states, progress bar, cursor];
  --sans:    [sans-serif font stack];
  --mono:    [monospace font stack];
  --italic:  [italic/serif font stack];
}
```

`theme.css` overrides these for light mode via `html[data-theme="light"]` selectors, which have higher specificity than `:root` and win regardless of load order.

---

## 4. HEADER & FOOTER

Both are Custom Elements v1 defined in `site-shell.js`. They replace themselves with injected HTML — no shadow DOM.

### `<site-header active="[key]">`

Inject the `active` attribute with the current page's nav key. The matching `.nav-link` gets `is-active`.

**Rendered structure:**

```html
<header class="rail" data-active="[key]">
  <a href="index.html" class="rail-brand" data-cursor="hover">[Site Name]</a>
  <nav class="rail-nav">
    <!-- One .nav-link per page; is-active added to matching key -->
    <a href="[page].html" class="nav-link" data-cursor="hover">[Label]</a>
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
  <nav><!-- same nav-links --></nav>
  <a class="mob-cta" href="mailto:[EMAIL]">Get in touch &rarr;</a>
</div>
```

**Behaviours (wired in `connectedCallback`):**
- Hamburger: adds `.open` to `.mob-nav`, sets `body overflow: hidden`; `.mob-close`, overlay click, and nav link clicks all close it
- Scroll-shrink: adds `.is-shrunk` to `.rail` after 80px scroll (height collapses from `--rail-h` to `--rail-h-shrunk`)
- Progress hairline: sets `--scroll-progress` CSS var on `.rail` as a percentage of total page scroll; the `.rail-progress` element reads it and becomes visible once shrunk
- Internal nav flag: click listener sets `sessionStorage.setItem('site-internal-nav', 'true')` on same-origin link clicks so the preloader skips on the destination page

### `<site-footer>`

```html
<footer class="foot">
  <div class="left">[Name]</div>
  <div class="center">&copy; [Year]</div>
  <div class="right"><a href="mailto:[EMAIL]">[EMAIL]</a></div>
</footer>
```

### Header / Footer CSS (`nav.css`)

```css
:root {
  --rail-h:        72px;   /* full height */
  --rail-h-shrunk: 52px;   /* scrolled height */
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
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: height .35s cubic-bezier(.2,.7,.2,1);
}
.rail.is-shrunk { height: var(--rail-h-shrunk); }

/* Nav links draw underline left-to-right on hover */
.nav-link { position: relative; padding: 4px 0; }
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
  height: 1px; background: var(--accent);
  width: var(--scroll-progress, 0%);
  opacity: 0; transition: opacity .25s; pointer-events: none;
}
.rail.is-shrunk .rail-progress { opacity: 1; }

/* Mobile breakpoint */
@media (max-width: 900px) {
  .rail { grid-template-columns: 1fr auto; padding: 0 22px; }
  .rail-nav, .rail-cta { display: none; }
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

/* SplitText line-mask fix — prevents descender clipping on tight line-heights */
.split-line { padding-bottom: 0.18em; margin-bottom: -0.1em; }

/* Global overflow safety */
html, body { overflow-x: hidden; }
```

---

## 5. SMOOTH SCROLL (`js/smooth-scroll.js`)

Lenis wired to the GSAP ticker so ScrollTrigger positions stay accurate.

```js
// Bails on prefers-reduced-motion, or if Lenis/GSAP failed to load.

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

// Pause/resume when a lightbox or modal is open (toggled via body.lb-open)
new MutationObserver(() => {
  document.body.classList.contains('lb-open') ? lenis.stop() : lenis.start();
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });

window.lenis = lenis; // exposed for external control
```

---

## 6. ANIMATION HELPERS (`js/animations.js`)

Shared primitives exposed as `window.AnimHelpers`. All functions bail silently if GSAP / ScrollTrigger / SplitText are unavailable.

```js
gsap.registerPlugin(SplitText, ScrollTrigger);
const A = window.AnimHelpers = {};
A.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### `A.reveal(target, opts)`

Generic stagger fade-up bound to scroll visibility.

```js
// target: Element | NodeList | Element[]
// opts: y (50), duration (0.85), ease ('power3.out'), stagger (0), start ('top 82%'), trigger

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

SplitText characters rise from below a line mask — the "type appearing" effect.

```js
// opts: duration (0.95), stagger (0.025), start ('top 82%')

const split = new SplitText(target, {
  type: 'chars,lines',
  mask: 'lines',
  linesClass: 'split-line',   // CSS in nav.css prevents descender clipping
  charsClass:  'split-char'
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

Image starts slightly zoomed in and eases to natural scale on scroll entry.

```js
// opts: from (1.06), trigger

gsap.fromTo(target,
  { scale: opts.from || 1.06 },
  { scale: 1, duration: 1.4, ease: 'power2.out',
    scrollTrigger: { trigger, start: 'top 80%', toggleActions: 'play none none reverse' }
  });
```

### `A.parallax(target, opts)`

Scrub-tied vertical drift while element is in view.

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

Choreographed hero entrance: kicker → name (SplitText) → supporting elements. Waits for `document.fonts.ready` so SplitText measures lines on final layout.

```js
// config: { name: '.hero-name', sub: '.hero-sub', kick: '.hero-kicker' }

const split = new SplitText(heroName, { type: 'chars,lines', mask: 'lines', ... });
const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

tl.fromTo(heroKick, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.15);
gsap.set(split.chars, { yPercent: 110 });
tl.to(split.chars, { yPercent: 0, duration: 1.0, stagger: 0.022 }, 0.25);
tl.fromTo(heroSub, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.3');
```

### `A.refreshOnLoad()`

Calls `ScrollTrigger.refresh()` on both `load` and `document.fonts.ready` so triggers land on the final post-font layout.

---

## 7. PAGE ANIMATION PATTERN

Each page has `js/pages/[page].js` that calls `AnimHelpers` primitives. The structure is consistent across all pages:

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

**Section header reveal pattern (reused on every page):**

```js
function revealSectionHead(section) {
  const num   = section.querySelector('.s-num');
  const title = section.querySelector('.s-title');
  if (num)   A.reveal(num,        { y: 16, duration: 0.5, start: 'top 88%' });
  if (title) A.splitReveal(title, { stagger: 0.025, start: 'top 82%' });
}
```

**Grid stagger pattern:**

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

Runs on first visit only — skipped on internal navigation (sessionStorage flag `site-internal-nav`).

### Architecture

The preloader is a fixed full-viewport overlay (z-index 9999) that covers the page while it loads, then reveals the page underneath via an animated CSS mask. The specific visual inside the overlay — logo, wordmark, animation, image — is defined by the user in setup (see Section 18).

**Fixed structure:**

```js
// 1. Build overlay and insert before body content
const el = document.createElement('div');
el.id = 'preloader';
el.className = 'preloader';
el.setAttribute('aria-hidden', 'true');
document.body.insertBefore(el, document.body.firstChild);
document.body.classList.add('preloader-active'); // overflow: hidden
```

**Reveal mechanism (CSS mask):**

The overlay removes itself by expanding a soft-edged transparent circle from a configurable origin point. The origin is set via `--reveal-x` / `--reveal-y` CSS variables (in px or %). `--hole` is a unitless number animated by GSAP from 0 → 150 over ~1.35s.

```css
.preloader--revealing {
  --soft: 3;
  mask-image: radial-gradient(
    circle at var(--reveal-x) var(--reveal-y),
    transparent calc((var(--hole) - var(--soft)) * 1%),
    black       calc(var(--hole) * 1%)
  );
}
```

```js
// Trigger reveal:
el.classList.add('preloader--revealing');
gsap.to(el, { '--hole': 150, duration: 1.35, ease: 'power3.inOut', onComplete: dismiss });
```

**Dismiss:**

```js
function dismiss(el) {
  el.classList.add('preloader--gone'); // opacity: 0, transition: .25s
  setTimeout(() => {
    document.body.classList.remove('preloader-active');
    el.remove();
  }, 350);
}
```

**Bail conditions:** element already exists, `sessionStorage('site-internal-nav') === 'true'`, `prefers-reduced-motion` (shows briefly then dismisses immediately).

**Target element hook:** if the reveal should originate from a specific element on the page, mark it with `data-preloader-target`. The preloader will position its content over that element's bounding rect and set `--reveal-x` / `--reveal-y` to its center.

---

## 9. CUSTOM CURSOR (`js/cursor.js` + `css/cursor.css`)

**Bail conditions:** `(pointer: coarse)` touch device, `prefers-reduced-motion: reduce`, GSAP not loaded.

### Architecture

Three DOM elements are appended to `<body>`:

```html
<div class="cursor" aria-hidden="true"></div>       <!-- main dot -->
<div class="cursor-ring" aria-hidden="true"></div>  <!-- optional ring -->
<canvas class="cursor-canvas" aria-hidden="true"></canvas> <!-- optional trail -->
```

`body.has-custom-cursor` hides the native OS cursor via CSS.

**Motion (GSAP quickTo — avoids per-mousemove tween allocation):**

```js
const xTo = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3' });
const yTo = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3' });
window.addEventListener('mousemove', (e) => { xTo(e.clientX); yTo(e.clientY); });
```

**State system (via `data-cursor` attribute):**

Add `data-cursor="[state]"` to any element. The cursor gains `.is-[state]` on `mouseenter`. The exact sizes and visual styles for each state are defined by the user in setup (see Section 18), but the states available are:

| State | Typical use |
|-------|------------|
| `hover` | Nav links, buttons |
| `view` | Lightbox-triggering images |
| `drag` | Draggable elements |
| `external` | Links opening new tabs |
| `email` | Email links |

**Particle canvas trail (optional — defined in setup):**
- Full-viewport canvas layered behind the cursor
- HiDPI-aware sizing (`canvas.width = vw * devicePixelRatio`)
- Particles are spawned on mousemove, rendered on the GSAP ticker
- Color reads from `--accent` CSS var, updates on `data-theme` change via MutationObserver

**Public API:**

```js
window.cursorBurst({ rect: element.getBoundingClientRect(), count: 80 });
// OR
window.cursorBurst({ x: 400, y: 300, count: 60 });
```

---

## 10. LIGHTBOX (`js/pages/[page]-lightbox.js`)

One lightbox instance per page. Both architecture and animation style are shared across all pages that use it.

### Required HTML (inside `.page`)

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
    { src: 'img/image.webp', hl: 'Headline.', meta: 'Caption · Detail' },
    ...
  ]
};
```

### Triggering an image

```html
<div class="ad" data-gallery="gallery-name" data-index="0">
  <img src="img/image.webp" alt="">
</div>
```

### Open animation

1. `.page` wrapper recedes: `scale(0.93)`, `filter: blur(10px)`, 0.7s
2. Backdrop fades in
3. Source image hidden; flying clone positioned over it at source rect
4. Clone animates to fullscreen via a 3-phase GSAP timeline:
   - **Anticipation:** slight backward tilt (`rotationX: -5`, `scale: 1.02`)
   - **Fold out:** travels to target rect with forward tilt, `z`-depth, motion blur, growing shadow
   - **Unfold flat:** settles to `rotationX: 0`, `z: 0` with a gentle `expo.out`
5. Caption and chrome fade in last

```js
gsap.set(clone, {
  transformPerspective: 1300,
  transformStyle: 'preserve-3d',
  transformOrigin: '50% 100%'  // hinge from bottom edge
});
```

### Close animation

Chrome fades, flying clone animates back to the source tile's rect, `.page` restores to `scale(1) blur(0)`.

### Prev / Next: 3D card flip

Outgoing image slides and rotates off (`rotationY ±16°`, motion blur); incoming starts pre-rotated on the opposite side and settles flat.

### Keyboard

- `Escape` → close
- `ArrowLeft` → previous
- `ArrowRight` → next
- Click outside image → close

**Body state:** `body.lb-open` is toggled by the lightbox. `smooth-scroll.js` watches this class to pause/resume Lenis.

---

## 11. DATA ATTRIBUTES REFERENCE

| Attribute | Value | Where used | Effect |
|-----------|-------|------------|--------|
| `data-theme` | `dark` / `light` | `<html>` | Activates CSS variable overrides in `theme.css` |
| `data-cursor` | `hover / view / drag / external / email` | Any element | Cursor enters named state on hover |
| `data-cursor-text` | string | Any element with `data-cursor` | Optional label shown near cursor |
| `data-preloader-target` | (no value) | Landmark image in hero | Preloader positions content over this element and reveals from its center |
| `data-gallery` | gallery name string | `.ad` elements | Links element to a gallery in lightbox JS |
| `data-index` | integer | `.ad` elements | Index into gallery array |
| `data-active` | nav key string | Set on `.rail` by site-shell | Drives active nav link state |

---

## 12. ACCESSIBILITY REQUIREMENTS

| Feature | Implementation |
|---------|---------------|
| Reduced motion | All GSAP animations guard with `matchMedia('prefers-reduced-motion: reduce').matches`. Preloader dismisses immediately. Lenis smooth scroll skips entirely. |
| Touch devices | Custom cursor and canvas trail hidden via `@media (pointer: coarse)` |
| ARIA | Preloader, cursor, canvas: `aria-hidden="true"`. Lightbox: `aria-hidden` toggled on open/close. All buttons have `aria-label`. |
| Noscript | Each page includes a `<noscript>` block with plain HTML navigation |
| Semantic markup | `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<article>` used appropriately |
| Keyboard | Lightbox: Escape / ArrowLeft / ArrowRight fully wired |

---

## 13. THEME SYSTEM

Theme persists in `localStorage` as `theme` (`dark` or `light`). Default is `dark`.

**Anti-flash bootstrap** (must be the very first `<script>` in `<head>`):

```html
<script>document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||'dark');</script>
```

**Toggle handler** (`theme.js`, at end of `<body>`):

```js
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#theme-toggle');
  if (!btn) return;
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});
```

**CSS overrides** (`theme.css`): use `html[data-theme="light"]` selectors — higher specificity than `:root`, wins regardless of file order.

`html { scrollbar-gutter: stable; }` prevents viewport-width jumps when `overflow: hidden` is applied (preloader, lightbox).

---

## 14. SCROLL TRIGGER DEFAULTS

```js
scrollTrigger: {
  trigger: element,
  start: 'top 82%',
  toggleActions: 'play none none reverse'
}
```

**Trigger thresholds by element type:**

| Element type | `start` value |
|---|---|
| Hero (on load, no scroll trigger) | — immediate |
| Section numbers, small labels | `top 88%` |
| Section titles (SplitText) | `top 82%` |
| Body paragraphs | `top 80%` |
| Cards / grid items | `top 78%` |
| Images (KenBurns) | `top 80%` |

---

## 15. SCRIPT LOADING RULES

1. Inline theme setter — **first script in `<head>`, always**. Prevents flash of wrong theme.
2. `site-shell.js` — deferred, before GSAP. Custom elements must exist before animation scripts query the nav.
3. GSAP core and plugins — before Lenis (Lenis GSAP integration requires GSAP).
4. `cursor.js`, `smooth-scroll.js`, `animations.js` — after GSAP + Lenis.
5. Page-specific JS — always last.
6. `theme.js` — end of `<body>`, not `<head>`, so `#theme-toggle` exists when the listener attaches.
7. All scripts use `defer` — execute in source order, zero render-blocking.

---

## 16. PERFORMANCE NOTES

- All scripts `defer` — zero render-blocking
- `gsap.quickTo()` for cursor — no new tween object per mousemove
- `gsap.ticker.lagSmoothing(0)` — prevents GSAP from compressing missed frames (keeps scroll linear)
- `ScrollTrigger.refresh()` called on both `window load` and `document.fonts.ready` to catch post-font layout shifts
- Canvas HiDPI: `canvas.width = vw * devicePixelRatio`; ctx transform scaled to match
- Lightbox flying clone reuses the `src` already in DOM — no extra network request
- `will-change: transform` used only on elements that actively animate position (cursor, transition overlays) — not added speculatively
- `scrollbar-gutter: stable` keeps layout stable when `overflow: hidden` is applied

---

## 17. BUILDING A NEW PAGE

Given a design spec (HTML or PDF):

1. Copy the HTML template from Section 3. Set the correct `active` attribute and `<title>`.
2. Fill in `:root` CSS custom properties from the design's color and type tokens.
3. Build page content inside `<div class="page">`. Use `.s-num` / `.s-title` class names for section headers so `revealSectionHead()` works without modification.
4. For image galleries: add `data-gallery` and `data-index` to `.ad` trigger elements; add matching gallery arrays to the lightbox JS file.
5. Mark the hero's primary visual with `data-preloader-target` if you want the preloader to reveal from that element's position.
6. Create `js/pages/[page].js` using the `init()` pattern. Guard with `if (A.reduced) return;`. Call `A.refreshOnLoad()` at the end.
7. Add `data-cursor` attributes to interactive elements per the table in Section 11.
8. No additional CSS files needed for most pages — the token system plus global sheets covers all structural styling.

---

## 18. SITE SETUP — AI PROMPT

> **INSTRUCTION FOR AI:** Before writing any site-specific code for the cursor, preloader, or page transitions, stop and ask the user the following questions. Collect all answers, then implement everything at once. Do not assume defaults — ask even if an option seems obvious.

---

**When you are ready to build, ask the user:**

---

### Cursor

> **What kind of cursor do you want?**
>
> Options (pick one or describe your own):
> - **A** — Simple dot. Small filled circle that follows the mouse with a slight lag. Grows slightly on hover. No trail.
> - **B** — Dot + ring. A dot at the pointer position and a larger ring that follows with more lag, inverting colors it passes over (`mix-blend-mode: difference`).
> - **C** — Dot + ring + particle trail. Same as B, with a canvas-rendered trail of small particles in your accent color that dissipate behind the cursor.
> - **D** — None. Use the default OS cursor throughout.
> - **Custom** — Describe what you want.
>
> For options A–C: should clicking trigger a burst of particles from the click point? (yes / no)

---

### Preloader

> **Do you want a preloader?** (yes / no)
>
> If yes:
>
> - **What should be shown while the page loads?** Describe the visual — for example: your logo, a wordmark, an animated icon, a loading bar, a percentage counter, a full-screen illustration, or just a solid color screen with nothing.
> - **Where should the reveal originate from?** Options: center of screen, top-left corner, the position of your logo/hero image on the page, or custom coordinates.
> - **What style of reveal?** Options: expanding circle that wipes the overlay away, fade out, slide up, slide left, or describe your own.
> - **Any intro animation before the reveal?** For example: a flickering effect, a count-up, a typewriter, or just show the element and immediately reveal.

---

### Page Transitions

> **What should happen when the user navigates between pages?**
>
> Options:
> - **A** — None. Native browser page load, no animation.
> - **B** — Simple fade. Current page fades out, next page fades in.
> - **C** — Slide. Pages slide left/right based on nav direction.
> - **D** — Color wipe. Colored panels sweep across the screen (like a curtain), then dissolve to reveal the new page.
> - **E** — Scale. Current page scales down and blurs while the new page scales up into view.
> - **Custom** — Describe what you want.
>
> If you choose any animated option: should a destination label (page name) appear during the transition? (yes / no)

---

### Scroll Feel

> **How should scrolling feel?**
>
> - **A** — Native. Standard browser scroll, no modification.
> - **B** — Smooth. Lenis smooth scroll with a gentle glide (1.15s duration, exponential easing).
> - **C** — Smooth, slower. More cinematic feel (1.6s duration).
> - **D** — Smooth, snappy. Faster settle (0.7s duration).

---

### Content Animations

> **How should content animate in as the user scrolls?**
>
> - **A** — Nothing. All content is visible immediately.
> - **B** — Fade up. Elements fade in and rise slightly as they enter the viewport.
> - **C** — Fade up with stagger. Groups of elements (cards, list items) appear one after another with a short delay between each.
> - **D** — Fade up + type reveal. Headlines use the SplitText character-by-character rising animation. Body content fades up.
> - **Custom** — Describe what you want.

---

### Dark / Light Mode

> **Should the site support a dark/light mode toggle?** (yes / no)
>
> If yes: which should be the default? (dark / light)

---

Once you have answers to all of the above, implement the full site.
