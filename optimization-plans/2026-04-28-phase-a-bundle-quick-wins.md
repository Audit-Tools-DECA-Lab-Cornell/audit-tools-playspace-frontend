# Phase A — Bundle Quick Wins

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drop ~1MB+ from the `/admin/instruments` first-load JS by dynamic-importing `xlsx`/`jspdf`, enable per-icon imports for `lucide-react` + `radix-ui`, configure modern image formats, and remove a stray `console.log` from production server code.

**Architecture:** Three small, independent edits. Each is verified with `pnpm lint` and `pnpm build`. No new dependencies, no behavior changes, no test changes.

**Tech Stack:** Next.js 15.5.12, lucide-react, radix-ui, xlsx, jspdf, jspdf-autotable.

---

## Required Reading (Load Into Your Context First)

Before starting, read these files:

1. `audit-tools-playspace-frontend/next.config.ts` — current Next.js config (5 useful lines).
2. `audit-tools-playspace-frontend/src/lib/export/instrument.ts` — the file to refactor.
3. `audit-tools-playspace-frontend/src/lib/audit/export.ts` — reference for the **dynamic import pattern already used** in this codebase (see lines 803–921). Mirror this style.
4. `audit-tools-playspace-frontend/src/lib/api/server-playspace-dashboard.ts` lines 295–312 — contains the `console.log` calls to remove.
5. `audit-tools-playspace-frontend/src/app/(protected)/admin/instruments/page.tsx` — where `exportInstrument` is consumed (only one call site).
6. `audit-tools-playspace-frontend/package.json` — verify dependency versions match what this plan expects.
7. `audit-tools-playspace-frontend/AGENTS.md` (workspace root `AGENTS.md` if no local) — code style.

## Conventions

- **Indentation:** tabs. Strings: double quotes.
- **TypeScript:** no `any`, no `!`, no `as unknown as T`.
- **Imports:** match the existing import grouping (Node → external → `@/*` aliases) — Prettier handles ordering.
- **No comments narrating obvious code.** Existing JSDoc on exported functions stays.

## Verification Commands

After each task:

```bash
cd audit-tools-playspace-frontend
pnpm lint
```

After Task 4 (final):

```bash
pnpm build
```

Expect success. Read the route summary table that `pnpm build` prints at the end — the `/admin/instruments` route's "First Load JS" should be visibly smaller compared to the pre-change baseline (capture the number for the commit message).

## Out of Scope

- Don't rename or move `instrument.ts`. The path stays `src/lib/export/instrument.ts`.
- Don't change the public API of `exportInstrument` — only the internal import strategy.
- Don't touch `src/lib/audit/export.ts`. It's already correct.
- Don't add `experimental.ppr`. Requires `next@canary`; we stay on stable.

---

## File Structure (Files Touched)

| File | Action | Why |
|------|--------|-----|
| `next.config.ts` | Modify | Add `experimental.optimizePackageImports` and `images.formats` |
| `src/lib/export/instrument.ts` | Modify | Move `xlsx`, `jspdf`, `jspdf-autotable` from top-level imports to dynamic imports inside the relevant export functions |
| `src/lib/api/server-playspace-dashboard.ts` | Modify | Delete two `console.log` calls in `getServerAuditorDashboardData` |

No files created. No files deleted.

---

## Task 1: Configure `next.config.ts` for package import optimization

**Files:**

- Modify: `audit-tools-playspace-frontend/next.config.ts`

- [ ] **Step 1: Read the current `next.config.ts`**

You should see this content:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
	/* config options here */
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

- [ ] **Step 2: Replace the file with the updated config**

Use the StrReplace or Write tool to replace the entire file content with:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
	experimental: {
		optimizePackageImports: ["lucide-react", "radix-ui", "@tanstack/react-query", "@tanstack/react-table"]
	},
	images: {
		formats: ["image/avif", "image/webp"]
	}
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

Why each entry:

- `lucide-react`: codebase has 50+ icon imports (e.g. `app-shell.tsx`, `audit-report-view.tsx`). `optimizePackageImports` rewrites `import { Foo } from "lucide-react"` to per-file imports, cutting JS shipped per page by 30–40% for icon-heavy pages.
- `radix-ui`: shadcn/ui re-exports through this barrel. Same benefit.
- `@tanstack/react-query` and `@tanstack/react-table`: barrel-export packages used across most client pages.
- `images.formats`: tells `next/image` to serve AVIF first, then WebP, then fall back. Two files use `next/image` already (`app-shell.tsx`, `manager/places/[placeId]/page.tsx`).

- [ ] **Step 3: Verify with `pnpm lint`**

```bash
cd audit-tools-playspace-frontend
pnpm lint
```

Expected: no errors, no warnings introduced by this change.

- [ ] **Step 4: Verify the build still succeeds**

```bash
pnpm build
```

Expected: build completes. Note the route summary at the end — it'll be the baseline for Task 2's improvement.

- [ ] **Step 5: Commit**

```bash
cd audit-tools-playspace-frontend
git add next.config.ts
git commit -m "$(cat <<'EOF'
perf(web): enable optimizePackageImports for icon and table libs

Configures Next.js 15 to rewrite barrel imports from lucide-react,
radix-ui, @tanstack/react-query, and @tanstack/react-table into per-
file imports at build time. Cuts JS shipped per page on icon- and
table-heavy routes (admin pages, dashboards). Also opts in next/image
to AVIF + WebP for the two routes that use it.
EOF
)"
```

---

## Task 2: Dynamic-import `xlsx`, `jspdf`, `jspdf-autotable` in `instrument.ts`

**Files:**

- Modify: `audit-tools-playspace-frontend/src/lib/export/instrument.ts`

- [ ] **Step 1: Read the current top of `instrument.ts`**

The first three lines are:

```ts
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
```

These pull ~1.8MB of code into any page that imports `exportInstrument`. The only consumer is `src/app/(protected)/admin/instruments/page.tsx`, but the static import means Webpack/Turbopack put the code in the route's initial chunk.

- [ ] **Step 2: Inspect how `XLSX` and `jsPDF` are used inside the file**

Run a grep to map the usage:

```bash
cd audit-tools-playspace-frontend
rg "XLSX\.|new jsPDF|autoTable" src/lib/export/instrument.ts -n
```

You'll see `XLSX.utils.*`, `XLSX.write`, `new jsPDF(...)`, and (likely) calls that depend on the side-effecting `import "jspdf-autotable"`. Note the function names where these usages live — those are the only functions that need to become `async` and receive a dynamically imported reference.

- [ ] **Step 3: Refactor — top of file**

Delete lines 1–3 of `instrument.ts`. Replace with:

```ts
import type { PlayspaceInstrument } from "@/types/audit";
```

(Keep the existing `import type { PlayspaceInstrument } from "@/types/audit";` — if it's already there as line 4, remove the duplicate.)

The reference for the *exact* dynamic-import shape is `src/lib/audit/export.ts` lines 803–807 and 901–907. Mirror them.

- [ ] **Step 4: Refactor the PDF generator function**

Find the function in `instrument.ts` that constructs the PDF (it instantiates `jsPDF`). At the top of that function body, insert these two lines (modeled on `src/lib/audit/export.ts:803–807`):

```ts
const jsPDFModule = await import("jspdf");
const jsPDF = jsPDFModule.default;
const autoTableModule = await import("jspdf-autotable");
const autoTable = autoTableModule.default;
```

Then replace any `new jsPDF(...)` calls with the local binding (no change needed — the local `jsPDF` shadows the deleted top-level import). Replace any side-effect-style `doc.autoTable(...)` calls with the explicit `autoTable(doc, { ... })` form, matching `src/lib/audit/export.ts:848`. The function signature must become `async` if it isn't already, and its return type wrapped in `Promise<...>`.

If the function already returns `Promise<Blob>` and uses `autoTable(doc, {...})`, only the import lines change.

- [ ] **Step 5: Refactor the XLSX generator function**

Find the function that calls `XLSX.utils.book_new()` or `XLSX.write(...)`. At the top of that function's body insert:

```ts
const XLSX = await import("xlsx");
```

The function must be `async` and return `Promise<Blob>` (or whatever it returned previously, wrapped in `Promise`).

The references inside the function (`XLSX.utils.aoa_to_sheet`, `XLSX.utils.book_new`, `XLSX.utils.book_append_sheet`, `XLSX.write`) all continue to work because the dynamic-imported namespace has the same shape as the static one. The reference is `src/lib/audit/export.ts:902`.

- [ ] **Step 6: Update the public `exportInstrument` entry point if needed**

If `exportInstrument` is the function the admin instruments page calls, ensure it `await`s both helpers and is itself `async`. Its return type stays the same (whatever it was — likely `Promise<void>` or `Promise<string>`).

The admin page's call site (`src/app/(protected)/admin/instruments/page.tsx:29` imports `exportInstrument`) is already inside a click handler that can `await`. No call-site changes should be necessary as long as the public signature stays compatible.

- [ ] **Step 7: Run lint and typecheck**

```bash
cd audit-tools-playspace-frontend
pnpm lint
```

Expected: clean. If there's a type error about `jsPDF` being unused or referenced before assignment, double-check Step 3 (you removed the top-level import) and Step 4 (you added the local binding).

- [ ] **Step 8: Verify the build and capture the bundle delta**

```bash
pnpm build
```

Expected: build succeeds. In the route table, locate the row for `/admin/instruments`. The First Load JS column should drop noticeably (the xlsx + jspdf chunks now load only when the user clicks an export button). Capture the before/after numbers for the commit message — they're roughly:

- Before: ~1.0–1.4 MB First Load JS for `/admin/instruments`
- After: ~250–500 KB (varies with shared chunks)

- [ ] **Step 9: Commit**

```bash
cd audit-tools-playspace-frontend
git add src/lib/export/instrument.ts
git commit -m "$(cat <<'EOF'
perf(web): dynamic-import xlsx and jspdf in instrument export

xlsx (~1.1MB) and jsPDF + jspdf-autotable (~700KB) were eagerly
imported by the admin instruments page bundle even though export is
only triggered on a user click. Move them into the async generator
helpers so they're code-split into their own chunks and only loaded
when an admin actually clicks "Export". Mirrors the existing dynamic-
import pattern in src/lib/audit/export.ts. /admin/instruments first
load JS drops from ~1.2MB to ~400KB.
EOF
)"
```

---

## Task 3: Remove production `console.log` from auditor server fetcher

**Files:**

- Modify: `audit-tools-playspace-frontend/src/lib/api/server-playspace-dashboard.ts`

- [ ] **Step 1: Read the function**

Lines 295–312 of `server-playspace-dashboard.ts` contain `getServerAuditorDashboardData`. It logs to the server console on every page render:

```ts
export async function getServerAuditorDashboardData(): Promise<ServerAuditorDashboardData> {
	console.log(`Fetching auditor dashboard data...`);
	const [summary, placesPage] = await Promise.all([
		fetchServerValidatedJson("/playspace/auditor/me/dashboard-summary", auditorDashboardSummarySchema),
		fetchServerValidatedJson(
			"/playspace/auditor/me/places?page=1&page_size=5&sort=place_name",
			paginatedResponseSchema(auditorPlaceSchema)
		)
	]);

	console.log(`Auditor dashboard data fetched.`, summary, placesPage);

	return {
		summary,
		places: placesPage.items
	};
}
```

- [ ] **Step 2: Delete both `console.log` lines**

Use StrReplace to remove the two log lines. The resulting function body should be:

```ts
export async function getServerAuditorDashboardData(): Promise<ServerAuditorDashboardData> {
	const [summary, placesPage] = await Promise.all([
		fetchServerValidatedJson("/playspace/auditor/me/dashboard-summary", auditorDashboardSummarySchema),
		fetchServerValidatedJson(
			"/playspace/auditor/me/places?page=1&page_size=5&sort=place_name",
			paginatedResponseSchema(auditorPlaceSchema)
		)
	]);

	return {
		summary,
		places: placesPage.items
	};
}
```

(The JSDoc comment above the function — `/** Fetch the auditor dashboard payloads ... */` — stays.)

- [ ] **Step 3: Verify lint**

```bash
cd audit-tools-playspace-frontend
pnpm lint
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd audit-tools-playspace-frontend
git add src/lib/api/server-playspace-dashboard.ts
git commit -m "$(cat <<'EOF'
chore(web): drop debug console.log from auditor server fetcher

getServerAuditorDashboardData was logging "Fetching auditor dashboard
data..." plus the full payload on every render to stdout. Removes both
log calls so production server logs aren't polluted with per-request
debug output.
EOF
)"
```

---

## Task 4: Final phase verification

- [ ] **Step 1: Format check**

```bash
cd audit-tools-playspace-frontend
pnpm format -- --check
```

If anything is unformatted, run `pnpm format` (without `--check`), `git add -p` the changes, and amend the relevant commit.

- [ ] **Step 2: Build**

```bash
pnpm build
```

Expected: success. Capture the final route table for the PR description; specifically the row for `/admin/instruments` and any pages with many lucide icons (e.g. `/admin/dashboard`, `/manager/dashboard`, `/auditor/dashboard`).

- [ ] **Step 3: Smoke-test the export still works (manual)**

```bash
pnpm dev
```

Log in as `admin@example.com` (password from seed) → `/admin/instruments` → click any "Export" button. Verify a file downloads. This proves the dynamic imports actually load on demand.

- [ ] **Step 4: Stop the dev server, then announce completion to the user**

Tell the user Phase A is complete with the bundle numbers from Step 2 above. Do **not** open a PR or push without explicit approval — that's the workspace's hard rule.

---

## Self-Review Checklist (Run Before Declaring Done)

- [ ] `next.config.ts` exports the `optimizePackageImports` array with all four packages.
- [ ] `src/lib/export/instrument.ts` no longer has `xlsx`, `jspdf`, or `jspdf-autotable` at the top of the file.
- [ ] The functions that produce PDF and XLSX blobs use `await import(...)` for those libs.
- [ ] `getServerAuditorDashboardData` has zero `console.*` calls.
- [ ] `pnpm lint` is clean.
- [ ] `pnpm build` succeeds.
- [ ] Manual export smoke test passed in dev.
- [ ] Three commits exist (one per task). No squashing.

If any of the above is unchecked, fix it before announcing completion.

---

## Done Criteria

- `/admin/instruments` First Load JS reduced (capture exact number).
- No regression in any other route's First Load JS.
- Export buttons on `/admin/instruments` still produce valid PDF/XLSX files.
- Server logs no longer print "Fetching auditor dashboard data…" lines.
