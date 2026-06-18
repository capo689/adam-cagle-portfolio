# RUNBOOK — adamcagle.com

Operational playbook. This is a static site on Vercel, so most incidents are "a page looks wrong" or "a deploy went bad," not data loss. Git is the source of truth and the backup.

---

## Site is down / showing an error

1. Check Vercel status + the latest deployment in the Vercel dashboard (Deployments tab). A red/failed build means the last push didn't deploy and the **previous** deployment is still serving — the site should still be up.
2. `curl -I https://adamcagle.com/` — expect `200`. Check `x-vercel-id` to confirm it's hitting Vercel.
3. If a bad deploy is live: **roll back** (next section).
4. If Vercel itself is down: nothing to do but wait; the edge usually keeps serving the last good build.

## Bad deploy / a page broke after a push

**Fastest fix — Vercel rollback (no code change):**
- Vercel dashboard → Deployments → pick the last known-good one → ⋯ → **Promote to Production.** Instant.

**Or revert in git:**
```bash
git revert <bad-commit-sha>   # or: git revert HEAD
git push                       # Vercel redeploys the reverted state
```

**Or restore one file to a known-good version** (how the Creative Direction page was fixed):
```bash
git checkout <good-sha> -- path/to/file.html
git commit -m "restore file to known-good" && git push
```

## "It loads broken but a hard refresh fixes it" (stale cache)

This is almost always a **`?v=` version mismatch**: a page links `foo.css?v=OLD` while other pages use `?v=NEW`, so a browser/edge serves a stale cached copy.

1. Confirm: `curl -s https://adamcagle.com/<page>.html | grep -oE '<link[^>]*\.css[^>]*>'` and compare the `?v=` numbers against the working pages.
2. Fix: bump the stale `?v=` to match the current one across **all** pages that link it, push.
3. Belt-and-suspenders for layout-critical CSS: inline the critical rules in the page `<head>` so a stale external stylesheet can't break first paint (this is what the creative pages now do for the brain/content layout).
4. Tell the user a one-time hard refresh (Cmd+Shift+R) clears their local copy.

## Restore from scratch

The entire site is in git. To recreate:
```bash
git clone https://github.com/capo689/adam-cagle-portfolio.git
# Vercel project is linked to this repo; pushing main deploys.
```
No database or external state to restore.

## DNS / domain

- Apex `adamcagle.com` is the canonical host. `www.` and `*.vercel.app` 301-redirect to apex (see `vercel.json` redirects).
- DNS is managed at the domain registrar pointing at Vercel. If the domain resolves but the site 404s, check the Vercel project's Domains settings.

## Promote DEV to live

When DEV work is approved (this is the only time the live root is edited):
1. For each changed file, copy `DEV/<file>` → `<file>` at root.
2. Reverse the re-basing in the copied files: `/DEV/` → `/` (base href, links, JS image paths, the desktop→mobile redirect, space base). This is the exact inverse of how DEV was built.
3. Remove `noindex` from the promoted pages (DEV pages are `noindex`; live should be `index, follow`).
4. If promoting `DEV/404.html`: copy to root `/404.html` and change its `/DEV/` links to `/`.
5. Bump any changed asset's `?v=` consistently across all pages that link it.
6. Verify locally (serve repo root, load `/`), then push. Verify live with `curl`, then watch the Vercel deployment.

## Apply the FINISHER hardening (one-time, at a live-config window)

See `FINISHER-AUDIT.md §5`: add the 4 security headers and the `/img/` long-cache rule to the root `vercel.json`, convert the large brain/book PNGs to WebP, and copy the 404 to root. These touch the live config, so do them deliberately, then `curl -I` to confirm headers.

## What there is NOT to worry about

No database to back up, no secrets to rotate (none exist in the code — verified), no payment webhooks, no auth sessions, no API spend. The risk surface is markup/asset correctness and deploy hygiene, both covered above.
