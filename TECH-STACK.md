# adamcagle.com — Tech Stack
*Live site as of May 2026. Main directory only.*

---

## Hosting & Deployment

| | |
|---|---|
| **Platform** | Vercel |
| **Config** | `vercel.json` — canonical redirect from `adam-cagle-portfolio.vercel.app` → `adamcagle.com`, cache headers (`public, max-age=0, must-revalidate`) on all routes |
| **Clean URLs** | Disabled (explicit `.html` extensions in all links) |

---

## Third-Party Libraries (CDN)

### Lenis — Smooth Scroll
- **Version:** 1.1.20
- **Source:** `cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js`
- **Used on:** All main nav pages, all writing-sample reader pages
- **Role:** Replaces native scroll with a momentum-based smooth scroll. Wired to the GSAP ticker in `js/smooth-scroll.js` so ScrollTrigger scrubs stay frame-accurate.
- **Accessibility note:** Bails automatically on `prefers-reduced-motion: reduce`.

### GSAP (GreenSock Animation Platform)
- **Version:** 3.13.0
- **Source:** `cdn.jsdelivr.net/npm/gsap@3.13.0/dist/`
- **Plugins loaded per page:**

| Plugin | File | Pages |
|---|---|---|
| Core | `gsap.min.js` | All pages except Contact |
| ScrollTrigger | `ScrollTrigger.min.js` | All pages with scroll animations |
| SplitText | `SplitText.min.js` | index, Resume, Studio, Portfolio, Agents |
| Flip | `Flip.min.js` | Portfolio only |

- **Role:** Powers all entrance animations, parallax, scroll-scrubbed reveals, text character/word splitting for animated headlines, and Flip-based layout transitions on Portfolio.

### Google Fonts
- **Source:** `fonts.googleapis.com`
- **Fonts by section:**

| Font | Weights/Variants | Used on |
|---|---|---|
| Geist | 300–900 | All main nav pages, writing-sample reader pages |
| Geist Mono | 400, 500 | All main nav pages, writing-sample reader pages |
| Instrument Serif | Regular, Italic | All main nav pages, writing-sample reader pages |
| Source Serif 4 | 300–700, optical sizing, italic | Writing-sample reader pages (body copy) |
| Fraunces | 300–900, optical sizing, SOFT/WONK axes | aiw-whitepaper, booklite-whitepaper |
| Newsreader | 200–800, optical sizing, italic | aiw-whitepaper, booklite-whitepaper |
| JetBrains Mono | 200–700 | ssia-whitepaper (root + wpaper/), aiw-whitepaper, booklite-whitepaper |
| Space Mono | 400, 700, italic | auscan-whitepaper |

### Google Analytics 4
- **Property ID:** G-9NZT1JSQ54
- **Source:** `www.googletagmanager.com/gtag/js` (async)
- **Used on:** All 19 HTML pages including whitepapers and writing-sample reader pages

---

## Bespoke JS Modules

All custom — no framework, no bundler. Loaded via `<script defer>` tags.

### `site-shell.js` — Navigation & Site Shell
- Implements `<site-header>` and `<site-footer>` as **Web Components** (`customElements.define`)
- Injects a mega-menu nav, theme toggle, and footer into every main page from a single source
- Scroll handler shrinks the header and updates the `--header-h` CSS custom property (72px → 52px past 80px scroll)
- Active page highlight driven by `active=""` attribute on each page's `<site-header>` tag

### `js/smooth-scroll.js` — Lenis/GSAP Bridge
- Initializes Lenis and registers it on the GSAP ticker (`gsap.ticker.add`)
- Exposes `window.lenis` for lightbox and anchor-scroll consumers
- Uses `MutationObserver` to pause/resume scroll when a lightbox overlay is open
- Bails on `prefers-reduced-motion`

### `js/animations.js` — Shared Animation Primitives
- Provides `AnimHelpers.reveal()`, `.splitReveal()`, and related utilities
- Consumed by every page-level script (`home.js`, `portfolio.js`, `studio.js`, etc.)
- Bails silently if GSAP/ScrollTrigger/SplitText haven't loaded

### `js/cursor.js` — Custom Cursor + Particle Trail
- Replaces the OS cursor with a single DOM node (blend-mode inversion)
- Canvas-based particle trail — renders N particles per frame on a full-viewport `<canvas>`, cheap GPU path
- Uses `MutationObserver` to re-read the accent color CSS variable when the theme changes
- Disabled on touch devices

### `js/preloader.js` — First-Load Overlay
- Full-screen black overlay on page entry
- Animates a neon sign: off → flicker on → settle
- Iris wipe reveal: circular clip-path expands outward to uncover the page
- Only runs on first visit per session (sessionStorage flag)

### `js/page-transitions.js` — Between-Page Fade
- Intercepts internal link clicks
- Fades a full-screen overlay to black, then hard-navigates to the new URL
- On the new page, overlay fades back to transparent
- Uses `MutationObserver` to watch for overlay DOM readiness
- Transition: fade-out 280ms ease-in, fade-in 380ms ease-out

### `js/folio.js` — Writing-Sample Reader Dock
- Builds numbered dot buttons dynamically from `.folio-page` elements in the DOM
- **IntersectionObserver** tracks which page section has the highest intersection ratio and sets it active
- Wires Prev/Next buttons + keyboard arrow navigation (← / →)
- Slide-up dock visibility: shows when scroll Y passes the first folio's position (threshold: first folio top − 70% viewport height)
- Fills the thin top progress bar via `scaleX()` transform based on scroll position

### `js/pages/portfolio-lightbox.js` — Portfolio Lightbox
- Bespoke cinematic lightbox; no third-party library
- Reads `data-gallery` and `data-index` attributes on `.ad` elements
- Keyboard navigable (← / →), closes on Escape or outside click
- Coordinates with `window.lenis` to pause smooth scroll while open
- Used on: `Portfolio.html`, `Work.html`

### `js/pages/agents-lightbox.js` — Agents Lightbox
- Same architecture as `portfolio-lightbox.js`, tuned for the Agents page layout
- Used on: `Agents.html`

### `js/pages/home.js`, `portfolio.js`, `studio.js`, `agents.js`, `books.js`
- Page-level animation orchestration — calls `AnimHelpers` and wires page-specific GSAP timelines

---

## Bespoke CSS Modules

### `nav.css` — Global Layout & Navigation Styles
- Sets `overflow-x: clip` on `html, body` (not `hidden` — `clip` avoids creating a scroll container that would break `position: sticky`)
- Core layout tokens, grid definitions, nav component styles

### `theme.css` — Light/Dark Theme System
- CSS custom properties for both themes under `[data-theme="light"]` and `[data-theme="dark"]`
- Covers color, surface, text, accent, and border tokens

### `theme.js` — Theme Persistence
- Reads `localStorage.getItem('theme') || 'light'` (light is the default)
- Sets `document.documentElement.dataset.theme` before first paint to prevent flash

### `css/folio.css` — Reader Page Layout + Dock
- Single-column reader shell (`max-width: 820px`)
- `.reader-progress-bar` — 3px fixed top bar, fills left-to-right via `scaleX()` on `.rpb-fill`
- `.reader-dock` — floating pill nav, `position: fixed; bottom: 24px`, slides up from below viewport with a cubic-bezier spring (`translate(-50%, calc(100% + 40px))` → `translate(-50%, 0)`)
- `backdrop-filter: blur(22px) saturate(160%)` on the dock for frosted-glass effect
- Active dot: accent blue pill with box-shadow glow

### `css/cursor.css` — Custom Cursor Styles
- Hides the OS cursor (`cursor: none` on `html`)
- Styles the DOM cursor element (size, blend mode, transition)

### `css/preloader.css` — Preloader Overlay Styles
- Full-viewport fixed overlay, z-index stacking, neon sign styles

### `css/page-transitions.css` — Transition Overlay Styles
- Full-viewport fixed overlay for the between-page fade

---

## Browser APIs Used (no library dependency)

| API | Where |
|---|---|
| `customElements.define` | `site-shell.js` — Web Components for `<site-header>` / `<site-footer>` |
| `IntersectionObserver` | `js/folio.js` — active folio page tracking |
| `MutationObserver` | `js/cursor.js` (theme changes), `js/smooth-scroll.js` (lightbox open/close), `js/page-transitions.js` (overlay readiness) |
| `localStorage` | `theme.js` — theme preference persistence |
| `sessionStorage` | `js/preloader.js` — first-visit flag |
| `CSS Custom Properties` | Theme tokens, `--header-h` dynamic header height |
| `Canvas 2D API` | `js/cursor.js` — particle trail rendering |
| `clip-path` animation | `js/preloader.js` — iris wipe reveal |
| `Web Animations / CSS transitions` | Page transitions, dock slide, dot glow |

---

## SEO & Structured Data

| | |
|---|---|
| **Canonical tags** | `<link rel="canonical">` on all pages |
| **Open Graph** | `og:title`, `og:description`, `og:image`, `og:type`, `og:url` on all pages |
| **Twitter Card** | `summary_large_image` on all pages |
| **JSON-LD** | `schema.org/Person` on `index.html`; `schema.org/CollectionPage` on `Portfolio.html` |
| **Sitemap** | `sitemap.xml` — 18 pages, manually maintained |
| **robots.txt** | `Allow: /`, sitemap pointer |
| **Meta robots** | `index, follow` on all pages |

---

## What's NOT here

- No JavaScript framework (no React, Vue, Angular, Svelte)
- No CSS framework (no Tailwind, Bootstrap)
- No bundler or build step (no Webpack, Vite, Rollup — assets loaded directly)
- No jQuery
- No third-party lightbox library (bespoke)
- No CMS or SSG
- No service worker / PWA
- No server-side rendering
