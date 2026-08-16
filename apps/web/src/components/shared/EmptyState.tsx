import React from "react";
import type { LucideIcon } from "lucide-react";

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
 * Primary CTA uses `bg-brand` — auto-themes per route group.
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
            <button
              onClick={onAction}
              className="bg-brand hover:bg-brand-hover text-brand-fg rounded-xl px-4 h-10 text-[13px] font-semibold
                shadow-[0_1px_2px_hsl(var(--brand)/0.24),0_6px_16px_-6px_hsl(var(--brand)/0.45)]
                hover:shadow-[0_2px_4px_hsl(var(--brand)/0.28),0_10px_22px_-6px_hsl(var(--brand)/0.5)]
                active:translate-y-px transition-[background-color,box-shadow,transform] duration-150
                outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button
              onClick={onSecondary}
              className="bg-card border border-border text-foreground/80 hover:bg-muted rounded-xl px-4 h-10
                text-[13px] font-semibold active:translate-y-px
                transition-[background-color,transform] duration-150
                outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
