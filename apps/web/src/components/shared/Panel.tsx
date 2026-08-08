import React from "react";
import { AlertCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Theme ────────────────────────────────────────────────────────────────────
   The vendor console reads teal, but `--brand` is navy in global.css and the
   teal override lives in admin.css — which only AdminApp imports. Rather than
   sprinkle #117479 through the JSX (what the older vendor pages had to do),
   re-point the token on a page's root so every `bg-brand` / `text-brand` /
   `ring-brand/15` beneath it resolves teal through Tailwind. Opacity modifiers
   keep working because the token is hsl channels, not a hex string.

   Radix portals its overlays to <body>, outside any page root — so a Dialog
   that uses brand classes needs `style={BRAND_VARS}` on its own content too. */
export const BRAND_VARS = {
  "--brand": "183 76% 27%" /* #117479 */,
  "--brand-hover": "183 76% 22%" /* #0d5c60 */,
  "--brand-fg": "0 0% 100%",
  // shadcn primitives (Switch fill, Checkbox tick, Select/Input focus ring) key
  // off --primary and --ring, not --brand, so re-point those too or the
  // controls stay navy.
  "--primary": "183 76% 27%",
  "--primary-foreground": "0 0% 100%",
  "--ring": "180 68% 54%",
} as React.CSSProperties;

/**
 * The `app-*` surface/accent layer for the ADMIN area, for the same reason as
 * BRAND_VARS: those vars are declared on `[data-brand="admin"]` (AdminLayout's
 * root), and Radix portals dialogs / select popovers to <body> — outside it. In
 * a portal `app-accent` would otherwise fall back to global.css's `:root`, which
 * is purple. Spread this onto any portalled content that uses `app-*` classes.
 * Values mirror the admin block in admin.css.
 */
export const ADMIN_APP_VARS = {
  ...BRAND_VARS,
  "--surface": "#ffffff",
  "--surface-2": "#f1f3f5",
  "--surface-border": "#e4e7eb",
  "--surface-fg": "#101828",
  "--surface-fg-muted": "#55585e",
  "--surface-fg-subtle": "#6e7278",
  "--accent": "#117479",
  "--accent-hover": "#0d5c60",
  "--accent-soft": "rgba(59, 217, 218, 0.2)",
  "--accent-fg": "#ffffff",
} as React.CSSProperties;

/** White card, hairline edge, soft layered lift — depth from shadow, not stroke. */
export const PANEL =
  "bg-card rounded-[18px] border border-border/70 " +
  "shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] " +
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_-16px_rgba(0,0,0,0.55)]";

/** Action bar at the bottom of a panel — hairline top, faintly recessed. */
export const PANEL_FOOTER =
  "flex items-center justify-between gap-4 px-5 py-4 border-t border-border/70 " +
  "bg-muted/40 dark:bg-white/[0.02]";

/** Active-row highlight for a vertical rail. Give the `motion.span` a `layoutId`
    so one pill slides between rows; siblings need `relative` to paint above it. */
export const ACTIVE_PILL =
  "absolute inset-0 rounded-xl bg-brand/[0.09] shadow-[inset_3px_0_0_0_hsl(var(--brand))]";

/** Inset field that lifts to the card surface on focus — CONVENTIONS.md Rule 1/2. */
export const CONTROL =
  "rounded-xl border-border bg-muted/50 dark:bg-white/5 text-[13.5px] " +
  "placeholder:text-muted-foreground/60 focus-visible:bg-card focus-visible:border-brand " +
  "focus-visible:ring-4 focus-visible:ring-brand/15 focus-visible:ring-offset-0 " +
  "transition-[background-color,border-color,box-shadow] duration-150";

export const CONTROL_ERROR =
  "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/15";

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

/* Secondary actions read as tinted fills, not hairline outlines — a 1px
   `border-border` pill on a white card is almost invisible and looks unfinished. */
export const BTN_SOFT =
  "h-9 px-3.5 rounded-xl border-0 shadow-none bg-brand/[0.09] text-brand " +
  "hover:bg-brand/[0.16] text-[12.5px] font-semibold gap-1.5";
export const BTN_NEUTRAL =
  "h-9 px-4 rounded-xl border-0 shadow-none bg-muted text-foreground/80 " +
  "hover:bg-muted/70 text-[12.5px] font-semibold gap-1.5";
export const BTN_PRIMARY =
  "h-10 px-5 rounded-xl bg-brand hover:bg-brand-hover text-brand-fg font-semibold gap-2 " +
  "shadow-[0_1px_2px_rgba(59, 217, 218, 0.48),0_6px_16px_-6px_rgba(59, 217, 218, 0.65)] " +
  "hover:shadow-[0_1px_2px_rgba(59, 217, 218, 0.56),0_8px_20px_-6px_rgba(59, 217, 218, 0.65)] " +
  "transition-shadow duration-150";

export const Panel = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => <section className={cn(PANEL, "overflow-hidden", className)}>{children}</section>;

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
  <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3.5 border-b border-border/70">
    <div className="flex items-start gap-3 min-w-0">
      {Icon && (
        <span className="mt-0.5 grid place-items-center w-8 h-8 rounded-[10px] bg-brand/10 text-brand shrink-0">
          <Icon size={15} strokeWidth={2.1} />
        </span>
      )}
      <div className="min-w-0">
        <h3 className="text-[14.5px] font-bold tracking-[-0.01em] text-foreground">{title}</h3>
        {blurb && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{blurb}</p>}
      </div>
    </div>
    {aside && <div className="shrink-0 pt-0.5">{aside}</div>}
  </header>
);

/** A titled block nested inside a Panel — groups fields without nesting cards. */
export const SubPanel = ({
  icon: Icon,
  title,
  blurb,
  aside,
  children,
}: {
  icon: LucideIcon;
  title: string;
  blurb?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="rounded-[14px] border border-border/70 overflow-hidden">
    <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border/70 bg-muted/40 dark:bg-white/[0.02]">
      <div className="flex items-start gap-3 min-w-0">
        <span className="grid place-items-center w-8 h-8 rounded-[10px] bg-brand/10 text-brand shrink-0">
          <Icon size={15} strokeWidth={2.1} />
        </span>
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

/** Label + blurb on the left, control on the right. */
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
  <div className="flex items-center justify-between gap-6 px-5 py-4">
    <div className="flex items-start gap-3 min-w-0">
      {Icon && (
        <span className="mt-px grid place-items-center w-8 h-8 rounded-[10px] bg-muted text-muted-foreground shrink-0">
          <Icon size={15} strokeWidth={2} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-foreground">{title}</p>
        {blurb && (
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{blurb}</p>
        )}
      </div>
    </div>
    <div className="shrink-0">{children}</div>
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
