# FINISHER Audit — adamcagle.com

**Date:** 2026-06-18
**Scope:** the DEV staging mirror (`/DEV/`), which is a faithful copy of the live site.
**Auditor note:** This is a **static, vanilla HTML/CSS/JS portfolio** hosted on Vercel. There is **no backend, database, authentication, user accounts, payments, file uploads, or server-side AI calls.** Roughly half of the FINISHER checklist (auth, RLS, payments, migrations, AI cost controls, rate limiting, load balancing) is therefore **Not Applicable** and is marked as such rather than scored low. The applicable layers are frontend, security headers, caching/CDN, deployment, observability, and handoff.

---

## 1. Executive summary

- **Overall readiness: 84 / 100** for what it is — a marketing/portfolio site.
- **Launch recommendation: Production ready.** (The site is already live.) Recommended hardening is P1/P2, not launch-blocking.
- **Risk class: Level 1 (public brochure site).** No personal data, no payments, no accounts. The blast radius of any bug is "a page looks wrong," not "data breach" or "runaway bill."

### Top 5 risks (all low-to-moderate for this site type)
1. **No security response headers** beyond HSTS (no `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` header, `Permissions-Policy`). Clickjacking + MIME-sniffing exposure. *(P1)*
2. **Heavy images.** `brain-on.png` (2.4 MB) + `brain-off.png` (1.5 MB) load on **every** desktop page as WebGL textures; book covers are ~2 MB each. Bandwidth + LCP cost. *(P1)*
3. **Blanket `Cache-Control: max-age=0, must-revalidate`** on all assets — every image/font/script revalidates every load. Wasteful, and the inconsistent `?v=` bumping already caused a stale-CSS incident. *(P1)*
4. **No CI gate** (no automated HTML/link/build validation before deploy). Broken links or markup can ship unnoticed. *(P2)*
5. **No client-side error tracking / uptime monitor.** A broken page is found by a visitor, not by you. *(P2 — low need for a brochure site.)*

### Top 5 fastest fixes
1. Add 4 security headers to `vercel.json` (10-line change). *(done as a documented snippet below — needs the root config, so staged for promotion)*
2. Convert the brain textures + book covers to WebP (mobile already ships `brain-off.webp`). Biggest perf win.
3. Set long-cache `immutable` for `/img/` only; keep HTML/CSS/JS revalidating.
4. Add a custom `404.html`. *(built — `DEV/404.html`)*
5. `Referrer-Policy` meta. *(done — on all 30 pages)*

---

## 2. Risk table

| Priority | Issue | Why it matters | Evidence | Fix | Exit criteria |
|---|---|---|---|---|---|
| **P0** | — none — | No secrets, no auth, no data, no payments | Secret scan clean; static site | n/a | n/a |
| **P1** | Missing security headers | Clickjacking, MIME sniffing, referrer leakage | `vercel.json` sets only `Cache-Control`; HSTS via Vercel | Add nosniff / frame-options / referrer-policy / permissions-policy (snippet §5) | `curl -I` shows all 4 headers |
| **P1** | Oversized images | ~4 MB of brain PNGs per desktop page; 2 MB book covers | `img/brain/brain-on.png` 2.4M, `brain-off.png` 1.5M, `theledger.png` 2.0M | Convert to WebP/AVIF + compress | Largest image < 400 KB; brain textures < 500 KB total |
| **P1** | Cache policy too conservative | Every asset revalidates each load | `Cache-Control: public, max-age=0, must-revalidate` on `/(.*)` | Long-cache `/img/`, keep HTML revalidating (snippet §5) | Images return `max-age=31536000, immutable`; HTML still revalidates |
| **P2** | No CI validation | Broken links/markup can ship | No CI workflow in repo | Add GitHub Action: HTML validate + internal-link check on PR | CI blocks a known-broken link |
| **P2** | No error/uptime monitoring | Outages found by visitors | No tracker wired | Add a free uptime ping (e.g. on the apex) + optional client error beacon | Owner alerted before a user reports |
| **P2** | No CI/CD build gate | Pushes deploy straight to prod | Vercel auto-deploys `main` | Use the DEV mirror as staging (now in place); review there first | Changes reviewed at `/DEV/` before promotion |

---

## 3. 13-layer scorecard

| Layer | Score | Status | Required next action |
|---|---:|---|---|
| Frontend foundations | 4/5 | Strong | All imgs have `alt`; `lang` on all pages; reduced-motion in 24 spots; good `aria`. Add a skip-link + broaden `:focus-visible`. |
| APIs and backend logic | — | **N/A** | No backend; no server code. |
| Database and storage | — | **N/A** | No database/storage. |
| Auth and permissions | — | **N/A** | No auth/accounts/admin. |
| Hosting and deployment | 4/5 | Good | Vercel; `main`=prod; preview deploys; DEV staging now exists; rollback via Vercel deployments + git. Document rollback (done in RUNBOOK). |
| Cloud and compute | — | **N/A** | Static files on CDN; no compute. |
| CI/CD and version control | 2/5 | Gap | Git clean, but no automated checks. Add link/markup CI (P2). |
| Security and data protection | 3/5 | Needs headers | No secrets, HSTS present; add the 4 response headers. CSP deferred (needs inline-handler refactor — 75 `onerror`, 17 inline `<script>`). |
| Rate limiting and cost controls | — | **N/A** | No paid endpoints or APIs the site calls server-side. |
| Caching and CDN | 3/5 | Tune | On Vercel CDN; loosen cache for static `/img/`. |
| Load balancing and scaling | 5/5 | **N/A / inherent** | Static assets on Vercel's edge scale automatically. |
| Error tracking and logs | 2/5 | Optional | Add uptime ping; client error beacon optional for a brochure site. |
| Availability and recovery | 4/5 | Good | Git is the source of truth + backup; Vercel keeps prior deployments for instant rollback. Restore steps in RUNBOOK. |

---

## 4. What was applied in this pass (DEV only — live untouched)

- **`Referrer-Policy` meta** (`strict-origin-when-cross-origin`) added to all 30 DEV pages — the one response-header equivalent that works in-page.
- **Lazy-loading** added to 23 below-the-fold gallery images (ad scans, UX shots, agent plates). Lazy count 81 → 104. Above-fold heroes and the brain were intentionally left eager.
- **`DEV/404.html`** — branded, self-contained 404 in the site's warm theme. (See §5: must be promoted to the **root** `/404.html` to take effect on Vercel.)
- **Handoff docs** — `DEV/README.md` and `DEV/RUNBOOK.md`.

Verified: no secrets in the codebase, 0 `console.log`/`debugger`, every image already had `alt` text.

---

## 5. Recommendations to apply at promotion (require the root `vercel.json` — a live change, deferred per this session's "DEV only" rule)

### 5a. Security headers
Add to the `headers` array in the root `vercel.json`:

```json
{
  "source": "/(.*)",
  "headers": [
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
  ]
}
```

These are safe for this site (no embedding in third-party iframes, no camera/mic/geo use). **CSP is deliberately omitted** — a meaningful policy would need `'unsafe-inline'` (defeating most of its value) until the 75 inline `onerror` handlers and 17 inline `<script>` blocks are refactored. If desired later, ship a `Content-Security-Policy-Report-Only` first and watch for violations before enforcing.

### 5b. Cache policy (keep HTML fresh, let images live long)
```json
{ "source": "/img/(.*)",  "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
```
Leave HTML/CSS/JS on `must-revalidate` (they change often and the `?v=` bumping has been inconsistent — see the interior.css incident). Images rarely change and get a new path when they do, so `immutable` is safe and cuts repeat bandwidth.

### 5c. Image optimization (biggest perf win)
- `img/brain/brain-on.png` (2.4 MB) and `brain-off.png` (1.5 MB) load on every desktop page. Convert to WebP (mobile already uses `brain-off.webp`). Target < 500 KB combined.
- Book covers (`theledger.png`, `vampiresbabysitter.png`, `thedeal.png`, `ship.png`) ~2 MB each → WebP, target < 300 KB.
- `cwebp -q 82 in.png -o out.webp`, then point the `<img>`/texture loader at the WebP with a PNG fallback.

### 5d. Custom 404
Copy `DEV/404.html` to the repo root as `/404.html` (Vercel serves the root 404 for all not-found routes) and change its two `/DEV/` links to `/`.

---

## 6. Definition of done (for this site type)

A static portfolio is "finished" when: it works for visitors with no explanation ✅, has no exposed secrets ✅, is responsive + accessible (alt/lang/reduced-motion/aria) ✅, deploys are previewable and reversible ✅ (DEV staging + Vercel rollback), security headers are set ⛳ (staged), images are optimized ⛳, and a new developer can run/deploy/debug from docs ✅ (README + RUNBOOK). The ⛳ items are the remaining promotion-time work.
