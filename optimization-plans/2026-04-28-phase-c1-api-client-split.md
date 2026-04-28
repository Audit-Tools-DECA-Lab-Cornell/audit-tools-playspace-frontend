# Phase C1 — API Client Split (Foundational Refactor)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. **This is a foundational refactor that Phase C2 and C3 depend on.** Take your time, verify after every task, do not skip the build step.

**Goal:** Split `src/lib/api/playspace.ts` (currently 1583 lines, marked `"use client"`) into three files so that types and Zod schemas can be safely imported from server components without dragging the axios-based browser client into the server bundle. Delete the duplicate Zod schemas in `server-playspace-dashboard.ts` and route its fetches through a new server-only helper. Preserve every existing public export so consumer files don't have to change.

**Architecture:**
- `src/lib/api/playspace-types.ts` (NEW, server-safe) — all Zod schemas, type aliases, query interfaces, the `paginatedResponseSchema` helper, and the `PlayspaceApiError` class.
- `src/lib/api/playspace.ts` (KEPT, client-only) — `"use client"` stays at top. Imports schemas it needs from `playspace-types.ts`. Re-exports everything from `playspace-types.ts` so existing imports keep working. Keeps the `playspaceApi` object and the axios-based `fetchValidatedJson`/`fetchNoContent` helpers.
- `src/lib/api/playspace-server.ts` (NEW, server-only) — uses native `fetch` + `next/headers` cookies to talk to the backend. Exports a low-level `fetchServerJson` helper plus a few high-level functions (`getServerAudit`, `getServerInstrument`) that Phase C2 needs.
- `src/lib/api/server-playspace-dashboard.ts` (REFACTORED) — drops its 312-line copy-pasted Zod schemas and uses `playspace-types.ts` + `playspace-server.ts`. Shrinks to <80 lines (just composition functions).

**Tech Stack:** Next.js 15.5.12, Zod 4, TypeScript strict, `next/headers` for server-side cookie reads.

---

## Required Reading (Load Into Your Context First)

1. `audit-tools-playspace-frontend/src/lib/api/playspace.ts` — full 1583 lines. The whole file goes into context.
2. `audit-tools-playspace-frontend/src/lib/api/server-playspace-dashboard.ts` — full 312 lines. The whole file.
3. `audit-tools-playspace-frontend/src/lib/api/api-client.ts` — 91 lines. Reference for the cookie-reading client; we mirror its base-URL helper but for server.
4. `audit-tools-playspace-frontend/src/lib/auth/server-session.ts` — 25 lines. Pattern for reading cookies on the server.
5. `audit-tools-playspace-frontend/src/lib/auth/role.ts` — 30 lines. Cookie name constants we need.
6. `audit-tools-playspace-frontend/src/types/audit.ts` (just confirm the `playspaceInstrumentSchema` and `PlayspaceInstrument` exports). Don't modify.
7. `audit-tools-playspace-frontend/AGENTS.md` — code style.
8. `audit-tools-playspace-frontend/tsconfig.json` — confirm `"strict": true` and `"isolatedModules": true`. The plan relies on both.
9. The master plan at `docs/superpowers/plans/2026-04-28-frontend-perf-master.md`.

## Conventions

- **Indentation:** tabs. Strings: double quotes.
- **TypeScript:** strict — no `any`, no `!`, no `as unknown as T`.
- **Server file imports:** `playspace-server.ts` MUST NOT import from `playspace.ts` or `api-client.ts`. It uses `next/headers` (`cookies`) and the native `fetch`. Importing the axios client would force the bundler to pull in a client-only module.
- **Re-export pattern:** `playspace.ts` uses `export * from "./playspace-types";` so existing consumers keep working without import changes.
- **Schema parity:** never paraphrase a schema while moving it. Copy character-for-character. A misplaced `.optional()` will silently break parsing at runtime.
- **No new dependencies.** Everything you need is already installed.

## Verification Commands

After every task:

```bash
cd audit-tools-playspace-frontend
pnpm lint
```

After Tasks 2, 4, and 6 (the bigger ones):

```bash
pnpm build
```

`pnpm build` is the most important check — it surfaces RSC boundary violations, missing exports, type errors, and circular imports all at once.

## Out of Scope

- **Don't touch any consumer of `playspace.ts`.** Pages and components keep their existing `import { playspaceApi, type AuditSession } from "@/lib/api/playspace"` calls. The re-export pattern guarantees backward compatibility.
- **Don't move the `playspaceApi` object** out of `playspace.ts`. It depends on the axios client; it stays client-only.
- **Don't introduce a new dependency** (e.g. don't add `node-fetch` or `undici` — Next.js's built-in `fetch` works on the server).
- **Don't rename the existing `fetchServerValidatedJson`** in `server-playspace-dashboard.ts` until Task 6. Renaming it earlier risks broken intermediate states.
- **Don't fix unrelated lint issues** that you see while editing. Stay scoped.

---

## File Structure (Files Touched)

| File | Action | Final size (approx) |
|------|--------|---------------------|
| `src/lib/api/playspace-types.ts` | Create | ~1010 lines |
| `src/lib/api/playspace.ts` | Modify (heavy) | ~580 lines |
| `src/lib/api/playspace-server.ts` | Create | ~120 lines |
| `src/lib/api/server-playspace-dashboard.ts` | Refactor | ~80 lines |

No deletions. The full diff lives in those four files.

---

## Task 1: Create `playspace-types.ts` (server-safe schemas + types)

**Files:**

- Create: `audit-tools-playspace-frontend/src/lib/api/playspace-types.ts`

This file is built by **copying specific blocks from the existing `playspace.ts`**. Read the original first.

- [ ] **Step 1: Read `src/lib/api/playspace.ts` in full**

You need it in your context for the copy operations below.

- [ ] **Step 2: Create `playspace-types.ts` with this header**

```ts
import { z } from "zod";

import { playspaceInstrumentSchema, type PlayspaceInstrument } from "@/types/audit";

export type { PlayspaceInstrument };
```

- [ ] **Step 3: Append the schema block — copy lines 8–869 of the original `playspace.ts` verbatim**

Lines 8–869 of `src/lib/api/playspace.ts` contain every `const xxxSchema = z.xxx(...)` declaration, in this order:

```
8:   accountTypeSchema, projectStatusSchema, placeStatusSchema, auditStatusSchema, executionModeSchema, placeAxisStatusSchema, playspaceTypeSchema
24:  managerProfileSchema
37:  scorePairSchema
42:  accountStatsSchema
49:  recentActivitySchema
61:  accountDetailSchema
72:  projectSummarySchema
88:  projectDetailSchema
102: projectStatsSchema
113: auditorSummarySchema
128: placeSummarySchema
150: scoreTotalsSchema
165: placeAuditHistoryItemSchema
179: placeHistorySchema
206: managerPlacesSummarySchema
218: managerPlaceRowSchema
241: managerPlacesListSchema
250: managerAuditsSummarySchema
258: managerAuditRowSchema
274: managerAuditsListSchema
283: assignmentSchema
296: assignmentWriteSchema
301: bulkAssignmentWriteSchema
307: placeDetailSchema
327: accountManagementResponseSchema
335: accountUpdateRequestSchema
340: auditorProfileDetailSchema
352: projectCreateRequestSchema
363: projectUpdateRequestSchema
373: placeCreateRequestSchema
390: placeUpdateRequestSchema
407: auditorCreateRequestSchema
417: auditorUpdateRequestSchema
427: auditorPlaceSchema
452: auditorAuditSummarySchema
470: auditorDashboardSummarySchema
478: auditMetaSchema
482: auditPreAuditSchema
494: questionResponseValueSchema
501: questionResponsePayloadSchema
503: auditSectionStateSchema
509: auditSectionProgressSchema
517: auditProgressSchema
527: auditScoresSchema
537: auditAggregateSchema
545: auditSessionSchema
590: auditAggregateWriteSchema
623: auditDraftPatchSchema
657: auditDraftSaveSchema
666: adminOverviewSchema
676: adminAccountRowSchema
687: adminProjectRowSchema
701: adminPlaceRowSchema
724: adminAuditorRowSchema
734: adminAuditRowSchema
752: instrumentContentSchema
758: adminSystemSchema
766: adminProjectExportRecordSchema
782: adminProjectsExportResponseSchema
789: adminPlaceExportRecordSchema
816: adminPlacesExportResponseSchema
823: adminAuditExportRecordSchema
844: adminAuditsExportResponseSchema
851: instrumentResponseSchema
861: instrumentCreateRequestSchema
867: instrumentUpdateRequestSchema (ends at line 869)
```

Copy that whole block **verbatim** into `playspace-types.ts`. **Add `export ` in front of every top-level `const` declaration** so external code can import them. (E.g. `const accountTypeSchema = ...` becomes `export const accountTypeSchema = ...`.) Do NOT modify the schema bodies.

- [ ] **Step 4: Append `paginatedResponseSchema` (line 871–879 of the original)**

After the schema block, append:

```ts
/**
 * Build a paginated-response schema wrapping any item schema.
 */
export function paginatedResponseSchema<TItem extends z.ZodTypeAny>(itemSchema: TItem) {
	return z.object({
		items: z.array(itemSchema),
		total_count: z.number().int().nonnegative(),
		page: z.number().int().positive(),
		page_size: z.number().int().positive(),
		total_pages: z.number().int().positive()
	});
}
```

- [ ] **Step 5: Append the type alias block (lines 881–921 of the original) and the `PaginatedResponse` generic**

```ts
export type ManagerProfile = z.infer<typeof managerProfileSchema>;
export type AccountDetail = z.infer<typeof accountDetailSchema>;
export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type ProjectDetail = z.infer<typeof projectDetailSchema>;
export type ProjectStats = z.infer<typeof projectStatsSchema>;
export type AuditorSummary = z.infer<typeof auditorSummarySchema>;
export type PlaceSummary = z.infer<typeof placeSummarySchema>;
export type PlayspaceType = z.infer<typeof playspaceTypeSchema>;
export type PlaceAuditHistoryItem = z.infer<typeof placeAuditHistoryItemSchema>;
export type PlaceHistory = z.infer<typeof placeHistorySchema>;
export type ManagerPlacesSummary = z.infer<typeof managerPlacesSummarySchema>;
export type ManagerPlaceRow = z.infer<typeof managerPlaceRowSchema>;
export type ManagerPlacesList = z.infer<typeof managerPlacesListSchema>;
export type ManagerAuditsSummary = z.infer<typeof managerAuditsSummarySchema>;
export type ManagerAuditRow = z.infer<typeof managerAuditRowSchema>;
export type ManagerAuditsList = z.infer<typeof managerAuditsListSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type AssignmentWrite = z.infer<typeof assignmentWriteSchema>;
export type BulkAssignmentWrite = z.infer<typeof bulkAssignmentWriteSchema>;
export type PlaceDetail = z.infer<typeof placeDetailSchema>;
export type AccountManagementResponse = z.infer<typeof accountManagementResponseSchema>;
export type AuditorProfileDetail = z.infer<typeof auditorProfileDetailSchema>;
export type AuditorPlace = z.infer<typeof auditorPlaceSchema>;
export type AuditorAuditSummary = z.infer<typeof auditorAuditSummarySchema>;
export type AuditorDashboardSummary = z.infer<typeof auditorDashboardSummarySchema>;
export type AuditSession = z.infer<typeof auditSessionSchema>;
export type AuditDraftPatch = z.infer<typeof auditDraftPatchSchema>;
export type AuditDraftSave = z.infer<typeof auditDraftSaveSchema>;
export type AdminOverview = z.infer<typeof adminOverviewSchema>;
export type AdminAccountRow = z.infer<typeof adminAccountRowSchema>;
export type AdminProjectRow = z.infer<typeof adminProjectRowSchema>;
export type AdminPlaceRow = z.infer<typeof adminPlaceRowSchema>;
export type AdminAuditorRow = z.infer<typeof adminAuditorRowSchema>;
export type AdminAuditRow = z.infer<typeof adminAuditRowSchema>;
export type AdminSystem = z.infer<typeof adminSystemSchema>;
export type AdminProjectExportRecord = z.infer<typeof adminProjectExportRecordSchema>;
export type AdminProjectsExportResponse = z.infer<typeof adminProjectsExportResponseSchema>;
export type AdminPlaceExportRecord = z.infer<typeof adminPlaceExportRecordSchema>;
export type AdminPlacesExportResponse = z.infer<typeof adminPlacesExportResponseSchema>;
export type AdminAuditExportRecord = z.infer<typeof adminAuditExportRecordSchema>;
export type AdminAuditsExportResponse = z.infer<typeof adminAuditsExportResponseSchema>;

export type PaginatedResponse<TItem> = {
	items: TItem[];
	total_count: number;
	page: number;
	page_size: number;
	total_pages: number;
};
```

- [ ] **Step 6: Append the query interfaces (lines 930–1000 of the original)**

Copy these verbatim:

```ts
export interface ManagerPlacesQuery {
	search?: string;
	auditStatus?: "not_started" | "in_progress" | "submitted";
	projectIds?: readonly string[];
	page?: number;
	pageSize?: number;
	sort?: string;
}

export interface ManagerAuditsQuery {
	search?: string;
	statuses?: Array<"IN_PROGRESS" | "PAUSED" | "SUBMITTED">;
	projectIds?: readonly string[];
	auditorIds?: readonly string[];
	page?: number;
	pageSize?: number;
	sort?: string;
}

export interface PaginatedListQuery {
	page?: number;
	pageSize?: number;
	search?: string;
	sort?: string;
}

export interface AuditorPlacesQuery extends PaginatedListQuery {
	statuses?: Array<"not_started" | "in_progress" | "submitted">;
}

export interface AuditorAuditsQuery extends PaginatedListQuery {
	statuses?: Array<"in_progress" | "paused" | "submitted">;
}

export interface AdminAccountsQuery extends PaginatedListQuery {
	accountTypes?: Array<"ADMIN" | "MANAGER" | "AUDITOR">;
}

export interface AdminPlacesQuery extends PaginatedListQuery {
	accountIds?: readonly string[];
	projectIds?: readonly string[];
	auditStatuses?: readonly string[];
	surveyStatuses?: readonly string[];
}

export interface AdminAuditorsQuery extends PaginatedListQuery {
	accountIds?: readonly string[];
}

export interface AdminProjectsQuery extends PaginatedListQuery {
	accountIds?: readonly string[];
}

export interface AdminAuditsQuery extends PaginatedListQuery {
	accountIds?: readonly string[];
	projectIds?: readonly string[];
	auditorIds?: readonly string[];
	statuses?: Array<"IN_PROGRESS" | "PAUSED" | "SUBMITTED">;
}

export interface AdminExportQuery {
	search?: string;
	accountIds?: readonly string[];
	projectIds?: readonly string[];
	auditStatuses?: readonly string[];
	surveyStatuses?: readonly string[];
	statuses?: Array<"IN_PROGRESS" | "PAUSED" | "SUBMITTED">;
}
```

If any of these signatures differ from the original `playspace.ts`, **trust the original** and copy that one instead. The text above is the version present at the time this plan was written.

- [ ] **Step 7: Append the `PlayspaceApiError` class (lines 1001–1012 of the original)**

```ts
/**
 * Structured error for API failures and validation issues.
 */
export class PlayspaceApiError extends Error {
	public readonly status: number;

	public constructor(message: string, status: number) {
		super(message);
		this.name = "PlayspaceApiError";
		this.status = status;
	}
}
```

- [ ] **Step 8: Verify the file compiles in isolation**

```bash
cd audit-tools-playspace-frontend
pnpm lint
```

Expected: lint passes. The new file is now a self-contained module exporting every schema, type, query interface, paginated wrapper, and the error class.

If lint complains about an unresolved import or a duplicated declaration, re-read the relevant lines of the original `playspace.ts` and fix the discrepancy. Don't rename anything to avoid the error — match the original.

- [ ] **Step 9: Confirm exports with a quick check**

```bash
node --input-type=module -e "import('./node_modules/typescript/lib/typescript.js').then(ts => { const sf = ts.createSourceFile('p.ts', require('fs').readFileSync('./src/lib/api/playspace-types.ts','utf8'), ts.ScriptTarget.Latest, true); let count = 0; sf.forEachChild(n => { if ((n.modifiers ?? []).some(m => m.kind === ts.SyntaxKind.ExportKeyword)) count++; }); console.log('exports:', count); });"
```

Expected: `exports: 100` or higher (varies, but should be roughly: ~65 schema consts + ~40 types + ~10 query interfaces + 1 helper + 1 class = ~117). If you see a number much smaller than 100, you missed adding `export` to a block.

- [ ] **Step 10: Commit**

```bash
git add src/lib/api/playspace-types.ts
git commit -m "$(cat <<'EOF'
feat(web): extract playspace API types and schemas to playspace-types

New file src/lib/api/playspace-types.ts holds every Zod schema, type
alias, query interface, the paginatedResponseSchema helper, and the
PlayspaceApiError class. Server-safe (no "use client", no axios). The
existing playspace.ts will re-export from this file in the next commit
so consumer imports keep working unchanged.
EOF
)"
```

---

## Task 2: Replace the schema/type block in `playspace.ts` with imports + re-exports

**Files:**

- Modify: `audit-tools-playspace-frontend/src/lib/api/playspace.ts`

This is the biggest single edit in the plan. The strategy: **delete lines 6–1012** of the original (where 6 is the `playspaceInstrumentSchema` import, 8–1012 is everything we just moved) and replace them with a tighter prefix block. Lines 1014–1583 (the helper functions and `playspaceApi` object) stay byte-identical.

- [ ] **Step 1: Re-read `src/lib/api/playspace.ts`**

Confirm lines 1014–1583 are still the helper functions (`getErrorMessage`, `normalizeRequestBody`, `getRequestFallbackMessage`, `toPlayspaceApiError`, `fetchValidatedJson`, `fetchNoContent`, `buildQueryString`) followed by `export const playspaceApi = { ... }`.

- [ ] **Step 2: Construct the new prefix block**

The replacement for original lines 1–1012 is:

```ts
"use client";

import { isAxiosError } from "axios";
import { z } from "zod";

import { api } from "@/lib/api/api-client";
import {
	accountManagementResponseSchema,
	accountUpdateRequestSchema,
	accountDetailSchema,
	adminAccountRowSchema,
	adminAuditExportRecordSchema,
	adminAuditRowSchema,
	adminAuditorRowSchema,
	adminAuditsExportResponseSchema,
	adminOverviewSchema,
	adminPlaceExportRecordSchema,
	adminPlaceRowSchema,
	adminPlacesExportResponseSchema,
	adminProjectExportRecordSchema,
	adminProjectRowSchema,
	adminProjectsExportResponseSchema,
	adminSystemSchema,
	assignmentSchema,
	auditDraftPatchSchema,
	auditDraftSaveSchema,
	auditSessionSchema,
	auditorAuditSummarySchema,
	auditorCreateRequestSchema,
	auditorDashboardSummarySchema,
	auditorPlaceSchema,
	auditorProfileDetailSchema,
	auditorSummarySchema,
	auditorUpdateRequestSchema,
	bulkAssignmentWriteSchema,
	instrumentContentSchema,
	instrumentCreateRequestSchema,
	instrumentResponseSchema,
	instrumentUpdateRequestSchema,
	managerAuditsListSchema,
	managerPlacesListSchema,
	managerProfileSchema,
	paginatedResponseSchema,
	placeCreateRequestSchema,
	placeDetailSchema,
	placeHistorySchema,
	placeSummarySchema,
	placeUpdateRequestSchema,
	PlayspaceApiError,
	projectCreateRequestSchema,
	projectDetailSchema,
	projectStatsSchema,
	projectSummarySchema,
	projectUpdateRequestSchema
} from "./playspace-types";

export * from "./playspace-types";
```

Notes on this block:
- The first three `import` lines (`isAxiosError`, `z`, `api`) match the original lines 3–5.
- The `import { ... } from "./playspace-types"` named-import list lists every schema or class **referenced inside the helper functions or `playspaceApi` object** (lines 1014+ of the original). If you add a schema later that the API methods don't reference, you don't need to import it — `export *` re-exports it for outside consumers.
- The `export * from "./playspace-types";` line is what keeps existing imports like `import { type AuditSession } from "@/lib/api/playspace"` working everywhere.
- The `PlayspaceApiError` class is used by `toPlayspaceApiError` (around original line 1066) and `fetchValidatedJson`/`fetchNoContent`. It must be in the named-import list.

If the named-import list omits something the API methods reference, the build will fail with a clear "X is not defined" error. If that happens, add the missing name and rebuild.

- [ ] **Step 3: Replace lines 1–1012 of `playspace.ts` with the prefix block**

Use the Read tool first to locate the exact start/end of the block to replace. Then either:

(a) Use multiple StrReplace operations to delete schema declarations in chunks, then add the prefix block at the top, OR
(b) Use the Write tool to overwrite the file. The new content is **the prefix block above + lines 1013 onwards of the original file unchanged**.

Approach (b) is faster and less error-prone. To do it safely:

1. Read the file once and note the exact text starting at line 1013 (`/**` of `getErrorMessage`'s JSDoc) through line 1583 (the closing `} as const;` of `playspaceApi`). Capture this 570-line block byte-for-byte.
2. Compose the new file as `<prefix block> + "\n\n" + <captured block>`.
3. Use Write to overwrite `src/lib/api/playspace.ts`.

- [ ] **Step 4: Run `pnpm lint`**

```bash
cd audit-tools-playspace-frontend
pnpm lint
```

Expected: clean. If you see "X is not defined" or "X is declared but never used", trace it:
- "not defined": add the missing schema to the named-import list in the prefix block.
- "declared but never used": the named-import list includes a schema the API methods don't actually reference. Remove it from the list (it's still re-exported via `export *`).

- [ ] **Step 5: Run `pnpm build`**

```bash
pnpm build
```

This is the critical checkpoint. The build must succeed. If it doesn't:
- Check for circular imports between `playspace.ts` and `playspace-types.ts`. Neither should import from the other except via `playspace.ts`'s named-import list and `export *`.
- Check that `import { z } from "zod"` is still in `playspace.ts` if any code outside the moved block references `z` (e.g. `z.infer<typeof ...>` casts inside the API methods — there are some). If unused, remove.
- Check that `playspaceInstrumentSchema` is no longer imported in `playspace.ts` (it moved to `playspace-types.ts`).

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/playspace.ts
git commit -m "$(cat <<'EOF'
refactor(web): re-export playspace API types from playspace-types

Removes ~1000 lines of inline Zod schemas, type aliases, query types,
PaginatedResponse, paginatedResponseSchema, and PlayspaceApiError from
playspace.ts. They now live in the server-safe playspace-types.ts.
playspace.ts keeps "use client", imports the schemas it needs for
runtime parsing, and uses `export * from "./playspace-types"` to
preserve every existing public export. No consumer imports change.
EOF
)"
```

---

## Task 3: Create `playspace-server.ts` (server-only fetcher)

**Files:**

- Create: `audit-tools-playspace-frontend/src/lib/api/playspace-server.ts`

Server-safe utility that calls the backend with the bearer token from the request cookie. Mirrors `fetchServerValidatedJson` from the existing `server-playspace-dashboard.ts` but lives in its own file so other server fetches (Phase C2) can reuse it without dragging the dashboard composition logic.

- [ ] **Step 1: Create the file**

```ts
import { cookies } from "next/headers";
import { z } from "zod";

import { AUTH_COOKIE_NAMES } from "@/lib/auth/role";
import { auditSessionSchema, PlayspaceApiError, type AuditSession } from "@/lib/api/playspace-types";
import { playspaceInstrumentSchema, type PlayspaceInstrument } from "@/types/audit";

/**
 * Resolve the API base URL from env (NEXT_PUBLIC_API_BASE_URL) with a localhost fallback.
 * Identical defaulting to the browser-side helper in api-client.ts so dev environments stay
 * consistent across client and server.
 */
function getServerApiBaseUrl(): string {
	const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
	if (configured && configured.trim().length > 0) {
		return configured;
	}
	return "http://127.0.0.1:8000";
}

/**
 * Read the bearer token from the request cookies in a server component.
 * Returns null if the user is not authenticated.
 */
async function getServerAccessToken(): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value ?? null;
}

/**
 * Convert any non-OK response payload into a useful error message, matching
 * the shape FastAPI returns ({ detail: "..." }).
 */
function getServerErrorMessage(payload: unknown, fallback: string): string {
	if (typeof payload === "string" && payload.trim().length > 0) {
		return payload;
	}
	if (typeof payload === "object" && payload !== null && "detail" in payload) {
		const detail = (payload as { detail?: unknown }).detail;
		if (typeof detail === "string" && detail.trim().length > 0) {
			return detail;
		}
	}
	return fallback;
}

/**
 * Options accepted by `fetchServerJson`. `next` is the standard Next.js fetch
 * cache directive — we expose it so callers can opt into ISR-style caching with
 * tags. Phase C3 uses this to cache the static instrument fetch.
 */
export interface ServerFetchOptions {
	method?: "GET" | "POST" | "PATCH" | "DELETE";
	body?: unknown;
	cache?: RequestCache;
	next?: { revalidate?: number | false; tags?: string[] };
	requireAuth?: boolean;
}

/**
 * Authenticated server-side fetch + Zod validation.
 * Throws `PlayspaceApiError` on transport failure, non-OK status, or schema mismatch.
 */
export async function fetchServerJson<TValue>(
	path: string,
	schema: z.ZodType<TValue>,
	options: ServerFetchOptions = {}
): Promise<TValue> {
	const { method = "GET", body, cache, next, requireAuth = true } = options;

	const headers: HeadersInit = {
		Accept: "application/json"
	};

	if (body !== undefined) {
		headers["Content-Type"] = "application/json";
	}

	if (requireAuth) {
		const accessToken = await getServerAccessToken();
		if (!accessToken) {
			throw new PlayspaceApiError("Authenticated session required.", 401);
		}
		headers.Authorization = `Bearer ${accessToken}`;
	}

	const url = `${getServerApiBaseUrl()}${path}`;
	const fetchInit: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body)
	};

	if (cache) {
		fetchInit.cache = cache;
	}
	if (next) {
		fetchInit.next = next;
	}
	if (!cache && !next) {
		fetchInit.cache = "no-store";
	}

	const response = await fetch(url, fetchInit);

	if (!response.ok) {
		const payload: unknown = await response.json().catch(() => null);
		throw new PlayspaceApiError(
			getServerErrorMessage(payload, `${method} ${path} request failed.`),
			response.status
		);
	}

	const payload: unknown = await response.json();
	const parsed = schema.safeParse(payload);
	if (!parsed.success) {
		throw new PlayspaceApiError(`Schema validation failed for ${method} ${path}.`, 0);
	}
	return parsed.data;
}

/**
 * Fetch one audit session by id on the server.
 * Same endpoint as `playspaceApi.auditor.getAudit` / `admin.auditDetail` /
 * `accounts.auditDetail` — the route is role-aware on the backend.
 */
export async function getServerAudit(auditId: string): Promise<AuditSession> {
	return fetchServerJson(`/playspace/audits/${encodeURIComponent(auditId)}`, auditSessionSchema);
}

/**
 * Fetch a localized instrument definition on the server.
 * Phase C3 wraps this with `next: { tags, revalidate }` for ISR caching.
 */
export async function getServerInstrument(instrumentKey: string, lang: string = "en"): Promise<PlayspaceInstrument> {
	const query = new URLSearchParams({ lang });
	return fetchServerJson(
		`/playspace/instruments/active/${encodeURIComponent(instrumentKey)}?${query.toString()}`,
		playspaceInstrumentSchema
	);
}
```

- [ ] **Step 2: Lint**

```bash
pnpm lint
```

Expected: clean.

- [ ] **Step 3: Build**

```bash
pnpm build
```

The new file is unused by anything yet, but the build must still succeed (verifies the file is valid).

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/playspace-server.ts
git commit -m "$(cat <<'EOF'
feat(web): add playspace-server.ts for server-only API fetches

New utility module that talks to the FastAPI backend from server
components. Reads the bearer token via next/headers cookies, uses
the native fetch (not axios), and validates responses via the shared
Zod schemas in playspace-types.ts. Exposes:

- fetchServerJson(path, schema, opts) — low-level helper.
- getServerAudit(auditId) — single-audit fetcher used by detail pages.
- getServerInstrument(key) — instrument fetcher; Phase C3 will tag this
  for ISR caching.

Wired into pages by Phase C2. Phase C3 layers in caching via the `next`
option already exposed.
EOF
)"
```

---

## Task 4: Refactor `server-playspace-dashboard.ts` to use the new shared modules

**Files:**

- Modify: `audit-tools-playspace-frontend/src/lib/api/server-playspace-dashboard.ts`

The current file (312 lines) duplicates ~150 lines of Zod schemas because they were defined in the `"use client"` `playspace.ts` and couldn't be imported from the server. With C1, that's no longer true — we delete the duplicates and import from `playspace-types.ts`.

- [ ] **Step 1: Read the current `server-playspace-dashboard.ts`**

You'll see it duplicates schemas like `accountTypeSchema`, `projectStatusSchema`, `auditStatusSchema`, `playspaceTypeSchema`, etc., and defines `accountDetailSchema`, `projectSummarySchema`, `auditorSummarySchema`, `adminOverviewSchema`, `adminAuditRowSchema`, `auditorPlaceSchema`, `auditorDashboardSummarySchema` again. It also defines `paginatedResponseSchema`, a server-side `fetchServerValidatedJson` helper, and three exported functions: `getServerManagerDashboardData`, `getServerAdminDashboardData`, `getServerAuditorDashboardData`.

- [ ] **Step 2: Replace the entire file with this content**

```ts
import {
	accountDetailSchema,
	adminAuditRowSchema,
	adminOverviewSchema,
	auditorDashboardSummarySchema,
	auditorPlaceSchema,
	auditorSummarySchema,
	managerProfileSchema,
	paginatedResponseSchema,
	projectSummarySchema,
	type AccountDetail,
	type AdminAuditRow,
	type AdminOverview,
	type AuditorDashboardSummary,
	type AuditorPlace,
	type AuditorSummary,
	type ManagerProfile,
	type ProjectSummary
} from "@/lib/api/playspace-types";
import { fetchServerJson } from "@/lib/api/playspace-server";
import { z } from "zod";

export type ServerManagerDashboardData = Readonly<{
	account: AccountDetail;
	managerProfiles: ManagerProfile[];
	projects: ProjectSummary[];
	auditors: AuditorSummary[];
}>;

export type ServerAdminDashboardData = Readonly<{
	overview: AdminOverview;
	latestAudits: AdminAuditRow[];
}>;

export type ServerAuditorDashboardData = Readonly<{
	summary: AuditorDashboardSummary;
	places: AuditorPlace[];
}>;

/**
 * Fetch the manager dashboard payloads on the server so the page can render
 * without a client-side request waterfall.
 */
export async function getServerManagerDashboardData(accountId: string): Promise<ServerManagerDashboardData> {
	const [account, managerProfiles, projects, auditors] = await Promise.all([
		fetchServerJson(`/playspace/accounts/${encodeURIComponent(accountId)}`, accountDetailSchema),
		fetchServerJson(
			`/playspace/accounts/${encodeURIComponent(accountId)}/manager-profiles`,
			z.array(managerProfileSchema)
		),
		fetchServerJson(`/playspace/accounts/${encodeURIComponent(accountId)}/projects`, z.array(projectSummarySchema)),
		fetchServerJson(`/playspace/accounts/${encodeURIComponent(accountId)}/auditors`, z.array(auditorSummarySchema))
	]);

	return { account, managerProfiles, projects, auditors };
}

/**
 * Fetch the admin dashboard payloads on the server so the page can render its
 * overview immediately.
 */
export async function getServerAdminDashboardData(): Promise<ServerAdminDashboardData> {
	const [overview, auditsPage] = await Promise.all([
		fetchServerJson("/playspace/admin/overview", adminOverviewSchema),
		fetchServerJson(
			"/playspace/admin/audits?page=1&page_size=5&sort=-submitted_at",
			paginatedResponseSchema(adminAuditRowSchema)
		)
	]);

	return { overview, latestAudits: auditsPage.items };
}

/**
 * Fetch the auditor dashboard payloads on the server so the page can render
 * without a client-side request waterfall.
 */
export async function getServerAuditorDashboardData(): Promise<ServerAuditorDashboardData> {
	const [summary, placesPage] = await Promise.all([
		fetchServerJson("/playspace/auditor/me/dashboard-summary", auditorDashboardSummarySchema),
		fetchServerJson(
			"/playspace/auditor/me/places?page=1&page_size=5&sort=place_name",
			paginatedResponseSchema(auditorPlaceSchema)
		)
	]);

	return { summary, places: placesPage.items };
}
```

This file should now be ~85 lines down from 312.

- [ ] **Step 3: Lint**

```bash
pnpm lint
```

If `z` is reported as unused, remove the `import { z } from "zod"` line. (It IS used inside `getServerManagerDashboardData` for `z.array(...)`, so it should stay.)

- [ ] **Step 4: Build**

```bash
pnpm build
```

Expected: success. The admin and manager dashboard pages still call `getServerAdminDashboardData` / `getServerManagerDashboardData` from this file with the same signatures, so they continue to work unchanged.

- [ ] **Step 5: Smoke test**

```bash
pnpm dev
```

Log in as admin → confirm the dashboard renders. Log in as manager → same. Auditor dashboard is unchanged at this point (Phase C2 wires it up). No regression expected.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/server-playspace-dashboard.ts
git commit -m "$(cat <<'EOF'
refactor(web): drop duplicated zod schemas from server dashboard fetcher

server-playspace-dashboard.ts had ~150 lines of Zod schemas duplicated
from playspace.ts because the latter was marked "use client". After
the playspace-types.ts split (foundational refactor in C1), the
duplicates are gone and the file now imports from playspace-types.ts +
playspace-server.ts. Shrinks from 312 lines to ~85 lines, all of which
are now actual dashboard-composition logic.

No API surface change — the three exported `getServer*DashboardData`
functions keep the same signatures and the same callers.
EOF
)"
```

---

## Task 5: Phase C1 verification

- [ ] **Step 1: Confirm the four files**

```bash
cd audit-tools-playspace-frontend
ls -la src/lib/api/
```

Expected:
```
api-client.ts
playspace-server.ts
playspace-types.ts
playspace.ts
server-playspace-dashboard.ts
```

- [ ] **Step 2: Confirm `playspace.ts` is much shorter than before**

```bash
wc -l src/lib/api/playspace.ts src/lib/api/playspace-types.ts src/lib/api/playspace-server.ts src/lib/api/server-playspace-dashboard.ts
```

Expected ranges:
- `playspace.ts`: 550–650 lines (was 1583)
- `playspace-types.ts`: 970–1100 lines
- `playspace-server.ts`: 100–150 lines
- `server-playspace-dashboard.ts`: 70–110 lines

- [ ] **Step 3: Full quality gate**

```bash
pnpm lint
pnpm format -- --check
pnpm build
```

All green.

- [ ] **Step 4: Confirm no consumer files were modified**

```bash
git log --oneline -10
git diff --name-only HEAD~4..HEAD
```

The only files changed across the four C1 commits should be:
- `src/lib/api/playspace.ts`
- `src/lib/api/playspace-types.ts`
- `src/lib/api/playspace-server.ts`
- `src/lib/api/server-playspace-dashboard.ts`

If any other file appears, you went out of scope. Roll it back.

- [ ] **Step 5: Smoke test in dev**

```bash
pnpm dev
```

Log in as admin, manager, and auditor. Visit each dashboard. Click into a place / audit / report. Everything should work exactly as before — no behavior changes in C1.

- [ ] **Step 6: Stop the dev server, announce completion**

Tell the user Phase C1 is complete with the line counts from Step 2 above. Do not push or open a PR without explicit approval.

---

## Self-Review Checklist

- [ ] `playspace-types.ts` does NOT contain `"use client"` at the top.
- [ ] `playspace-types.ts` does NOT import from `axios`, `@/lib/api/api-client`, or `@/lib/api/playspace.ts`.
- [ ] Every `const xxxSchema = z.xxx(...)` declaration in `playspace-types.ts` has the `export` keyword.
- [ ] `playspace.ts` still has `"use client"` as its first line.
- [ ] `playspace.ts` includes `export * from "./playspace-types";`.
- [ ] `playspace.ts` line count is roughly 550–650 (down from 1583).
- [ ] `playspace-server.ts` does NOT import from `playspace.ts` or `api-client.ts`.
- [ ] `playspace-server.ts` reads the bearer token via `cookies()` from `next/headers`.
- [ ] `server-playspace-dashboard.ts` is roughly 70–110 lines and does not redefine any schema that exists in `playspace-types.ts`.
- [ ] All four commits exist in `git log` and have the messages specified by this plan.
- [ ] `pnpm build` succeeds.
- [ ] No consumer files were modified.

If any item is unchecked, fix it before announcing completion.

---

## Done Criteria

- The four-file structure exists.
- No file outside `src/lib/api/` was touched.
- `pnpm build` succeeds.
- Manual smoke test of admin + manager dashboards passes (auditor dashboard is unchanged here; gets wired in Phase C2).
- The line-count delta on `playspace.ts` is roughly −1000 lines.

This unlocks Phase C2 (server prefetch on detail pages) and Phase C3 (instrument fetch caching).
