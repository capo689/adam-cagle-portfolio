# FINISHER Skill: Production Finish for AI-Built Apps and Web Projects

**Version:** 0.1  
**Date:** 2026-06-10  
**Purpose:** Guide an AI assistant, developer, or product owner through the work required to turn a vibe-coded app or web project into a secure, observable, maintainable, deployable, recoverable, and handoff-ready product.  
**Primary user:** a builder using AI coding tools who has a working prototype but needs production discipline.  
**Core rule:** A working demo is not a finished product.

---

## 1. When to Use This Skill

Use this skill whenever the user is:

- Building, auditing, finishing, or launching an app, website, SaaS, AI tool, internal workflow, mobile app, or web platform.
- Using AI-generated code from tools such as AI coding agents, AI IDEs, prompt-to-app builders, chat assistants, or code copilots.
- Asking whether a project is “ready,” “safe,” “production-ready,” “scalable,” “secure,” “handoff-ready,” or “launchable.”
- Preparing to connect authentication, payments, database, AI APIs, third-party APIs, user accounts, private data, file uploads, mobile apps, or app-store submissions.
- Debugging mysterious production failures, runaway API bills, exposed keys, broken auth, deployment roulette, missing logs, or scaling cliffs.

Do not use this skill as a reason to slow down harmless prototypes. Use it to protect anything that touches users, money, private data, production systems, or reputation.

---

## 2. Operating Principles

1. **Assess before building.** Do not add new features until the current production risks are known.
2. **Freeze the happy path.** Once the demo works, stop expanding scope and finish the foundations.
3. **Separate prototype success from production readiness.** The demo proves the idea. The finish proves the product.
4. **Trust no generated code until reviewed.** AI code can work while still being insecure, unmaintainable, or expensive.
5. **Authentication is not authorization.** Login proves identity. Permissions prove what the user can access.
6. **Secrets never belong in frontend code, Git history, logs, screenshots, or AI prompts.** Rotate anything that was exposed.
7. **Production must be observable.** If the app breaks and no system records it, the system is not production-ready.
8. **Every paid endpoint needs a budget boundary.** Rate limits, spend caps, caching, batching, and quotas come before launch.
9. **Every database change must be repeatable.** Migrations, backups, and restore tests are mandatory.
10. **Every deployment must be reversible.** Preview, test, deploy, monitor, rollback.
11. **Every handoff must be understandable.** A new developer should be able to run, deploy, debug, and extend the project from documentation.
12. **Security is continuous.** Scans and reviews run on every meaningful change, not once at the end.
13. **Prefer boring, battle-tested services for dangerous problems.** Do not roll your own auth, payments, secrets, or crypto.

---

## 3. Required Inputs

When starting a FINISHER review, collect or infer the following. If the user cannot provide everything, proceed with best effort and clearly mark unknowns.

### 3.1 Project identity

- Project name
- Product type: website, SaaS, marketplace, internal tool, AI app, mobile app, API, extension, automation, other
- Target users
- Primary value proposition
- Current stage: idea, prototype, beta, paid beta, production, scaling, enterprise sales
- Current user count and expected 90-day user count
- Target launch date or decision date

### 3.2 Stack inventory

- Frontend framework and host
- Backend framework and host
- Database and storage
- Auth provider
- Payment/billing provider
- AI providers and model tiers
- Email/SMS providers
- Background job/queue system
- Analytics/observability tools
- Repository host and branch strategy
- CI/CD pipeline
- Third-party APIs
- Mobile/app-store requirements
- Legal/compliance requirements

### 3.3 Risk inventory

Ask or inspect:

- Does the app collect personal data?
- Does it collect payment data or handle billing?
- Does it store user-generated content?
- Does it use AI APIs that cost money per call?
- Does it call third-party APIs on page load or user action?
- Does it expose data by tenant, organization, role, or user?
- Does it have admin users?
- Does it upload or process files?
- Does it need offline/mobile/deep-link behavior?
- Does it target enterprise customers?
- Does it require SOC 2, HIPAA, GDPR, CCPA, FERPA, PCI, or other controls?

---

## 4. Required Output Format

Every FINISHER run should produce these sections unless the user asks for a narrower audit.

### 4.1 Executive summary

- Overall readiness score: 0–100
- Launch recommendation: **Do not launch**, **Private beta only**, **Paid beta with fixes**, **Production ready**, or **Scale-ready**
- Top 5 risks
- Top 5 fastest fixes
- Estimated finishing sequence

### 4.2 P0/P1/P2 risk table

| Priority | Issue | Why it matters | Evidence | Fix | Owner | Exit criteria |
|---|---|---|---|---|---|---|
| P0 | Blocks launch | Breach/data loss/outage/payment/legal risk | File, test, screenshot, or user statement | Specific remediation | Role/name | Measurable pass condition |
| P1 | Blocks paid launch | Stability, trust, maintainability, support risk | Evidence | Fix | Owner | Exit criteria |
| P2 | Improve after beta | Scalability, polish, efficiency | Evidence | Fix | Owner | Exit criteria |

### 4.3 13-layer scorecard

Score each layer from 0 to 5.

| Layer | Score | Status | Required next action |
|---|---:|---|---|
| Frontend foundations |  |  |  |
| APIs and backend logic |  |  |  |
| Database and storage |  |  |  |
| Auth and permissions |  |  |  |
| Hosting and deployment |  |  |  |
| Cloud and compute |  |  |  |
| CI/CD and version control |  |  |  |
| Security and data protection |  |  |  |
| Rate limiting and cost controls |  |  |  |
| Caching and CDN |  |  |  |
| Load balancing and scaling |  |  |  |
| Error tracking and logs |  |  |  |
| Availability and recovery |  |  |  |

### 4.4 Remediation plan

Use this order unless evidence says another order is safer:

1. Stop new feature work.
2. Create branch and backup.
3. Secure secrets and rotate exposed keys.
4. Fix auth and authorization.
5. Separate dev, staging, and production.
6. Add migrations, backups, and restore test.
7. Add dependency, license, and secret scanning.
8. Add structured logging, error tracking, uptime monitoring.
9. Add rate limits, spend caps, and AI/API cost controls.
10. Add retries, idempotency, and background jobs.
11. Add core tests and edge-case QA.
12. Add deployment previews, rollback, and feature flags.
13. Add legal/data deletion and compliance basics.
14. Load test.
15. Document handoff.
16. Ship private beta.
17. Measure real outcomes.

---

## 5. The FINISHER Workflow

### Phase 1: Read and inventory

Actions:

- Read the README, package files, config files, environment examples, deployment config, database schema, API routes, auth middleware, payment code, AI calls, and tests.
- Identify every vendor and third-party API.
- Identify every secret name without revealing secret values.
- Identify every user-data table, storage bucket, and endpoint.
- Identify every path that costs money per request.

Output:

- Stack map
- Data map
- Cost surface map
- Attack surface map
- Unknowns list

### Phase 2: Build the baseline

Before changing code, define measurable before/after metrics.

Required baseline metrics:

- Time on task
- Error rate
- Volume handled
- Cost per task
- Conversion/completion rate
- Support burden
- API cost per user/action
- Infrastructure cost per active user

For AI features, also measure:

- Token cost per request
- Cache hit rate
- Model distribution by tier
- Failure/refusal/error rate
- Latency by model
- User value event per AI call

### Phase 3: Classify the risk level

| Risk level | Characteristics | Minimum controls |
|---|---|---|
| Level 0: Local demo | No users, no real data, no payments, no public URL | README, local setup, no secrets committed |
| Level 1: Private prototype | Small invited users, low-risk data, no payments | Auth, basic logs, backups, privacy notice, error tracking |
| Level 2: Paid beta | Real users, payments, user data, AI/API costs | P0/P1 controls, staging, CI, monitoring, billing events, restore test |
| Level 3: Production SaaS | Public launch, private data, support expectation | Full 13-layer pass, incident runbook, rate limits, security scans, handoff docs |
| Level 4: Enterprise/regulated | Compliance demands, large orgs, sensitive data | Access reviews, audit logs, compliance automation, SSO/SCIM, formal vendor risk review |

### Phase 4: Fix P0 launch blockers

P0 blockers include:

- Exposed secrets.
- Custom or weak auth.
- Missing authorization/RLS/resource ownership checks.
- Users can access other users’ data.
- Passwords stored insecurely.
- Payment webhooks are not verified.
- No backups or untested restores.
- Direct production database editing.
- No deployment rollback.
- No error tracking on production.
- AI/paid API endpoints without rate limits.
- Public admin endpoints.
- Frontend calls database or secret-bearing APIs directly without server-side controls.
- No privacy policy or terms while collecting user data.

### Phase 5: Fix P1 paid-launch risks

P1 risks include:

- No CI/CD.
- No staging environment.
- No automated tests for core flows.
- No dependency scan.
- No secret scan.
- No structured logs.
- No uptime monitor.
- No API wrapper/fallback plan.
- No retry/idempotency logic for external calls.
- No loading/error/empty states.
- No mobile/browser/device QA.
- No cost forecast.
- No handoff docs.

### Phase 6: Plan P2 scale work

P2 work includes:

- Feature flags and canary rollouts.
- Advanced tracing.
- Multi-region routing.
- Read replicas.
- Partitioning or sharding.
- Dynamic secrets.
- SOC 2 readiness automation.
- Formal accessibility audit.
- AI eval suites.
- Advanced cost engineering.

---

## 6. The 13 Production Layers

### Layer 1: Frontend foundations

Check:

- Responsive design across mobile/tablet/desktop.
- Safari, Chrome, Firefox, and older Android/iOS behavior.
- Loading, error, empty, and success states for every component.
- Error boundaries for crash isolation.
- Accessible labels, keyboard navigation, focus states, contrast, semantic HTML.
- Bundle size and image optimization.
- Offline or degraded behavior if relevant.
- Forms handle apostrophes, emojis, long input, blank input, repeated submit, and slow networks.

Minimum pass:

- Five target users can complete the core flow without explanation.
- The app does not blank-screen on common edge cases.
- Slow network and mobile testing are complete.

### Layer 2: APIs and backend logic

Check:

- All sensitive operations run server-side.
- Frontend never calls paid/external APIs with exposed secrets.
- Inputs are validated at the API boundary.
- Business rules are enforced server-side, not only in the client.
- API calls are wrapped in one service layer per provider.
- External calls have timeouts, retries, circuit breakers, and fallbacks.
- Long-running work is queued instead of blocking requests.
- OpenAPI or equivalent API contract exists for handoff-critical systems.

Minimum pass:

- No secret or privileged operation is exposed to browser code.
- API returns clear error responses and never trusts client-side authorization.

### Layer 3: Database and storage

Check:

- Schema is normalized enough for the domain.
- Tables have relationships, constraints, indexes, and tenant/user ownership fields.
- Every schema change is a migration file.
- Dev, staging, and production databases are separate.
- Backups are automated.
- Restore has been tested.
- Query performance is measured.
- File uploads have size/type limits and storage policies.
- Sensitive data has retention and deletion rules.

Minimum pass:

- A fresh environment can be created from migrations.
- A backup can be restored.
- User/tenant data isolation is enforced at database level where possible.

### Layer 4: Auth and permissions

Check:

- Auth provider is battle-tested unless there is a serious reason otherwise.
- Password storage is provider-managed or uses modern hashing.
- Sessions expire.
- Logout actually invalidates access.
- Password reset links expire and are single-use.
- Login endpoints have rate limits.
- Every route checks authentication.
- Every resource checks authorization.
- Every data query filters by user/tenant/role as needed.
- Admin routes are separately protected.
- RLS/resource ownership policies are tested with user A/user B attempts.

Minimum pass:

- User A cannot see, edit, delete, export, or infer User B’s data.
- Tenant A cannot see Tenant B’s data.
- Admin access cannot be gained by URL changes or client-side flags.

### Layer 5: Hosting and deployment

Check:

- Main branch is production.
- Development work happens on branches or dev branch.
- Preview/staging deploy exists.
- Production deploy is automated.
- Rollback is documented and tested.
- Environment variables differ by environment.
- Health checks exist.
- Manual server edits are prohibited.

Minimum pass:

- A new change can be previewed before production.
- A failed production deploy can be rolled back quickly.

### Layer 6: Cloud and compute

Check:

- Serverless timeouts are known.
- File processing, PDF generation, email sends, webhooks, and AI pipelines do not exceed request timeouts.
- Background workers exist for heavy jobs.
- Cron/scheduled jobs are documented.
- Compute plan can handle current workload and next 90 days.
- Spend alerts exist for hosting and compute.

Minimum pass:

- No core user action times out because heavy work is trapped in request/response.

### Layer 7: CI/CD and version control

Check:

- Git repository exists and is clean.
- Lock files are committed.
- Pull requests are used for risky changes.
- CI runs lint/typecheck/tests/build/security scans.
- Critical checks block merge.
- Dependency updates are reviewed.
- AI code review is optional but never replaces accountable human review.

Minimum pass:

- Code that does not build/test cannot merge.
- A previous working version can be restored.

### Layer 8: Security and data protection

Check:

- Secret scan passes.
- Dependency scan passes or exceptions are documented.
- OWASP Top 10 risks are reviewed.
- API auth/authorization tampering has been manually tested.
- Security headers are present.
- CORS is restricted.
- Cookies use secure/httpOnly/sameSite where relevant.
- Logs redact secrets and sensitive data.
- File uploads are scanned/limited where relevant.
- Least privilege is applied to service accounts and database credentials.
- Data retention, deletion, and export are defined.

Minimum pass:

- No known critical vulnerabilities ship.
- No exposed secrets remain active.
- Sensitive data access is auditable.

### Layer 9: Rate limiting and cost controls

Check:

- Auth endpoints are rate limited.
- AI endpoints are rate limited.
- Public APIs are rate limited.
- Paid third-party calls have quotas.
- Per-user, per-IP, and per-account limits exist as needed.
- Spend caps and billing alerts exist.
- Abuse paths are tested.
- Usage is tracked by user/account/tenant.

Minimum pass:

- A bot cannot create an unlimited bill or brute-force login unchecked.

### Layer 10: Caching and CDN

Check:

- Static assets use browser/CDN caching.
- Expensive queries are cached when safe.
- AI responses are semantically cached where appropriate.
- Cache keys include tenant/user permissions when data is private.
- Cache invalidation is defined.
- CDN settings do not cache private data publicly.

Minimum pass:

- Repeated safe requests avoid repeated expensive database/API/model work.
- Private data is never cached for the wrong user.

### Layer 11: Load balancing and scaling

Check:

- Connection pooling is enabled.
- Database connection math works for expected concurrent users.
- Slow queries are indexed or redesigned.
- Heavy operations use queues.
- Load tests simulate launch traffic.
- External API rate limits are known.
- Autoscaling or manual scale plan exists.

Minimum pass:

- The app survives a realistic first-traffic spike without locking the database or timing out users.

### Layer 12: Error tracking and logs

Check:

- Frontend and backend errors go to error tracking.
- Logs are structured.
- Logs include timestamp, request ID, route, severity, and safe user/account identifiers.
- Logs do not include secrets or sensitive payloads.
- Alerts exist for critical errors.
- Performance traces exist for slow endpoints.
- Product analytics exist for core funnel if relevant.

Minimum pass:

- The team knows an error occurred before relying on a user complaint.
- A bug report can be traced to a request, route, release, and user context.

### Layer 13: Availability and recovery

Check:

- Uptime monitoring exists.
- Backups are automated.
- Restore has been tested.
- Recovery time objective and recovery point objective are defined.
- Incident runbook exists.
- On-call/notification path exists.
- Rollback path is tested.
- Status page or customer communication plan exists if relevant.

Minimum pass:

- If the app goes down at 2 a.m., the owner knows what to check, who is notified, how to roll back, and how to restore.

---

## 7. Command Checklist

Use commands that fit the stack. Do not run destructive commands without confirmation and backup.

### 7.1 JavaScript/TypeScript dependency audit

```bash
npm audit
npm outdated
npm ls --depth=0
```

For pnpm:

```bash
pnpm audit
pnpm outdated
pnpm list --depth 0
```

For yarn:

```bash
yarn audit
yarn outdated
```

### 7.2 Secret scan

```bash
trufflehog filesystem . --only-verified
```

Also inspect:

```bash
git log --all --full-history -- .env
find . -name "*.env*" -not -path "*/node_modules/*"
```

If a secret was ever committed or exposed to frontend code, rotate it. Deleting it is not enough.

### 7.3 Build/test gate

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

If these scripts do not exist, create them or document why the stack uses alternatives.

### 7.4 Security scan against staging

```bash
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://staging.example.com
```

Run passive scans first. Authenticated and active scans require care and should target staging, not production.

### 7.5 Load test sample

Use k6 or Artillery against staging. Simulate 10, 50, 100, and 1,000 users only if the environment can safely handle it.

```bash
k6 run load-test.js
```

Minimum load-test questions:

- When does latency exceed acceptable levels?
- When do database connections max out?
- When do external API limits trigger?
- What happens when 50 users sign up at once?
- What happens when multiple users run AI calls at once?

---

## 8. Required Manual Tests

### 8.1 Auth boundary test

1. Create User A.
2. Create User B.
3. Log in as User A.
4. Try to access User B’s dashboard URL.
5. Try to change IDs in URLs.
6. Try to change IDs in API request bodies.
7. Try to call admin endpoints.
8. Log out and paste a protected URL.
9. Verify no private data is visible.

Pass condition: all unauthorized attempts fail safely and are logged.

### 8.2 Data ownership test

For every table or collection with user/tenant data:

- Confirm ownership column exists.
- Confirm query filters by ownership.
- Confirm database policy enforces ownership where supported.
- Confirm update/delete/export operations cannot cross ownership boundaries.

### 8.3 Secrets exposure test

- Search frontend bundle for `key`, `secret`, `token`, `sk_`, `pk_`, `api`, provider names, and connection strings.
- Inspect browser DevTools Sources and Network tabs.
- Check Git history.
- Check deployment logs.
- Check error logs.

Pass condition: only public keys intended for browser use are visible.

### 8.4 Payment test

- Use test mode.
- Test card success.
- Test card decline.
- Test webhook signature verification.
- Test duplicate webhook delivery.
- Test subscription cancellation.
- Test failed renewal.
- Test refund/dispute path if relevant.
- Test idempotency on repeated submit.

### 8.5 AI cost/abuse test

- Try repeated requests.
- Try very long prompts.
- Try malicious prompt injection.
- Try concurrent requests.
- Try unauthenticated endpoint calls.
- Confirm token logging, per-user spend tracking, cache behavior, and model routing.

### 8.6 Edge-case UX test

- Blank forms.
- Apostrophes and special characters.
- Emojis.
- 10,000-character input.
- Double submit.
- Browser back mid-request.
- Slow network.
- Old phone.
- Safari.
- Expired session.
- Third-party API failure.

---

## 9. AI Feature Finishing Rules

For any AI feature:

1. **Wrap the provider.** All calls go through one service layer or gateway.
2. **Never call AI providers directly from frontend with secret-bearing keys.**
3. **Classify request complexity.** Route simple tasks to cheaper models.
4. **Cache repeated work.** Use exact cache where safe and semantic cache where useful.
5. **Batch non-urgent work.** Use batch APIs for asynchronous processing when latency allows.
6. **Set per-user quotas.** Free, paid, admin, and internal tiers should have different limits.
7. **Set global spend caps.** Configure provider billing alerts and hard limits where available.
8. **Log token usage.** Track provider, model, prompt tokens, output tokens, cached tokens, user/account, feature, and cost estimate.
9. **Protect tools.** Agents need scoped tool permissions, not broad system access.
10. **Test prompt injection.** Especially when the AI can call tools, retrieve documents, or take actions.
11. **Store memory intentionally.** Store only data that changes future behavior and has a defined privacy purpose.
12. **Provide graceful fallback.** If the provider is down, show a clear message or queue the work.

### AI cost table required in every AI app review

| Feature | Provider | Model | Trigger | Avg calls/user/day | Avg tokens/call | Estimated cost/user/month | Control |
|---|---|---|---|---:|---:|---:|---|
| Example |  |  |  |  |  |  | cache/routing/quota |

---

## 10. Database Finishing Rules

1. **No direct production schema changes.** Every schema change must be a migration.
2. **No single mega-table unless justified.** Normalize entities and index access patterns.
3. **Every tenant-owned table gets tenant ID.** Every user-owned table gets user ID.
4. **Use constraints.** Unique, not null, foreign keys, checks, and cascading rules should be deliberate.
5. **Index for actual queries.** Do not guess. Measure slow queries.
6. **Separate environments.** Development, staging, and production use separate databases or branches.
7. **Backups are not real until restored.** Test restore before launch.
8. **Avoid destructive migrations without backups.** Plan rollback or forward-fix path.
9. **Add idempotency keys for user-triggered jobs.** Duplicate clicks must not duplicate side effects.
10. **Add connection pooling before traffic.** Especially with serverless hosting.

---

## 11. Deployment Finishing Rules

1. **Never push straight to production without preview.**
2. **Small commits, small deploys.** One meaningful change at a time.
3. **Use branch previews or staging URLs.**
4. **Know rollback before deploy.** Test rollback when calm.
5. **Use feature flags for risky releases.**
6. **Use canary/staged rollout for high-traffic apps.**
7. **Monitor after deploy.** Watch error rate, latency, conversion, API cost, and support signals.
8. **Automate promotion only after metrics pass.**
9. **Document deploy process.** A new developer should be able to deploy from docs.

---

## 12. Security Gates

### P0 security gates

The project cannot launch if any are true:

- Active secrets are exposed.
- User/tenant data can be accessed across boundaries.
- Password handling is custom and unreviewed.
- Payment webhooks are unverified.
- Admin access is client-side or URL-based.
- No backups exist for production data.
- Critical dependency vulnerability is exploitable in the app.
- AI endpoint is public and unmetered.
- Private data is cached publicly.

### P1 security gates

The project should not accept paid users until fixed:

- No dependency scan in CI.
- No secret scan in CI.
- No security headers/CORS review.
- No audit trail for sensitive actions.
- No privacy policy/data deletion flow.
- No incident runbook.
- No least-privilege review for service accounts.

---

## 13. Handoff Requirements

A project is not handoff-ready until it includes:

### 13.1 README

- What the app does.
- Stack overview.
- Local setup.
- Environment variables by name only, never values.
- Scripts.
- Test commands.
- Deployment process.
- Rollback process.
- Known limitations.

### 13.2 Architecture notes

- System diagram.
- Data model.
- API map.
- Auth/permission model.
- Third-party vendor map.
- Background jobs.
- AI calls and cost controls.
- Caching strategy.
- Monitoring/alerts.

### 13.3 Runbook

- App down.
- Database down.
- Payment webhook failing.
- AI provider bill spike.
- Secret leaked.
- User reports data exposure.
- Bad deploy.
- Restore from backup.

### 13.4 Decision log

Use Architecture Decision Records for major choices:

```markdown
# ADR: [Decision title]

Date: YYYY-MM-DD
Status: Proposed | Accepted | Replaced

## Context

## Decision

## Alternatives considered

## Consequences

## Reversal plan
```

---

## 14. FINISHER Prompts

Use these prompts with the codebase or relevant files. Replace bracketed fields.

### 14.1 Repo inventory prompt

```text
You are auditing this app for production readiness. Build a stack inventory from the repo. Identify frontend, backend, database, auth, payments, AI providers, third-party APIs, deployment, CI/CD, tests, logs, monitoring, and secrets by variable name only. Do not reveal secret values. Output unknowns clearly.
```

### 14.2 Auth and authorization prompt

```text
Review the auth and permission model. Separate authentication from authorization. Identify every route, API endpoint, database query, storage bucket, and admin path that needs user, role, or tenant checks. Provide a User A/User B test plan and list P0 issues first.
```

### 14.3 Secrets prompt

```text
Review the codebase for secret exposure patterns. Look for environment variables used in frontend code, keys committed to code, provider keys in config files, secrets in logs, and missing key rotation. Do not print secret values. Provide exact file paths, risk level, and rotation steps.
```

### 14.4 Database prompt

```text
Review the database schema and migrations. Identify missing migrations, missing indexes, missing constraints, missing ownership fields, missing RLS/resource policies, risky destructive changes, and backup/restore gaps. Provide a safe remediation order.
```

### 14.5 AI cost prompt

```text
Review every AI provider call. Identify provider, model, trigger, token estimate, user/account association, cacheability, fallback behavior, timeout handling, and abuse risk. Propose model routing, semantic caching, batching, rate limits, and spend caps.
```

### 14.6 Deployment prompt

```text
Review deployment readiness. Identify whether dev/staging/prod are separated, whether preview deploys exist, whether CI gates merges, whether rollback is tested, whether environment variables are scoped by environment, and whether feature flags or canary rollout are needed.
```

### 14.7 Handoff prompt

```text
Create the missing handoff documentation for this project: README, architecture notes, vendor map, API map, auth model, data model, deploy process, rollback process, incident runbook, and known risks. Keep secrets out of the documentation.
```

---

## 15. Definition of Done

A vibe-coded app is finished when:

- The specific problem and success metrics are documented.
- The app works for target users without explanation.
- Auth and authorization are tested.
- Secrets are server-side and rotated if ever exposed.
- Dev, staging, and production are separated.
- Database migrations exist.
- Backups are automated and a restore has been tested.
- Core flows have tests.
- Dependency and secret scans run.
- Error tracking and uptime monitoring are installed.
- Structured logs exist.
- Rate limits and spend caps exist for paid endpoints.
- AI calls are wrapped, tracked, cached/routed where appropriate, and budgeted.
- Deployments are previewed and reversible.
- Legal basics are present if user data is collected.
- A runbook exists.
- A new developer can understand, run, deploy, and debug the system from docs.

---

## 16. Response Style for AI Using This Skill

When using this skill, be direct and practical.

- Do not bury P0 risks.
- Do not reassure the user that something is safe without evidence.
- Do not recommend enterprise tools when simple controls solve the risk.
- Do not invent pricing, vendor features, or compliance claims. Verify current docs when needed.
- Do not expose secrets in the response.
- Do not ask for clarification when a best-effort audit can proceed from the available files.
- Clearly label unknowns.
- Prefer checklists, tables, commands, and measurable exit criteria.
- Preserve project-specific redaction rules and never output excluded organizations or people.
