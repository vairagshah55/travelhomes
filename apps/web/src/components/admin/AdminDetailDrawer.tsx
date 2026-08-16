import React from "react";
import { AlertCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { EYEBROW, FOCUS_RING, PORTAL_VARS, SKELETON } from "./adminUI";
import { cn } from "@/lib/utils";

/**
 * Right-side record inspector.
 *
 * Replaces the centred `fixed inset-0` modals the management pages used to
 * open. A modal over a table blacks out the list you were reading, which is the
 * context that makes a single record mean anything — "is this the only failed
 * payment or the fourth one today" is not answerable once the table is gone.
 * The drawer leaves the list visible and adds prev/next, so an operator can
 * walk a filtered set without a close-scan-reopen cycle per record.
 *
 * Radix portals the sheet to <body>, outside the `[data-brand="admin"]` root.
 * `body.admin-scope` (see AdminApp) restates the tokens there, and PORTAL_VARS
 * is carried as well so the surface is correct even if the drawer is rendered
 * before that class lands.
 */

interface AdminDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Small caps kicker above the title — the record TYPE, e.g. "Booking". */
  eyebrow?: string;
  /** The record's own identifier — booking ref, name, invoice number. */
  title: string;
  /** Usually a <StatusBadge/>. */
  status?: React.ReactNode;
  /** One line of context under the title. */
  subtitle?: string;
  /** Actions pinned to the base of the drawer. */
  footer?: React.ReactNode;
  /** Position within the list being walked, e.g. `{ index: 3, total: 24 }`. */
  position?: { index: number; total: number };
  onPrev?: () => void;
  onNext?: () => void;
  /**
   * Panel width. Most records are label/value pairs and read best in a narrow
   * column (`md`); `lg` and `xl` are for records that carry their own media or
   * multi-column blocks — a listing with a photo gallery in a 540px rail turns
   * every image into a postage stamp.
   */
  width?: "md" | "lg" | "xl";
  /** Small square media beside the title — an avatar or cover thumbnail. */
  media?: React.ReactNode;
  /**
   * The record is still being fetched. The header (which is drawn from the row
   * already in hand) stays put and only the body shimmers, so the panel does
   * not change size or identity when the data lands.
   */
  loading?: boolean;
  /** Fetch failed — replaces the body with the reason. */
  error?: string | null;
  children: React.ReactNode;
}

const WIDTH_CLASS: Record<NonNullable<AdminDetailDrawerProps["width"]>, string> = {
  md: "sm:max-w-[540px]",
  lg: "sm:max-w-[720px]",
  xl: "sm:max-w-[920px]",
};

export function AdminDetailDrawer({
  open,
  onClose,
  eyebrow,
  title,
  status,
  subtitle,
  footer,
  position,
  onPrev,
  onNext,
  width = "md",
  media,
  loading = false,
  error = null,
  children,
}: AdminDetailDrawerProps) {
  const stepper =
    "grid place-items-center w-7 h-7 rounded-md border border-app-border text-app-fg-muted " +
    "hover:bg-app-surface-2 hover:text-app-fg disabled:opacity-35 disabled:pointer-events-none " +
    `transition-colors ${FOCUS_RING}`;

  /* ── Focus restoration ──────────────────────────────────────────────────
     Radix's MODAL dialog preventDefaults its own close-autofocus and returns
     focus to `triggerRef` instead. These drawers have no trigger — they open
     from a row click, an Enter keypress or a `?id=` in the URL — so that ref is
     null and focus lands on <body>, which drops a keyboard operator back to the
     top of the document on every close.

     The element is captured during the render that opens the drawer rather than
     in an effect: child effects run before parent ones, so by the time an effect
     here fired, Radix's FocusScope would already have moved focus inside the
     panel and we would "restore" to the drawer's own button. */
  const restoreRef = React.useRef<HTMLElement | null>(null);
  const wasOpen = React.useRef(false);
  if (open && !wasOpen.current) {
    const active = typeof document !== "undefined" ? document.activeElement : null;
    restoreRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
  }
  wasOpen.current = open;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        style={PORTAL_VARS}
        onCloseAutoFocus={(event) => {
          const target = restoreRef.current;
          // Only take over when the origin is still on the page — a row that
          // was deleted or filtered away is not somewhere to send focus.
          if (target && target.isConnected) {
            event.preventDefault();
            target.focus();
          }
        }}
        // The stock Sheet ships its own close button in the corner; this one
        // has a header row that owns that slot, so it is suppressed via
        // [&>button]:hidden rather than duplicated.
        className={cn(
          "w-full p-0 gap-0 flex flex-col bg-app-surface border-l border-app-border [&>button]:hidden",
          WIDTH_CLASS[width],
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="shrink-0 px-5 py-4 border-b border-app-border">
          <div className="flex items-start gap-3">
            {media && <div className="shrink-0">{media}</div>}
            <div className="min-w-0 flex-1">
              {eyebrow && <p className={cn(EYEBROW, "mb-1.5")}>{eyebrow}</p>}
              <SheetTitle className="text-[19px] font-bold text-app-fg tracking-[-0.02em] leading-tight truncate">
                {title}
              </SheetTitle>
              {subtitle ? (
                <SheetDescription className="mt-1 text-[12.5px] text-app-fg-muted truncate">
                  {subtitle}
                </SheetDescription>
              ) : (
                <SheetDescription className="sr-only">Record details</SheetDescription>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Prev/next walk the list behind the drawer. Vertical chevrons,
                  because the thing being stepped through is a column of rows. */}
              {(onPrev || onNext) && (
                <div className="flex items-center gap-1 mr-1">
                  <button
                    onClick={onPrev}
                    disabled={!onPrev}
                    className={stepper}
                    aria-label="Previous record"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    onClick={onNext}
                    disabled={!onNext}
                    className={stepper}
                    aria-label="Next record"
                  >
                    <ChevronDown size={15} />
                  </button>
                  {position && (
                    <span className="ml-1 text-[11.5px] font-medium text-app-fg-subtle tabular-nums whitespace-nowrap">
                      {position.index} of {position.total}
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className={`grid place-items-center w-7 h-7 rounded-md text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg transition-colors ${FOCUS_RING}`}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {status && <div className="mt-3">{status}</div>}
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {error ? (
            <div className="flex flex-col items-center text-center gap-3 py-16">
              <div className="grid place-items-center w-11 h-11 rounded-full bg-red-50 dark:bg-red-500/10">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <p className="text-[13px] text-app-fg-muted max-w-xs">{error}</p>
            </div>
          ) : loading ? (
            <DrawerSkeleton />
          ) : (
            children
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        {footer && (
          <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-3.5 border-t border-app-border bg-app-surface-2/60">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Loading body: two sections' worth of label/value pairs at the real sizes, so
 * the panel does not resize when the record lands. A centred spinner would give
 * the same information and then jump.
 */
function DrawerSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      {[0, 1].map((section) => (
        <div key={section} className="space-y-3.5">
          <div className={`h-3 w-24 ${SKELETON}`} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
            {[0, 1, 2, 3].map((field) => (
              <div key={field} className="space-y-1.5">
                <div className={`h-2.5 w-16 ${SKELETON}`} />
                <div className={`h-3.5 ${SKELETON} ${field % 2 ? "w-20" : "w-28"}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Content primitives ──────────────────────────────────────────────────
   A drawer is a stack of labelled groups, and every management page was
   otherwise going to re-invent the same label/value pair with slightly
   different type sizes. */

/* Column counts are spelled out rather than interpolated — Tailwind extracts
   class names statically, so `grid-cols-${n}` would emit nothing. */
const SECTION_COLS: Record<2 | 3 | 4, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

/** A labelled group of fields. */
export function DetailSection({
  title,
  children,
  columns = 2,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  /** Fields per row from `sm` up. Wider drawers can afford 3–4 short values. */
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <section className={cn("py-4 first:pt-0 border-b border-app-border last:border-b-0", className)}>
      <h3 className="mb-3 text-[12.5px] font-bold text-app-fg tracking-[-0.005em]">{title}</h3>
      <dl className={cn("grid gap-x-4 gap-y-3.5", SECTION_COLS[columns])}>{children}</dl>
    </section>
  );
}

/**
 * One label/value pair. An empty value renders an em dash rather than
 * collapsing, so the grid keeps its shape across records with different
 * completeness — a field that disappears reads as a layout bug.
 */
export function DetailField({
  label,
  value,
  full = false,
}: {
  label: string;
  value: React.ReactNode;
  /** Span both columns — for addresses, notes, anything that wraps. */
  full?: boolean;
}) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={full ? "col-span-full" : "col-span-1"}>
      <dt className="text-[11.5px] font-medium text-app-fg-subtle mb-1">{label}</dt>
      <dd
        className={cn(
          "text-[13.5px] leading-snug",
          empty ? "text-app-fg-subtle" : "text-app-fg font-medium",
        )}
      >
        {empty ? "—" : value}
      </dd>
    </div>
  );
}

/** Free-text block — notes, special requests, descriptions. */
export function DetailNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full rounded-lg border border-app-border bg-app-surface-2/60 px-3.5 py-3 text-[13px] leading-relaxed text-app-fg whitespace-pre-wrap">
      {children}
    </div>
  );
}

/**
 * Bulleted values — rules, inclusions, what-to-expect. Markers are drawn as a
 * dot rather than a list-style bullet so they align with the 13px text metrics
 * instead of sitting slightly high.
 */
export function DetailList({ items, className = "" }: { items: string[]; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={cn("col-span-full space-y-1.5", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-app-fg">
          <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-app-fg-subtle" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Thumbnail grid — ID proofs, listing galleries. Each tile opens the full image
 * in a new tab; a lightbox inside a drawer would be a third stacked layer over
 * the list, which is the problem the drawer exists to avoid.
 */
export function DetailPhotos({ photos, label = "photo" }: { photos: string[]; label?: string }) {
  if (!photos.length) return null;
  return (
    <div className="col-span-full grid grid-cols-3 sm:grid-cols-4 gap-2.5">
      {photos.map((src, i) => (
        <a
          key={`${src}-${i}`}
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "group/photo relative aspect-[4/3] overflow-hidden rounded-lg border border-app-border bg-app-surface-2",
            FOCUS_RING,
          )}
          aria-label={`Open ${label} ${i + 1} in a new tab`}
        >
          <img
            src={src}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 group-hover/photo:scale-[1.04]"
          />
        </a>
      ))}
    </div>
  );
}

export default AdminDetailDrawer;
