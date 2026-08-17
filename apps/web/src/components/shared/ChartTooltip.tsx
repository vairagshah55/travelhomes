import React from "react";

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  valueFormatter?: (value: number) => string;
  delta?: { value: number; positive: boolean };
}

/** Neutral palette — no brand color usage, identical in either route group. */
export function ChartTooltip({
  active,
  payload,
  label,
  valuePrefix = "",
  valueSuffix = "",
  valueFormatter,
  delta,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const raw = typeof item?.value === "number" ? item.value : Number(item?.value ?? 0);
  const formatted = valueFormatter
    ? valueFormatter(raw)
    : `${valuePrefix}${raw.toLocaleString("en-IN")}${valueSuffix}`;

  /* Recharts renders the tooltip inside the chart's own SVG wrapper, which IS
     inside the console root — so the surface tokens reach it and this can be
     spelled in `card`/`border` like every other floating layer. It used to be
     literal `white` / `gray-200`, a different white from the panel it floated
     over and a different border from the grid lines behind it. */
  return (
    <div className="bg-card rounded-lg border border-border shadow-[0_8px_24px_-6px_rgba(14,26,27,0.14)] px-3 py-2 min-w-[140px]">
      {label && (
        <div className="text-[10.5px] uppercase tracking-wide font-semibold text-muted-foreground mb-0.5">
          {label}
        </div>
      )}
      <div className="text-[14px] font-bold tabular-nums text-foreground">{formatted}</div>
      {delta && (
        <div
          className={`text-[10.5px] font-semibold mt-0.5 tabular-nums ${
            delta.positive
              ? "text-emerald-600 dark:text-emerald-500"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {delta.positive ? "↑" : "↓"} {Math.abs(delta.value)}% vs last period
        </div>
      )}
    </div>
  );
}

export default ChartTooltip;
