import React from "react";
import { AlertCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Theme ────────────────────────────────────────────────────────────────────
   The vendor console reads teal, but `--brand` is navy in global.css and the
   teal override lives in admin.css — which only AdminApp imports. Rather than
   sprinkle #0d9488 through the JSX (what the older vendor pages had to do),
   re-point the token on a page's root so every `bg-brand` / `text-brand` /
   `ring-brand/15` beneath it resolves teal through Tailwind. Opacity modifiers
   keep working because the token is hsl channels, not a hex string.

   Radix portals its overlays to <body>, outside any page root — so a Dialog
   that uses brand classes needs `style={BRAND_VARS}` on its own content too. */
export const BRAND_VARS = {
  "--brand": "175 84% 32%" /* #0d9488 */,
  "--brand-hover": "175 78% 26%" /* #0f766e */,
  "--brand-fg": "0 0% 100%",
  // shadcn primitives (Switch fill, Checkbox tick, Select/Input focus ring) key
  // off --primary and --ring, not --brand, so re-point those too or the
  // controls stay navy.
  "--primary": "175 84% 32%",
  "--primary-foreground": "0 0% 100%",
  "--ring": "175 84% 32%",
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

/** Inset field that lifts to the card surface on focus — CONVENTIONS.md Rule 1/2. */
export const CONTROL =
  "rounded-xl border-border bg-muted/50 dark:bg-white/5 text-[13.5px] " +
  "placeholder:text-muted-foreground/60 focus-visible:bg-card focus-visible:border-brand " +
  "focus-visible:ring-4 focus-visible:ring-brand/15 focus-visible:ring-offset-0 " +
  "transition-[background-color,border-color,box-shadow] duration-150";

export const CONTROL_ERROR =
  "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/15";

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
  "shadow-[0_1px_2px_rgba(13,148,136,0.24),0_6px_16px_-6px_rgba(13,148,136,0.45)] " +
  "hover:shadow-[0_1px_2px_rgba(13,148,136,0.28),0_8px_20px_-6px_rgba(13,148,136,0.55)] " +
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
