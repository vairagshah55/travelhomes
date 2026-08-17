import React from "react";
import { ChevronRight, CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PANEL, PANEL_HEAD } from "./Panel";

export type ActionTone = "urgent" | "attention" | "info";

export interface ActionItem {
  id: string;
  icon: LucideIcon;
  /** What needs doing, in the vendor's language: "3 bookings awaiting your confirmation". */
  label: string;
  /** Why it matters or when it expires — one short line, optional. */
  detail?: string;
  /** Count shown as a bubble. Items with a count of 0 should not be passed in. */
  count?: number;
  tone?: ActionTone;
  onClick: () => void;
}

/* Tone is carried by the glyph and the count bubble, never by a filled row.
   A row-wide red fill for "3 bookings pending" turns a routine queue into an
   alarm, and once three rows are filled the list reads as an outage. */
const TONE: Record<ActionTone, { glyph: string; bubble: string }> = {
  urgent: {
    glyph: "text-red-600 dark:text-red-400",
    bubble: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  },
  attention: {
    glyph: "text-amber-600 dark:text-amber-400",
    bubble: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  info: {
    glyph: "text-brand",
    bubble: "bg-brand/[0.09] text-brand",
  },
};

/**
 * "What needs my attention right now" — the half of a dashboard that a metric
 * grid cannot answer.
 *
 * A KPI tells the vendor how the business is doing; it does not tell them that
 * two bookings expire tonight if nobody confirms them. Those live here, sorted
 * by urgency, each one a single click from the screen that resolves it.
 *
 * When the list is empty this renders a settled state rather than disappearing.
 * A panel that vanishes when there is nothing to do makes the page jump on every
 * refresh, and "you're all caught up" is genuinely useful information.
 */
export const ActionCenter = ({
  items,
  title = "Needs your attention",
  emptyLabel = "You're all caught up",
  emptyHint = "No pending bookings, expiring offers or unread messages.",
  className,
  isLoading = false,
}: {
  items: ActionItem[];
  title?: string;
  emptyLabel?: string;
  emptyHint?: string;
  className?: string;
  isLoading?: boolean;
}) => {
  /* The badge counts ROWS, not the sum of each row's count. Summing made the
     header read "4" beside three visible items (two pending bookings + one
     listing + one uncounted payout row), which invites the reader to look for
     a fourth thing that isn't there — and it disagreed with the page subtitle,
     which says how many items are in this list. */
  const total = items.length;

  return (
    <section className={cn(PANEL, "overflow-hidden flex flex-col", className)}>
      <header className={PANEL_HEAD}>
        <h3 className="text-[14px] font-bold tracking-[-0.01em] text-foreground">{title}</h3>
        {!isLoading && items.length > 0 && (
          <span className="shrink-0 grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand/[0.09] text-brand text-[11px] font-bold tabular-nums">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </header>

      {isLoading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-4 h-4 rounded bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-1/3 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-9">
          <CheckCircle2
            size={22}
            strokeWidth={1.8}
            aria-hidden
            className="text-emerald-600 dark:text-emerald-500"
          />
          <p className="mt-2.5 text-[13.5px] font-semibold text-foreground">{emptyLabel}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground max-w-[34ch]">
            {emptyHint}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const tone = TONE[item.tone ?? "info"];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={item.onClick}
                  className="group w-full flex items-center gap-3 px-4 py-3 text-left
                    transition-colors duration-150 hover:bg-muted/60 dark:hover:bg-white/[0.03]
                    outline-none focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
                >
                  <item.icon
                    size={16}
                    strokeWidth={2}
                    aria-hidden
                    className={cn("shrink-0", tone.glyph)}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-foreground truncate">
                      {item.label}
                    </span>
                    {item.detail && (
                      <span className="block mt-0.5 text-[12px] text-muted-foreground truncate">
                        {item.detail}
                      </span>
                    )}
                  </span>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={cn(
                        "shrink-0 grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold tabular-nums",
                        tone.bubble,
                      )}
                    >
                      {item.count > 99 ? "99+" : item.count}
                    </span>
                  )}
                  {/* Reserved width, always rendered: revealing the chevron on
                      hover shifts every label 16px sideways as the pointer
                      travels down the list. */}
                  <ChevronRight
                    size={15}
                    strokeWidth={2.2}
                    aria-hidden
                    className="shrink-0 text-muted-foreground/40 transition-[color,transform] duration-150
                      group-hover:text-muted-foreground group-hover:translate-x-0.5"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default ActionCenter;
