import React from "react";
import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";

interface AdminStatCardProps {
  title: string;
  /** Plain integers animate via count-up; formatted strings (₹1.2L) render as-is. */
  value: string | number;
  icon: React.ElementType;
  /** Solid fill for the circular icon badge — hex or any CSS color. */
  iconColor: string;
  /** Signed percentage. Positive → green ▲, negative → red ▼. 0/undefined hides the delta. */
  growthRate?: number;
  /** When provided, the card becomes a button (keyboard + pointer). */
  onClick?: () => void;
  /** Stagger entrance delay in seconds (index * 0.05 from a grid map). */
  delay?: number;
  className?: string;
}

/**
 * Canonical admin stat card. Same geometry as the vendor console's StatTile
 * (`components/shared/StatTile.tsx`) — panel surface, tinted 9x9 icon tile,
 * 22px count-up value, 11.5px label — so a metric row reads identically in
 * both consoles. Adds the growth delta, which only admin reports.
 *
 * Consolidates the StatCard previously defined inline in AdminDashboard. Unlike
 * that version, `onClick` is optional: cards without a clear navigation target
 * render as static (no pointer cursor / hover lift), per the "clickable only
 * when navigation is clear" rule.
 */
export function AdminStatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  growthRate,
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: "easeOut" }}
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
      className={`group relative overflow-hidden bg-app-surface rounded-[18px] border border-app-border p-4 outline-none shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_-16px_rgba(0,0,0,0.55)] transition-[transform,box-shadow] duration-200 ${
        clickable
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(17, 116, 121,0.14),0_14px_32px_-16px_rgba(17, 116, 121,0.45)] focus-visible:ring-4 focus-visible:ring-app-accent/20"
          : ""
      } ${className}`}
    >
      <div
        className={`grid place-items-center w-9 h-9 rounded-[10px] shrink-0 transition-transform duration-200 ${
          clickable ? "group-hover:scale-105" : ""
        }`}
        style={{ backgroundColor: `${iconColor}1f`, color: iconColor }}
      >
        <Icon size={16} strokeWidth={2.1} />
      </div>

      <div className="mt-3.5 flex items-end justify-between gap-3">
        <dl className="min-w-0">
          <dt className="text-[22px] font-bold text-app-fg tracking-[-0.02em] leading-none tabular-nums truncate">
            {displayValue}
          </dt>
          <dd className="mt-1.5 text-[11.5px] font-semibold text-app-fg-muted truncate">{title}</dd>
        </dl>

        {hasDelta && (
          <dl
            className={`text-[12px] font-semibold shrink-0 tabular-nums ${isDecreasing ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
          >
            <dt className="flex items-center gap-1">
              {Math.abs(growthRate!)}%
              <span aria-hidden className="text-[10px]">
                {isDecreasing ? "▼" : "▲"}
              </span>
            </dt>
          </dl>
        )}
      </div>
    </motion.div>
  );
}

export default AdminStatCard;
