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
  const formatted = valueFormatter ? valueFormatter(raw) : `${valuePrefix}${raw.toLocaleString("en-IN")}${valueSuffix}`;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-md px-3 py-2 min-w-[140px]">
      {label && (
        <div className="text-[10.5px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500 mb-0.5">
          {label}
        </div>
      )}
      <div className="text-[14px] font-bold text-gray-900 dark:text-white">{formatted}</div>
      {delta && (
        <div
          className={`text-[10.5px] font-semibold mt-0.5 ${
            delta.positive ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {delta.positive ? "↑" : "↓"} {Math.abs(delta.value)}% vs last period
        </div>
      )}
    </div>
  );
}

export default ChartTooltip;
