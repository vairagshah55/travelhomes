# Admin Redesign Prompt — "57 Facets" Dark-Luxury Look

> **Purpose.** This is an execution prompt for restyling the entire travelhomes admin surface
> (`apps/web/src/pages/admin/**`) to match the visual language of the reference app at
> `C:\vairag\57facets-digital-platform\client`. It was produced by analyzing both codebases.
> Hand this file to an implementer (human or AI) as the single source of truth for the redesign.
>
> **Golden rule:** Change _appearance_, not _behavior_. All data hooks, routing, forms, RHF+Zod
> schemas, and table logic stay exactly as-is. We re-skin the shared components and tokens; the
> ~17 admin pages inherit the new look automatically because they already compose shared parts.

---

## 1. Context — why this change

The travelhomes admin currently uses the **NextAdmin** template aesthetic: light-first, white cards
on `#f9fafb`, indigo/purple accent (`#5750f1`), Plus Jakarta Sans, shadow-based elevation.

The target is the **57 Facets** aesthetic: a dark-first luxury SaaS — near-black layered surfaces,
**teal** accent, serif display headings, glass morphism, and motion as a first-class design element.

Both stacks are close (React + Tailwind + shadcn/ui + Recharts + Framer Motion), so the migration is
primarily a **token + shell + composition** change, not a framework swap. travelhomes is on Tailwind
**v3** with a CSS-variable token system already scoped via `[data-brand="admin"]` — that scoping is
the seam we use to flip the entire admin to dark without touching the vendor/frontend surface.

---

## 2. Hard constraints (read before writing any code)

These come from `apps/web/CONVENTIONS.md` and the existing architecture. Violating them = rework.

1. **Tailwind for static styles; `style={{}}` only for dynamic runtime values.** Hardcoded pixels
   in inline styles are bugs.
2. **Hover/focus via CSS only** (`:hover`, `:focus-within`, `group-hover:`). Never
   `useState(false)` + `onMouseEnter/Leave`.
3. **One token namespace.** The admin already routes through `[data-brand="admin"]`-scoped CSS vars
   (`--tpl-*` in `apps/web/src/admin.css`, `--th-*` in `apps/web/src/global.css`). **Re-skin by
   changing the values of the existing `--tpl-*` / `--th-*` admin-scoped variables — do NOT introduce
   a parallel `--sf-*` namespace.** `th-*` tokens are raw hex, so `bg-x/10` opacity modifiers do not
   work — add dedicated `-soft` tokens for translucency.
4. **Forms = react-hook-form + zod + shadcn `<FormField>`.** Do not touch form logic; only restyle
   inputs via the shared input/primitive styles.
5. **Canonical primitives live in `src/components/ui/`** (shadcn). Missing one → `npx shadcn add <name>`.
6. **Scope all theme changes under `[data-brand="admin"]`** so the public/vendor site is unaffected.

---

## 3. Target design tokens (the 57 Facets palette)

Set these as the **dark default** for the admin (i.e. under `[data-brand="admin"]`, make dark the
base, not an opt-in). Source values taken from `57facets/client/src/styles/theme.css`.

### 3.1 Surfaces (layered dark — depth via color steps, not shadows)

```
--bg-base       #080A0D   page background
--bg-surface-1  #0D1118   cards, sidebar
--bg-surface-2  #131A25   inputs, secondary surfaces, table header
--bg-surface-3  #1A2235   elevated (dropdowns, popovers, tooltips)
```

Map onto existing admin vars:

- `--tpl-body-bg` → `#080A0D`
- `--tpl-card-bg` → `#0D1118`
- `--tpl-dark-2` (dark card) → `#131A25`
- `--tpl-stroke` → `#1C2535`

### 3.2 Accent & brand

```
--accent-teal       #30B8BF   PRIMARY interactive accent (active nav, CTAs, focus, chart fills)
--accent-teal-hover #2aa6ac
--blue-primary      #2660A0   secondary brand / chart pairing
--blue-secondary    #3880BE   focus ring base
```

Map: `--tpl-primary` → `#30B8BF`, `--tpl-primary-hover` → `#2aa6ac`,
`--tpl-primary-soft` → `rgba(48,184,191,0.12)`. Also point `--th-brand` → `#30B8BF` and add
`--th-brand-soft: rgba(48,184,191,0.12)`.

### 3.3 Text

```
--text-primary    #FFFFFF
--text-secondary  #A8B0BF
--text-muted      #8A929F
```

Map: `--tpl-dark` → `#FFFFFF`, `--tpl-dark-5` → `#8A929F`, `--tpl-dark-6` → `#A8B0BF`.

### 3.4 Status (semi-transparent fill + matching text + subtle border)

```
success / in-stock   bg rgba(74,222,128,0.12)  text #4ade80  border rgba(74,222,128,0.30)
warning / pending    bg rgba(251,146,60,0.12)  text #fb923c  border rgba(251,146,60,0.30)
error / rejected     bg rgba(248,113,113,0.12) text #f87171  border rgba(248,113,113,0.30)
info / verified      bg rgba(56,128,190,0.12)  text #3880BE  border rgba(56,128,190,0.30)
```

Apply to `apps/web/src/components/shared/StatusBadge.tsx` variant map.

### 3.5 Charts (Recharts)

```
--chart-1 #2660A0   --chart-2 #30B8BF   --chart-3 #3880BE   --chart-4 #A8B0BF   --chart-5 #636B7A
```

Bar/area fills use a teal→blue `linearGradient`. Tooltip bg = `--bg-surface-3`. Update
`apps/web/src/components/shared/ChartTooltip.tsx` and the dashboard chart cards.

### 3.6 Glass / elevation utilities (add as admin-scoped vars)

```
--glass-bg            rgba(255,255,255,0.03)
--glass-bg-hover      rgba(255,255,255,0.06)
--glass-border        rgba(255,255,255,0.07)
--glass-border-strong rgba(255,255,255,0.12)
--teal-glass          rgba(48,184,191,0.18)
--teal-border         rgba(48,184,191,0.25)
--shadow-lg           0 1px 3px rgba(0,0,0,0.4)
--shadow-teal         0 0 0 1px rgba(48,184,191,0.45)
```

Used for nav backgrounds (`backdrop-filter: blur(20px)`), teal-tinted icon boxes, and dropdowns.

### 3.7 Radius & typography

- Radius: cards/panels `rounded-xl` (12px); large containers/dropdowns `rounded-2xl` (16px);
  inputs/buttons `rounded-md` (6–8px); status pills/badge counts `rounded-full`.
  Set `--tpl-radius-card` → `12px`.
- **Headings (display serif):** load `Melodrama` (Fontshare) and apply to `h1–h6` within
  `[data-brand="admin"]`. **Body/UI:** keep travelhomes' sans, or load `General Sans` to match
  exactly. Headings get the serif; everything else stays sans for legibility.
  _(If loading external fonts is undesirable, keep Plus Jakarta Sans for headings — note this as a
  deliberate deviation.)_

---

## 4. Shell changes (do these first — they cascade)

### 4.1 `apps/web/src/admin.css` + `apps/web/src/global.css`

Rewrite the `[data-brand="admin"]` token block to the values in §3 as the **base** (dark). Keep the
existing variable _names_; only change _values_. Add the new `-soft`, glass, and teal vars.

### 4.2 `apps/web/src/components/admin/AdminLayout.tsx`

- Root stays `data-brand="admin"`; background becomes `bg-tpl-body-bg` (now `#080A0D`).
- Content padding unchanged.

### 4.3 `apps/web/src/components/admin/AdminSidebar.tsx`

Match 57facets `AdminLayout.tsx` sidebar:

- Surface `--bg-surface-1`, `border-r` in `--bg-surface / --glass-border`.
- **Color-coded nav icons** (each item gets its own hue, rendered in a `rounded-xl` box at ~10–18%
  opacity of that hue): Dashboard teal `#30B8BF`, Listings purple `#a855f7`, Bookings blue `#3b82f6`,
  Vendors green `#22c55e`, Users amber `#f59e0b`, Payments teal `#14b8a6`, Analytics pink `#ec4899`,
  CMS/CRM/Staff/Settings — assign from the same functional palette.
- **Active item:** teal-glass fill (`--teal-glass`) + teal text + left/edge accent.
- Spring-animated collapse (Framer Motion) is already partly present — align timing with reference
  (icon-only 72px → expanded 290px, `localStorage`-pinned).

### 4.4 `apps/web/src/components/admin/AdminHeader.tsx`

- Sticky bar on `--bg-surface-1` with `--glass-border` bottom border and `backdrop-filter: blur(20px)`.
- Search pill: `--bg-surface-2` fill, teal focus ring. Bell with teal/red ping dot. Avatar dropdown
  on `--bg-surface-3`.

---

## 5. Shared component restyle (re-skin once → all pages update)

| Component (path under `apps/web/src/components/`)                                           | Change                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin/AdminStatCard.tsx`                                                                   | `rounded-2xl border` on `--bg-surface-1`; colored icon box (8×8 `rounded-xl`, hue@10%); large `text-2xl font-bold tabular-nums` metric; `text-[10px] uppercase tracking-wide` label; thin top gradient accent stripe; subtle glow orb behind icon; `fadeUp` entry with `delay = index*0.05`. |
| `admin/AdminDataTable.tsx`                                                                  | Container `rounded-xl border` on `--bg-surface-1`; header row `--bg-surface-2`, `text-secondary` uppercase; row hover `--glass-bg-hover`; divider `--glass-border`. Keep sort/select/pagination logic untouched.                                                                             |
| `admin/AdminToolbar.tsx`                                                                    | Search input `--bg-surface-2` + teal focus ring; Sort/Filter as `rounded-full` ghost buttons with `--glass-border`; primary action = teal button.                                                                                                                                            |
| `admin/AdminFilterBar.tsx`                                                                  | Panel on `--bg-surface-3`, `--glass-border`.                                                                                                                                                                                                                                                 |
| `admin/AdminPageHeader.tsx`                                                                 | Serif title, `text-primary`; subtitle `text-muted`.                                                                                                                                                                                                                                          |
| `admin/Pagination.tsx`                                                                      | Ghost buttons, teal active page.                                                                                                                                                                                                                                                             |
| `shared/StatusBadge.tsx`                                                                    | Apply §3.4 status token pairs; `rounded-full`, `border`, `text-xs font-medium`.                                                                                                                                                                                                              |
| `shared/TabStrip.tsx`                                                                       | Underline indicator in teal; active `text-accent`, inactive `text-muted`.                                                                                                                                                                                                                    |
| `shared/EmptyState.tsx`                                                                     | Muted text, teal-tinted icon.                                                                                                                                                                                                                                                                |
| `shared/TableSkeleton.tsx` / `shared/PageSkeleton.tsx`                                      | Shimmer sweep on `--bg-surface-2` (sweeping gradient, not pulse).                                                                                                                                                                                                                            |
| `shared/ConfirmModal.tsx`                                                                   | Dialog on `--bg-surface-1`, `--glass-border`, overlay `bg-black/50` + blur.                                                                                                                                                                                                                  |
| `shared/ChartTooltip.tsx`                                                                   | Bg `--bg-surface-3`, `--glass-border`, `text-primary`.                                                                                                                                                                                                                                       |
| `shared/Breadcrumb.tsx`                                                                     | `text-muted`, teal current crumb.                                                                                                                                                                                                                                                            |
| `components/ui/*` (button, card, input, dialog, table, badge, select, popover, sheet, tabs) | Confirm they read the semantic CSS vars; since values flip via §3, most need no edits. Verify focus rings use teal (`--ring` → `#3880BE`) and inputs use `--bg-surface-2`.                                                                                                                   |

---

## 6. Page-by-page checklist (all ~17 admin pages)

Most pages compose §5 shared parts and need **no per-page edits** once shared parts are reskinned.
Verify each renders correctly; the notes below flag pages with bespoke markup to audit.

**List/management pages — should auto-inherit (verify only):**

- `pages/admin/management/ManagementListing.tsx` (Listings) — tabs + toolbar + table + popups
- `pages/admin/management/UserManagement.tsx`
- `pages/admin/management/VendorManagement.tsx`
- `pages/admin/management/BookingManagement.tsx`
- `pages/admin/management/PaymentManagement.tsx`
- Their popups/modals (ViewDetailsPopup, VendorDetailsPopup, ManagementForm, RejectReasonPopup, etc.)
  — audit any hardcoded white/gray backgrounds; replace with surface tokens.

**Dashboard — bespoke, needs composition work:**

- `pages/admin/AdminDashboard.tsx` — restyle to the 57facets dashboard composition:
  - Stat-card row: `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3` of reskinned `AdminStatCard`.
  - Chart cards (area + bar): teal→blue gradient fills, `barSize≈6`, `radius=[3,3,0,0]`, dark grid lines.
  - Recent bookings table + help-desk widget on `--bg-surface-1` cards.
  - `motion.div` `fadeUp` stagger on each section.

**Analytics / reporting — audit chart + card colors:**

- `pages/admin/AdminAnalytics.tsx` + `components/admin/AdminAnalyticsReport.tsx` — segment control
  teal active; chart palette per §3.5.

**Content-heavy / tabbed pages — audit for hardcoded surfaces:**

- `pages/admin/AdminCMS.tsx` (+ `AdminCMS/tabs/*`, `AdminCMS/modals/*`) — 9 tabs; check each tab's
  cards/inputs use tokens.
- `pages/admin/AdminCRM.tsx`, `AdminMarketing.tsx`, `AdminPlugins.tsx`, `AdminStaff.tsx`,
  `AdminHelpDesk.tsx`, `AdminGlobalSettings.tsx` (Switches → teal), `Notifications.tsx`, `Help.tsx`.

**Auth — bespoke two-column, restyle directly:**

- `pages/admin/AdminLogin.tsx` — dark two-column; left gallery/gradient, right form on `--bg-surface-1`,
  teal CTA. Not wrapped in `AdminLayout`, so it needs its own `data-brand="admin"` + dark styles.

**Misc:**

- `pages/admin/NotFound.tsx` — dark 404.

---

## 7. Motion (Framer Motion — match the reference feel)

- Sidebar expand/collapse: spring (`type: 'spring', stiffness ~260, damping ~30`).
- Section/page entry: `fadeUp` = `{opacity: 0→1, y: 18→0}`, staggered `delay = index*0.05`.
- Dropdowns/notifications: `AnimatePresence` fade+scale.
- Button press: `active:scale-[0.96]`.
- Card hover: shimmer sweep / `--glass-bg-hover` lift.
  Keep durations subtle (0.2–0.35s). Respect `prefers-reduced-motion`.

---

## 8. Suggested execution order

1. **Tokens** — rewrite admin-scoped vars in `admin.css` / `global.css` (§3). Load fonts if approved.
2. **Shell** — `AdminLayout`, `AdminSidebar`, `AdminHeader` (§4).
3. **Shared components** — table, toolbar, stat card, badges, skeletons, modals, tooltip (§5).
4. **Dashboard** — bespoke composition (§6).
5. **Page audit** — sweep all pages for hardcoded `bg-white` / `text-black` / gray hexes; replace
   with tokens (§6). `Grep` for `bg-white`, `#fff`, `text-gray-`, `bg-gray-` under `pages/admin/`.
6. **Polish** — motion (§7), focus rings, contrast (WCAG AA on dark).

---

## 9. Verification

- **Build/typecheck:** `npm run typecheck` and `npm run build` in `apps/web` (NOTE: repo `npm run lint`
  does not cover `apps/web` — rely on typecheck + build, not lint).
- **Visual:** run the web app, log into `/admin/login`, walk every route in §6. Confirm: no leftover
  white cards, teal accents on active nav/CTAs/focus, dark surfaces layer correctly, status badges
  legible, charts use the new palette, motion plays.
- **Scope safety:** open a public/vendor (non-admin) page and confirm it is **unchanged** — proves the
  `[data-brand="admin"]` scoping held.
- **Contrast:** spot-check text on `--bg-base`/`--bg-surface-1` meets AA.

---

## 10. Open decisions (resolve with stakeholder before/while implementing)

1. **Brand accent:** use 57facets teal `#30B8BF` (this doc's default) vs. travelhomes Pacific
   `#0f5c8a`? Affects every active/CTA surface.
2. **Serif headings:** load `Melodrama`/`General Sans` from Fontshare (exact match) vs. keep Plus
   Jakarta Sans (no new font dependency)?
3. **Dark-only vs. dual-theme:** 57facets admin is dark-only. Make travelhomes admin dark-only too,
   or preserve a light toggle? This doc assumes **dark as the base**; keeping the toggle is more work.
4. **Scope of first cut:** ship shell + shared + dashboard as a proof, then sweep remaining pages?
