import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Image as ImageIcon, Loader2, Upload, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_APP_VARS } from "@/components/shared/Panel";
import { getImageUrl } from "@/lib/adminUtils";

/* ── Tokens ───────────────────────────────────────────────────────────────────
   The CMS panel body lives inside AdminLayout, so the `app-*` namespace (the
   same one AdminToolbar / AdminDataTable / AdminStatCard use) resolves to the
   admin teal values. Every control here is spelled in those tokens rather than
   literal grays, which is what let the old tab bodies drift away from the rest
   of the admin. */

const CONTROL_BASE =
  "w-full rounded-xl border border-app-border bg-app-surface-2 text-[13.5px] text-app-fg " +
  "placeholder:text-app-fg-muted/70 outline-none " +
  "transition-[background-color,border-color,box-shadow] duration-150 " +
  "focus:bg-app-surface focus:border-app-accent focus:ring-4 focus:ring-app-accent/20 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

/** Inset field that lifts to the card surface on focus. */
export const CONTROL = `${CONTROL_BASE} h-11 px-3.5`;
export const TEXTAREA = `${CONTROL_BASE} px-3.5 py-3 leading-6 resize-none`;

export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl shrink-0 " +
  "bg-app-accent text-app-accent-fg text-[13px] font-semibold " +
  "transition-[background-color,box-shadow] duration-150 hover:bg-app-accent-hover " +
  "shadow-[0_1px_2px_rgba(13,148,136,0.24),0_6px_16px_-6px_rgba(13,148,136,0.45)] " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-accent/25 " +
  "disabled:opacity-45 disabled:shadow-none disabled:cursor-not-allowed";

/* Secondary actions read as tinted fills — a hairline outline pill on a white
   card is close to invisible (same call the vendor Panel kit makes). */
export const BTN_SOFT =
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl shrink-0 " +
  "bg-app-accent-soft text-app-accent text-[12.5px] font-semibold " +
  "transition-colors duration-150 hover:bg-app-accent/[0.16] " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-accent/20 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export const BTN_NEUTRAL =
  "inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl shrink-0 " +
  "bg-app-surface-2 text-app-fg/80 text-[12.5px] font-semibold " +
  "transition-colors duration-150 hover:bg-app-border/70 " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-accent/20 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Highlight styling for dropdown rows. `--accent` is declared twice in
 * incompatible formats app-wide, so shadcn's own `focus:bg-accent` drops out and
 * highlighted rows render white-on-white — see the note on SELECT_ITEM in
 * components/shared/Panel.tsx. Spelled in `app-*` here to match this page.
 */
export const SELECT_ITEM =
  "cursor-pointer focus:bg-app-accent-soft focus:text-app-accent " +
  "data-[highlighted]:bg-app-accent-soft data-[highlighted]:text-app-accent";

/**
 * Radix portals dialogs/popovers to <body>, outside AdminLayout — so neither the
 * `app-*` surface vars nor the teal `--brand` reach them and `app-accent` would
 * resolve to the global purple. Put this on every DialogContent / SelectContent.
 */
export const DIALOG_VARS = ADMIN_APP_VARS;

/* ── Layout ──────────────────────────────────────────────────────────────── */

/**
 * A titled block inside the CMS panel. Groups a tab's content without nesting
 * another full card inside the page card (which is what the old white-on-white
 * `bg-white p-4` wrappers did).
 */
export const CmsSection: React.FC<{
  icon?: LucideIcon;
  title: string;
  blurb?: string;
  aside?: React.ReactNode;
  bodyClassName?: string;
  /** Tables provide their own edge padding. */
  flush?: boolean;
  children?: React.ReactNode;
}> = ({ icon: Icon, title, blurb, aside, bodyClassName, flush = false, children }) => (
  <section className="rounded-[14px] border border-app-border overflow-hidden">
    <header className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 border-b border-app-border bg-app-surface-2">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className="grid place-items-center w-8 h-8 rounded-[10px] bg-app-accent-soft text-app-accent shrink-0">
            <Icon size={15} strokeWidth={2.1} />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold text-app-fg">{title}</p>
          {blurb && <p className="mt-0.5 text-[12px] text-app-fg-muted">{blurb}</p>}
        </div>
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
    {children && <div className={cn(flush ? "" : "p-4", bodyClassName)}>{children}</div>}
  </section>
);

/**
 * Row thumbnail. Uploaded media outlives the file on disk in this project, so a
 * dead URL must degrade to the placeholder glyph rather than the browser's
 * broken-image icon.
 */
export const Thumb: React.FC<{
  src?: string;
  alt?: string;
  icon?: LucideIcon;
  className?: string;
  imgClassName?: string;
}> = ({ src, alt = "", icon: Icon = ImageIcon, className, imgClassName }) => {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);

  return (
    <div
      className={cn(
        "grid place-items-center shrink-0 overflow-hidden rounded-[10px] border border-app-border bg-app-surface-2",
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={getImageUrl(src)}
          alt={alt}
          onError={() => setFailed(true)}
          className={cn("w-full h-full object-cover", imgClassName)}
        />
      ) : (
        <Icon size={14} className="text-app-fg-subtle" />
      )}
    </div>
  );
};

/** Frame around an AdminDataTable so its edges meet the section border. */
export const TableFrame: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <div className={cn("border border-app-border rounded-xl overflow-hidden", className)}>
    {children}
  </div>
);

export interface SegmentedItem<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

/**
 * Sub-tab control for the inside of a CMS section. A recessed track with one
 * sliding pill, distinct from the page-level rail in AdminCMS.tsx but the same
 * motion — `layoutId` must be unique per rail on screen.
 */
export function CmsSegmented<T extends string>({
  items,
  value,
  onChange,
  layoutId,
  ariaLabel,
  className,
}: {
  items: SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-2xl bg-app-surface-2 border border-app-border",
        "max-w-full overflow-x-auto scrollbar-hide",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl whitespace-nowrap shrink-0",
              "text-[12.5px] font-semibold outline-none transition-colors duration-150",
              "focus-visible:ring-2 focus-visible:ring-app-accent/40",
              active ? "text-app-accent" : "text-app-fg-muted hover:text-app-fg",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-app-surface shadow-[0_1px_2px_rgba(16,24,40,0.10)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {item.icon && <item.icon size={14} strokeWidth={2.1} className="relative shrink-0" />}
            <span className="relative">{item.label}</span>
            {typeof item.count === "number" && (
              <span
                className={cn(
                  "relative grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none",
                  active
                    ? "bg-app-accent text-app-accent-fg"
                    : "bg-app-border/70 text-app-fg-muted",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Forms ───────────────────────────────────────────────────────────────── */

/** Sentence-case label with an optional right-aligned hint and an error slot. */
export const CmsField: React.FC<{
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, hint, error, className, children }) => (
  <div className={cn("space-y-1.5", className)}>
    <div className="flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-[12.5px] font-semibold text-app-fg/85">
        {label}
      </label>
      {hint && !error && <span className="text-[11px] tabular-nums text-app-fg-muted">{hint}</span>}
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

/** Label + blurb on the left, control on the right — one row of a settings list. */
export const CmsToggleRow: React.FC<{
  icon?: LucideIcon;
  title: string;
  blurb?: string;
  children: React.ReactNode;
}> = ({ icon: Icon, title, blurb, children }) => (
  <div className="flex items-center justify-between gap-6 px-4 py-3.5">
    <div className="flex items-start gap-3 min-w-0">
      {Icon && (
        <span className="mt-px grid place-items-center w-8 h-8 rounded-[10px] bg-app-surface-2 text-app-fg-muted shrink-0">
          <Icon size={15} strokeWidth={2} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-app-fg">{title}</p>
        {blurb && <p className="mt-0.5 text-[12.5px] leading-relaxed text-app-fg-muted">{blurb}</p>}
      </div>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

/**
 * Image field: preview + upload button + optional "paste a URL" escape hatch.
 * Replaces the bare `<input type="file">` and the ad-hoc preview boxes that each
 * tab hand-rolled.
 */
export const MediaPicker: React.FC<{
  value?: string;
  onFile: (file: File) => void;
  onChangeUrl?: (url: string) => void;
  onClear?: () => void;
  busy?: boolean;
  shape?: "square" | "circle" | "wide";
  hint?: string;
  accept?: string;
  buttonLabel?: string;
  className?: string;
  /** Override the preview fill — e.g. a dark plate for a dark-theme logo. */
  previewClassName?: string;
  /** Skip the built-in preview when the page already shows the image bigger. */
  hidePreview?: boolean;
}> = ({
  value,
  onFile,
  onChangeUrl,
  onClear,
  busy = false,
  shape = "square",
  hint,
  accept = "image/*",
  buttonLabel,
  className,
  previewClassName,
  hidePreview = false,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const frame =
    shape === "circle"
      ? "w-16 h-16 rounded-full"
      : shape === "wide"
        ? "w-28 h-16 rounded-xl"
        : "w-16 h-16 rounded-xl";

  return (
    <div className={cn("flex items-start gap-3", className)}>
      {!hidePreview &&
        (busy ? (
          <div
            className={cn(
              "grid place-items-center shrink-0 border border-app-border bg-app-surface-2",
              frame,
              previewClassName,
            )}
          >
            <Loader2 size={18} className="animate-spin text-app-accent" />
          </div>
        ) : (
          <Thumb
            src={value}
            icon={Upload}
            className={cn(frame, previewClassName)}
            imgClassName="object-contain"
          />
        ))}

      <div className="min-w-0 flex-1 space-y-2">
        <input
          type="file"
          accept={accept}
          ref={inputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onFile(file);
          }}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={BTN_SOFT}
            disabled={busy}
          >
            <Upload size={14} />
            {busy ? "Uploading…" : buttonLabel || (value ? "Replace" : "Upload")}
          </button>
          {value && onClear && (
            <button type="button" onClick={onClear} className={BTN_NEUTRAL}>
              <X size={14} /> Remove
            </button>
          )}
        </div>
        {onChangeUrl && (
          <input
            value={value || ""}
            onChange={(e) => onChangeUrl(e.target.value)}
            placeholder="…or paste an image URL"
            className={cn(CONTROL, "h-9 text-[12px]")}
          />
        )}
        {hint && <p className="text-[11.5px] text-app-fg-muted">{hint}</p>}
      </div>
    </div>
  );
};
