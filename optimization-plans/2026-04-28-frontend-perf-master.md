# Frontend Performance Optimization — Master Plan

> **For agentic workers:** This is the orchestration document. Each phase below has its own self-contained sub-plan. Sub-agents should read **this file plus their phase-specific file** — nothing else from this folder. Steps in sub-plans use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce TTI, FCP, and bundle size on the Playspace web app by replacing the SPA-style "skeleton then fetch" pattern with Next.js 15 server components, streaming, and hydration where appropriate, while killing concrete bundle bloat from static-imported heavy libraries.

**Architecture:** Three phases, six sub-plans. Phase A (mechanical bundle wins) and Phase B (loading/error scaffolding) are independent and can run in parallel. Phase C is a refactor that splits the API client (C1, foundational), retrofits server prefetch + React Query hydration onto detail pages (C2), and tags the static instrument fetch for ISR-style caching (C3). C2 and C3 both depend on C1.

**Tech Stack:** Next.js 15.5.12 (App Router), React 19, TanStack Query 5.90, next-intl 4.8, Zod 4, Axios, Tailwind v4, shadcn/ui, pnpm.

---

## Phase Map

| Phase | Plan File | Depends On | Effort | Risk | Headline Win |
| ----- | --------- | ---------- | ------ | ---- | ------------ |
| **A** | `2026-04-28-phase-a-bundle-quick-wins.md` | none | ~30 min | Very low | Drop ~1MB+ from `/admin/instruments` first-load JS; per-icon imports for `lucide-react` + `radix-ui` |
| **B** | `2026-04-28-phase-b-streaming-scaffolding.md` | none | ~2 hrs | Low | `loading.tsx` + `error.tsx` everywhere; instant skeleton on every navigation; recoverable error boundaries |
| **C1** | `2026-04-28-phase-c1-api-client-split.md` | none (foundation) | ~3 hrs | Medium | Stops the 1583-line `"use client"` API file polluting server components; deletes ~150 lines of duplicated Zod schemas |
| **C2** | `2026-04-28-phase-c2-server-prefetch.md` | C1 | ~1 day | Medium | Auditor dashboard + 5 detail pages render real content from the server, hydrate React Query so navigations feel instant |
| **C3** | `2026-04-28-phase-c3-fetch-caching.md` | C1 | ~30 min | Low | Static instrument data served from Next.js data cache, invalidated by tag |

Total estimated effort: **~1.5–2 engineer-days**, splittable across multiple agents. Plans A, B, and C1 can be assigned in parallel. C2 and C3 must wait for C1 to merge.

---

## Recommended Assignment Order

1. **Wave 1 (parallel, ~3 hrs wall time):** Assign A, B, and C1 to three separate agents. They touch disjoint files. Merge each independently as it lands.
2. **Wave 2 (parallel, after C1 merges):** Assign C2 and C3 to two separate agents. C2 is the larger plan; C3 is a small follow-up.

---

## Conventions Every Sub-Agent Must Honor

These come from the workspace's `AGENTS.md`. Every plan repeats them in its own context section, but listing here so reviewers can spot deviations.

- **Indentation:** tabs for TypeScript and Python.
- **Strings:** double quotes (`"`).
- **TypeScript:** strict — no `any`, no `!` (non-null assertion), no `as unknown as T` casts. Define types as needed.
- **Code style:** ESLint via `pnpm lint`; Prettier via `pnpm format`. No pre-commit hooks; CI/manual.
- **Path alias:** `@/*` → `./src/*`.
- **Build verification:** `pnpm build` after every phase. Type errors block the merge.
- **No new dependencies** unless a sub-plan explicitly says so. Phase A and Phase C use only what's already in `package.json`.
- **Don't commit secrets.** Tokens, env files, etc. stay out of the repo.
- **Commits:** sub-agents commit per task as the plan dictates. Plans use Conventional Commits (`feat:`, `perf:`, `refactor:`, `chore:`).
- **Don't push or open PRs without explicit user approval.** This is the workspace's one hard rule.

---

## Quality Gate (Run After Every Phase)

```bash
cd audit-tools-playspace-frontend
pnpm install --frozen-lockfile
pnpm lint
pnpm format --check  # or "pnpm format" if you accept formatting changes
pnpm build
```

Expected: lint passes, formatter clean, build succeeds. The build step is the most important — it surfaces type errors, missing imports, RSC boundary violations, and bundle issues all at once.

For Phase A specifically, also inspect the post-build output for the `/admin/instruments` route in the Next.js build summary; the First Load JS for that route should drop noticeably (reference: was ~1MB+ before because of `xlsx` + `jspdf`).

For Phase C2, dev-mode smoke tests are mandatory because RSC + hydration bugs are silent at build time:

```bash
pnpm dev
# In a browser: log in as admin, manager, and auditor (DemoPass123! for seeded users)
# Visit dashboard, click into a place/audit/report detail
# Confirm: HTML response already contains data (View Source), no skeleton flash
# Confirm: no hydration errors in console
```

---

## Out of Scope for All Phases

These came up during analysis but are deliberately excluded. If you spot another opportunity while implementing, **note it and stop** — don't expand the plan.

- **Auth cookie hardening** (`httpOnly`/`Secure`). Real fix but blocked by axios reading cookies client-side.
- **Removing `force-dynamic` from per-user pages.** They legitimately read cookies; can't be statically generated.
- **Settings page split** (currently 1147 lines). Worth doing later as its own refactor.
- **Replacing the home page redirect with middleware.** Tiny win; risky if the middleware matcher misses something.
- **Filter-popover account/project list caching.** Real but small; covered by `staleTime` already.
- **Upgrading Next.js to 16.** Cache Components and `'use cache'` directive only land in 16+. The skill `next-cache-components` does not apply to this codebase yet.
- **Enabling `experimental.ppr`.** Requires `next@canary`. Stay on stable.

---

## Success Criteria

Each phase has its own acceptance criteria in its sub-plan. Master-level success looks like this when all phases land:

1. **Bundle:** Admin instruments page first-load JS drops by ~700KB+ (xlsx + jspdf gone from initial chunk). All other routes either flat or smaller. Verified via `pnpm build` output diff.
2. **Network:** Detail pages (audit/report under admin/manager/auditor) respond with HTML that already contains data — no client-side waterfall on cold load. Verified via "View Source" smoke test.
3. **UX:** Every protected route shows a skeleton instantly on navigation (via `loading.tsx`), and unhandled errors are recoverable (via `error.tsx`) without forcing `window.location.reload()`.
4. **Code health:** `src/lib/api/playspace.ts` no longer has `"use client"` at the top. Zod schemas live once in `playspace-types.ts`. The 312-line `server-playspace-dashboard.ts` shrinks to <80 lines (just the dashboard composition functions).
5. **Caching:** PVUA instrument fetches hit Next.js data cache and revalidate via tag; visible in dev tools as cached responses on second view.

---

## Where to Find Things

- Sub-plans: `docs/superpowers/plans/2026-04-28-phase-*.md`
- Backend OpenAPI (for endpoint shapes referenced in C1/C2): `audit-tools-backend/STRUCTURE.md` and live at `audit-tools-backend.onrender.com/openapi.json`
- Existing seeded demo accounts: see `audit-tools-backend/.env.example` and `app/products/playspace/seed/`
- AGENTS.md / CLAUDE.md at workspace root for code style and product boundaries

---

## When You Get Stuck

- **Type errors after C1:** the new `playspace-types.ts` may be missing an export. Phase C1's task list enumerates every type that must be exported — check the list against what `playspace.ts` re-exports.
- **Hydration mismatch in C2:** the most common cause is `Date` formatting that depends on locale. Use `formatDateTimeLabel` (already in `src/components/dashboard/utils.ts`) — it's deterministic.
- **Build fails with "use server" or RSC errors:** something is being imported on the server that is marked `"use client"`. Trace the import chain back from the failing module.
- **`pnpm build` succeeds but pages 500 in dev:** check the server-side env var `NEXT_PUBLIC_API_BASE_URL` (or the default `http://127.0.0.1:8000`) is reachable from the Next.js process. Phase C1's `playspace-server.ts` uses the same default.

If a sub-plan instruction is genuinely ambiguous, **stop and ask** rather than guessing. The user prefers a clarifying question over a wrong refactor.
