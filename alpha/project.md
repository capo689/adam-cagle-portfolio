# alpha — project log

Running log of the alpha rebuild. Updated as each round completes.
**Live site is everything outside `alpha/`. Alpha is its own sandbox.**

---

## Stack (locked in)

**Foundation**
- Vanilla HTML5, vanilla CSS, no build step (deploy direct to Vercel)

**Animation engine — GSAP 3 (everything goes through this)**
- GSAP Core, ScrollTrigger, SplitText, Flip, Observer

**Smooth scroll**
- Lenis (pairs with ScrollTrigger and Barba)

**Page transitions**
- Barba.js v2 (AJAX navigation lifecycle, paired with GSAP for visuals)

**Architecture**
- `SiteFX` (custom, ~120 lines) — orchestration layer. Phase tracking, plugin registry with selector ownership, event bus. Every effect registers here before touching the DOM.

**Reserved (only if a section earns it)**
- OGL — single WebGL shader moment, ~14KB
- Howler.js — ambient audio, ~25KB

**Explicitly NOT in stack**
jQuery, React/Vue/Svelte, Three.js, AOS/Animate.css, Bootstrap/Tailwind, build tools (Webpack/Vite), TypeScript.

---

## File structure

```
alpha/
  index.html              ← Résumé
  Portfolio.html
  Agents.html
  Books.html
  Studio.html
  css/
    base.css              ← reset, tokens, typography
    layout.css            ← .page, hero, sections, grid
    nav.css               ← rail + mobile overlay + footer
    theme.css             ← light/dark toggle UI
    components.css        ← btn, card, cta, chip, kicker, link
    pages/                ← per-page styles only
      home.css
      portfolio.css
      agents.css
      books.css
      studio.css
  js/
    site-fx.js            ← orchestrator (FIRST script always)
    site-shell.js         ← rail + mobile menu
    theme.js              ← light/dark toggle (no FOUC)
    cursor.js             ← custom cursor
    smooth-scroll.js      ← Lenis init
    barba-init.js         ← page transitions
    preloader.js          ← first-load reveal
    fx/                   ← reusable animation primitives
      hero-reveal.js
      section-reveal.js
      lightbox.js
      magnetic.js
      parallax.js
    pages/                ← per-page choreography only
      home.js
      portfolio.js
      agents.js
      books.js
      studio.js
  img/
  vercel.json
```

---

## Working rules

- **Small chunks per turn.** Two files at most, then commit + push. Larger turns kill the session.
- **Live site untouched.** All work inside `alpha/`. Files at repo root are read-only reference.
- **Branch:** `claude/work-in-progress-eJKGG`
- Match the live design language exactly (tokens, type scale, spacing) until we explicitly diverge.
- Token-driven CSS only — no hard-coded colors outside `base.css`.

---

## Progress

### Round 0 — wipe (commit `96e68a1`)
Cleared `alpha/` to truly empty (158 files removed: legacy Barba/cursor/preloader scripts and all assets). Live site untouched.

### Round 1a — orchestrator + base tokens (commit `9f762be`)
- `alpha/js/site-fx.js` — phase tracking, plugin registry with selector ownership, event bus. Auto-boots on DOMContentLoaded; effects register before boot to guarantee init order.
- `alpha/css/base.css` — design tokens (matching live: `#0f0f0e` bg, `#4D8BE8` accent, Geist + Instrument Serif), reset, typography primitives, reduced-motion media query.

### Round 1b — layout + components (commit `3427638`)
- `alpha/css/layout.css` — `.page`, hero block (kicker/namerow/sub/meta/creds), section grid (260px sticky head + body). Breakpoints at 960/600/480 mirror live.
- `alpha/css/components.css` — reusable atoms: `.cta`/`.hero-cta`, `.btn` (+`--solid`), `.card` (+`--ghost`/`--clickable`), `.chip`, `.rule`, `.kicker`, `.link`. All token-driven.

### Round 1c — nav + theme (commit `19c69bd`)
- `alpha/css/base.css` — light-theme tokens swapped to live cream palette (`#f4efe7`); `scrollbar-gutter: stable`.
- `alpha/css/nav.css` — fixed top rail, brand, nav links (active underline draw), theme toggle, CTA pill, hamburger, scroll-shrink + progress hairline, mobile overlay, footer. 900px breakpoint.
- `alpha/css/theme.css` — `.theme-toggle` pill UI (icon rotation + knob translate).
- `alpha/js/site-shell.js` — `<site-shell>` custom element renders rail + mob-nav from one NAV list, marks active link from pathname, scroll-shrinks via rAF, opens/closes mobile overlay. Registers with SiteFX.
- `alpha/js/theme.js` — pre-paint theme apply (no FOUC) + click toggle, persists to localStorage, emits `theme:change` on SiteFX.

### Round 2 — assets (commit `7078fe5`)
Copied all 129 files from live `img/` → `alpha/img/` (51MB total). Folders: CLINK, HF, ads, agents, banners, books, plus root-level icons/portraits (cross.png, adampic.png, adamart.jpg, neon-* variants, workout.png, Vampire.png).

### Round 3 — homepage (commit `f429c3e`)
- `alpha/index.html` — clean rebuild matching the live résumé. `<site-shell>` for nav, inline pre-paint theme bootstrap (no FOUC), explicit CSS load order (base → layout → components → nav → theme → page), defer-loaded JS. Five sections: Summary, Capabilities, Experience, Selected Work, Awards/Ed/Board. Content matches live verbatim.
- `alpha/css/pages/home.css` — `.portrait-img`, `.hero-neon`, `.summary`, `.caps`/`.cap*`, `.job*`/`.job-roster*`, `.works`/`.work*`/`.work-cta`/`.work-intro`, `.tri*`. 960px responsive + print stylesheet (résumé export, light cream tokens, hides nav).
- No animations yet — round 5.

### Round 4a — portfolio.css (commits `d925b2f`, `71f79d3`, `6e6105b`)
Built up in three appended parts to stay under chunk limits.
- **4a-1 core (450 lines)** — hero overrides (smaller balanced name + .dot + .hero-links), section primitives (.sect-label / .sect-head + raw `<section>` padding), .campaign / .c-meta / .c-body sticky card, .ad-grid (g-1/g-2/g-3/g-featured) + .ad/.overlay, .pull pullquote, .hl-grid/.hl-tile, .verbs/.verb-col, .closer, 960/520 responsive + print.
- **4a-2 case studies (189 lines)** — Sunset Marquis: .sm-mvmt (chapter labels), .sm-pair (image+pull, with reverse + apex), .sm-arch (2x2 sub-brand grid), .sm-site (live-site tile). Hotel Figueroa: .hf-cover-wrap (cover plate that opens hf-viewer).
- **4a-3 modals (201 lines)** — `#lightbox` (ad-grid zoom view, blurred backdrop, prev/next/close pills, body.lb-open scroll lock). `#hf-viewer` (Hotel Figueroa brand-book spread modal with perspective + preserve-3d for GSAP page-flip; .hf-pg solo/pair, .hf-spine, .hf-footer counter, .hf-btn pills). Modal JS lands in round 5.

---

## What's next

**Round 4 — remaining pages**
Portfolio.html → Agents.html → Books.html → Studio.html. Each page: HTML + `pages/<page>.css` (+ `pages/<page>.js` later if it has unique behavior). **One page per turn** to stay under the chunk limit.

**Round 5 — motion layer**
Lenis (smooth scroll), Barba (page transitions), GSAP primitives (`fx/hero-reveal.js`, `section-reveal.js`, `magnetic.js`, `parallax.js`, `lightbox.js`), all registered through SiteFX.

**Round 6 — cinematic moments**
Flip-driven hero handoffs (corner brand → hero, tile → next-page hero), SplitText reveals, page-transition slab/dissolve. Optional WebGL hero shader if a section earns it.
