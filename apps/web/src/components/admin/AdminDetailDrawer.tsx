import React from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { EYEBROW, FOCUS_RING, PORTAL_VARS } from "./adminUI";
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
  children: React.ReactNode;
}

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
  children,
}: AdminDetailDrawerProps) {
  const stepper =
    "grid place-items-center w-7 h-7 rounded-md border border-app-border text-app-fg-muted " +
    "hover:bg-app-surface-2 hover:text-app-fg disabled:opacity-35 disabled:pointer-events-none " +
    `transition-colors ${FOCUS_RING}`;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        style={PORTAL_VARS}
        // The stock Sheet ships its own close button in the corner; this one
        // has a header row that owns that slot, so it is suppressed via
        // [&>button]:hidden rather than duplicated.
        className="w-full sm:max-w-[540px] p-0 gap-0 flex flex-col bg-app-surface border-l border-app-border [&>button]:hidden"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="shrink-0 px-5 py-4 border-b border-app-border">
          <div className="flex items-start gap-3">
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
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">{children}</div>

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

/* ── Content primitives ──────────────────────────────────────────────────
   A drawer is a stack of labelled groups, and every management page was
   otherwise going to re-invent the same label/value pair with slightly
   different type sizes. */

/** A labelled group of fields. */
export function DetailSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-4 first:pt-0 border-b border-app-border last:border-b-0", className)}>
      <h3 className="mb-3 text-[12.5px] font-bold text-app-fg tracking-[-0.005em]">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5">{children}</dl>
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
    <div className={full ? "col-span-2" : "col-span-2 sm:col-span-1"}>
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
    <div className="col-span-2 rounded-lg border border-app-border bg-app-surface-2/60 px-3.5 py-3 text-[13px] leading-relaxed text-app-fg">
      {children}
    </div>
  );
}

export default AdminDetailDrawer;
