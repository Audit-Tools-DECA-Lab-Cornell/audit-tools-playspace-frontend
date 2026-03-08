## Playspace Play Value & Usability Audit Tool (Frontend)

Enterprise-grade frontend for the **Playspace Play Value and Usability Audit Tool**.

This app is part of a hierarchical Audit Management System (Account → Projects → Places → Audits) and is designed to integrate with a FastAPI backend.

### Tech stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **UI**: shadcn/ui
- **Data**: TanStack Query (React Query) + Axios
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

### RBAC roles

- **Managers (full access)**:
  - Manager dashboard shows aggregate stats + recent activity.
  - Playspace audits surface **both** `audit_score` and `combined_score`.
  - UI can request a **Manager Survey Link** for external place owners.
- **Auditors (limited access)**:
  - Identified strictly by an alphanumeric `auditor_code` (no real names displayed).
  - Can execute audits, auto-save progress, and view their own work.
  - Cannot access `/manager` routes.

### Local setup (macOS + pnpm)

Install dependencies:

```bash
pnpm install
```

Run the dev server:

```bash
pnpm dev
```

Open the app at [`http://localhost:3000`](http://localhost:3000).

Other useful commands:

```bash
pnpm lint
pnpm build
pnpm start
```

### Environment variables

Configure the FastAPI base URL in `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"
```

If not set, the frontend defaults to `http://127.0.0.1:8000`.

### Authentication (current scaffold)

This repo currently uses a **frontend-only demo login** that sets cookies in the browser to simulate an authenticated session.

- **Cookie names** (see `src/lib/auth/role.ts`):
  - `playspace_role`: `"manager"` or `"auditor"`
  - `playspace_access_token`: bearer token (demo-generated for now)
  - `playspace_auditor_code`: auditor-only identifier

The route guard is implemented in `middleware.ts` using those cookies:

- `/manager/**` requires `playspace_role="manager"`
- `/auditor/**` requires `playspace_role="auditor"`
- `/settings` requires authentication (either role)

### App routes

- **Public**
  - `/login`
- **Manager**
  - `/manager/dashboard`
  - `/manager/projects`
- **Auditor**
  - `/auditor/dashboard`
  - `/auditor/execute/[placeId]`
- **Shared**
  - `/settings`

### Role-based layout (sidebar)

Protected routes render inside a responsive `AppShell` with a sidebar (desktop) and a sheet drawer (mobile):

- `src/app/(protected)/layout.tsx`
- `src/components/app/app-shell.tsx`

The navigation items are derived from the active role and rendered dynamically.

### API client

Axios client lives at `src/lib/api/api-client.ts`:

- Adds `Authorization: Bearer <token>` from `playspace_access_token`
- On `401`, clears auth cookies and redirects to `/login`

### Auditor multi-step form + auto-save

The audit execution UI is in:

- `src/app/(protected)/auditor/execute/[placeId]/page.tsx` (server wrapper)
- `src/app/(protected)/auditor/execute/[placeId]/audit-form.tsx` (client form)

Auto-save behavior:

- Watches form values via React Hook Form.
- Sends a debounced `PATCH` (900ms) with a **partial** payload to:
  - `PATCH /playspace/places/:placeId/audits/draft`

### Manager survey link (Playspace-specific)

The Manager dashboard includes a button that requests a “Manager Survey Link” and offers a copy-to-clipboard UX:

- `POST /playspace/places/:placeId/manager-survey-link`
- Expected response shape:
  - `{ "survey_link": "https://..." }`

### Project structure

- `src/app/(public)` — unauthenticated pages
- `src/app/(protected)` — authenticated shell + role-specific routes
- `src/lib/auth` — role/session cookie helpers (server + browser)
- `src/lib/api` — Axios client + interceptors
- `src/components/app` — application shell components

