# Phase C2 — Server Prefetch + React Query Hydration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. **Phase C1 must be merged before starting this plan.** Verify by checking that `src/lib/api/playspace-types.ts` and `src/lib/api/playspace-server.ts` exist.

**Goal:** Replace the SPA-style "render skeleton, fetch on mount, render data" pattern on the auditor dashboard plus all five audit/report detail pages with server-side prefetching, dehydration of the QueryClient, and `<HydrationBoundary>` so the HTML response already contains the data, eliminating the cold-load waterfall.

**Architecture:** Each refactored page becomes a thin server component that:

1. Reads `params` (auditId) and any cookie-derived state (e.g. accountId for managers).
2. Creates a per-request `QueryClient` via a new `getQueryClient` helper.
3. Calls `prefetchQuery` against `playspace-server.ts` fetchers for the **same `queryKey` the client uses**.
4. Wraps the existing client component (renamed to `<thing>-client.tsx`) inside `<HydrationBoundary state={dehydrate(queryClient)}>`.

The renamed client component keeps every line of its existing logic (`useQuery`, mutations, navigation) — its `useQuery` calls now resolve immediately from the dehydrated cache on the first render, so no skeleton flash on cold load. On warm navigation, TanStack Query handles staleness as it always did.

**Tech Stack:** Next.js 15.5.12 (App Router), React 19, `@tanstack/react-query` 5.90 (`dehydrate`, `HydrationBoundary`), `next/headers`.

---

## Required Reading

1. `audit-tools-playspace-frontend/docs/superpowers/plans/2026-04-28-phase-c1-api-client-split.md` — confirm C1 is done.
2. `audit-tools-playspace-frontend/src/lib/api/playspace-server.ts` (created in C1) — you'll extend this.
3. `audit-tools-playspace-frontend/src/app/providers.tsx` — current client-side QueryClient config.
4. `audit-tools-playspace-frontend/src/app/(protected)/admin/dashboard/page.tsx` — reference: server component that already prefetches (but uses props rather than hydration). Don't change it.
5. The five detail pages you'll refactor:
   - `src/app/(protected)/admin/audits/[auditId]/page.tsx`
   - `src/app/(protected)/manager/audits/[auditId]/page.tsx`
   - `src/app/(protected)/admin/reports/[auditId]/page.tsx`
   - `src/app/(protected)/manager/reports/[auditId]/page.tsx`
   - `src/app/(protected)/auditor/reports/[auditId]/page.tsx`
6. The auditor dashboard:
   - `src/app/(protected)/auditor/dashboard/page.tsx`
   - `src/app/(protected)/auditor/dashboard/dashboard-client.tsx`
7. `src/components/dashboard/audit-detail-view.tsx` — used by admin/manager audit detail. Don't modify.
8. `src/components/dashboard/audit-report-view.tsx` — used by admin/manager report detail. Don't modify.
9. TanStack Query SSR docs — Next.js + React Query hydration pattern: <https://tanstack.com/query/latest/docs/framework/react/guides/ssr>.
10. `audit-tools-playspace-frontend/src/lib/auth/server-session.ts` — pattern for cookie-derived session in server components.

## Conventions

- **Indentation:** tabs. Strings: double quotes.
- **TypeScript:** strict — no `any`, no `!`, no `as unknown as T`.
- **Query keys:** never invent new ones. Match exactly what the client component uses, including ordering of array elements.
- **Prefetch errors:** wrap each `prefetchQuery` call in `.catch(() => undefined)`. If the server fetch fails, the client query will retry on mount and show its own error UI. Don't propagate prefetch errors to the parent — that would 500 the page when the API is briefly down.
- **Don't add `force-dynamic`** — pages reading cookies are already dynamic by inference. Adding the directive is noise.
- **Don't change client-side `useQuery` calls.** The client component is renamed but otherwise identical.
- **`dehydrate`/`HydrationBoundary`** must come from `@tanstack/react-query` (already installed).

## Verification Commands

After every task:

```bash
cd audit-tools-playspace-frontend
pnpm lint
```

After every detail-page task and at the end:

```bash
pnpm build
```

Manual smoke test (mandatory for this phase) after every task that wires a page:

```bash
pnpm dev
```

For each refactored page:

1. Open the page in the browser.
2. Open DevTools → Network. Hard-reload.
3. The first network response (the HTML document) should already contain the page's data — view source, search for the audit code or place name.
4. Confirm there's no skeleton flash on cold load. Throttle to "Slow 3G" to make this obvious.
5. Confirm the React Query devtools (if installed) show the query in `success` state immediately.

## Out of Scope

- **Don't refactor admin or manager dashboards.** They already prefetch via direct prop-passing. Leaving them is fine.
- **Don't refactor list pages** (`/admin/audits`, `/manager/places`, etc.). They use complex pagination/filtering state that's hard to prefetch deterministically. Future work.
- **Don't change the audit detail or audit report view components** (`audit-detail-view.tsx`, `audit-report-view.tsx`). They're already client components that take props; the wrapping renamed `<thing>-client.tsx` keeps using them as-is.
- **Don't change query keys.** The client's existing keys must match the prefetched keys exactly.

---

## File Structure (Files Touched)

| File | Action |
|------|--------|
| `src/lib/api/playspace-server.ts` | Modify — add 2 helpers |
| `src/lib/query/server-query-client.ts` | Create — `getQueryClient` |
| `src/app/(protected)/auditor/dashboard/page.tsx` | Replace — server prefetch + `<HydrationBoundary>` |
| `src/app/(protected)/admin/audits/[auditId]/page.tsx` | Replace — server prefetch wrapper |
| `src/app/(protected)/admin/audits/[auditId]/audit-detail-client.tsx` | Create — extracted from old page |
| `src/app/(protected)/manager/audits/[auditId]/page.tsx` | Replace |
| `src/app/(protected)/manager/audits/[auditId]/audit-detail-client.tsx` | Create |
| `src/app/(protected)/admin/reports/[auditId]/page.tsx` | Replace |
| `src/app/(protected)/admin/reports/[auditId]/report-detail-client.tsx` | Create |
| `src/app/(protected)/manager/reports/[auditId]/page.tsx` | Replace |
| `src/app/(protected)/manager/reports/[auditId]/report-detail-client.tsx` | Create |
| `src/app/(protected)/auditor/reports/[auditId]/page.tsx` | Replace |
| `src/app/(protected)/auditor/reports/[auditId]/report-detail-client.tsx` | Create |

13 files touched. No deletions (the old `page.tsx` content moves to `*-client.tsx`, then `page.tsx` becomes a server component).

---

## Task 1: Add `getQueryClient` helper and extend `playspace-server.ts`

**Files:**

- Create: `audit-tools-playspace-frontend/src/lib/query/server-query-client.ts`
- Modify: `audit-tools-playspace-frontend/src/lib/api/playspace-server.ts`

- [ ] **Step 1: Create `src/lib/query/server-query-client.ts`**

```ts
import { QueryClient } from "@tanstack/react-query";

/**
 * Per-request server QueryClient.
 *
 * Every server component that wants to prefetch should call this helper, run
 * `prefetchQuery`/`setQueryData` against the result, then pass the dehydrated
 * state to a <HydrationBoundary>. A new client per request keeps state
 * isolated between concurrent renders. Defaults mirror the browser-side client
 * defined in src/app/providers.tsx so server-side prefetch and client-side
 * useQuery agree on staleness.
 */
export function getQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: 1,
				staleTime: 30_000
			}
		}
	});
}
```

- [ ] **Step 2: Append two helpers to `playspace-server.ts`**

Open `src/lib/api/playspace-server.ts`. After the existing `getServerInstrument` function, append:

```ts
import {
	auditorDashboardSummarySchema,
	auditorPlaceSchema,
	paginatedResponseSchema,
	type AuditorDashboardSummary,
	type AuditorPlace,
	type PaginatedResponse
} from "@/lib/api/playspace-types";

/**
 * Fetch the authenticated auditor's dashboard summary on the server.
 * Mirrors `playspaceApi.auditor.dashboardSummary()` from the browser client.
 */
export async function getServerAuditorDashboardSummary(): Promise<AuditorDashboardSummary> {
	return fetchServerJson("/playspace/auditor/me/dashboard-summary", auditorDashboardSummarySchema);
}

/**
 * Fetch the auditor's assigned places on the server. Default page size matches
 * the dashboard query so the prefetched cache lines up with the client's
 * `useQuery({ queryKey: [..., "assignedPlaces", "dashboard"] })` call.
 */
export async function getServerAuditorAssignedPlaces(
	options: { page?: number; pageSize?: number; sort?: string } = {}
): Promise<PaginatedResponse<AuditorPlace>> {
	const { page = 1, pageSize = 100, sort } = options;
	const params = new URLSearchParams();
	params.set("page", String(page));
	params.set("page_size", String(pageSize));
	if (sort) {
		params.set("sort", sort);
	}
	return fetchServerJson(
		`/playspace/auditor/me/places?${params.toString()}`,
		paginatedResponseSchema(auditorPlaceSchema)
	);
}
```

The new `import` block should be merged with the existing imports at the top of the file (don't actually leave a stray import in the middle). Reorder if needed so all imports come before any function declarations.

- [ ] **Step 3: Lint and build**

```bash
cd audit-tools-playspace-frontend
pnpm lint
pnpm build
```

Expected: clean, build succeeds. The new helpers are unused at this point; the build only verifies they compile.

- [ ] **Step 4: Commit**

```bash
git add src/lib/query/server-query-client.ts src/lib/api/playspace-server.ts
git commit -m "$(cat <<'EOF'
feat(web): add getQueryClient helper and auditor server fetchers

Adds src/lib/query/server-query-client.ts exporting a per-request
QueryClient factory that mirrors the browser-side defaults in
providers.tsx (retry: 1, staleTime: 30s). Used by server components
in upcoming commits to prefetch via <HydrationBoundary>.

Extends playspace-server.ts with getServerAuditorDashboardSummary and
getServerAuditorAssignedPlaces — the two endpoints the auditor
dashboard reads. They mirror playspaceApi.auditor.dashboardSummary
and playspaceApi.auditor.assignedPlaces so prefetched data matches
the client's query keys exactly.
EOF
)"
```

---

## Task 2: Server-prefetch the auditor dashboard

**Files:**

- Modify: `audit-tools-playspace-frontend/src/app/(protected)/auditor/dashboard/page.tsx`

The auditor dashboard's client component (`dashboard-client.tsx`) already exists and uses two queries:

- `["playspace", "auditor", "dashboardSummary"]` → `playspaceApi.auditor.dashboardSummary()`
- `["playspace", "auditor", "assignedPlaces", "dashboard"]` → `playspaceApi.auditor.assignedPlaces({ page: 1, pageSize: 100 })`

We prefetch both server-side without modifying the client component.

- [ ] **Step 1: Replace the contents of `auditor/dashboard/page.tsx`**

The current file is 5 lines:

```tsx
import { AuditorDashboardClient } from "./dashboard-client";

export default function AuditorDashboardPage() {
	return <AuditorDashboardClient />;
}
```

Replace with:

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getServerAuditorAssignedPlaces, getServerAuditorDashboardSummary } from "@/lib/api/playspace-server";
import { getQueryClient } from "@/lib/query/server-query-client";

import { AuditorDashboardClient } from "./dashboard-client";

export default async function AuditorDashboardPage() {
	const queryClient = getQueryClient();

	await Promise.all([
		queryClient
			.prefetchQuery({
				queryKey: ["playspace", "auditor", "dashboardSummary"],
				queryFn: () => getServerAuditorDashboardSummary()
			})
			.catch(() => undefined),
		queryClient
			.prefetchQuery({
				queryKey: ["playspace", "auditor", "assignedPlaces", "dashboard"],
				queryFn: () => getServerAuditorAssignedPlaces({ page: 1, pageSize: 100 })
			})
			.catch(() => undefined)
	]);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AuditorDashboardClient />
		</HydrationBoundary>
	);
}
```

The `dashboard-client.tsx` file is **not modified**.

- [ ] **Step 2: Lint and build**

```bash
pnpm lint
pnpm build
```

- [ ] **Step 3: Smoke test**

```bash
pnpm dev
```

Log in as `auditor1@example.com` / `DemoPass123!` (or whatever auditor seed account exists). Navigate to `/auditor/dashboard`. View source — the HTML should already contain auditor place names. There should be no skeleton flash on cold reload (throttle to Slow 3G to verify).

If the prefetch fails silently (e.g. backend down), the client query will retry on mount as before — same UX as today.

- [ ] **Step 4: Stop dev server, commit**

```bash
git add src/app/\(protected\)/auditor/dashboard/page.tsx
git commit -m "$(cat <<'EOF'
perf(web): server-prefetch auditor dashboard via React Query hydration

Auditor dashboard was the only role dashboard still rendering empty
HTML and fetching on mount. Mirrors the admin/manager pattern but
keeps the existing useQuery-based AuditorDashboardClient unchanged
by hydrating the QueryClient via <HydrationBoundary>. The two
prefetched queries match the client's query keys exactly.
EOF
)"
```

---

## Task 3: Server-prefetch admin audit detail

**Files:**

- Create: `audit-tools-playspace-frontend/src/app/(protected)/admin/audits/[auditId]/audit-detail-client.tsx`
- Modify: `audit-tools-playspace-frontend/src/app/(protected)/admin/audits/[auditId]/page.tsx`

- [ ] **Step 1: Read the current `page.tsx`**

It's 82 lines. Top reads:

```tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
// ...
export default function AdminAuditDetailPage() {
	const params = useParams<{ auditId: string }>();
	// ...
}
```

- [ ] **Step 2: Create `audit-detail-client.tsx`**

Copy the entire current `page.tsx` content into the new `audit-detail-client.tsx`. Apply these changes:

1. The file keeps `"use client"` at the top.
2. Remove `useParams` from the `next/navigation` import.
3. Add a props interface and accept `auditId` directly. Replace the function declaration:

   - **Old:**
     ```tsx
     export default function AdminAuditDetailPage() {
     	const params = useParams<{ auditId: string }>();
     	const router = useRouter();
     	const t = useTranslations("admin.auditDetail");
     	const auditId = params.auditId;
     ```
   - **New:**
     ```tsx
     interface AdminAuditDetailClientProps {
     	auditId: string;
     }

     export function AdminAuditDetailClient({ auditId }: Readonly<AdminAuditDetailClientProps>) {
     	const router = useRouter();
     	const t = useTranslations("admin.auditDetail");
     ```

4. The default export becomes a named export. Remove the `default` keyword. The new server `page.tsx` will import `AdminAuditDetailClient`.

The rest of the file body stays byte-identical.

- [ ] **Step 3: Replace `page.tsx` with this server component**

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getServerAudit } from "@/lib/api/playspace-server";
import { getQueryClient } from "@/lib/query/server-query-client";

import { AdminAuditDetailClient } from "./audit-detail-client";

interface AdminAuditDetailPageProps {
	params: Promise<{ auditId: string }>;
}

export default async function AdminAuditDetailPage({ params }: Readonly<AdminAuditDetailPageProps>) {
	const { auditId } = await params;
	const queryClient = getQueryClient();

	await queryClient
		.prefetchQuery({
			queryKey: ["playspace", "admin", "audit-detail", auditId],
			queryFn: () => getServerAudit(auditId)
		})
		.catch(() => undefined);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AdminAuditDetailClient auditId={auditId} />
		</HydrationBoundary>
	);
}
```

The query key matches `audit-detail-client.tsx`'s `useQuery({ queryKey: ["playspace", "admin", "audit-detail", auditId] })` exactly.

- [ ] **Step 4: Lint and build**

```bash
pnpm lint
pnpm build
```

If you see `useParams` still imported in `audit-detail-client.tsx` but unused, delete that import line. If you see "AdminAuditDetailPage is not a function" or similar runtime errors, double-check that `page.tsx`'s default export is `async function` and uses the props pattern above.

- [ ] **Step 5: Smoke test**

```bash
pnpm dev
```

Log in as admin → `/admin/audits` → click any submitted audit. View source on the loaded HTML — search for the audit code. It should be present in the initial HTML. No skeleton flash (throttle to Slow 3G).

- [ ] **Step 6: Commit**

```bash
git add src/app/\(protected\)/admin/audits/\[auditId\]/
git commit -m "$(cat <<'EOF'
perf(web): server-prefetch admin audit detail page

Splits the admin audit detail page into a server-component shell that
prefetches the audit via getServerAudit + dehydrate, and a renamed
AdminAuditDetailClient that keeps every line of the existing useQuery
logic but accepts auditId as a prop instead of useParams. Cold loads
ship the audit data in the initial HTML; no client-side waterfall.
EOF
)"
```

---

## Task 4: Server-prefetch manager audit detail

**Files:**

- Create: `audit-tools-playspace-frontend/src/app/(protected)/manager/audits/[auditId]/audit-detail-client.tsx`
- Modify: `audit-tools-playspace-frontend/src/app/(protected)/manager/audits/[auditId]/page.tsx`

The manager version's `useQuery` key includes `accountId` from the session: `["playspace", "manager", "audit-detail", auditId, accountId]`. We need to read the session server-side too.

- [ ] **Step 1: Create `audit-detail-client.tsx`**

Copy the current `page.tsx` content into the new file. Same transform as Task 3:

1. Keep `"use client"`.
2. Remove `useParams` from the import.
3. Replace the function header:

   - **Old:**
     ```tsx
     export default function ManagerAuditDetailPage() {
     	const params = useParams<{ auditId: string }>();
     	const router = useRouter();
     	const t = useTranslations("manager.auditDetail");
     	const session = useAuthSession();
     	const accountId = session?.role === "manager" ? session.accountId : null;
     	const auditId = params.auditId;
     ```
   - **New:**
     ```tsx
     interface ManagerAuditDetailClientProps {
     	auditId: string;
     }

     export function ManagerAuditDetailClient({ auditId }: Readonly<ManagerAuditDetailClientProps>) {
     	const router = useRouter();
     	const t = useTranslations("manager.auditDetail");
     	const session = useAuthSession();
     	const accountId = session?.role === "manager" ? session.accountId : null;
     ```

4. Switch from default export to named export.

The `useAuthSession` hook stays — it provides `accountId` to the query key. Server-side we need to use the same `accountId` to prefetch under the matching key.

- [ ] **Step 2: Replace `page.tsx`**

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getServerAudit } from "@/lib/api/playspace-server";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { getQueryClient } from "@/lib/query/server-query-client";

import { ManagerAuditDetailClient } from "./audit-detail-client";

interface ManagerAuditDetailPageProps {
	params: Promise<{ auditId: string }>;
}

export default async function ManagerAuditDetailPage({ params }: Readonly<ManagerAuditDetailPageProps>) {
	const { auditId } = await params;
	const session = await getServerAuthSession();
	const accountId = session?.role === "manager" ? session.accountId : null;

	const queryClient = getQueryClient();

	if (accountId) {
		await queryClient
			.prefetchQuery({
				queryKey: ["playspace", "manager", "audit-detail", auditId, accountId],
				queryFn: () => getServerAudit(auditId)
			})
			.catch(() => undefined);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<ManagerAuditDetailClient auditId={auditId} />
		</HydrationBoundary>
	);
}
```

- [ ] **Step 3: Lint and build**

```bash
pnpm lint
pnpm build
```

- [ ] **Step 4: Smoke test**

```bash
pnpm dev
```

Log in as a manager → `/manager/audits` → click an audit. View source — audit code present. No skeleton flash on Slow 3G.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(protected\)/manager/audits/\[auditId\]/
git commit -m "$(cat <<'EOF'
perf(web): server-prefetch manager audit detail page

Mirrors admin audit detail. Reads the session via getServerAuthSession
to get the accountId portion of the manager-scoped query key, then
prefetches getServerAudit under
["playspace", "manager", "audit-detail", auditId, accountId] before
hydrating ManagerAuditDetailClient.
EOF
)"
```

---

## Task 5: Server-prefetch admin report detail

**Files:**

- Create: `audit-tools-playspace-frontend/src/app/(protected)/admin/reports/[auditId]/report-detail-client.tsx`
- Modify: `audit-tools-playspace-frontend/src/app/(protected)/admin/reports/[auditId]/page.tsx`

The admin report page uses query key `["playspace", "audit", auditId]` for the audit and `["playspace", "instrument", audit?.instrument_key]` for the instrument. The audit response often inlines the instrument (`audit.instrument`), in which case the second query resolves locally without a network call. We prefetch only the audit; the client handles the instrument-loading branch as before.

- [ ] **Step 1: Create `report-detail-client.tsx`**

Copy current `page.tsx` content. Apply the same transform:

1. Keep `"use client"`.
2. Drop the `useParams` import.
3. Replace the header:

   - **Old:**
     ```tsx
     export default function AdminReportDetailPage() {
     	const params = useParams<{ auditId: string }>();
     	const auditId = params.auditId;
     ```
   - **New:**
     ```tsx
     interface AdminReportDetailClientProps {
     	auditId: string;
     }

     export function AdminReportDetailClient({ auditId }: Readonly<AdminReportDetailClientProps>) {
     ```

4. Convert default to named export.

- [ ] **Step 2: Replace `page.tsx`**

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getServerAudit } from "@/lib/api/playspace-server";
import { getQueryClient } from "@/lib/query/server-query-client";

import { AdminReportDetailClient } from "./report-detail-client";

interface AdminReportDetailPageProps {
	params: Promise<{ auditId: string }>;
}

export default async function AdminReportDetailPage({ params }: Readonly<AdminReportDetailPageProps>) {
	const { auditId } = await params;
	const queryClient = getQueryClient();

	await queryClient
		.prefetchQuery({
			queryKey: ["playspace", "audit", auditId],
			queryFn: () => getServerAudit(auditId)
		})
		.catch(() => undefined);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AdminReportDetailClient auditId={auditId} />
		</HydrationBoundary>
	);
}
```

- [ ] **Step 3: Lint and build**

```bash
pnpm lint
pnpm build
```

- [ ] **Step 4: Smoke test**

```bash
pnpm dev
```

Log in as admin → `/admin/reports/<auditId>` (paste a real audit id from `/admin/audits`). View source — audit code, place name, project name should all be in the HTML. No skeleton flash.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(protected\)/admin/reports/\[auditId\]/
git commit -m "$(cat <<'EOF'
perf(web): server-prefetch admin report detail page

Splits the admin report detail page into a server shell that
prefetches the audit (incl. inline instrument) under the
["playspace", "audit", auditId] key, plus the renamed
AdminReportDetailClient. Cold loads ship the report data in the
initial HTML.
EOF
)"
```

---

## Task 6: Server-prefetch manager report detail

**Files:**

- Create: `audit-tools-playspace-frontend/src/app/(protected)/manager/reports/[auditId]/report-detail-client.tsx`
- Modify: `audit-tools-playspace-frontend/src/app/(protected)/manager/reports/[auditId]/page.tsx`

The manager report page uses the same query key as admin: `["playspace", "audit", auditId]`. (See `manager/reports/[auditId]/page.tsx` line 24 — it's `["playspace", "audit", auditId]` not the manager-scoped one. Don't confuse it with the audit-detail page's key.)

- [ ] **Step 1: Create `report-detail-client.tsx`**

Copy the current `page.tsx`, apply the transform:

1. Keep `"use client"`.
2. Drop `useParams` import.
3. Replace the header:

   - **Old:**
     ```tsx
     export default function ManagerReportDetailPage() {
     	const params = useParams<{ auditId: string }>();
     	const auditId = params.auditId;
     ```
   - **New:**
     ```tsx
     interface ManagerReportDetailClientProps {
     	auditId: string;
     }

     export function ManagerReportDetailClient({ auditId }: Readonly<ManagerReportDetailClientProps>) {
     ```

4. Default → named export.

- [ ] **Step 2: Replace `page.tsx`**

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getServerAudit } from "@/lib/api/playspace-server";
import { getQueryClient } from "@/lib/query/server-query-client";

import { ManagerReportDetailClient } from "./report-detail-client";

interface ManagerReportDetailPageProps {
	params: Promise<{ auditId: string }>;
}

export default async function ManagerReportDetailPage({ params }: Readonly<ManagerReportDetailPageProps>) {
	const { auditId } = await params;
	const queryClient = getQueryClient();

	await queryClient
		.prefetchQuery({
			queryKey: ["playspace", "audit", auditId],
			queryFn: () => getServerAudit(auditId)
		})
		.catch(() => undefined);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<ManagerReportDetailClient auditId={auditId} />
		</HydrationBoundary>
	);
}
```

- [ ] **Step 3: Lint and build**

```bash
pnpm lint
pnpm build
```

- [ ] **Step 4: Smoke test**

```bash
pnpm dev
```

Log in as manager → `/manager/reports/<auditId>`. Same verification as admin.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(protected\)/manager/reports/\[auditId\]/
git commit -m "perf(web): server-prefetch manager report detail page"
```

---

## Task 7: Server-prefetch auditor report detail

**Files:**

- Create: `audit-tools-playspace-frontend/src/app/(protected)/auditor/reports/[auditId]/report-detail-client.tsx`
- Modify: `audit-tools-playspace-frontend/src/app/(protected)/auditor/reports/[auditId]/page.tsx`

The auditor report page is structurally different from admin/manager (its own UI for section notes), but the prefetch shape is the same. Query key: `["playspace", "auditor", "audit", auditId]`.

- [ ] **Step 1: Create `report-detail-client.tsx`**

Copy the current 446-line `page.tsx` into the new file. Apply the transform:

1. Keep `"use client"`.
2. Drop `useParams` import.
3. Replace the header:

   - **Old:**
     ```tsx
     export default function AuditorReportDetailPage() {
     	const t = useTranslations("auditor.reportDetail");
     	const formatT = useTranslations("common.format");
     	const params = useParams<{ auditId: string }>();
     	const auditId = params.auditId;
     ```
   - **New:**
     ```tsx
     interface AuditorReportDetailClientProps {
     	auditId: string;
     }

     export function AuditorReportDetailClient({ auditId }: Readonly<AuditorReportDetailClientProps>) {
     	const t = useTranslations("auditor.reportDetail");
     	const formatT = useTranslations("common.format");
     ```

4. Default → named export.

- [ ] **Step 2: Replace `page.tsx`**

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getServerAudit } from "@/lib/api/playspace-server";
import { getQueryClient } from "@/lib/query/server-query-client";

import { AuditorReportDetailClient } from "./report-detail-client";

interface AuditorReportDetailPageProps {
	params: Promise<{ auditId: string }>;
}

export default async function AuditorReportDetailPage({ params }: Readonly<AuditorReportDetailPageProps>) {
	const { auditId } = await params;
	const queryClient = getQueryClient();

	await queryClient
		.prefetchQuery({
			queryKey: ["playspace", "auditor", "audit", auditId],
			queryFn: () => getServerAudit(auditId)
		})
		.catch(() => undefined);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AuditorReportDetailClient auditId={auditId} />
		</HydrationBoundary>
	);
}
```

- [ ] **Step 3: Lint and build**

```bash
pnpm lint
pnpm build
```

- [ ] **Step 4: Smoke test**

```bash
pnpm dev
```

Log in as auditor → `/auditor/reports/<auditId>`. Verify same way.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(protected\)/auditor/reports/\[auditId\]/
git commit -m "perf(web): server-prefetch auditor report detail page"
```

---

## Task 8: Phase verification

- [ ] **Step 1: Full quality gate**

```bash
cd audit-tools-playspace-frontend
pnpm lint
pnpm format -- --check
pnpm build
```

All green.

- [ ] **Step 2: Confirm the 13 expected files exist**

```bash
git log --name-only --oneline -10
```

The C2 commits should touch exactly these files:

```
src/lib/query/server-query-client.ts
src/lib/api/playspace-server.ts
src/app/(protected)/auditor/dashboard/page.tsx
src/app/(protected)/admin/audits/[auditId]/audit-detail-client.tsx
src/app/(protected)/admin/audits/[auditId]/page.tsx
src/app/(protected)/manager/audits/[auditId]/audit-detail-client.tsx
src/app/(protected)/manager/audits/[auditId]/page.tsx
src/app/(protected)/admin/reports/[auditId]/report-detail-client.tsx
src/app/(protected)/admin/reports/[auditId]/page.tsx
src/app/(protected)/manager/reports/[auditId]/report-detail-client.tsx
src/app/(protected)/manager/reports/[auditId]/page.tsx
src/app/(protected)/auditor/reports/[auditId]/report-detail-client.tsx
src/app/(protected)/auditor/reports/[auditId]/page.tsx
```

If any other file appears, you went out of scope.

- [ ] **Step 3: Final smoke test (all 6 routes)**

```bash
pnpm dev
```

For each of the six pages, throttle to "Slow 3G", do a hard reload, and verify:

- HTML response (`view-source:`) contains the page's data.
- No skeleton flash before content appears.
- No hydration mismatch in the browser console.
- Mutations / interactions still work (e.g. on auditor dashboard, click "Resume audit" — the click handler still navigates).

- [ ] **Step 4: Stop dev server, announce completion**

Tell the user Phase C2 is complete. Note any anomalies (e.g. one of the prefetches consistently fails) for follow-up. Do not push or open a PR without explicit approval.

---

## Self-Review Checklist

- [ ] Every renamed client component still has `"use client"` at the top.
- [ ] Every server `page.tsx` is `async` and reads `params: Promise<{ auditId: string }>`.
- [ ] Every server `page.tsx` wraps its client in `<HydrationBoundary state={dehydrate(queryClient)}>`.
- [ ] Every `prefetchQuery` is followed by `.catch(() => undefined)` so a server fetch failure doesn't 500 the page.
- [ ] Every prefetched `queryKey` matches the corresponding client `useQuery({ queryKey: ... })` exactly (same array, same ordering, same primitive types).
- [ ] No `*-client.tsx` file imports from `next/navigation`'s `useParams` — the prop is passed instead.
- [ ] No client component was renamed without also updating its default export to a named export.
- [ ] `pnpm build` succeeds.
- [ ] Eight commits exist (one for Task 1, one each for Tasks 2–7, plus any verification fixups).
- [ ] No file outside the 13 listed above was modified.

If any item is unchecked, fix it before announcing completion.

---

## Done Criteria

- All six pages render their data in the initial HTML response on cold load.
- No skeleton flash visible at "Slow 3G" throttle on first navigation.
- All `useQuery` calls in the renamed client components find their data in the dehydrated cache and resolve without a network call on first render.
- No regression in mutations or in-page interactions.
- Build, lint, format all pass.

This phase, combined with C1 (foundational) and C3 (instrument caching), completes the server-render refactor. Subsequent navigations within the app are also faster because the HydrationBoundary keeps the cache populated for the session.
