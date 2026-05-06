# CLAUDE.md — audit-tools-playspace-frontend

## Phase 3 & 4 Implementation Brief

Read PVUA_DESIGN_SYSTEM_PHASE3.md and PVUA_DESIGN_SYSTEM_PHASE4.md fully
before writing any code. Phase 1 and 2 are already implemented.

---

## Repo context (unchanged from Phase 1/2 brief)
- Next.js 15 App Router, TypeScript, Tailwind v4, shadcn/ui
- Design tokens in src/lib/design-system.ts (already updated)
- Package manager: pnpm

---

## Task sequence

### Task 1 — Manager dashboard bento grid

File: src/app/(dashboard)/manager/dashboard/page.tsx
(and any child components it uses for the stat cards)

Replace the current 4-equal-column stat grid with a 6-column asymmetric
bento grid.

Grid spec:
  Active Audits:  grid-column span 3, BezelCard, 48px Space Grotesk number
                  accentTerracotta color, breathing dot (10px, 2.4s)
                  Sub-line: "+N since yesterday" if data available
  Places:         grid-column span 1, BezelCard, 32px textPrimary
  Auditors:       grid-column span 1, BezelCard, 32px textPrimary
  Completed:      grid-column span 1, BezelCard, 32px accentMoss

Remove ALL top border accent colors from stat cards. No terracotta/violet/
gold/teal borders. The number color carries the semantic signal.

Responsive:
  ≥1280px: 6-column layout as above
  768–1279px: Active Audits full-width, others 2-col
  <768px: single column, Active Audits first

---

### Task 2 — Recent activity row redesign

Find: the recent activity list component on the manager dashboard.
Redesign the row information hierarchy:

NEW row structure (top to bottom, left to right):
  Left column:
    Line 1: Place name — Space Grotesk 14px 600, textPrimary
    Line 2: Project name — Geist 12px, textSecondary
    Line 3: Auditor name · timestamp — Geist 11px, textMuted
    Line 4: audit code — Geist 11px, textMuted, opacity 0.6, NO background

  Right column (flex-end):
    Score: ScoreDisplayCompact (violet PV/U labels, moss numbers)
           Shows NORMALIZED score (e.g. 4.2) not raw total (e.g. 16)
    Status badge: Geist 11px 500, sentence case

REMOVE:
  The black/dark pill badge around the audit code completely.
  The "Score PV 16 | U 128" raw total string format.

Row hover: background var(--table-row-hover), no card lift.
Row separator: 0.5px var(--edge) border-bottom.

---

### Task 3 — Project status panel

Create a new component: src/components/app/project-status-panel.tsx

This replaces or supplements whatever is in the right column of the
dashboard bottom row.

Per project row:
  Project name:   Geist 13px 500, textPrimary
  Progress bar:   4px height, border-radius 2px
                  Three segments: moss (complete) + terracotta (in-progress)
                  + edge (remaining). All in one track.
  Sub-label:      "N of M places audited" — Geist 11px, textMuted
                  Percentage right-aligned: moss if ≥75%, terracotta if <75%

Data shape needed: { name, completedPlaces, inProgressPlaces, totalPlaces }

Card: SpotlightCard wrapper (not double-bezel — it's a list).
Header: "Projects" Space Grotesk 15px 600 + "View all →" link.

---

### Task 4 — Chart color tokens

Find all Recharts usages in the codebase.
Search for: <BarChart, <LineChart, <RadialBar, fill="#, stroke="#

Create: src/lib/chart-colors.ts

  export const CHART_COLORS = {
    primary:       "var(--accent-terracotta)",
    secondary:     "var(--accent-moss)",
    provision:     "var(--accent-terracotta)",
    diversity:     "var(--accent-slate)",
    challenge:     "var(--accent-moss)",
    sociability:   "var(--accent-violet)",
    playValue:     "var(--accent-terracotta)",
    usability:     "var(--accent-slate)",
    scoreHigh:     "var(--status-success)",
    scoreMid:      "var(--status-warning)",
    scoreLow:      "var(--status-danger)",
    grid:          "var(--edge)",
    axis:          "var(--text-muted)",
    tooltipBg:     "var(--surface-raised)",
    tooltipBorder: "var(--edge)",
  } as const

Replace all hardcoded Recharts colors with values from CHART_COLORS.
For CSS variable strings in Recharts fill props, resolve them via
getComputedStyle if Recharts requires actual hex values.

---

### Task 5 — Domain card header redesign (report view)

Find: "Best & Worst Scored Domains" section and domain breakdown cards.

Replace the full-width terracotta background header bars with:
  Surface card background
  3px left border in the domain's assigned accent color
  Domain name: Space Grotesk 13px 600, textPrimary, left-aligned

Domain → border color map (import from CHART_COLORS or define locally):
  Provision:           var(--accent-terracotta)
  Diversity:           var(--accent-slate)
  Challenge Opp.:      var(--accent-moss)
  Sociability Support: var(--accent-violet)
  Play Value:          var(--accent-terracotta)
  Usability:           var(--accent-slate)

Important: left border only → border-radius: 0 on the left side.
Use border-left: 3px solid [color] with border-radius only on right corners.

---

### Task 6 — Domain section transition animation

File: wherever the execute/audit form section navigation is handled.

On advancing to next domain (not just next question — domain boundary only):

  Exiting section:
    animation: translateX(0)→(-24px) + opacity 1→0
    duration: 220ms, ease: cubic-bezier(0.4,0.0,1.0,1.0)

  Entering section:
    animation: translateX(24px)→(0) + opacity 0→1
    duration: 280ms, ease: cubic-bezier(0.32,0.72,0,1)
    delay: 160ms

Use CSS @keyframes + className swap, or framer-motion if already in the
project. Check package.json before adding framer-motion.

Reduced motion: wrap translate values in
  @media (prefers-reduced-motion: reduce) { transform: none }
  Fade-only fallback.

---

### Task 7 — Score reveal animation (report page)

File: src/app/(dashboard)/auditor/reports/[auditId]/page.tsx or its
score display component.

On page mount (IntersectionObserver trigger):
  1. Score cards entrance: scale 0.96→1.0, opacity 0→1, 200ms spring
  2. After 300ms: ScoreDisplayFull count-up 0→score, 900ms spring
     (use the useCountUp hook from Phase 2)
  3. Domain bars grow 0→final width, staggered 60ms per bar, 500ms spring
     Triggered 200ms after count-up starts.

Count-up fires on first mount only — not on refetch.
Respect prefers-reduced-motion: skip animation, show final values.

---

### Task 8 — Submission moment

File: wherever the audit submission confirmation UI lives.

Sequence on successful submission:
  1. Submit button: scale 0.97 press (150ms spring)
  2. Button enters loading state: terracotta spinner, keep button width
  3. On API success: button shows moss checkmark icon
     Scale 1.0→1.04→1.0 (spring overshoot, 400ms)
     Color: terracotta→moss on the button background/border
  4. After 600ms: navigate to /auditor/reports/[newAuditId]

---

## Global constraints (all phases)

- Never hardcode hex values in component files
- All transitions use --ease-spring curve
- prefers-reduced-motion respected on every new animation
- No new npm dependencies without checking package.json first
- pnpm typecheck must pass after each task
- Do not modify design-system.ts (Phase 1 locked it)

## Verification

- [ ] Dashboard stat grid is asymmetric — Active Audits visibly larger
- [ ] No top border accent colors on any stat card
- [ ] Recent activity rows show place name as headline, audit code as plain muted text
- [ ] Chart bars use design system colors (warm terracotta/moss/slate/violet)
- [ ] Domain card headers have left border, not full colored background
- [ ] Score displays show normalized scores (4.2) in feed contexts
- [ ] Section transitions animate on domain boundary only
- [ ] Score reveals count up on report page load
- [ ] Submission moment transitions to moss on success
- [ ] pnpm build passes

---

The following briefing was used for the phase 1 and phase 2 implementation of the design system.

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

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] `pnpm build` passes
- [x] Dark mode: surfaces have visible depth hierarchy (canvas < surface < raised)
- [x] Accent moss reads as clearly distinct from the previous lighter moss
- [x] Status badges use Geist font, not mono
- [x] Score dimension labels use Space Grotesk, not mono
- [x] Domain eyebrow in AuditSectionBlock uses Space Grotesk, not mono
- [x] JetBrains Mono only appears on: auditor codes, timestamps, raw totals
- [x] All transitions use `ease-spring` curve
- [x] No hardcoded hex values in any new component file
- [x] High-contrast dark mode still renders correctly
- [x] High-contrast light mode still renders correctly
