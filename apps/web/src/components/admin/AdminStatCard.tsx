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
 * Canonical admin stat card — NextAdmin template style. White card, large solid
 * circular icon badge, big bold value, small label, optional growth delta.
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
      className={`relative overflow-hidden bg-app-surface rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-8px_rgba(16,24,40,0.1)] border border-app-border p-5 transition-all duration-200 group outline-none ${
        clickable
          ? "cursor-pointer hover:border-[var(--teal-border)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-14px_rgba(13,148,136,0.3)] focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface"
          : ""
      } ${className}`}
    >
      {/* Top accent stripe — thin hue gradient bleeding from the icon corner */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${iconColor}, transparent)` }}
      />

      <div
        className={`size-11 rounded-xl grid place-items-center shrink-0 transition-transform duration-200 ${
          clickable ? "group-hover:scale-105" : ""
        }`}
        style={{ backgroundColor: `${iconColor}1f`, color: iconColor }}
      >
        <Icon size={22} strokeWidth={2} />
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <dl className="min-w-0">
          <dt className="mb-1 text-2xl font-bold text-app-fg tracking-tight leading-tight tabular-nums truncate">
            {displayValue}
          </dt>
          <dd className="text-[11px] font-medium uppercase tracking-wide text-app-fg-muted truncate">
            {title}
          </dd>
        </dl>

        {hasDelta && (
          <dl
            className={`text-[13px] font-medium shrink-0 ${isDecreasing ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
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
