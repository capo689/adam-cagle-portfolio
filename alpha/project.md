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

### Round 4 — Portfolio page

#### 4a — portfolio.css (commits `d925b2f`, `71f79d3`, `6e6105b`)
Built up in three appended parts to stay under chunk limits.
- **4a-1 core (450 lines)** — hero overrides (smaller balanced name + .dot + .hero-links), section primitives (.sect-label / .sect-head + raw `<section>` padding), .campaign / .c-meta / .c-body sticky card, .ad-grid (g-1/g-2/g-3/g-featured) + .ad/.overlay, .pull pullquote, .hl-grid/.hl-tile, .verbs/.verb-col, .closer, 960/520 responsive + print.
- **4a-2 case studies (189 lines)** — Sunset Marquis: .sm-mvmt (chapter labels), .sm-pair (image+pull, with reverse + apex), .sm-arch (2x2 sub-brand grid), .sm-site (live-site tile). Hotel Figueroa: .hf-cover-wrap (cover plate that opens hf-viewer).
- **4a-3 modals (201 lines)** — `#lightbox` (ad-grid zoom view, blurred backdrop, prev/next/close pills, body.lb-open scroll lock). `#hf-viewer` (Hotel Figueroa brand-book spread modal with perspective + preserve-3d for GSAP page-flip; .hf-pg solo/pair, .hf-spine, .hf-footer counter, .hf-btn pills). Modal JS lands in round 5.

#### 4b — Portfolio.html (commits `3cd95a3`, `5bb6fbc`, `e1ce693`, `8db0732`, `f020fe5`)
Built up across five passes; six case studies inserted via Edit into the skeleton.
- **4b-1 skeleton (224 lines)** — full head (meta + OG/Twitter), theme bootstrap, font + CSS load order, defer-loaded SiteFX/site-shell/theme. `<site-shell>` for nav. Hero ('Words that move products.'). Section 01 · Traveler Guitar (campaign card, hero ad-grid g-1, body pull, 3x2 ad-grid g-3, headline grid). Closer + footer. `#lightbox` and `#hf-viewer` markup placed at end of body.
- **4b-2 Sunset Marquis (132 lines)** — four movements: Apex (Gallery Headline), Range (3 print campaigns: Legendary Nights, ACM, GDS), Architecture (Cavatina + LIVE@SunsetMarquis sub-brands), Brand at Work (live-site link).
- **4b-3 Killer NIC (67 lines)** — 3-up triptych ad-grid + verb stacks (warrior/mage/sniper, all terminating in 'Kill Faster.') + body pull.
- **4b-4 Hotel Figueroa (40 lines)** — cover plate (`#hf-cover`, opens `#hf-viewer` in round 5) + brand thesis pull.
- **4b-5 Clink + FileKeepers (83 lines)** — Clink: cover plate + 'Friends, not miles.' pull. FileKeepers: 2x2 ad-grid (Space rooms 1-4) + insight pull + tagline pull.

Discovered live Portfolio has 6 sections, not 4; plan adjusted mid-build.

#### 4c — agents.css (commits `5b733bb`, `949194a`)
Note on namespace: classes like `.campaign`, `.c-meta`, `.ad-grid`, `.pull`, `.overlay` are intentionally redefined here with different proportions than `pages/portfolio.css` — Agents uses tighter pulls, square borders, gap-based grids vs Portfolio's editorial collage. Each page only loads its own `pages/<page>.css`, so no runtime conflict.
- **4c-1 core (346 lines)** — `.page` padding override (72px top, 120px bottom), hero (smaller, 80px top), hero-sub 2x1 with `.hero-stat-row` sidebar, `.sect-label`/`.sect-head` (tighter), `.campaign` sticky-meta card, `.ad`+`.overlay` (160deg gradient, square borders), `.ad-grid` (gap-based) with g-1/g-2/g-4/g-featured, `.pull` (radius 2px), `.wp-btn` whitepaper link, `.status-live` pulsing green dot keyframe, 860/640 responsive, print stylesheet.
- **4c-2 lightbox (83 lines)** — Agents-flavored `#lightbox`: square buttons (10x14, radius 3px), bordered `.lb-img`, 80/60 padding. Both pages style `#lightbox` differently — only ever load one per doc.

#### 4d — Agents.html (commits `4d18849`, `706930b`, `fd60042`)
- **4d-1 skeleton (188 lines)** — full head + nav + hero ('Systems that work while you sleep.', `.hero-stat-row` with Models/Agents in Production/Architecture/Deployment) + Section 01 SSIA (campaign card with `.status-live` + `.wp-btn` to whitepaper, engine pull, 2x2 ad-grid g-4 of dashboard/graph screenshots) + footer + #lightbox markup.
- **4d-2 Book + AuScan (88 lines)** — Book Agent (single hero, attribution pull). AuScan (Beta status, 2-up dashboard+report screenshots, '72% high-confidence hit' result pull).
- **4d-3 BEEF + Music (85 lines)** — BEEF (Live, single dashboard, strange-signals hunt pull). Music Agent (Beta, single dashboard, closed-loop system pull).

#### 4e — Books page (commits `e2c0916`, `52c8c42`, `646b2bb`)
- **4e-1 books.css (218 lines, single chunk)** — editorial book-jacket layout. Hero override (`.ac` accent, narrower 18ch name, paragraph hero-sub). `.book` 280px sticky cover left + body right. `.book-genre`/`.book-cover` (1.025 hover scale)/`.book-title`/`.book-subtitle`. `.synopsis` with **drop cap** on first paragraph (italic-serif accent, 4.4em float-left). `.quote` cards with corner `.quote-tag`, italic `.quote-pull`, ruled `.quote-body`. 960/520 responsive (collapses to 110px cover + stacked grid).
- **4e-2 skeleton + Books 01-02 (162 lines)** — Vampire's Babysitter (Historical Fiction · Horror) + Ship Happens (Zombie Comedy). Each: drop-cap synopsis + two `.quote` excerpts.
- **4e-3 Books 03-05 (96 lines)** — The Deal (Nonfiction · civilization-and-control), The Ledger (Nonfiction · gender roles), What Worked For Me (Fitness memoir).

#### 4f — Studio page (commits `820a9f7`, `0364a50`)
- **4f-1 studio.css (234 lines, single chunk)** — full-viewport hero (min-height 100vh, larger 68/12vw/200px name), `.studios` 2x1 grid (Agency689 / Agentic689 cards with `.studio-num`/`.studio-name`/`.studio-url`/`.studio-desc`/`.studio-tags`), `.coming` 'coming soon' label, `.banner-section` HTML5 ad showcase with `.banner-wrap` (728x90, bordered, hosts thumb img or iframe) and `.b-btn` pill button. 960px breakpoint scales banner via aspect-ratio.
- **4f-2 Studio.html + studio.js (211 lines)** — full head + nav + hero ('Two studios. One obsession.') + Agency689 + Agentic689 cards + Sunset Marquis HTML5 banner showcase + 'coming soon' + footer. `js/pages/studio.js` registers as a SiteFX plugin (`owns: ['#banner-wrap']`) and toggles thumbnail ↔ live iframe.

---

## Round 4 summary — All five pages shipped
- `alpha/index.html` (résumé) + `pages/home.css`
- `alpha/Portfolio.html` (6 case studies + lightbox + hf-viewer markup) + `pages/portfolio.css`
- `alpha/Agents.html` (5 production agents + lightbox markup) + `pages/agents.css`
- `alpha/Books.html` (5 books) + `pages/books.css`
- `alpha/Studio.html` (Agency689 + Agentic689 + banner showcase) + `pages/studio.css` + `js/pages/studio.js`

Total: 24 commits across rounds 4a-4f. All content matches live verbatim. No animations or modal JS yet — round 5.

---

### Round 5 — motion layer

Each plugin is a SiteFX-registered plugin (init order + selector ownership guaranteed). Recommended order:

1. **5a** — Lenis smooth scroll ✅
2. **5b** — Section reveal (GSAP + ScrollTrigger fade-ups) ✅
3. **5c** — Hero reveal (SplitText character animation)
4. **5d** — Lightbox (Portfolio + Agents image grids)
5. **5e** — HF viewer (Hotel Figueroa brand book page-flip)
6. **5f** — Magnetic + Parallax (polish)
7. **5g** — Custom cursor (`data-cursor` hooks)
8. **5h** — Preloader (first-load reveal)
9. **5i** — Barba page transitions (lands last; orchestrates everything)

#### 5a — Lenis smooth scroll (commit `5b0db34`, live on main)
- `alpha/js/smooth-scroll.js` (66 lines) — Lenis 1.1.20 init at 1.1s duration with custom ease-out, exposes `window.__lenis`. Honors `prefers-reduced-motion`. Pre-wired ScrollTrigger bridge (`scrollerProxy` + `lenis.on('scroll', ScrollTrigger.update)`) so 5b plugs in cleanly.
- CDN + script wired into all five pages.

#### 5b — Section reveal (commit `6a45748`, live on main)
- `alpha/js/fx/section-reveal.js` (108 lines) — `ScrollTrigger.batch()` over a broad block selector (.section, .campaign, .book, .studio-card, .banner-section, .pull, .quote, .synopsis, .cap, .job, .work, .tri-item, .cred, .hl-tile, .verb-col, .sm-arch-cell, .ad-grid). Each block: y:24 + autoAlpha:0 locked on init (no FOUC), then y:0/autoAlpha:1, 0.7s, power3.out, 0.08s stagger inside batch. Plays once at `top 88%`. Refreshes after fonts.ready + window load. Emits `scrolltrigger:ready` on SiteFX so smooth-scroll.js bridges its proxy.
- GSAP Core + ScrollTrigger CDN + script wired into all five pages.

**Round 5 — motion layer**
Lenis (smooth scroll), Barba (page transitions), GSAP primitives (`fx/hero-reveal.js`, `section-reveal.js`, `magnetic.js`, `parallax.js`, `lightbox.js`), all registered through SiteFX.

**Round 6 — cinematic moments**
Flip-driven hero handoffs (corner brand → hero, tile → next-page hero), SplitText reveals, page-transition slab/dissolve. Optional WebGL hero shader if a section earns it.
