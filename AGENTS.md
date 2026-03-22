# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a **single Next.js 15 frontend application** (not a monorepo). It is the Playspace Play Value & Usability Audit Tool frontend, built with TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, and React Hook Form + Zod.

### Services

| Service | Command | Port | Notes |
|---|---|---|---|
| Next.js dev server | `pnpm dev` | 3000 | The only service in this repo |

### Key commands

All standard commands are in `package.json` scripts; see `README.md` for details.

- **Dev server:** `pnpm dev`
- **Lint:** `pnpm lint` (ESLint 9 flat config)
- **Build:** `pnpm build`
- **Format:** `pnpm format` (Prettier)

### Authentication (demo scaffold)

The login page at `/login` uses a **frontend-only demo login** — no backend is required to authenticate. It sets browser cookies (`playspace_role`, `playspace_access_token`, `playspace_auditor_code`) and redirects to the appropriate dashboard.

- Manager login: any valid email + password (min 8 chars)
- Auditor login: any alphanumeric auditor code

### Backend dependency

The app expects a FastAPI backend at `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://127.0.0.1:8000`). Without the backend, dashboard pages will render with mock/seeded data or show API error states — but **login and navigation work fully without it**.

### No automated tests

This repo has no test framework or test files configured. Validation is limited to `pnpm lint` and `pnpm build`.
