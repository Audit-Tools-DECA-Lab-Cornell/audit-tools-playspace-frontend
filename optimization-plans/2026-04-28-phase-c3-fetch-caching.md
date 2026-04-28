# Phase C3 — Cacheable Instrument Fetch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. **Phase C1 must be merged before starting this plan.** Phase C2 is recommended (this plan extends two pages C2 created) but not strictly required for tasks 1 and 3.

**Goal:** Cache the static PVUA instrument fetch in Next.js's data cache so it's served from memory after the first request, with explicit tag-based invalidation when the backend publishes a new instrument version. Also wire the report detail pages to server-prefetch the instrument when the audit's inline `instrument` field is null, so cold loads of those pages don't re-fetch the instrument client-side.

**Architecture:** The PVUA instrument is essentially read-only and changes only when the backend deploys a new version. Today every report fetch redownloads it. We:

1. Update `getServerInstrument` to opt into Next.js fetch caching with a tag like `instrument:<key>:<lang>` and `revalidate: 3600`.
2. Add a small server-only `revalidateInstrument` helper plus a webhook-style route handler that the backend (or an operator) can `POST` to in order to invalidate cached instruments without a redeploy.
3. Update the three report detail pages from Phase C2 to optionally prefetch the instrument under the same query key the client uses, when the inlined `audit.instrument` would be `null`. This eliminates the client-side instrument fetch on cold load.

**Tech Stack:** Next.js 15 fetch caching (`fetch(url, { next: { revalidate, tags } })`), `revalidateTag` from `next/cache`, App Router route handlers, `next/headers`.

---

## Required Reading

1. The Phase C1 plan: `docs/superpowers/plans/2026-04-28-phase-c1-api-client-split.md`. Confirm `playspace-server.ts` has `getServerInstrument` already.
2. The Phase C2 plan: `docs/superpowers/plans/2026-04-28-phase-c2-server-prefetch.md`. The three files touched by Task 3 of this plan are created by C2.
3. `audit-tools-playspace-frontend/src/lib/api/playspace-server.ts` — current `getServerInstrument` implementation.
4. `audit-tools-playspace-frontend/src/app/(protected)/admin/reports/[auditId]/page.tsx` (created in C2) — pattern we extend.
5. `audit-tools-playspace-frontend/src/app/(protected)/manager/reports/[auditId]/page.tsx` (created in C2).
6. `audit-tools-playspace-frontend/src/app/(protected)/auditor/reports/[auditId]/page.tsx` (created in C2).
7. `audit-tools-playspace-frontend/src/app/(protected)/admin/reports/[auditId]/report-detail-client.tsx` and `manager/reports/.../report-detail-client.tsx` — for understanding the client-side instrument query.
8. [Next.js docs: `revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag) and [route handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers).

## Conventions

- **Indentation:** tabs. Strings: double quotes.
- **TypeScript:** strict.
- **Cache tag format:** `instrument:<key>:<lang>` — use `instrument:pvua_v5_2:en` for the standard English instrument.
- **Invalidation route auth:** require a shared secret via the `INSTRUMENT_REVALIDATE_SECRET` environment variable. The plan does NOT modify any `.env` file — that's a deployment-time concern. Document the variable in the AGENTS.md (workspace-root) under "Required backend secrets" if your team prefers.
- **Don't add `force-dynamic` anywhere** — the report detail pages remain cookie-derived dynamic; the cached instrument fetch lives at a layer below.

## Verification Commands

```bash
cd audit-tools-playspace-frontend
pnpm lint
pnpm build
pnpm dev
```

Manual verification of caching:

1. With dev server running, open `/admin/reports/<auditId>`.
2. In the FastAPI backend logs (or proxy access logs), confirm `GET /playspace/instruments/active/<key>?lang=en` is logged.
3. Hard-reload the page. Confirm the backend log does **not** show a second instrument fetch — the response served from Next.js's data cache.
4. POST to the revalidate route (curl example below). Confirm the next page load *does* re-fetch from the backend.

```bash
curl -X POST -H "Content-Type: application/json" \
	-H "x-revalidate-secret: $INSTRUMENT_REVALIDATE_SECRET" \
	-d '{"instrumentKey":"pvua_v5_2","lang":"en"}' \
	http://localhost:3000/api/internal/revalidate-instrument
```

Expected response: `{"ok":true,"revalidated":["instrument:pvua_v5_2:en"]}`.

## Out of Scope

- **Don't add caching to user-scoped data** (audits, dashboards). They legitimately depend on cookies and per-user state; caching them is dangerous and out of scope.
- **Don't add a UI for instrument invalidation.** The route handler is for backend/CI use.
- **Don't modify `playspaceApi.auditor.fetchInstrument`** in the browser client. It's used inside `useQuery` and stays as-is.
- **Don't change `revalidate` to a longer duration** without checking with the user. 1 hour is a safe default; longer windows can mask broken instruments in production.

---

## File Structure (Files Touched)

| File | Action |
|------|--------|
| `src/lib/api/playspace-server.ts` | Modify — make `getServerInstrument` cacheable, add `revalidateInstrument` helper |
| `src/app/api/internal/revalidate-instrument/route.ts` | Create — POST endpoint for tag invalidation |
| `src/app/(protected)/admin/reports/[auditId]/page.tsx` | Modify — also prefetch instrument when not inlined |
| `src/app/(protected)/manager/reports/[auditId]/page.tsx` | Modify — same |
| `src/app/(protected)/auditor/reports/[auditId]/page.tsx` | Modify — same (uses `playspaceApi.auditor.fetchInstrument` query key) |

5 files touched. No deletions.

---

## Task 1: Cacheable `getServerInstrument` and a tag-revalidation helper

**Files:**

- Modify: `audit-tools-playspace-frontend/src/lib/api/playspace-server.ts`

- [ ] **Step 1: Read the current `getServerInstrument`**

In Phase C1's `playspace-server.ts` it looks like:

```ts
export async function getServerInstrument(instrumentKey: string, lang: string = "en"): Promise<PlayspaceInstrument> {
	const query = new URLSearchParams({ lang });
	return fetchServerJson(
		`/playspace/instruments/active/${encodeURIComponent(instrumentKey)}?${query.toString()}`,
		playspaceInstrumentSchema
	);
}
```

- [ ] **Step 2: Add a `buildInstrumentCacheTag` helper near the top of the file**

After the existing imports, before `getServerApiBaseUrl`:

```ts
/**
 * Build a Next.js fetch-cache tag for a given instrument key + language.
 * The same tag is consumed by `revalidateInstrument` to invalidate the cache
 * after a backend publishes a new instrument version.
 */
function buildInstrumentCacheTag(instrumentKey: string, lang: string): string {
	return `instrument:${instrumentKey}:${lang}`;
}
```

- [ ] **Step 3: Replace `getServerInstrument`**

Replace the body to opt into the data cache:

```ts
/**
 * Fetch a localized instrument definition on the server with Next.js data
 * caching. The instrument is essentially read-only between deploys; tagged
 * caching means subsequent server renders read from the in-memory cache instead
 * of hitting FastAPI. Invalidate via `revalidateInstrument(key, lang)` or
 * `POST /api/internal/revalidate-instrument`.
 */
export async function getServerInstrument(instrumentKey: string, lang: string = "en"): Promise<PlayspaceInstrument> {
	const query = new URLSearchParams({ lang });
	return fetchServerJson(
		`/playspace/instruments/active/${encodeURIComponent(instrumentKey)}?${query.toString()}`,
		playspaceInstrumentSchema,
		{
			cache: "force-cache",
			next: {
				revalidate: 3600,
				tags: [buildInstrumentCacheTag(instrumentKey, lang)]
			}
		}
	);
}
```

`fetchServerJson` from C1 already supports the `cache` and `next` options on its `ServerFetchOptions` interface.

- [ ] **Step 4: Append `revalidateInstrument` helper**

At the bottom of the file:

```ts
import { revalidateTag } from "next/cache";

/**
 * Manually invalidate the cached instrument for a given key + language.
 * Use after publishing a new instrument version on the backend, either via the
 * `/api/internal/revalidate-instrument` route handler or directly in a server
 * action.
 */
export function revalidateInstrument(instrumentKey: string, lang: string = "en"): string {
	const tag = buildInstrumentCacheTag(instrumentKey, lang);
	revalidateTag(tag);
	return tag;
}
```

Move the new `import { revalidateTag } from "next/cache";` line into the existing import block at the top of the file. Final import order should put `next/cache` alongside `next/headers`:

```ts
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
```

- [ ] **Step 5: Lint and build**

```bash
pnpm lint
pnpm build
```

Expected: clean. No consumer changes yet.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/playspace-server.ts
git commit -m "$(cat <<'EOF'
perf(web): cache server-side instrument fetch with tag invalidation

getServerInstrument now opts into Next.js's fetch data cache with a
per-(key, lang) tag and a 1-hour revalidate window. The instrument is
essentially read-only between backend deploys, so caching slashes the
roundtrips report-detail server prefetch generates. Adds
revalidateInstrument(key, lang) so consumers (and an upcoming route
handler) can invalidate when the backend publishes a new version.
EOF
)"
```

---

## Task 2: Add the revalidate-instrument route handler

**Files:**

- Create: `audit-tools-playspace-frontend/src/app/api/internal/revalidate-instrument/route.ts`

A small POST endpoint guarded by a shared secret. The backend (or a CI step) can call it after publishing a new instrument to invalidate the cache without a redeploy.

- [ ] **Step 1: Create the route handler**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { revalidateInstrument } from "@/lib/api/playspace-server";

const REQUEST_SECRET_HEADER = "x-revalidate-secret";

const requestBodySchema = z.object({
	instrumentKey: z.string().min(1),
	lang: z.string().min(1).default("en")
});

/**
 * POST /api/internal/revalidate-instrument
 *
 * Body:
 *   { "instrumentKey": "pvua_v5_2", "lang": "en" }
 *
 * Header:
 *   x-revalidate-secret: <shared secret matching INSTRUMENT_REVALIDATE_SECRET>
 *
 * Response:
 *   200 { "ok": true, "revalidated": ["instrument:pvua_v5_2:en"] }
 *   401 if the secret is missing or mismatched
 *   400 if the body fails validation
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
	const secret = process.env.INSTRUMENT_REVALIDATE_SECRET;
	if (!secret || secret.trim().length === 0) {
		return NextResponse.json({ ok: false, error: "Server is not configured." }, { status: 500 });
	}

	const provided = request.headers.get(REQUEST_SECRET_HEADER);
	if (provided !== secret) {
		return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
	}

	const rawBody: unknown = await request.json().catch(() => null);
	const parsed = requestBodySchema.safeParse(rawBody);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: "Body must be { instrumentKey: string, lang?: string }." },
			{ status: 400 }
		);
	}

	const tag = revalidateInstrument(parsed.data.instrumentKey, parsed.data.lang);
	return NextResponse.json({ ok: true, revalidated: [tag] });
}
```

- [ ] **Step 2: Lint and build**

```bash
pnpm lint
pnpm build
```

- [ ] **Step 3: Smoke test the route**

```bash
pnpm dev
```

In a second terminal, with `INSTRUMENT_REVALIDATE_SECRET=test-secret` set in your `.env.local` (don't commit this file — `.env.local` is gitignored by Next.js):

```bash
curl -i -X POST -H "Content-Type: application/json" \
	-H "x-revalidate-secret: wrong-secret" \
	-d '{"instrumentKey":"pvua_v5_2"}' \
	http://localhost:3000/api/internal/revalidate-instrument
```

Expected: `HTTP 401 {"ok":false,"error":"Unauthorized."}`.

```bash
curl -i -X POST -H "Content-Type: application/json" \
	-H "x-revalidate-secret: test-secret" \
	-d '{"instrumentKey":"pvua_v5_2"}' \
	http://localhost:3000/api/internal/revalidate-instrument
```

Expected: `HTTP 200 {"ok":true,"revalidated":["instrument:pvua_v5_2:en"]}`.

Then visit a report page in the browser and observe in the FastAPI backend logs (or use any HTTP debug tool) that the next instrument fetch *does* hit the backend — confirming the cache was invalidated.

- [ ] **Step 4: Stop the dev server, commit**

```bash
git add src/app/api/internal/revalidate-instrument/route.ts
git commit -m "$(cat <<'EOF'
feat(web): add /api/internal/revalidate-instrument route handler

POST endpoint that invalidates the cached instrument tag for a given
(instrumentKey, lang). Requires INSTRUMENT_REVALIDATE_SECRET env var
and a matching x-revalidate-secret header. Backend can call this
after publishing a new instrument version to flush the Next.js data
cache without a redeploy. Validates the body via Zod.
EOF
)"
```

- [ ] **Step 5: Document the env var in AGENTS.md (workspace root)**

Open `/Users/praty/Desktop/StudentJob/playspace/AGENTS.md`. Find the "Required backend secrets" line under the Deployment Topology section (currently reads "Required backend secrets: `DATABASE_URL_YEE`, `DATABASE_URL_PLAYSPACE`, `AUTH_TOKEN_SECRET_KEY`."). Add a new bullet right after it for the frontend:

```md
Required frontend env vars (Vercel): `INSTRUMENT_REVALIDATE_SECRET` (only needed if the backend or a CI step calls `/api/internal/revalidate-instrument` to invalidate cached instruments).
```

If you can't find the exact line, add the bullet under any "Deployment Topology" or env-vars section you find. The point is to make the variable discoverable.

- [ ] **Step 6: Commit the docs update**

```bash
cd /Users/praty/Desktop/StudentJob/playspace
git add AGENTS.md
git commit -m "docs: document INSTRUMENT_REVALIDATE_SECRET frontend env var"
```

---

## Task 3: Server-prefetch the instrument when not inlined (admin/manager/auditor reports)

**Files:**

- Modify: `audit-tools-playspace-frontend/src/app/(protected)/admin/reports/[auditId]/page.tsx`
- Modify: `audit-tools-playspace-frontend/src/app/(protected)/manager/reports/[auditId]/page.tsx`
- Modify: `audit-tools-playspace-frontend/src/app/(protected)/auditor/reports/[auditId]/page.tsx`

The client-side `report-detail-client.tsx` files (created in Phase C2) read:

```ts
const audit = auditQuery.data;

const instrumentQuery = useQuery({
	queryKey: ["playspace", "instrument", audit?.instrument_key],
	queryFn: () => {
		if (audit?.instrument !== undefined && audit.instrument !== null) {
			return Promise.resolve(audit.instrument);
		}
		// fetches via playspaceApi.auditor.fetchInstrument
	},
	enabled: audit !== undefined
});
```

So when the audit response inlines `audit.instrument`, the client query resolves locally. When it doesn't, the client makes a network round-trip on mount. We can preempt that round-trip by server-prefetching the instrument under the same query key.

For this task, all three report `page.tsx` files get the same change. We keep the auditor page's flow (with `["playspace", "auditor", "audit", auditId]` key) and admin/manager (`["playspace", "audit", auditId]` key) intact and just append a second prefetch.

- [ ] **Step 1: Update `admin/reports/[auditId]/page.tsx`**

Replace the body so it also prefetches the instrument when needed. The new file:

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getServerAudit, getServerInstrument } from "@/lib/api/playspace-server";
import { type AuditSession } from "@/lib/api/playspace-types";
import { getQueryClient } from "@/lib/query/server-query-client";

import { AdminReportDetailClient } from "./report-detail-client";

interface AdminReportDetailPageProps {
	params: Promise<{ auditId: string }>;
}

export default async function AdminReportDetailPage({ params }: Readonly<AdminReportDetailPageProps>) {
	const { auditId } = await params;
	const queryClient = getQueryClient();

	const auditKey = ["playspace", "audit", auditId] as const;
	await queryClient
		.prefetchQuery({
			queryKey: auditKey,
			queryFn: () => getServerAudit(auditId)
		})
		.catch(() => undefined);

	const audit = queryClient.getQueryData<AuditSession>(auditKey);
	if (audit && (audit.instrument === null || audit.instrument === undefined)) {
		await queryClient
			.prefetchQuery({
				queryKey: ["playspace", "instrument", audit.instrument_key],
				queryFn: () => getServerInstrument(audit.instrument_key)
			})
			.catch(() => undefined);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AdminReportDetailClient auditId={auditId} />
		</HydrationBoundary>
	);
}
```

- [ ] **Step 2: Update `manager/reports/[auditId]/page.tsx`**

Identical content except the imported client component name:

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getServerAudit, getServerInstrument } from "@/lib/api/playspace-server";
import { type AuditSession } from "@/lib/api/playspace-types";
import { getQueryClient } from "@/lib/query/server-query-client";

import { ManagerReportDetailClient } from "./report-detail-client";

interface ManagerReportDetailPageProps {
	params: Promise<{ auditId: string }>;
}

export default async function ManagerReportDetailPage({ params }: Readonly<ManagerReportDetailPageProps>) {
	const { auditId } = await params;
	const queryClient = getQueryClient();

	const auditKey = ["playspace", "audit", auditId] as const;
	await queryClient
		.prefetchQuery({
			queryKey: auditKey,
			queryFn: () => getServerAudit(auditId)
		})
		.catch(() => undefined);

	const audit = queryClient.getQueryData<AuditSession>(auditKey);
	if (audit && (audit.instrument === null || audit.instrument === undefined)) {
		await queryClient
			.prefetchQuery({
				queryKey: ["playspace", "instrument", audit.instrument_key],
				queryFn: () => getServerInstrument(audit.instrument_key)
			})
			.catch(() => undefined);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<ManagerReportDetailClient auditId={auditId} />
		</HydrationBoundary>
	);
}
```

- [ ] **Step 3: Update `auditor/reports/[auditId]/page.tsx`**

The auditor page uses a different audit query key (`["playspace", "auditor", "audit", auditId]`). The instrument key in the client is still `["playspace", "instrument", audit?.instrument_key]` because the auditor's `report-detail-client.tsx` uses `useLocalizedInstrument(audit?.instrument)` (no separate query, but the audit's inline instrument feeds it). To keep the client unchanged, we just need the audit prefetch — the inline instrument arrives with the audit. **No instrument prefetch needed for the auditor report page.**

If the audit response does NOT inline the instrument (rare), the auditor client's `useLocalizedInstrument(audit?.instrument)` returns null and the page degrades gracefully (renders without per-question domain labels). Don't add an extra prefetch unless we observe this in production.

So the auditor page stays as Phase C2 left it. **No change to this file in Task 3.**

To verify, open `auditor/reports/[auditId]/page.tsx` and confirm it has only the audit prefetch (the C2 version). If it does, skip the rest of Step 3.

- [ ] **Step 4: Lint and build**

```bash
pnpm lint
pnpm build
```

- [ ] **Step 5: Smoke test**

```bash
pnpm dev
```

For each of `/admin/reports/<auditId>` and `/manager/reports/<auditId>`:

1. Cold-load. View source. Confirm the audit details AND the per-question domain labels (which require the instrument) are in the HTML.
2. Hard-reload. Confirm the FastAPI backend logs show the audit fetch but NOT the instrument fetch (because the instrument is now cached).

For `/auditor/reports/<auditId>`: hard-reload. Backend logs should show only the audit fetch (instrument is inline in the audit response).

- [ ] **Step 6: Commit**

```bash
git add src/app/\(protected\)/admin/reports/\[auditId\]/page.tsx \
        src/app/\(protected\)/manager/reports/\[auditId\]/page.tsx
git commit -m "$(cat <<'EOF'
perf(web): server-prefetch instrument for admin and manager reports

Admin and manager report detail pages now prefetch the instrument via
the cached getServerInstrument when the audit response doesn't inline
it. Combined with C3's tagged caching, repeat report views serve the
instrument from Next.js's data cache instead of round-tripping to
FastAPI. Auditor report page already gets the instrument inline with
the audit, so no change there.
EOF
)"
```

---

## Task 4: Phase verification

- [ ] **Step 1: Full quality gate**

```bash
cd audit-tools-playspace-frontend
pnpm lint
pnpm format -- --check
pnpm build
```

All green.

- [ ] **Step 2: Cache hit verification**

```bash
pnpm dev
```

Open the FastAPI backend log in another terminal. Reload `/admin/reports/<auditId>` twice in a row. Confirm:

- First request: backend logs show `GET /playspace/audits/<auditId>` AND `GET /playspace/instruments/active/<key>?lang=en`.
- Second request: backend logs show only the audit fetch — instrument was served from Next.js cache.

- [ ] **Step 3: Cache invalidation verification**

With the dev server still running and `INSTRUMENT_REVALIDATE_SECRET=test-secret` in `.env.local`:

```bash
curl -X POST -H "Content-Type: application/json" \
	-H "x-revalidate-secret: test-secret" \
	-d '{"instrumentKey":"pvua_v5_2","lang":"en"}' \
	http://localhost:3000/api/internal/revalidate-instrument
```

Expected response: `{"ok":true,"revalidated":["instrument:pvua_v5_2:en"]}`.

Reload the report page. Backend logs should now show the instrument fetch happening again (cache was just invalidated).

- [ ] **Step 4: Stop dev server, announce completion**

Tell the user Phase C3 is complete. Note the exact instrument key that's cached (`pvua_v5_2` is the current default). Do not push or open a PR without explicit approval.

---

## Self-Review Checklist

- [ ] `getServerInstrument` calls `fetchServerJson` with `cache: "force-cache"` and `next: { revalidate: 3600, tags: ["instrument:..."] }`.
- [ ] `revalidateInstrument` is exported from `playspace-server.ts` and uses `revalidateTag` from `next/cache`.
- [ ] `/api/internal/revalidate-instrument/route.ts` exists, validates the body via Zod, requires the `x-revalidate-secret` header, and returns the tag(s) it invalidated.
- [ ] Admin and manager `report/[auditId]/page.tsx` files conditionally prefetch the instrument when `audit.instrument` is null or undefined.
- [ ] Auditor `report/[auditId]/page.tsx` was NOT modified by this phase (it relies on inline `audit.instrument`).
- [ ] No `.env` or `.env.local` file was committed.
- [ ] `AGENTS.md` (workspace root) mentions the new env var.
- [ ] `pnpm build` succeeds.
- [ ] At least 3 commits exist (Task 1, Task 2, Task 3, plus the docs commit).
- [ ] Cache hit verified via FastAPI backend logs.
- [ ] Cache invalidation verified via the route handler.

If any item is unchecked, fix it before announcing completion.

---

## Done Criteria

- Repeat instrument fetches on the same `(key, lang)` combo are served from Next.js's data cache, verified by the absence of repeated FastAPI log lines.
- A POST to `/api/internal/revalidate-instrument` with the right secret invalidates the cached tag, and the next page load re-fetches.
- Build, lint, format all pass.
- The frontend env var `INSTRUMENT_REVALIDATE_SECRET` is documented for ops handoff.

This is the last phase. Combined with C1 + C2, the entire Phase C goal is met: detail pages serve real content from server-rendered HTML, with hot caches across navigations.
