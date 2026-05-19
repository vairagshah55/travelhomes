interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  valuePrefix?: string;
  valueFormatter?: (v: number) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  valuePrefix = "",
  valueFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const value = payload[0]?.value ?? 0;
  const delta = payload[0]?.payload?.delta;

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm min-w-[120px]">
      {label && <p className="text-[10px] text-gray-400 mb-1">{label}</p>}
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-semibold text-gray-900">
          {valuePrefix}
          {valueFormatter ? valueFormatter(value) : value.toLocaleString("en-IN")}
        </span>
      </div>
      {delta !== undefined && (
        <p className={`text-[10px] mt-0.5 ${delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% vs last period
        </p>
      )}
    </div>
  );
}

export default ChartTooltip;
