import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { CARD, CARD_INTERACTIVE_HOVER, FOCUS_RING } from "./adminUI";

interface AdminStatCardProps {
  title: string;
  /** Plain integers animate via count-up; formatted strings (₹1.2L) render as-is. */
  value: string | number;
  icon: React.ElementType;
  /** Accent for the icon glyph. Kept muted — see the note on the icon below. */
  iconColor: string;
  /** Signed percentage. Positive → green ▲, negative → red ▼. 0/undefined hides the delta. */
  growthRate?: number;
  /** What the delta is measured against, e.g. "vs last month". */
  deltaLabel?: string;
  /** Extra context under the number when there is no delta, e.g. "across 12 vendors". */
  hint?: string;
  /** When provided, the card becomes a button (keyboard + pointer). */
  onClick?: () => void;
  /** Stagger entrance delay in seconds (index * 0.05 from a grid map). */
  delay?: number;
  className?: string;
}

/**
 * Compact KPI card.
 *
 * Reads label-first, then the number: scanning a metric row you are looking for
 * "which one is Active", not for a colour. The previous version led with a
 * tinted icon square and put a 24px number under it, which left the card mostly
 * empty and made four cards in a row look like a placeholder grid.
 *
 * The icon is a small monochrome-ish glyph pinned top-right rather than a
 * filled tile — the tile was doing decoration, not communication, and four
 * different tile hues in one row is the look the redesign is getting away from.
 */
export function AdminStatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  growthRate,
  deltaLabel,
  hint,
  onClick,
  delay = 0,
  className = "",
}: AdminStatCardProps) {
  const raw = String(value);
  const isPlainInteger = /^-?\d+$/.test(raw);
  const numericTarget = isPlainInteger ? parseInt(raw, 10) : 0;
  const animated = useCountUp(numericTarget);
  const displayValue = isPlainInteger ? animated.toLocaleString("en-IN") : raw;

  const isDecreasing = growthRate !== undefined && growthRate < 0;
  const hasDelta = growthRate !== undefined && growthRate !== 0;
  const clickable = typeof onClick === "function";
  const TrendIcon = isDecreasing ? TrendingDown : TrendingUp;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22, ease: "easeOut" }}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick!();
              }
            }
          : undefined
      }
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `${title}: ${displayValue}` : undefined}
      className={`group relative px-4 py-3.5 ${CARD} transition-colors duration-150 ${
        clickable ? `cursor-pointer ${CARD_INTERACTIVE_HOVER} ${FOCUS_RING}` : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-app-fg-subtle truncate">
          {title}
        </p>
        {/* On a clickable card the metric glyph crossfades to an arrow: the
            hover border/tint alone never read as "this goes somewhere", and an
            arrow parked permanently next to every icon is eight arrows of
            decoration on a grid that already has eight icons. */}
        <span className="relative shrink-0 mt-px size-[15px]">
          <Icon
            size={15}
            strokeWidth={2}
            aria-hidden
            className={`absolute inset-0 opacity-55 transition-opacity duration-150 ${
              clickable
                ? "group-hover:opacity-0 group-focus-visible:opacity-0"
                : "group-hover:opacity-90"
            }`}
            style={{ color: iconColor }}
          />
          {clickable && (
            <ArrowUpRight
              size={15}
              strokeWidth={2.4}
              aria-hidden
              className="absolute inset-0 opacity-0 transition-opacity duration-150 text-app-accent group-hover:opacity-100 group-focus-visible:opacity-100"
            />
          )}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-2 min-w-0">
        <span className="text-[27px] font-bold text-app-fg tracking-[-0.03em] leading-none tabular-nums">
          {displayValue}
        </span>

        {hasDelta && (
          <span
            className={`inline-flex items-center gap-0.5 text-[12px] font-semibold tabular-nums shrink-0 ${
              isDecreasing
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-500"
            }`}
          >
            <TrendIcon size={13} strokeWidth={2.6} aria-hidden />
            {Math.abs(growthRate!)}%
          </span>
        )}
      </div>

      {(deltaLabel || hint) && (
        <p className="mt-1.5 text-[11.5px] text-app-fg-subtle truncate">{deltaLabel ?? hint}</p>
      )}
    </motion.div>
  );
}

/** Loading counterpart — same box and rhythm, so the grid doesn't reflow. */
export function AdminStatCardSkeleton() {
  return (
    <div className={`px-4 py-3.5 ${CARD}`}>
      <div className="h-3 w-20 rounded admin-shimmer bg-app-surface-2" />
      <div className="mt-2.5 h-7 w-16 rounded admin-shimmer bg-app-surface-2" />
      <div className="mt-2 h-2.5 w-24 rounded admin-shimmer bg-app-surface-2" />
    </div>
  );
}

export default AdminStatCard;
