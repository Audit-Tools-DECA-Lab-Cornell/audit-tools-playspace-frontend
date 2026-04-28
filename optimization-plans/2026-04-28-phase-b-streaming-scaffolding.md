# Phase B — Streaming, Loading, and Error Scaffolding

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `loading.tsx` and `error.tsx` boundaries at the right granularity so Next.js can stream content progressively, every navigation shows an immediate skeleton, and unexpected errors are recoverable in-place via React's `reset()` (instead of a full `window.location.reload()`).

**Architecture:** Add a small reusable skeletons module in `src/components/dashboard/page-skeletons.tsx`, then place `loading.tsx` and `error.tsx` files at strategic levels of the App Router tree. Add `app/global-error.tsx` for the absolute-fallback case. Wire i18n keys for the new error UI text in `messages/en.json` and `messages/de.json`. No source files outside `app/` and `components/dashboard/` are modified, no dependencies added.

**Tech Stack:** Next.js 15 App Router (file-based loading/error boundaries), React 19, next-intl 4.8, Tailwind v4.

---

## Required Reading

1. `audit-tools-playspace-frontend/src/components/ui/skeleton.tsx` — the base `<Skeleton>` primitive (15 lines).
2. `audit-tools-playspace-frontend/src/components/dashboard/empty-state.tsx` — pattern for shared dashboard panels.
3. `audit-tools-playspace-frontend/src/app/(protected)/layout.tsx` — protected layout that wraps all role pages with `<AppShell>`.
4. `audit-tools-playspace-frontend/src/app/(protected)/admin/audits/[auditId]/page.tsx` lines 32–47 — the **inline** loading skeleton currently used in detail pages. We're going to extract this shape.
5. `audit-tools-playspace-frontend/src/app/(protected)/auditor/dashboard/dashboard-client.tsx` lines 332–347 — the **inline** dashboard loading skeleton currently used.
6. `audit-tools-playspace-frontend/src/app/(protected)/manager/audits/[auditId]/page.tsx` lines 58–94 — the **inline** error fallback currently used (with `EmptyState`).
7. `audit-tools-playspace-frontend/messages/en.json` lines 6–22 — the `common` translation block. We extend it.
8. `audit-tools-playspace-frontend/messages/de.json` — German translations (for parity).
9. [Next.js docs: loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading) and [error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error). Both are App Router file conventions.

## Conventions

- **Indentation:** tabs. Strings: double quotes.
- **TypeScript:** strict — no `any`, no `!`, no `as unknown as T`.
- **`error.tsx` MUST start with `"use client"`** (App Router requirement). They receive `error: Error & { digest?: string }` and `reset: () => void` props.
- **`loading.tsx` MUST be a server component** (no `"use client"`) so it streams as part of the initial HTML. It can render only static markup.
- **`global-error.tsx` MUST render `<html>` and `<body>` itself** because it replaces the root layout when invoked.
- **i18n:** use `next-intl`'s `useTranslations` in `error.tsx` (client component). `loading.tsx` uses no translations — text-free skeletons only.

## Verification Commands

```bash
cd audit-tools-playspace-frontend
pnpm lint
pnpm build
```

After build, manually smoke-test:

```bash
pnpm dev
```

- Hard-reload `/admin/audits/<some-real-uuid>` — confirm a skeleton flashes during the network round-trip.
- In DevTools network tab, throttle to "Slow 3G", navigate between dashboard and a detail page — verify the skeleton is visible.
- Throw an error temporarily inside a page (e.g. `throw new Error("test")` in a server component) — verify the matching `error.tsx` renders and the "Try again" button works (don't commit this!).

## Out of Scope

- **Don't refactor existing inline loading skeletons inside client components.** They stay; the new `loading.tsx` files are added alongside, not as replacements.
- **Don't add `loading.tsx` to `app/(public)/login/` or `/signup/`** — these pages render a form synchronously; no loading state needed.
- **Don't change any data fetching logic.** This phase is purely scaffolding.
- **Don't add German strings if the JSON file uses a key the rest of the app uses.** Just add new keys in both files.

---

## File Structure (Files Touched)

| File | Action |
|------|--------|
| `src/components/dashboard/page-skeletons.tsx` | Create — reusable skeleton compositions |
| `src/app/(protected)/loading.tsx` | Create — fallback while role pages stream |
| `src/app/(protected)/admin/loading.tsx` | Create — admin-area generic skeleton |
| `src/app/(protected)/manager/loading.tsx` | Create — manager-area generic skeleton |
| `src/app/(protected)/auditor/loading.tsx` | Create — auditor-area generic skeleton |
| `src/app/(protected)/admin/audits/[auditId]/loading.tsx` | Create — audit-detail skeleton |
| `src/app/(protected)/admin/reports/[auditId]/loading.tsx` | Create — report-detail skeleton |
| `src/app/(protected)/manager/audits/[auditId]/loading.tsx` | Create |
| `src/app/(protected)/manager/reports/[auditId]/loading.tsx` | Create |
| `src/app/(protected)/auditor/reports/[auditId]/loading.tsx` | Create |
| `src/app/(protected)/error.tsx` | Create — protected-area error boundary |
| `src/app/(protected)/admin/error.tsx` | Create |
| `src/app/(protected)/manager/error.tsx` | Create |
| `src/app/(protected)/auditor/error.tsx` | Create |
| `src/app/global-error.tsx` | Create — absolute-fallback error |
| `messages/en.json` | Modify — add `common.errorBoundary` block |
| `messages/de.json` | Modify — add `common.errorBoundary` block |

Total: 16 files created, 2 modified. No deletions.

---

## Task 1: Add reusable page skeleton primitives

**Files:**

- Create: `audit-tools-playspace-frontend/src/components/dashboard/page-skeletons.tsx`

- [ ] **Step 1: Create the file with these exact contents**

```tsx
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_LINE_KEYS = ["a", "b", "c", "d"] as const;

/**
 * Compact stat-card grid skeleton matching the production stat cards.
 * Used by dashboard `loading.tsx` files.
 */
export function StatCardsSkeleton({ count = 4 }: Readonly<{ count?: number }>) {
	const items = Array.from({ length: count }, (_value, index) => index);
	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			{items.map(index => (
				<Skeleton key={`stat-card-${index}`} className="h-32 rounded-card border border-border bg-card" />
			))}
		</div>
	);
}

/**
 * Generic table skeleton used by list pages while the data loads server-side.
 */
export function TableSkeleton() {
	return <Skeleton className="h-[420px] rounded-card border border-border bg-card" />;
}

/**
 * Skeleton for the audit-detail page: header, four-up score grid, response table.
 */
export function AuditDetailSkeleton() {
	const items = Array.from({ length: 4 }, (_value, index) => index);
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-48 rounded-md" />
			<Skeleton className="h-40 rounded-card border border-border bg-card" />
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{items.map(index => (
					<Skeleton key={`detail-stat-${index}`} className="h-32 rounded-card border border-border bg-card" />
				))}
			</div>
			<Skeleton className="h-64 rounded-card border border-border bg-card" />
		</div>
	);
}

/**
 * Skeleton for the audit-report page: header card, score bar block, domain table.
 */
export function AuditReportSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-48 rounded-md" />
			<Skeleton className="h-40 rounded-card border border-border bg-card" />
			<Skeleton className="h-[280px] rounded-card border border-border bg-card" />
			<Skeleton className="h-[420px] rounded-card border border-border bg-card" />
		</div>
	);
}

/**
 * Generic protected-shell skeleton: header strip + body block. Used as the
 * (protected) layout-level fallback when a deeper segment hasn't yet streamed.
 */
export function ProtectedShellSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<Skeleton className="h-4 w-32 rounded-md" />
				<Skeleton className="h-9 w-72 rounded-md" />
				<Skeleton className="h-4 w-96 rounded-md" />
			</div>
			<div className="space-y-3">
				{SKELETON_LINE_KEYS.map(key => (
					<Skeleton key={`shell-line-${key}`} className="h-20 rounded-card border border-border bg-card" />
				))}
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Verify lint**

```bash
cd audit-tools-playspace-frontend
pnpm lint
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/page-skeletons.tsx
git commit -m "$(cat <<'EOF'
feat(web): add reusable page-skeleton primitives

Adds StatCardsSkeleton, TableSkeleton, AuditDetailSkeleton,
AuditReportSkeleton, and ProtectedShellSkeleton in
components/dashboard/page-skeletons.tsx. These are the building
blocks for loading.tsx files in the next commit and replace the
ad-hoc Array.from({length: 4}) skeleton patterns scattered across
client pages.
EOF
)"
```

---

## Task 2: Add `loading.tsx` for the protected shell

**Files:**

- Create: `audit-tools-playspace-frontend/src/app/(protected)/loading.tsx`

This file streams immediately when any protected route is navigated to, before deeper segments resolve.

- [ ] **Step 1: Create the file**

```tsx
import { ProtectedShellSkeleton } from "@/components/dashboard/page-skeletons";

/**
 * Default streaming fallback for any protected route.
 * Renders inside the AppShell layout slot.
 */
export default function ProtectedLoading() {
	return <ProtectedShellSkeleton />;
}
```

- [ ] **Step 2: Verify build still type-checks**

```bash
cd audit-tools-playspace-frontend
pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/loading.tsx
git commit -m "feat(web): add loading.tsx for the protected app shell"
```

---

## Task 3: Add per-role `loading.tsx`

**Files:**

- Create: `src/app/(protected)/admin/loading.tsx`
- Create: `src/app/(protected)/manager/loading.tsx`
- Create: `src/app/(protected)/auditor/loading.tsx`

Per-role pages tend to be dashboards and list pages, all of which fit a "stat-cards + table" shape.

- [ ] **Step 1: Create `admin/loading.tsx`**

```tsx
import { StatCardsSkeleton, TableSkeleton } from "@/components/dashboard/page-skeletons";

/**
 * Admin-area streaming fallback.
 */
export default function AdminLoading() {
	return (
		<div className="space-y-6">
			<StatCardsSkeleton count={6} />
			<TableSkeleton />
		</div>
	);
}
```

- [ ] **Step 2: Create `manager/loading.tsx`**

```tsx
import { StatCardsSkeleton, TableSkeleton } from "@/components/dashboard/page-skeletons";

/**
 * Manager-area streaming fallback.
 */
export default function ManagerLoading() {
	return (
		<div className="space-y-6">
			<StatCardsSkeleton count={4} />
			<TableSkeleton />
		</div>
	);
}
```

- [ ] **Step 3: Create `auditor/loading.tsx`**

```tsx
import { StatCardsSkeleton, TableSkeleton } from "@/components/dashboard/page-skeletons";

/**
 * Auditor-area streaming fallback.
 */
export default function AuditorLoading() {
	return (
		<div className="space-y-6">
			<StatCardsSkeleton count={5} />
			<TableSkeleton />
		</div>
	);
}
```

- [ ] **Step 4: Lint**

```bash
pnpm lint
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(protected\)/admin/loading.tsx \
        src/app/\(protected\)/manager/loading.tsx \
        src/app/\(protected\)/auditor/loading.tsx
git commit -m "feat(web): add per-role loading.tsx fallbacks"
```

---

## Task 4: Add detail-page `loading.tsx`

Detail pages are heavier — they render a header card + score grid + response table.

**Files:**

- Create: `src/app/(protected)/admin/audits/[auditId]/loading.tsx`
- Create: `src/app/(protected)/admin/reports/[auditId]/loading.tsx`
- Create: `src/app/(protected)/manager/audits/[auditId]/loading.tsx`
- Create: `src/app/(protected)/manager/reports/[auditId]/loading.tsx`
- Create: `src/app/(protected)/auditor/reports/[auditId]/loading.tsx`

- [ ] **Step 1: Create `admin/audits/[auditId]/loading.tsx`**

```tsx
import { AuditDetailSkeleton } from "@/components/dashboard/page-skeletons";

export default function AdminAuditDetailLoading() {
	return <AuditDetailSkeleton />;
}
```

- [ ] **Step 2: Create `admin/reports/[auditId]/loading.tsx`**

```tsx
import { AuditReportSkeleton } from "@/components/dashboard/page-skeletons";

export default function AdminReportDetailLoading() {
	return <AuditReportSkeleton />;
}
```

- [ ] **Step 3: Create `manager/audits/[auditId]/loading.tsx`**

```tsx
import { AuditDetailSkeleton } from "@/components/dashboard/page-skeletons";

export default function ManagerAuditDetailLoading() {
	return <AuditDetailSkeleton />;
}
```

- [ ] **Step 4: Create `manager/reports/[auditId]/loading.tsx`**

```tsx
import { AuditReportSkeleton } from "@/components/dashboard/page-skeletons";

export default function ManagerReportDetailLoading() {
	return <AuditReportSkeleton />;
}
```

- [ ] **Step 5: Create `auditor/reports/[auditId]/loading.tsx`**

The auditor report page has its own slightly different shape (sectional notes + score summary) but the report-style skeleton works fine.

```tsx
import { AuditReportSkeleton } from "@/components/dashboard/page-skeletons";

export default function AuditorReportDetailLoading() {
	return <AuditReportSkeleton />;
}
```

- [ ] **Step 6: Lint**

```bash
pnpm lint
```

- [ ] **Step 7: Commit**

```bash
git add src/app/\(protected\)/admin/audits/\[auditId\]/loading.tsx \
        src/app/\(protected\)/admin/reports/\[auditId\]/loading.tsx \
        src/app/\(protected\)/manager/audits/\[auditId\]/loading.tsx \
        src/app/\(protected\)/manager/reports/\[auditId\]/loading.tsx \
        src/app/\(protected\)/auditor/reports/\[auditId\]/loading.tsx
git commit -m "feat(web): add loading.tsx for audit and report detail routes"
```

---

## Task 5: Extend i18n with error-boundary keys

**Files:**

- Modify: `audit-tools-playspace-frontend/messages/en.json`
- Modify: `audit-tools-playspace-frontend/messages/de.json`

Both `error.tsx` files use `useTranslations("common.errorBoundary")`. Add the keys.

- [ ] **Step 1: Locate the `common` block in `en.json`**

It starts at line 6 and contains `roles`, `workspace`, and `format` sub-objects. The `errorBoundary` block goes inside `common`, alphabetically after `workspace` (before `format`, or anywhere consistent). Use StrReplace to add the block.

The exact insertion target is the closing `}` of the `format` object inside `common`. Find this snippet around line 22:

```
		"format": {
			"notSet": "Not set",
			"noRecentActivity": "No recent activity",
			"pending": "Pending",
			"locationPending": "Location pending",
```

Without modifying any existing text, locate the closing `}` of the `format` object (a few lines after the snippet above), and add the `errorBoundary` object **after** `format` but inside `common`. Mind the trailing commas.

- [ ] **Step 2: Add this block to `en.json` inside `common`**

```json
		"errorBoundary": {
			"title": "Something went wrong",
			"description": "We hit an unexpected error rendering this page. You can try again, or go back to the dashboard.",
			"globalDescription": "We hit an unexpected error and could not finish loading the app. Reloading the page usually fixes this.",
			"actions": {
				"retry": "Try again",
				"reload": "Reload the page"
			}
		},
```

The full added block (with surrounding context for clarity):

```json
		"format": {
			"...": "...existing keys remain unchanged..."
		},
		"errorBoundary": {
			"title": "Something went wrong",
			"description": "We hit an unexpected error rendering this page. You can try again, or go back to the dashboard.",
			"globalDescription": "We hit an unexpected error and could not finish loading the app. Reloading the page usually fixes this.",
			"actions": {
				"retry": "Try again",
				"reload": "Reload the page"
			}
		}
```

If `format` was the last key in `common`, change its trailing comma logic so the JSON stays valid (no trailing comma after the new last key).

- [ ] **Step 3: Add the equivalent block to `de.json` inside `common`**

```json
		"errorBoundary": {
			"title": "Etwas ist schiefgelaufen",
			"description": "Beim Laden dieser Seite ist ein unerwarteter Fehler aufgetreten. Du kannst es erneut versuchen oder zum Dashboard zurückkehren.",
			"globalDescription": "Beim Laden der App ist ein unerwarteter Fehler aufgetreten. Ein Neuladen der Seite hilft meistens.",
			"actions": {
				"retry": "Erneut versuchen",
				"reload": "Seite neu laden"
			}
		}
```

If you don't see a `common` block in `de.json`, add one matching `en.json`'s structure for the keys we add.

- [ ] **Step 4: Validate the JSON files parse**

```bash
cd audit-tools-playspace-frontend
node --input-type=module -e "import('node:fs').then(fs => { const en = JSON.parse(fs.readFileSync('./messages/en.json', 'utf8')); const de = JSON.parse(fs.readFileSync('./messages/de.json', 'utf8')); if (!en.common.errorBoundary || !de.common.errorBoundary) throw new Error('errorBoundary missing'); console.log('OK'); });"
```

Expected: prints `OK`.

- [ ] **Step 5: Commit**

```bash
git add messages/en.json messages/de.json
git commit -m "feat(web): add common.errorBoundary i18n keys"
```

---

## Task 6: Add per-segment `error.tsx` files

**Files:**

- Create: `src/app/(protected)/error.tsx`
- Create: `src/app/(protected)/admin/error.tsx`
- Create: `src/app/(protected)/manager/error.tsx`
- Create: `src/app/(protected)/auditor/error.tsx`

The per-role variants exist so that errors thrown by role-specific code are caught at the role boundary, leaving the shell intact. The protected one is a fallback if no closer boundary handles the error.

- [ ] **Step 1: Create `(protected)/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";

interface ProtectedErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

/**
 * Boundary for any unhandled error inside a protected route.
 * Receives a `reset` from React; calling it re-renders the segment.
 */
export default function ProtectedError({ error, reset }: ProtectedErrorProps) {
	const t = useTranslations("common.errorBoundary");
	const router = useRouter();

	useEffect(() => {
		console.error("[protected:boundary]", error);
	}, [error]);

	return (
		<EmptyState
			title={t("title")}
			description={t("description")}
			action={
				<div className="flex flex-wrap items-center gap-2">
					<Button type="button" onClick={reset}>
						{t("actions.retry")}
					</Button>
					<Button type="button" variant="outline" onClick={() => router.push("/")}>
						{t("actions.reload")}
					</Button>
				</div>
			}
		/>
	);
}
```

- [ ] **Step 2: Create `(protected)/admin/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";

interface AdminErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
	const t = useTranslations("common.errorBoundary");
	const router = useRouter();

	useEffect(() => {
		console.error("[admin:boundary]", error);
	}, [error]);

	return (
		<EmptyState
			title={t("title")}
			description={t("description")}
			action={
				<div className="flex flex-wrap items-center gap-2">
					<Button type="button" onClick={reset}>
						{t("actions.retry")}
					</Button>
					<Button type="button" variant="outline" onClick={() => router.push("/admin/dashboard")}>
						{t("actions.reload")}
					</Button>
				</div>
			}
		/>
	);
}
```

- [ ] **Step 3: Create `(protected)/manager/error.tsx`**

Identical to admin's, but redirect goes to `/manager/dashboard`. Replace the line `console.error("[admin:boundary]", error);` with `console.error("[manager:boundary]", error);` and the router.push target with `/manager/dashboard`.

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";

interface ManagerErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function ManagerError({ error, reset }: ManagerErrorProps) {
	const t = useTranslations("common.errorBoundary");
	const router = useRouter();

	useEffect(() => {
		console.error("[manager:boundary]", error);
	}, [error]);

	return (
		<EmptyState
			title={t("title")}
			description={t("description")}
			action={
				<div className="flex flex-wrap items-center gap-2">
					<Button type="button" onClick={reset}>
						{t("actions.retry")}
					</Button>
					<Button type="button" variant="outline" onClick={() => router.push("/manager/dashboard")}>
						{t("actions.reload")}
					</Button>
				</div>
			}
		/>
	);
}
```

- [ ] **Step 4: Create `(protected)/auditor/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";

interface AuditorErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function AuditorError({ error, reset }: AuditorErrorProps) {
	const t = useTranslations("common.errorBoundary");
	const router = useRouter();

	useEffect(() => {
		console.error("[auditor:boundary]", error);
	}, [error]);

	return (
		<EmptyState
			title={t("title")}
			description={t("description")}
			action={
				<div className="flex flex-wrap items-center gap-2">
					<Button type="button" onClick={reset}>
						{t("actions.retry")}
					</Button>
					<Button type="button" variant="outline" onClick={() => router.push("/auditor/dashboard")}>
						{t("actions.reload")}
					</Button>
				</div>
			}
		/>
	);
}
```

- [ ] **Step 5: Lint**

```bash
pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(protected\)/error.tsx \
        src/app/\(protected\)/admin/error.tsx \
        src/app/\(protected\)/manager/error.tsx \
        src/app/\(protected\)/auditor/error.tsx
git commit -m "$(cat <<'EOF'
feat(web): add protected and per-role error.tsx boundaries

Adds error.tsx for the protected shell, plus admin/manager/auditor
segments. Each renders an EmptyState with i18n strings and offers
"Try again" (calls React's reset()) plus a fallback to the role's
dashboard. Logs the error.digest to console for tracing.
EOF
)"
```

---

## Task 7: Add the absolute-fallback `global-error.tsx`

This file replaces the root layout when an error is thrown above the protected boundary (e.g. in `app/layout.tsx` itself or in an unprotected route). It must render its own `<html>` and `<body>` and cannot use providers (no `next-intl`, no QueryClient).

**Files:**

- Create: `audit-tools-playspace-frontend/src/app/global-error.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

/**
 * Absolute-fallback error boundary.
 * Replaces the root layout when an error escapes every nested boundary,
 * so it renders its own html/body. Cannot rely on next-intl or other
 * providers — text is hardcoded English.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
	useEffect(() => {
		console.error("[global:boundary]", error);
	}, [error]);

	return (
		<html lang="en">
			<body
				style={{
					alignItems: "center",
					backgroundColor: "#0a0a0a",
					color: "#fafafa",
					display: "flex",
					fontFamily: "system-ui, -apple-system, sans-serif",
					justifyContent: "center",
					margin: 0,
					minHeight: "100vh",
					padding: "24px"
				}}>
				<main style={{ maxWidth: "480px", textAlign: "center" }}>
					<h1 style={{ fontSize: "1.5rem", marginBottom: "12px" }}>Something went wrong</h1>
					<p style={{ color: "#a3a3a3", lineHeight: 1.5, marginBottom: "24px" }}>
						We hit an unexpected error and could not finish loading the app. Reloading the page usually
						fixes this.
					</p>
					<button
						type="button"
						onClick={reset}
						style={{
							backgroundColor: "#fafafa",
							border: "none",
							borderRadius: "8px",
							color: "#0a0a0a",
							cursor: "pointer",
							fontSize: "0.95rem",
							fontWeight: 500,
							padding: "10px 18px"
						}}>
						Reload the page
					</button>
				</main>
			</body>
		</html>
	);
}
```

- [ ] **Step 2: Lint**

```bash
pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add src/app/global-error.tsx
git commit -m "feat(web): add absolute-fallback global-error.tsx"
```

---

## Task 8: Phase verification

- [ ] **Step 1: Run the full quality gate**

```bash
cd audit-tools-playspace-frontend
pnpm lint
pnpm format -- --check
pnpm build
```

Expected: all green.

- [ ] **Step 2: Confirm the new files exist via `git status`**

You should see no uncommitted changes (everything was committed per task) and the following new files in the latest commits:

```
src/components/dashboard/page-skeletons.tsx
src/app/(protected)/loading.tsx
src/app/(protected)/admin/loading.tsx
src/app/(protected)/manager/loading.tsx
src/app/(protected)/auditor/loading.tsx
src/app/(protected)/admin/audits/[auditId]/loading.tsx
src/app/(protected)/admin/reports/[auditId]/loading.tsx
src/app/(protected)/manager/audits/[auditId]/loading.tsx
src/app/(protected)/manager/reports/[auditId]/loading.tsx
src/app/(protected)/auditor/reports/[auditId]/loading.tsx
src/app/(protected)/error.tsx
src/app/(protected)/admin/error.tsx
src/app/(protected)/manager/error.tsx
src/app/(protected)/auditor/error.tsx
src/app/global-error.tsx
```

Plus `messages/en.json` and `messages/de.json` modified.

- [ ] **Step 3: Smoke test**

```bash
pnpm dev
```

In the browser:

1. Log in as admin, manager, and auditor in separate sessions.
2. Throttle the network to "Slow 3G" in DevTools.
3. Navigate from any list page to a detail page (e.g. `/admin/audits` → click a row).
4. Confirm the matching skeleton appears immediately and is replaced with content as data arrives.
5. To exercise `error.tsx`: temporarily edit any page to `throw new Error("smoke test")` near the top, navigate to it, confirm the per-role error UI shows with a working "Try again" button. **Revert the throw before continuing.**

- [ ] **Step 4: Stop the dev server, announce completion**

Tell the user Phase B is complete. Do **not** push or open a PR without explicit approval.

---

## Self-Review Checklist

- [ ] Every `loading.tsx` file is a server component (no `"use client"` directive).
- [ ] Every `error.tsx` file starts with `"use client"`.
- [ ] `app/global-error.tsx` renders `<html>` and `<body>` itself.
- [ ] No `error.tsx` imports from `next-intl` outside `common.errorBoundary` keys that exist in both `en.json` and `de.json`.
- [ ] The new i18n keys parse as valid JSON in both locale files.
- [ ] `EmptyState` is used (not re-implemented) in `error.tsx` files for visual consistency.
- [ ] `pnpm build` succeeds.
- [ ] Each task produced its own commit. Commits are not squashed.
- [ ] No data fetching or render logic was modified — this phase only adds boundary files.
- [ ] No new dependencies added.

If any item is unchecked, fix it before announcing completion.

---

## Done Criteria

- Every protected route shows an instant skeleton on cold navigation (verified via Slow 3G smoke test).
- Per-role error.tsx boundaries catch and recover from thrown errors via `reset()`.
- `global-error.tsx` replaces the root layout when needed.
- i18n keys exist in both English and German.
- All checks (lint, format, build) pass.
