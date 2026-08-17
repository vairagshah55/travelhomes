import React from "react";
import { AlertCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ELEV_1 } from "@/components/admin/adminUI";

/* ── Theme ────────────────────────────────────────────────────────────────────
   DELIBERATELY EMPTY. Kept as an export because ~28 vendor surfaces spread it
   onto their root, and because the name documents what that root is for.

   It used to re-point `--brand` / `--primary` / `--ring` inline, for a reason
   that no longer holds: back then `--brand` was NAVY in global.css and the teal
   lived in admin.css, which only AdminApp imports. The 2026 palette sweep made
   `:root --brand` the logo cyan, so every value in here became a byte-for-byte
   copy of the cascade it was overriding.

   Byte-identical in LIGHT mode, that is — and that is what made it a bug rather
   than dead weight. An inline custom property beats any stylesheet rule without
   `!important`, so pinning the light cyan here meant `.dark` could never take
   effect underneath it. #117479 is ~2.3:1 on the console's dark surface, so in
   dark mode every link, chart line, active tab and soft button on 28 pages was
   effectively unreadable, and no amount of CSS could fix it while this object
   had values in it.

   The tokens now live where they can be theme-aware — `:root` / `.dark` and the
   `[data-console="vendor"]` / `[data-console-portal]` blocks in global.css.
   Removing the `style={BRAND_VARS}` spreads is a safe follow-up sweep; leaving
   them costs nothing. */
export const BRAND_VARS = {} as React.CSSProperties;

/* The admin area's portal vars used to live here too, as `ADMIN_APP_VARS` —
   built by spreading BRAND_VARS above. That coupling broke the moment admin
   moved to a blue accent: admin dropdowns and dialogs kept opening in the
   vendor's cyan. They now live in components/admin/adminUI.ts as
   `PORTAL_VARS`, independent of this set. */

/**
 * Also deliberately empty, and for a sharper version of the same reason.
 *
 * A portalled surface (Radix renders drawers, dialogs, selects and dropdowns as
 * direct children of `<body>`) sits outside `[data-console="vendor"]`, so it
 * genuinely does need the console's tokens restated — the shared components are
 * written in the `app-*` namespace, whose `--accent` is the NextAdmin purple at
 * `:root`, and without a restatement a vendor drawer opened purple.
 *
 * But a style object cannot express "these values, unless dark", and a portal
 * needs BOTH: the console's neutral ramp and its accent invert between themes.
 * So the restatement moved to CSS — the `[data-console-portal]` and
 * `.dark [data-console-portal]` blocks in global.css — and the component stamps
 * that attribute instead of spreading values.
 *
 * Kept as an export so the four vendor surfaces that still pass it keep
 * compiling; `portalScope="vendor"` on the drawer is the current way in.
 */
export const CONSOLE_PORTAL_VARS = {} as React.CSSProperties;

/**
 * Marker attribute for portalled console surfaces — spread onto any Radix
 * content node rendered from the vendor console. See the note above.
 */
export const CONSOLE_PORTAL_ATTR = { "data-console-portal": "" } as const;

/* ── Geometry ─────────────────────────────────────────────────────────────
   The vendor console and the admin are held to ONE geometry contract, so a
   button, a field or a card is the same object in both. The numbers live in
   `components/admin/adminUI.ts` (spelled in the brand-agnostic `app-*`
   namespace); re-deriving them here is how the two drifted last time — a
   panel at 18px next to a table cell at 10px, a 40px button beside a 36px one.

     primary / filled controls .... h-9,  rounded-lg, 13px semibold
     inputs and selects ........... h-10, rounded-xl, 13.5px
     cards and panels ............. rounded-[10px], hairline, no lift
     pills and chips .............. h-8,  rounded-full, 12px

   What the vendor kit still owns is the SPELLING: these classes use the
   `brand` tokens (`bg-brand`, `ring-brand/15`) that vendor pages and Radix
   portals re-point through `BRAND_VARS`, where the admin kit uses `app-accent`.
   Same pixels, different token path. */

/**
 * The one panel definition for the console.
 *
 * A resting surface gets a hairline and essentially no shadow. The previous
 * value put a 28px blurred lift under every card, which read as consumer-app
 * rather than business tool and — worse — flattened hierarchy: when a stat
 * card, a chart, a table and a form section all levitate equally, nothing on
 * the page is actually raised. Shadow is now reserved for layers that really
 * do float (menus, drawers, dialogs) via `ELEV_FLOAT`.
 */
export const PANEL = `bg-card rounded-[10px] border border-border ${ELEV_1}`;

/** Same panel, clipping its children — use when a table or media sits flush. */
export const PANEL_FLUSH = `${PANEL} overflow-hidden`;

/** Genuinely floating layers only: drawers, dialogs, popovers. */
export const ELEV_FLOAT =
  "shadow-[0_8px_24px_-6px_rgba(14,26,27,0.12),0_2px_6px_-2px_rgba(14,26,27,0.06)] " +
  "dark:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.6)]";

/** Hover treatment for a clickable card — the edge darkens, it does not lift. */
export const PANEL_INTERACTIVE =
  "transition-[background-color,border-color] duration-150 " +
  "hover:border-brand/30 hover:bg-muted/40 dark:hover:bg-white/[0.03]";

/** Header strip inside a panel — hairline base, no fill. */
export const PANEL_HEAD =
  "flex items-start justify-between gap-4 px-4 py-3.5 border-b border-border";

/** Action bar at the bottom of a panel — hairline top, faintly recessed. */
export const PANEL_FOOTER =
  "flex items-center justify-between gap-4 px-4 py-3 border-t border-border " +
  "bg-muted/50 dark:bg-white/[0.02]";

/** Inner grouping block — a bordered region that must not read as a card. */
export const INSET = "rounded-lg border border-border overflow-hidden bg-card";

/** Active-row highlight for a vertical rail. Give the `motion.span` a `layoutId`
    so one pill slides between rows; siblings need `relative` to paint above it. */
export const ACTIVE_PILL =
  "absolute inset-0 rounded-lg bg-brand/[0.09] shadow-[inset_3px_0_0_0_hsl(var(--brand))]";

/** One focus ring for the whole console. `ring-offset-0` matters: without it the
    offset inherits and punches a white gap through tinted fills. */
export const FOCUS_RING =
  "outline-none focus-visible:ring-4 focus-visible:ring-brand/20 focus-visible:ring-offset-0";

/** Inset field that lifts to the card surface on focus — CONVENTIONS.md Rule 1/2. */
export const CONTROL =
  "h-10 rounded-xl border-border bg-muted/60 dark:bg-white/5 text-[13.5px] " +
  "placeholder:text-muted-foreground/60 focus-visible:bg-card focus-visible:border-brand " +
  "focus-visible:ring-4 focus-visible:ring-brand/15 focus-visible:ring-offset-0 " +
  "transition-[background-color,border-color,box-shadow] duration-150";

/** Textarea counterpart — same skin, height comes from `rows`. */
export const CONTROL_AREA =
  "rounded-xl border-border bg-muted/60 dark:bg-white/5 text-[13.5px] leading-6 resize-none " +
  "placeholder:text-muted-foreground/60 focus-visible:bg-card focus-visible:border-brand " +
  "focus-visible:ring-4 focus-visible:ring-brand/15 focus-visible:ring-offset-0 " +
  "transition-[background-color,border-color,box-shadow] duration-150";

export const CONTROL_ERROR =
  "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/15";

/* ── Pills and eyebrows ───────────────────────────────────────────────────
   Brand-tinted and neutral chips for counts, filters and metadata. Semantic
   status colours live in StatusBadge — do not restate them here. */
export const PILL_BRAND =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-brand/[0.09] " +
  "text-brand text-[12px] font-semibold";
export const PILL_NEUTRAL =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-muted " +
  "text-muted-foreground text-[12px] font-medium border border-border";
/** Column label / small-caps eyebrow above a group. */
export const EYEBROW =
  "text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80";

/**
 * Highlight styling for dropdown rows.
 *
 * shadcn's SelectItem highlights with `focus:bg-accent focus:text-accent-foreground`,
 * but `--accent` is declared twice: an UNLAYERED hex (`#5750f1`, global.css:41) and
 * the shadcn hsl-channel triplet inside `@layer base`. Unlayered wins over any
 * layer, so Tailwind emits `hsl(#5750f1)` — invalid, background drops out — while
 * `--accent-foreground` still resolves and paints the text white. Highlighted rows
 * come out white-on-white and unreadable.
 *
 * Same root cause the bookings pages already worked around in
 * `FormPrimitives.SELECT_ITEM_CLASS`; spelled out here in brand tokens instead of
 * literal hex. The real fix is renaming the app-layer `--accent*` vars so they stop
 * colliding — deliberately out of scope (see the note at admin.css:1476).
 *
 * SelectContent portals to <body>, outside any page root, so it needs its own
 * `style={BRAND_VARS}` for `brand` to resolve.
 */
export const SELECT_ITEM =
  "cursor-pointer focus:bg-brand/[0.1] focus:text-brand " +
  "data-[highlighted]:bg-brand/[0.1] data-[highlighted]:text-brand";

/* ── Buttons ──────────────────────────────────────────────────────────────
   Four roles only: primary (one per view), secondary, neutral, danger. The
   press state is a 1px sink rather than a scale — scale blurs text mid-frame
   on the sub-pixel grid, a translate does not.

   These are sized to be droppable onto a shadcn `<Button>` (which supplies the
   flex box) OR onto a bare element — hence `inline-flex` is NOT baked in; use
   `BTN_RAW` alongside when the element isn't a `<Button>`. */
export const BTN_RAW = "inline-flex items-center justify-center whitespace-nowrap shrink-0";

/* A flat fill with a 1px inset highlight along the top edge. It reads as a
   crisp physical key rather than a glowing blob, and it survives on both light
   and tinted grounds. The previous value floated the primary button on a 16px
   brand-coloured glow, which made a form's Save look like a hero CTA.
   Spelled in `hsl(var(--brand)/…)` so it follows whichever brand is in scope —
   and note Tailwind silently drops any arbitrary value containing a space. */
export const BTN_PRIMARY =
  "h-9 px-3.5 rounded-lg bg-brand hover:bg-brand-hover text-brand-fg " +
  "text-[13px] font-semibold gap-2 border-0 " +
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_1px_2px_hsl(var(--brand)/0.2)] " +
  "disabled:shadow-none active:translate-y-px " +
  "transition-[box-shadow,transform,background-color] duration-150";

/* Secondary actions read as tinted fills, not hairline outlines — a 1px
   `border-border` pill on a white card is almost invisible and looks unfinished. */
export const BTN_SOFT =
  "h-9 px-3.5 rounded-lg border-0 shadow-none bg-brand/[0.09] text-brand " +
  "hover:bg-brand/[0.16] text-[13px] font-semibold gap-1.5 active:translate-y-px " +
  "transition-[background-color,transform] duration-150";

/** Neutral equivalent, for actions that aren't brand-flavoured (Cancel, Export). */
export const BTN_NEUTRAL =
  "h-9 px-3.5 rounded-lg border border-border shadow-none bg-card text-foreground/85 " +
  "hover:bg-muted text-[13px] font-semibold gap-1.5 active:translate-y-px " +
  "transition-[background-color,transform] duration-150";

export const BTN_GHOST =
  "h-9 px-2.5 rounded-lg border-0 shadow-none bg-transparent text-muted-foreground " +
  "hover:bg-muted hover:text-foreground text-[13px] font-semibold gap-1.5";

export const BTN_DANGER_SOFT =
  "h-9 px-3.5 rounded-lg border-0 shadow-none bg-red-50 text-red-600 hover:bg-red-100 " +
  "dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 " +
  "text-[13px] font-semibold gap-1.5";

/** Tighter, for table footers and inline rows. */
export const BTN_SM = "h-8 px-3 text-[12.5px]";
/** Square icon-only button. Pair with any of the roles above. */
export const BTN_ICON = "h-9 w-9 px-0";
export const BTN_ICON_SM = "h-8 w-8 px-0";

export const Panel = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => <section className={cn(PANEL, "overflow-hidden", className)}>{children}</section>;

/**
 * Panel header.
 *
 * The icon is a small monochrome glyph, not a brand-tinted tile. A filled tile
 * on every panel head turned the accent into wallpaper: by the time a page had
 * six sections, the one thing on screen that was genuinely the primary action
 * had no colour left to distinguish it. The accent is rationed to five roles —
 * primary button, active nav row, focus ring, selected row/tab, and links.
 */
export const PanelHead = ({
  icon: Icon,
  title,
  blurb,
  aside,
}: {
  icon?: LucideIcon;
  title: string;
  blurb?: string;
  aside?: React.ReactNode;
}) => (
  <header className={PANEL_HEAD}>
    <div className="flex items-start gap-2.5 min-w-0">
      {Icon && (
        <Icon
          size={15}
          strokeWidth={2}
          aria-hidden
          className="mt-[3px] shrink-0 text-muted-foreground"
        />
      )}
      <div className="min-w-0">
        <h3 className="text-[14px] font-bold tracking-[-0.01em] text-foreground">{title}</h3>
        {blurb && (
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{blurb}</p>
        )}
      </div>
    </div>
    {aside && <div className="shrink-0 -mt-0.5">{aside}</div>}
  </header>
);

/** A titled block nested inside a Panel — groups fields without nesting cards. */
export const SubPanel = ({
  icon: Icon,
  title,
  blurb,
  aside,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  blurb?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={cn(INSET, className)}>
    <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border bg-muted/50 dark:bg-white/[0.02]">
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon
          size={15}
          strokeWidth={2}
          aria-hidden
          className="mt-[3px] shrink-0 text-muted-foreground"
        />
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold text-foreground">{title}</p>
          {blurb && <p className="mt-0.5 text-[12px] text-muted-foreground">{blurb}</p>}
        </div>
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
    <div className="p-4">{children}</div>
  </section>
);

/**
 * Label + blurb on the left, control on the right.
 *
 * Stacks below `sm`: a switch pinned to the right edge of a 360px phone with a
 * two-line description squeezed beside it was the single worst responsive
 * offender in Settings.
 */
export const SettingRow = ({
  icon: Icon,
  title,
  blurb,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  blurb?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
    <div className="flex items-start gap-2.5 min-w-0">
      {Icon && (
        <Icon
          size={15}
          strokeWidth={2}
          aria-hidden
          className="mt-[3px] shrink-0 text-muted-foreground"
        />
      )}
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-foreground">{title}</p>
        {blurb && (
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{blurb}</p>
        )}
      </div>
    </div>
    <div className="shrink-0 sm:pl-0 pl-[22px]">{children}</div>
  </div>
);

/** Sentence-case label with an optional right-aligned hint and an error slot. */
export const Field = ({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn("space-y-1.5", className)}>
    <div className="flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-[12.5px] font-semibold text-foreground/85">
        {label}
      </label>
      {hint && !error && (
        <span className="text-[11px] tabular-nums text-muted-foreground/70">{hint}</span>
      )}
    </div>
    {children}
    {error && (
      <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-red-600 dark:text-red-400">
        <AlertCircle size={12} strokeWidth={2.4} />
        {error}
      </p>
    )}
  </div>
);

/** Read-only counterpart to a filled control — same rhythm, no input chrome. */
export const ReadValue = ({ value }: { value?: React.ReactNode }) => {
  const empty = value === null || value === undefined || value === "" || value === "-";
  return (
    <p
      className={cn(
        "text-[13.5px] leading-6 break-words",
        empty ? "text-muted-foreground/50" : "text-foreground",
      )}
    >
      {empty ? "Not added" : value}
    </p>
  );
};

export default Panel;
