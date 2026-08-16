import React from "react";

/**
 * The admin design system, as class-name constants.
 *
 * Everything here is spelled in the `app-*` token namespace (`--surface*` /
 * `--accent*`, defined on `[data-brand="admin"]` in admin.css), never in
 * literal hex. That is what lets the admin shell read blue while the vendor
 * console — which uses the same shared components — stays on the logo cyan.
 *
 * This module is the single source of truth. `pages/admin/AdminCMS/ui.tsx`
 * re-exports from here rather than defining its own near-identical kit, which
 * is how the two previously drifted apart (different heights, different radii,
 * different shadows for the same role).
 *
 * Geometry contract, so controls line up when placed side by side:
 *   - primary / filled controls .... h-10, rounded-xl, 13px semibold
 *   - secondary / compact .......... h-9,  rounded-xl, 12.5px semibold
 *   - inputs and selects ........... h-10, rounded-xl, 13.5px
 *   - pills and chips .............. h-8,  rounded-full, 12px
 */

/* ── Elevation ────────────────────────────────────────────────────────────
   Resting surfaces get a hairline border and essentially no shadow. Only
   things that genuinely float — menus, popovers, dialogs — cast one. A soft
   glow under every card is the fastest way to make an admin tool look like a
   consumer app, and it also flattens hierarchy: if everything lifts, nothing
   reads as raised. */
export const ELEV_0 = "shadow-none";
export const ELEV_1 = "shadow-[0_1px_2px_rgba(18,25,38,0.04)]";
export const ELEV_2 = "shadow-[0_1px_2px_rgba(18,25,38,0.04),0_4px_12px_-6px_rgba(18,25,38,0.08)]";
/** Floating layers only: dropdowns, popovers, dialogs. */
export const ELEV_3 =
  "shadow-[0_8px_24px_-6px_rgba(18,25,38,0.12),0_2px_6px_-2px_rgba(18,25,38,0.06)]";

/** Hover treatment for a clickable card — border darkens, it does not levitate. */
export const CARD_INTERACTIVE_HOVER = "hover:border-app-fg-subtle/35 hover:bg-app-surface-2/40";

/* ── Focus ────────────────────────────────────────────────────────────────
   One ring, used everywhere. `ring-offset-0` matters: without it the offset
   inherits and punches a white gap through tinted fills. */
export const FOCUS_RING =
  "outline-none focus-visible:ring-4 focus-visible:ring-app-accent/20 focus-visible:ring-offset-0";

/* ── Surfaces ─────────────────────────────────────────────────────────────
   `CARD` is the one panel definition for the admin area. Pages that hand-rolled
   `bg-app-surface rounded-[18px] border …` with a literal shadow should use
   this instead — that duplication is why radii drifted between 10 and 18px. */
export const CARD = `bg-app-surface rounded-[10px] border border-app-border ${ELEV_1}`;
export const CARD_FLUSH = `${CARD} overflow-hidden`;
/** Header strip inside a card — hairline bottom, no fill. */
export const CARD_HEAD =
  "flex items-start justify-between gap-4 px-4 py-3.5 border-b border-app-border";
/** Footer strip inside a card — faintly recessed so it reads as a base. */
export const CARD_FOOT =
  "flex items-center justify-between gap-4 px-4 py-3 border-t border-app-border bg-app-surface-2/60";
/** Inner grouping block — a bordered region that must not look like a card. */
export const INSET = "rounded-lg border border-app-border overflow-hidden bg-app-surface";

/* ── Buttons ──────────────────────────────────────────────────────────────
   Four roles only: primary (one per view), secondary, ghost, danger. The
   press state is a 1px sink rather than a scale — scale blurs text mid-frame
   on the sub-pixel grid, a translate does not. */
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap font-semibold " +
  "transition-[background-color,box-shadow,transform,border-color] duration-150 " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-45 " +
  FOCUS_RING;

/* A flat fill with a 1px inset highlight along the top edge — the same trick
   Linear and Vercel use. It reads as a crisp physical key rather than a
   glowing blob, and it survives on both light and tinted backgrounds. */
export const BTN_PRIMARY =
  `${BTN_BASE} h-9 px-3.5 rounded-lg text-[13px] bg-app-accent text-app-accent-fg ` +
  "hover:bg-app-accent-hover " +
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_1px_2px_rgba(18,25,38,0.12)] " +
  "disabled:shadow-none";

/** Tinted fill, not a hairline outline — an outline pill on a white card is
    close to invisible and makes the UI look unfinished. */
export const BTN_SECONDARY =
  `${BTN_BASE} h-9 px-3.5 rounded-lg text-[13px] bg-app-accent-soft text-app-accent ` +
  "hover:bg-app-accent/[0.14]";

/** Neutral equivalent, for actions that aren't brand-flavoured (Cancel, Export). */
export const BTN_NEUTRAL =
  `${BTN_BASE} h-9 px-3.5 rounded-lg text-[13px] bg-app-surface text-app-fg ` +
  "border border-app-border hover:bg-app-surface-2 " +
  "shadow-[0_1px_2px_rgba(18,25,38,0.04)]";

export const BTN_GHOST =
  `${BTN_BASE} h-9 px-2.5 rounded-lg text-[13px] text-app-fg-muted ` +
  "hover:bg-app-surface-2 hover:text-app-fg";

export const BTN_DANGER =
  `${BTN_BASE} h-9 px-3.5 rounded-lg text-[13px] bg-red-600 text-white hover:bg-red-700 ` +
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_1px_2px_rgba(18,25,38,0.12)]";

export const BTN_DANGER_SOFT =
  `${BTN_BASE} h-9 px-3.5 rounded-lg text-[13px] bg-red-50 text-red-600 hover:bg-red-100 ` +
  "dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20";

/** Even tighter, for table footers and inline rows. */
export const BTN_SM = "h-8 px-3 text-[12.5px]";
/** Square icon-only button. Pair with BTN_NEUTRAL / BTN_GHOST. */
export const BTN_ICON = "h-9 w-9 px-0";
export const BTN_ICON_SM = "h-8 w-8 px-0";

/* ── Inputs ───────────────────────────────────────────────────────────────
   Fields sit inset on the page and lift to the card surface on focus, which
   gives focus a state change beyond the ring alone. */
const FIELD_BASE =
  "w-full rounded-xl border border-app-border bg-app-surface-2 text-app-fg " +
  "placeholder:text-app-fg-subtle " +
  "transition-[background-color,border-color,box-shadow] duration-150 " +
  "focus:bg-app-surface focus:border-app-accent " +
  "focus:ring-4 focus:ring-app-accent/20 focus:outline-none " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

export const INPUT = `${FIELD_BASE} h-10 px-3.5 text-[13.5px]`;
export const INPUT_SM = `${FIELD_BASE} h-9 px-3 text-[13px]`;
export const TEXTAREA = `${FIELD_BASE} px-3.5 py-3 text-[13.5px] leading-6 resize-none`;
export const FIELD_ERROR = "border-red-400 focus:border-red-500 focus:ring-red-500/20";
export const LABEL = "text-[12.5px] font-semibold text-app-fg/85";
export const HELP = "text-[11.5px] text-app-fg-muted";
export const ERROR_TEXT =
  "flex items-center gap-1.5 text-[11.5px] font-medium text-red-600 dark:text-red-400";

/* ── Select / dropdown rows ───────────────────────────────────────────────
   `--accent` is declared twice app-wide in incompatible formats (raw hex at
   the app layer, hsl channels inside shadcn's `@layer base`); the unlayered
   hex wins, so Tailwind emits `hsl(#…)`, the background drops out, and
   shadcn's own `focus:bg-accent` leaves highlighted rows white-on-white.
   Spelling the highlight in `app-*` sidesteps the collision entirely.
   See the note at admin.css and on SELECT_ITEM in components/shared/Panel.tsx. */
export const SELECT_ITEM =
  "cursor-pointer rounded-lg focus:bg-app-accent-soft focus:text-app-accent " +
  "data-[highlighted]:bg-app-accent-soft data-[highlighted]:text-app-accent";

export const MENU_ITEM =
  "gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[13px] font-medium text-app-fg " +
  "focus:bg-app-surface-2 focus:text-app-fg";
export const MENU_ITEM_DANGER =
  "gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[13px] font-medium " +
  "text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-500/10 focus:text-red-700";

/**
 * Radix portals dialogs, popovers and select menus to `<body>` — outside the
 * `[data-brand="admin"]` root — so neither the `app-*` surface vars nor the
 * blue `--brand` reach them, and they would fall back to the global (cyan)
 * values instead. Spread this onto every DialogContent / SelectContent /
 * PopoverContent / DropdownMenuContent rendered from the admin.
 *
 * These values MUST mirror the `[data-brand="admin"]` block in admin.css. They
 * are duplicated here because a portalled node has no ancestor carrying them —
 * there is no way to inherit them, only to restate them.
 *
 * Deliberately NOT shared with `BRAND_VARS` in components/shared/Panel.tsx:
 * that set is the vendor console's cyan, applied by ~28 vendor pages. Pointing
 * admin portals at it is what would make a dropdown open cyan inside an
 * otherwise blue panel.
 */
export const PORTAL_VARS = {
  "--brand": "221 83% 53%" /* #2563EB */,
  "--brand-hover": "224 76% 48%" /* #1D4ED8 */,
  "--brand-fg": "0 0% 100%",
  "--brand-subtle": "214 100% 97%",
  // shadcn primitives (Switch fill, Checkbox tick, Select/Input focus ring) key
  // off --primary and --ring rather than --brand, so re-point those too or the
  // controls keep the global accent.
  "--primary": "221 83% 53%",
  "--primary-foreground": "0 0% 100%",
  "--ring": "217 91% 60%",
  // app-* surface layer
  "--surface": "#ffffff",
  "--surface-2": "#f5f7fa",
  "--surface-border": "#e3e8ef",
  "--surface-fg": "#121926",
  "--surface-fg-muted": "#697586",
  "--surface-fg-subtle": "#9aa4b2",
  "--accent": "#2563eb",
  "--accent-hover": "#1d4ed8",
  "--accent-soft": "rgba(37, 99, 235, 0.08)",
  "--accent-fg": "#ffffff",
} as React.CSSProperties;

/* ── Pills, chips, badges ─────────────────────────────────────────────────
   Semantic status colours live in components/shared/StatusBadge.tsx — do not
   duplicate them here. These are the brand-tinted and neutral variants for
   counts, filters and metadata. */
export const PILL_ACCENT =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-app-accent-soft " +
  "text-app-accent text-[12px] font-semibold";
export const PILL_NEUTRAL =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-app-surface-2 " +
  "text-app-fg-muted text-[12px] font-medium border border-app-border";
/** Count bubble that sits inside a button or tab. */
export const COUNT_BUBBLE =
  "grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full " +
  "text-[10px] font-bold leading-none tabular-nums";

/* ── Alerts ───────────────────────────────────────────────────────────────
   Inline, non-blocking messages. Transient feedback should use a sonner toast
   instead; these are for state that persists on the page. */
const ALERT_BASE = "flex items-start gap-3 rounded-xl border px-4 py-3 text-[13px] leading-relaxed";
export const ALERT_INFO = `${ALERT_BASE} border-app-accent/25 bg-app-accent-soft text-app-fg`;
export const ALERT_SUCCESS = `${ALERT_BASE} border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200`;
export const ALERT_WARNING = `${ALERT_BASE} border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200`;
export const ALERT_DANGER = `${ALERT_BASE} border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200`;

/* ── Typography ───────────────────────────────────────────────────────────
   Tight tracking on large text only; body copy keeps normal tracking, since
   negative tracking below ~16px costs legibility rather than buying polish. */
export const H_PAGE = "text-[24px] md:text-[28px] font-bold tracking-[-0.02em] text-app-fg";
export const H_SECTION = "text-[15px] font-bold tracking-[-0.01em] text-app-fg";
export const H_CARD = "text-[14px] font-bold tracking-[-0.01em] text-app-fg";
export const TEXT_MUTED = "text-[13px] text-app-fg-muted";
export const TEXT_SUBTLE = "text-[12px] text-app-fg-subtle";
/** Column label / small caps eyebrow. */
export const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-subtle";

/* ── Skeletons ────────────────────────────────────────────────────────────
   A shimmer rather than a pulse: pulse fades the whole block to near-invisible
   and reads as a rendering fault on a slow connection. `admin-shimmer` is
   defined in admin.css and respects prefers-reduced-motion. */
export const SKELETON = "admin-shimmer rounded-md bg-app-surface-2";

/* ── Layout ───────────────────────────────────────────────────────────────
   One container width for every admin page, so headers, toolbars and tables
   share a left edge across routes. */
export const PAGE_CONTAINER = "mx-auto w-full max-w-[1600px]";
/** Vertical rhythm between major sections of a page. */
export const SECTION_STACK = "space-y-5 md:space-y-6";
/**
 * Standard responsive grid for a row of stat cards. Two-up from the smallest
 * width — stacked single-file, four KPI cards filled an entire phone screen
 * before you reached the table they describe.
 */
export const STAT_GRID = "grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4";
