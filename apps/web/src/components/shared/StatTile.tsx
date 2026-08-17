import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import { FOCUS_RING, PANEL, PANEL_INTERACTIVE } from "./Panel";
import { Sparkline } from "./Sparkline";

/**
 * Metric card for the vendor console — one definition shared by the dashboard,
 * bookings, offerings, offers, revenue, analytics and marketing, so the seven
 * can't drift.
 *
 * Reads LABEL first, then the number. Scanning a KPI row you are looking for
 * "which one is Revenue", not for a colour — the previous version led with a
 * tinted icon tile, put a 22px number under it and left the rest of the card
 * empty, so four in a row looked like a placeholder grid and the four tile hues
 * competed with the page's one real accent.
 *
 * A number with no direction is decoration, so the card takes `delta` (signed
 * percentage), `deltaLabel` (what it is measured against) and an optional
 * `trend` series for a sparkline. Where the data genuinely has no comparison,
 * `hint` carries context instead. Passing `onClick` makes the whole card a
 * button — a KPI you can't get behind is a dead end.
 */
export const StatTile = ({
  icon: Icon,
  label,
  value,
  prefix = "",
  hint,
  delta,
  deltaLabel,
  trend,
  onClick,
  index = 0,
  format,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  prefix?: string;
  hint?: string;
  /** Signed percentage change. Positive → green ▲, negative → red ▼. 0 hides it. */
  delta?: number;
  /** What `delta` is measured against, e.g. "vs last 30 days". */
  deltaLabel?: string;
  /** Series for the inline sparkline. Fewer than 2 points renders nothing. */
  trend?: number[];
  /** Makes the card a button — use it to link to the rows behind the number. */
  onClick?: () => void;
  index?: number;
  /**
   * Applied to the animating number. Needed for currency, where the default
   * `toLocaleString()` groups as 1,234,567 instead of the Indian 12,34,567.
   */
  format?: (v: number) => string;
  className?: string;
}) => {
  const numeric = typeof value === "number";
  const animated = useCountUp(numeric ? value : 0);
  const display = numeric ? (format ? format(animated) : animated.toLocaleString("en-IN")) : value;

  const hasDelta = delta !== undefined && delta !== 0;
  const down = (delta ?? 0) < 0;
  const TrendIcon = down ? TrendingDown : TrendingUp;
  const clickable = typeof onClick === "function";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22, ease: "easeOut" }}
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
      aria-label={clickable ? `${label}: ${prefix}${display}` : undefined}
      className={cn(
        PANEL,
        "group relative px-4 py-3.5 overflow-hidden",
        clickable && `cursor-pointer ${PANEL_INTERACTIVE} ${FOCUS_RING}`,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-muted-foreground truncate">
          {label}
        </p>
        {clickable ? (
          <ArrowRight
            size={14}
            strokeWidth={2.2}
            aria-hidden
            className="shrink-0 mt-px text-muted-foreground/40 transition-[color,transform] duration-150
              group-hover:text-brand group-hover:translate-x-0.5"
          />
        ) : (
          <Icon
            size={15}
            strokeWidth={2}
            aria-hidden
            className="shrink-0 mt-px text-muted-foreground/50 transition-opacity group-hover:opacity-90"
          />
        )}
      </div>

      {/* Wraps, and the number steps down a size below `sm`. Two of these sit
          side by side on a 390px phone, which leaves ~120px of usable width —
          a 26px "₹55,250" plus a delta chip does not fit, and `truncate` cut it
          mid-number to "₹55,…", which is worse than showing no number at all. */}
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
        <span className="text-[22px] sm:text-[26px] font-bold tracking-[-0.03em] leading-none tabular-nums text-foreground">
          {prefix}
          {display}
        </span>
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[12px] font-semibold tabular-nums shrink-0",
              down ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-500",
            )}
          >
            <TrendIcon size={13} strokeWidth={2.6} aria-hidden />
            {Math.abs(delta!)}%
          </span>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-[11.5px] text-muted-foreground truncate">{deltaLabel ?? hint ?? " "}</p>
        {/* The sparkline is the first thing to go when space is short: it is a
            direction cue, and the delta beside the number already gives that
            more precisely. Keeping it on a phone cost the label its width. */}
        {trend && trend.length > 1 && (
          <Sparkline
            data={trend}
            negative={down}
            width={72}
            height={24}
            className="hidden sm:block shrink-0 -mb-0.5 opacity-80"
          />
        )}
      </div>
    </motion.div>
  );
};

/** Loading counterpart — same box and rhythm, so the grid doesn't reflow. */
export const StatTileSkeleton = () => (
  <div className={cn(PANEL, "px-4 py-3.5")}>
    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
    <div className="mt-3 h-6 w-24 rounded bg-muted animate-pulse" />
    <div className="mt-3 h-2.5 w-16 rounded bg-muted animate-pulse" />
  </div>
);

export default StatTile;
