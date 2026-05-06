# CLAUDE.md — audit-tools-playspace-frontend

## Design System Implementation Brief

This file instructs Claude Code on how to implement the PVUA design system
update across the frontend. Read it fully before writing any code.

-----

## What this session is about

Implementing Phase 1 (color tokens + typography tokens) and Phase 2 (elevated
component patterns) of the PVUA design system update. The full specifications
live in:

- `PVUA_DESIGN_SYSTEM_PHASE1.md`
- `PVUA_DESIGN_SYSTEM_PHASE2_UPDATED.md`

Both files must be read before starting any task.

-----

## Repo context

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 with `@theme inline` in `globals.css`
- **UI:** shadcn/ui components
- **Token source:** `src/lib/design-system.ts` — this is the single source of
  truth for all colors. CSS custom properties are injected from here at runtime.
- **Token consumption:** `src/app/globals.css` maps those CSS vars to Tailwind
  color tokens via `@theme inline`
- **Package manager:** pnpm

-----

## Task sequence — do these in order, do not combine tasks

### Task 1 — Update token values in `design-system.ts`

**Files to touch:** `src/lib/design-system.ts` only.
**Do not touch** any component files, CSS files, or Tailwind config in this task.

Update the dark mode `standard` palette with these exact values:

```typescript
// Dark standard — replace existing values
canvas:        "#171310",
surface:       "#211c17",
surfaceRaised: "#2c241d",
surfaceSunken: "#120f0c",
textPrimary:   "#ede5d8",
textSecondary: "#c4b9ae",
textMuted:     "#968880",
edge:          "#3d342c",
focus:         "#d09a70",
accentTerracotta: "#c58a5c",   // unchanged
accentMoss:       "#5e9470",   // was #6f9a7f — deepened
accentSlate:      "#7a90b7",   // was #7b90b8 — minor
accentViolet:     "#9b86b2",   // unchanged
```

Update the light mode `standard` palette:

```typescript
canvas:        "#f7f1eb",
surface:       "#fdf8f3",
surfaceRaised: "#ffffff",
surfaceSunken: "#ede6da",
textPrimary:   "#1e1a16",
textSecondary: "#4a423a",
textMuted:     "#7a6e62",
edge:          "rgba(30, 26, 22, 0.15)",
focus:         "#b8743f",
accentMoss:    "#3d7554",   // light mode moss — deepened to match
```

After updating palette values, add these new CSS variable outputs in
`getDesignSystemCssVariables()`:

```typescript
// Typography role tokens — add these to the return object
"--text-eyebrow-font":    "var(--font-heading-active)",   // Space Grotesk
"--text-eyebrow-size":    "0.6875rem",
"--text-eyebrow-weight":  "500",
"--text-eyebrow-tracking":"0.03em",

"--text-score-dim-font":    "var(--font-heading-active)", // Space Grotesk
"--text-score-dim-size":    "0.625rem",
"--text-score-dim-weight":  "600",

"--text-badge-font":      "var(--font-body-active)",      // Geist
"--text-badge-size":      "0.6875rem",
"--text-badge-weight":    "500",
"--text-badge-tracking":  "0.02em",

"--text-counter-font":    "var(--font-body-active)",      // Geist
"--text-counter-size":    "0.75rem",
"--text-counter-weight":  "400",

"--text-meta-font":       "var(--font-code-active)",      // JetBrains Mono
"--text-meta-size":       "0.6875rem",
"--text-meta-tracking":   "0.04em",

// Easing tokens
"--ease-spring":   "cubic-bezier(0.32, 0.72, 0, 1)",
"--ease-out-fast": "cubic-bezier(0.0, 0.0, 0.2, 1.0)",
"--ease-in-fast":  "cubic-bezier(0.4, 0.0, 1.0, 1.0)",
```

**Verification:** After this task, check that `applyDesignSystemVariables` still
works correctly and that no TypeScript errors exist. Do not proceed to Task 2
until Task 1 has no errors.

-----

### Task 2 — Update `globals.css` and `tailwind.config.ts`

**Files to touch:** `src/app/globals.css` and `tailwind.config.ts` only.

In `globals.css`, add the new CSS variable tokens to the `@theme inline` block:

```css
/* Typography role tokens */
--font-eyebrow: var(--text-eyebrow-font);
--font-badge: var(--text-badge-font);
--font-meta: var(--text-meta-font);

/* Easing tokens — expose to Tailwind */
--ease-spring: var(--ease-spring);
--ease-out-fast: var(--ease-out-fast);
--ease-in-fast: var(--ease-in-fast);
```

In `tailwind.config.ts`, add:

```typescript
transitionTimingFunction: {
  spring:   "cubic-bezier(0.32, 0.72, 0, 1)",
  "out-fast": "cubic-bezier(0.0, 0.0, 0.2, 1.0)",
  "in-fast":  "cubic-bezier(0.4, 0.0, 1.0, 1.0)",
},
```

**Do not change** existing borderRadius, boxShadow, or color entries in
`tailwind.config.ts`. Add only.

-----

### Task 3 — Create `BezelCard` component

**File to create:** `src/components/ui/bezel-card.tsx`

This is a wrapper around shadcn `Card` that adds the double-bezel treatment.
It wraps the existing Card — does not replace it.

```typescript
// Interface
interface BezelCardProps {
  children: React.ReactNode
  className?: string
  accentOnHover?: boolean   // terracotta rim glow on hover, default true
}
```

Structure:

```
<div>                           // outer shell
  outer: bg-surface-raised
         border border-white/[0.055]
         rounded-[14px] p-[2px]
         transition-colors duration-[400ms] ease-spring
         hover (if accentOnHover): border-[rgba(197,138,92,0.25)]

  <div>                         // inner core
    inner: bg-surface
           rounded-[12px]
           border border-white/[0.03]
           shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
           overflow-hidden relative

    <div>                       // top shimmer overlay
      absolute inset-0 pointer-events-none
      bg-gradient-to-b from-white/[0.025] to-transparent h-[40%]
      rounded-t-[12px]

    {children}
```

Export as named export `BezelCard`. Also export `BezelCardBody` as a pre-padded
inner div: `p-4 md:p-[18px]`.

-----

### Task 4 — Create `SpotlightCard` component

**File to create:** `src/components/ui/spotlight-card.tsx`

A card with a spotlight border that follows the cursor. Used for place cards
and project cards. Not double-bezel — simpler surface.

```typescript
interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}
```

Implementation approach: use a CSS custom property `--mx` and `--my` updated
via `onMouseMove`. The spotlight is a `::before` pseudo via inline style, OR
a positioned child div if pseudo is not easily achievable in React.

```typescript
const [pos, setPos] = useState({ x: 50, y: 50 })

const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect()
  setPos({
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100,
  })
}
```

Spotlight layer (positioned child, not pseudo):

```
position absolute inset-0 rounded-[12px] pointer-events-none
background: radial-gradient(220px circle at {x}% {y}%,
            rgba(197,138,92,0.18), transparent 70%)
opacity-0 group-hover:opacity-100
transition-opacity duration-[350ms] ease-out-fast
```

Outer container:

```
relative rounded-[12px] overflow-hidden
bg-surface-raised border border-edge
hover:-translate-y-px
transition-transform duration-[300ms] ease-spring
cursor-pointer (if onClick provided)
```

-----

### Task 5 — Create `ScoreDisplay` components

**File to create:** `src/components/ui/score-display.tsx`

Two exports: `ScoreDisplayCompact` and `ScoreDisplayFull`.

**ScoreDisplayCompact props:**

```typescript
interface ScoreDisplayCompactProps {
  pv?: number | null
  u?: number | null
  s?: number | null
  size?: 'sm' | 'md'   // sm for table rows, md for cards
  animate?: boolean     // count-up on mount, default false
}
```

**ScoreDisplayFull props:**

```typescript
interface ScoreDisplayFullProps {
  pv?: number | null    // null = not measured
  u?: number | null
  s?: number | null
  pvTotal?: string      // e.g. "34/40" — raw total, JetBrains Mono
  uTotal?: string
  sTotal?: string
  auditLabel?: string   // e.g. "Millbrook Park · Audit #3 · Submitted 2026-04-22"
  animate?: boolean     // count-up on mount, default true
}
```

**Typography rules — critical:**

- Dimension labels (PV, U, S, PLAY VALUE, USABILITY, SOCIABILITY):
  `font-heading` (Space Grotesk), NOT mono
- Score numbers: `font-heading` (Space Grotesk), weight 700
- Raw totals (`34/40`): `font-mono` (JetBrains Mono) — this IS a coded value
- Colors: violet for dimension labels, moss for measured values,
  text-muted for not-measured (render "—" em dash)

**Count-up hook:**

```typescript
function useCountUp(target: number | null, duration: number, enabled: boolean) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled || target === null) return
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setValue(parseFloat((target * ease).toFixed(1)))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration, enabled])
  return target === null ? null : value
}
```

Respect `prefers-reduced-motion`: if reduced motion, skip animation and show
final value immediately.

-----

### Task 6 — Create `AuditSectionBlock` component

**File to create:** `src/components/ui/audit-section-block.tsx`

This is the field form section header + question display.

```typescript
interface AuditSectionBlockProps {
  domainNumber: number
  domainName: string         // e.g. "Sensory & Motor Play"
  sectionHeading: string     // e.g. "Play Opportunities"
  questionNumber: number
  totalQuestions: number
  sectionNumber: number
  totalSections: number
  questionText: string
  progressPercent: number    // 0–100, drives the progress bar width
  hasProvisionScale?: boolean
  onProvisionSelect?: (value: 0 | 1 | 2 | 3) => void
  provisionValue?: 0 | 1 | 2 | 3 | null
  autoSaveStatus?: 'idle' | 'saving' | 'saved'
  children?: React.ReactNode  // for additional question fields
}
```

**Domain eyebrow:**

```
font-heading (Space Grotesk), text-[11px], font-medium, tracking-[0.03em]
color: accent-violet
text: `Domain {n} · {domainName}` — sentence case for domain name
```

**Progress bar:**

```
h-[2px] bg-edge rounded-[1px] overflow-hidden
fill div: bg-accent-violet, transition-[width] duration-[600ms] ease-spring
```

**Provision toggle:**

```
Button that expands/collapses provision scale
Font: Geist text-[13px], NOT mono
Arrow rotates 90deg on open, spring transition
Max-height animation on the collapsible body
Buttons: 4 options (0–3), violet hover state, spring select feedback
```

**Auto-save indicator:**

```
Bottom-right of the block body
Geist 11px, textMuted
'idle':   hidden (render nothing)
'saving': "Saving..."
'saved':  "Saved locally" — fades out after 2s
No toast. No banner. Ambient only.
```

-----

### Task 7 — Update status badge styles

**Files to touch:** Find existing badge/status components in
`src/components/` and update their typography.

The change is primarily typographic:

- Remove any `font-mono` class from badge text
- Remove wide letter-spacing from badge text
- Apply `font-sans` (Geist), `text-[11px]`, `font-medium`, `tracking-[0.02em]`
- Keep colors unchanged
- Keep border-radius at 4px (not pill)
- Badge text should be sentence case ("Complete" not "COMPLETE") unless the
  component already handles this — if it uses a displayLabel from data, leave
  the data contract alone and handle at the style level

-----

### Task 8 — Update sidebar role identity

**Files to touch:** `src/components/app/app-shell.tsx` or wherever the sidebar
navigation role section is rendered.

Add a role label at the top of the sidebar nav section (above nav items):

```
Font: Geist 11px 500, tracking 0.04em, uppercase
Color: textMuted
Text: "MANAGER" | "AUDITOR" | "ADMINISTRATOR" depending on role

Position: above the first nav item, below the logo/workspace area
Visual weight: should be subtle — this is orientation information, not a heading
```

This is the only change to app-shell in this task. Do not restructure the
sidebar layout.

-----

### Task 9 — Add stat card count-up to dashboard

**Files to touch:** Manager dashboard page and/or its stat card components.

Find where dashboard stat numbers are rendered. Wrap them with the `useCountUp`
hook created in Task 5.

- Trigger: IntersectionObserver on the stat card container
- Duration: 700–900ms per card, staggered by 100ms per card
- Only animate on first mount — not on refetch/polling
- Reduced motion: skip animation, show final value immediately

-----

## Global constraints — read before every task

**Never:**

- Hardcode hex values in component files — always use CSS custom properties
  or Tailwind tokens that map to CSS variables
- Touch `design-system.ts` after Task 1 is complete
- Combine multiple tasks in one commit — each task is a separate, verifiable unit
- Refactor components that are not in the task scope
- Replace shadcn components — always wrap or extend them
- Add new npm dependencies without checking `package.json` first
  and flagging the addition

**Always:**

- Use `var(--ease-spring)` (or `ease-spring` Tailwind token) for transitions,
  never `ease-in-out` or `linear`
- Use existing CSS variable tokens for all colors
- Check that TypeScript compiles cleanly after each task
- Preserve the high-contrast mode palettes — `dark.high` and `light.high`
  in `design-system.ts` are not modified in any task
- Preserve OpenDyslexic font switching behavior

-----

## Verification checklist after all tasks

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] Dark mode: surfaces have visible depth hierarchy (canvas < surface < raised)
- [ ] Accent moss reads as clearly distinct from the previous lighter moss
- [ ] Status badges use Geist font, not mono
- [ ] Score dimension labels use Space Grotesk, not mono
- [ ] Domain eyebrow in AuditSectionBlock uses Space Grotesk, not mono
- [ ] JetBrains Mono only appears on: auditor codes, timestamps, raw totals
- [ ] All transitions use `ease-spring` curve
- [ ] No hardcoded hex values in any new component file
- [ ] High-contrast dark mode still renders correctly
- [ ] High-contrast light mode still renders correctly
