import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import { PANEL } from "./Panel";

/**
 * Metric card for the vendor console — one definition shared by the dashboard,
 * the bookings calendar and the bookings list, so the three can't drift.
 *
 * A numeric `value` counts up; a string renders as-is (already formatted, e.g.
 * a currency string). Hue lives on the icon tile rather than a coloured top
 * border, which is what kept the old cards from reading as kit panels.
 */
export const StatTile = ({
  icon: Icon,
  label,
  value,
  prefix = "",
  hint,
  color = "#117479",
  index = 0,
  format,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  prefix?: string;
  hint?: string;
  color?: string;
  index?: number;
  /**
   * Applied to the animating number. Needed for currency, where the default
   * `toLocaleString()` groups as 1,234,567 instead of the Indian 12,34,567.
   */
  format?: (v: number) => string;
}) => {
  const numeric = typeof value === "number";
  const animated = useCountUp(numeric ? value : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        PANEL,
        "group p-4 transition-[transform,box-shadow] duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_1px_2px_hsl(var(--brand)/0.16),0_14px_32px_-16px_hsl(var(--brand)/0.4)]",
      )}
    >
      <span
        className="grid place-items-center w-9 h-9 rounded-[10px] transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        <Icon size={16} strokeWidth={2.1} />
      </span>
      <p className="mt-3.5 text-[22px] font-bold tracking-[-0.02em] leading-none tabular-nums text-foreground truncate">
        {prefix}
        {numeric ? (format ? format(animated) : animated.toLocaleString()) : value}
      </p>
      <p className="mt-1.5 text-[11.5px] font-semibold text-muted-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground/70">{hint}</p>}
    </motion.div>
  );
};

/** Loading counterpart — same box, same rhythm, no numbers. */
export const StatTileSkeleton = () => (
  <div className={cn(PANEL, "p-4")}>
    <div className="w-9 h-9 rounded-[10px] bg-muted animate-pulse" />
    <div className="mt-3.5 h-6 w-20 rounded-lg bg-muted animate-pulse" />
    <div className="mt-2 h-3 w-24 rounded bg-muted animate-pulse" />
  </div>
);

export default StatTile;
