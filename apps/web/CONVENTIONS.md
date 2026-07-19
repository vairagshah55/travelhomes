# Web Frontend Conventions

Single source of truth for styling, primitives, and form patterns in `apps/web`.

**Why this doc exists:** four parallel patterns drifted into the codebase — Tailwind
classes, inline `style={{}}`, JS-driven hover state, and hand-rolled primitives sitting
next to the Radix ones we already pay for. This doc picks one rule per decision so the
next 5 PRs all push the same direction.

---

## The four rules

### Rule 1 — Tailwind classes for everything static. `style={{}}` only for dynamic values.

A value that's the same on every render → `className`. A value computed at runtime
(progress bar width, a color from data) → `style={{}}`. Hardcoded pixels in
`style={{}}` are a bug.

This matters because inline styles bypass the theme, can't be responsively prefixed
(`sm:`, `md:`), can't dark-mode, can't be deduped by `tailwind-merge`, and let magic
numbers like `13.5` / `11.5` / `padding: "6px 8px 6px 10px"` slip off the spacing grid.

**Don't** (currently in `shared/primitives/StyledInput.tsx:64-82`):

```tsx
<input
  style={{
    width: "100%",
    height: 52,
    padding: "0 16px",
    fontSize: 14.5,
    borderRadius: 13,
    border: `1.5px solid ${borderColor}`,
    backgroundColor: focused ? WHITE : SURFACE,
    boxShadow: active ? `0 0 0 4px ${TEAL_FOCUS}` : "none",
  }}
/>
```

**Do:**

```tsx
<input
  className={cn(
    "w-full h-13 px-4 text-sm rounded-th-md border-[1.5px]",
    "bg-th-surface-1 focus:bg-th-surface-0",
    "border-transparent focus:border-th-brand",
    "focus:ring-4 focus:ring-th-brand/15",
    "transition-[background-color,border-color,box-shadow] duration-150",
    error && "border-th-error",
  )}
/>
```

---

### Rule 2 — Hover/focus via CSS, not React state.

Use `:hover`, `:focus`, `:focus-within`, `group-hover:`, `data-[state=…]:`. Never
`useState(false)` + `onMouseEnter/Leave` to swap styles.

JS-driven hover causes re-renders, races (mouse leaves before child blurs), and
makes the component impossible to style from a parent (`group-hover:`).

**Don't** (currently in `caravan/DescriptionStep.tsx:313-323` — the `RuleRow` component):

```tsx
const [focused, setFocused] = React.useState(false);
return (
  <div
    style={{
      backgroundColor: focused ? WHITE : SURFACE,
      border: `1.5px solid ${focused ? TEAL : "transparent"}`,
      boxShadow: focused ? `0 0 0 4px ${TEAL_FOCUS}` : "none",
    }}
  >
    <input onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
  </div>
);
```

**Do:**

```tsx
return (
  <div
    className={cn(
      "bg-th-surface-1 border-[1.5px] border-transparent rounded-th-md",
      "focus-within:bg-th-surface-0 focus-within:border-th-brand",
      "focus-within:ring-4 focus-within:ring-th-brand/15",
      "transition-all duration-150",
    )}
  >
    <input />
  </div>
);
```

---

### Rule 3 — One token namespace: `th-*`. Don't re-export it as JS constants.

We currently have **four names for the brand teal**:

| Source                              | Symbol                      |
| ----------------------------------- | --------------------------- |
| `shared/primitives/tokens.ts`       | `TEAL`                      |
| `@/lib/brandColors`                 | `BRAND`                     |
| `tailwind.config.ts` `colors.ocean` | `ocean.500`                 |
| `tailwind.config.ts` `colors.th`    | `th-brand` ← **the winner** |

`th-*` wins because it's CSS-var-backed, theme-able, scopeable via `data-brand`
attribute, and reachable from both Tailwind classes and raw CSS files.

`tokens.ts` and the `BRAND`/`TEAL` re-exports will be deleted after the sweep.
The mapping below is the cheat-sheet for that sweep:

**Note on opacity modifiers:** `th-*` tokens are defined as raw hex strings in
`global.css`, so `bg-th-brand/10` does NOT work. For tinted/soft variants, use the
dedicated named tokens below (e.g. `bg-th-brand-soft`), not opacity modifiers.

| Old JS constant         | Hex                     | New Tailwind class                                    |
| ----------------------- | ----------------------- | ----------------------------------------------------- |
| `TEAL` (text)           | `#0F5C8A`               | `text-th-brand`                                       |
| `TEAL` (bg)             | `#0F5C8A`               | `bg-th-brand`                                         |
| `TEAL_BG`               | `rgba(15,92,138,0.07)`  | `bg-th-brand-soft`                                    |
| `TEAL_BORDER`           | `rgba(15,92,138,0.30)`  | `border-th-brand-border-soft`                         |
| `TEAL_FOCUS` (ring)     | `rgba(15,92,138,0.15)`  | uses `--th-ring` → `ring-[color:var(--th-ring)]`      |
| `BLACK`                 | `#0A2B40`               | `text-th-text-primary`                                |
| `WHITE` (bg)            | `#ffffff`               | `bg-th-surface-0`                                     |
| `WHITE` (text)          | `#ffffff`               | `text-th-text-inverse`                                |
| `SURFACE`               | `#F7F8FA`               | `bg-th-warm-surface`                                  |
| `GRAY_700` / `GRAY_500` | `#2C2C2A`               | `text-th-warm-text-dark`                              |
| `GRAY_400`              | `#888780`               | `text-th-warm-text-muted`                             |
| `GRAY_200` (border)     | `#D3D1C7`               | `border-th-warm-border`                               |
| `GRAY_200` (bg)         | `#D3D1C7`               | `bg-th-warm-border`                                   |
| `ERROR`                 | `#ef4444`               | `text-th-error-bright` / `border-th-error-bright`     |
| `ERROR_SOFT`            | `#fca5a5`               | `border-th-error-bright-soft`                         |
| `ERROR_BG`              | `rgba(239,68,68,0.04)`  | `bg-th-error-bright-bg`                               |
| `ERROR_RING`            | `rgba(239,68,68,0.10)`  | `ring-[color:var(--th-error-bright-ring)]`            |
| `SUCCESS`               | `#22c55e`               | `text-th-success-bright` / `border-th-success-bright` |
| `SUCCESS_BG`            | `rgba(34,197,94,0.08)`  | `bg-th-success-bright-bg`                             |
| `SUCCESS_BORDER`        | `rgba(34,197,94,0.20)`  | `border-th-success-bright-border`                     |
| `WARN`                  | `#f59e0b`               | `text-th-warn-bright`                                 |
| `WARN_BG`               | `rgba(245,158,11,0.10)` | `bg-th-warn-bright-bg`                                |
| `WARN_BORDER`           | `rgba(245,158,11,0.25)` | `border-th-warn-bright-border`                        |

Radii: `borderRadius: 12/13/14/16/18` → `rounded-th-sm/md/lg/xl/2xl`. Stop inventing
new values; pick the closest.

---

### Rule 4 — Forms = `react-hook-form` + `zod` + shadcn `<FormField>`. No callback-prop drilling.

Each step receives `form: UseFormReturn<MySchema>` — not 12 `onXChange` callbacks
plus an `errors` object plus a `clearError` function.

**Don't** (currently in `caravan/DescriptionStep.tsx:38-56`):

```tsx
interface DescriptionStepProps {
  name: string;
  description: string;
  rules: string[];
  photos: (string | File)[];
  errors: Record<string, string>;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAddRule: () => void;
  onRemoveRule: (index: number) => void;
  onUpdateRule: (index: number, value: string) => void;
  clearError: (field: string) => void;
  // …+ 6 more callbacks
}
```

**Do:**

```tsx
interface DescriptionStepProps {
  form: UseFormReturn<CaravanFormValues>;
}

<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Caravan Name</FormLabel>
      <FormControl>
        <Input {...field} maxLength={50} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>;
```

`zod` provides the validation schema. `<FormMessage />` displays errors automatically.
Manual `clearError` calls go away.

---

## Primitive layer

We use **shadcn/ui-style primitives** — Radix behavior + Tailwind styling + CVA variants.
Never hand-rolled `<input style={{}}>` wrappers.

- Canonical primitives live in `apps/web/src/components/ui/` (shadcn convention).
- `apps/web/src/components/onboarding/shared/primitives/` is **deprecated**. Wrappers
  there become thin adapters over `components/ui/*` and eventually get deleted.
- Missing a primitive? Add it with `npx shadcn add <name>` before reinventing it.

Domain components (`SectionCard`, `StepHeader`, `Stepper`) can live in a domain folder
but use `cn()` + Tailwind classes internally — no inline `style={{}}`.

---

## What's allowed in `style={{}}`

Only **dynamic** values that can't be expressed as a class name:

- Computed widths/heights: `style={{ width: `${pct}%` }}`
- Computed colors from props/data (chart series, dynamic theming)
- Transform values driven by Framer-Motion state
- Library-required inline styles (Recharts, react-day-picker config props)

Everything else → `className`. If a value never changes between renders, it's not
dynamic — it's a class.

---

## Checklist before merging a form

- [ ] No imports from `shared/primitives/tokens`
- [ ] No `useState(false)` for `hovered`/`focused` visual flags
- [ ] No `onMouseEnter/Leave` for visual state
- [ ] No callback-per-field — step takes `form: UseFormReturn<…>`
- [ ] No `style={{}}` with hardcoded pixels/colors
- [ ] Uses primitives from `components/ui/`, not `onboarding/shared/primitives/`

---

## Migration order

1. **Primitives** — replace `shared/primitives/*` with Tailwind-based versions. Same
   exported API, no consumer changes required.
2. **`onboarding/stays/`** — worst affected (200+ inline styles across 6 files,
   `IndividualRoomForm.tsx` alone has 70).
3. **`onboarding/caravan/`** and **`onboarding/activity/`** — same disease, smaller files.
4. **`onboarding/shared/*Step.tsx`** — `BusinessDetailsStep`, `DiscountOffersStep`,
   `PersonalDetailsStep`.
5. **Booking/offering pages** — `BookingDetails`, `BookingModals`, `offering/*`,
   `Bookings.tsx`, `Offering.tsx`, `EditOfferings.tsx`.
6. **Delete** `tokens.ts` and the `BRAND`/`TEAL` re-exports in `brandColors.ts` once
   no imports remain.

After step 1, steps 2–5 are mostly mechanical: delete `style={{}}`, paste in
`className`.
