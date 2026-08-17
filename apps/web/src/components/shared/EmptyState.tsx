import React from "react";
import type { LucideIcon } from "lucide-react";
import { BTN_NEUTRAL, BTN_PRIMARY, BTN_RAW, FOCUS_RING } from "./Panel";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}

/**
 * The screen a surface shows when it has no rows.
 *
 * Three of these are distinct states and must not be collapsed into one:
 * nothing exists yet ("Create your first offering"), a filter matched nothing
 * ("Try adjusting your filters"), and the fetch failed. Each carries the action
 * that resolves it — an empty state without a next step is a dead end dressed
 * up as a feature.
 *
 * Buttons come from the shared kit rather than being spelled inline, so the CTA
 * in an empty table is the same object as the CTA in the page header above it.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}
    >
      {/* Concentric rings rather than a flat disc — the icon reads as placed on
          the surface instead of stamped into it, which is what stops an empty
          table from looking like a failed render. */}
      <div className="relative mb-4">
        <span
          aria-hidden
          className="absolute inset-0 -m-3 rounded-full bg-muted/40 dark:bg-white/[0.03]"
        />
        <span className="relative grid place-items-center w-14 h-14 rounded-full bg-muted dark:bg-white/[0.06] ring-1 ring-border/60">
          <Icon size={23} strokeWidth={1.6} className="text-muted-foreground/70" />
        </span>
      </div>

      <h3 className="text-[15px] font-bold tracking-[-0.01em] text-foreground mb-1.5">{title}</h3>
      {description && (
        <p className="text-[13px] text-muted-foreground max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {actionLabel && onAction && (
            <button onClick={onAction} className={`${BTN_RAW} ${BTN_PRIMARY} ${FOCUS_RING}`}>
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button onClick={onSecondary} className={`${BTN_RAW} ${BTN_NEUTRAL} ${FOCUS_RING}`}>
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
