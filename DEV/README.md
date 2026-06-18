# adamcagle.com

Personal portfolio of Adam R. Cagle — Creative Director, Copywriter, and AI Systems builder. A static, animated, single-experience site built around a Three.js "brain" navigation (left hemisphere = tech work, right hemisphere = creative work).

## Stack

- **Frontend:** vanilla HTML, CSS, JavaScript. No framework, **no build step.**
- **3D/animation:** Three.js (via CDN importmap), GSAP (CDN), cross-document View Transitions for page-to-page brain morphs.
- **Hosting:** Vercel, auto-deploys on push to `main` (repo `capo689/adam-cagle-portfolio`).
- **Fonts:** Google Fonts (EB Garamond, Inter, IBM Plex Mono).
- **No backend, database, auth, accounts, payments, or server-side AI calls.** Everything is static files served from Vercel's edge.

## Layout

```
/                       desktop site (7 pages)
  index.html            home — brain nav (left=tech, right=creative)
  ai-systems.html  ux-ui.html  technical-writing.html     (left / tech)
  creative-direction.html  copywriting.html  creative-writing.html  (right / creative)
  css/  js/  img/       shared assets
  mobile/               separate touch-first site (phones auto-redirect here)
  space/                SULU INVADERS canvas game (standalone, /space)
  writing-samples/      long-form book/sample pages (opened from creative-writing)
  wpaper/  gummy/        whitepapers + a side experiment
  vercel.json           redirects + cache headers (apex/www, /brain,/launch → /)
  .vercelignore         excludes ARCHIVE, .claude
DEV/                    full isolated staging mirror (this folder) — see below
ARCHIVE/                old builds, not deployed
```

## DEV staging mirror

`DEV/` is a complete, self-contained copy of the **whole** live experience (desktop + mobile + space + sub-pages), re-based so every path resolves under `/DEV/` (`<base href="/DEV/">`, mobile under `/DEV/mobile/`, space under `/DEV/space/`). It is live at **adamcagle.com/DEV/** and every page is `noindex, nofollow`.

**Work happens in `DEV/`. The live root is not edited directly.** When DEV work is approved, promote it to the root and reverse the re-basing (`/DEV/` → `/`). See RUNBOOK §"Promote DEV to live."

## Local preview

The Claude preview server can't read `~/Downloads`, so mirror the repo to a readable path and serve it (serve the **repo root** so `/DEV/` resolves):

```bash
rsync -a --delete --exclude='.git' --exclude='ARCHIVE' --exclude='.claude' \
  /Users/adamcagle/Downloads/adamcagle/ /tmp/fable-preview/
cd /tmp/fable-preview && python3 -m http.server 8731
# open http://localhost:8731/DEV/  (add ?desktop=1 to skip the mobile redirect)
```

## Deploy

Push to `main` → Vercel builds and deploys automatically. There is no build/test command (static site). Cache headers and redirects live in `vercel.json`.

```bash
git add -A && git commit -m "..." && git push
```

## Rollback

Vercel keeps every prior deployment — instant rollback from the Vercel dashboard (Deployments → ⋯ → Promote to Production). Or revert in git and push. See RUNBOOK.

## Known limitations / gotchas

- **Cache `?v=` bumping is manual.** When you edit a CSS/JS file, bump its `?v=N` in every page that links it, or browsers serve stale copies (this caused a real incident — creative pages were pinned to a stale `interior.css?v=24`). Keep versions consistent across pages.
- **The mobile reel** (`window.CD_TILES`) is not defined in the mobile files, so the kinetic reel on the mobile creative-direction page stays dormant. Pre-existing.
- **Security headers** beyond HSTS are not yet set (see FINISHER-AUDIT.md §5a).
- **Large brain/book images** are unoptimized PNGs (see FINISHER-AUDIT.md §5c).
- **Two voices rule:** site copy is first person ("I/my"), never "we/our". Never use em dashes or double hyphens. Don't invent project copy — pull verbatim from existing pages.
