import React, { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, LineChart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BRAND_VARS,
  ChartTooltip,
  CONTROL,
  EmptyState,
  Panel,
  PanelHead,
  SELECT_ITEM,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { inr, inrCompact } from "./format";

export interface ChartItem {
  month: string;
  value: number;
}

/** Server enum — vendor-analytics.dto.js accepts exactly these three. */
export const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export const EarningsChart: React.FC<{
  chartData: ChartItem[];
  period: string;
  onPeriodChange: (p: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}> = ({ chartData, period, onPeriodChange, isLoading, isError, errorMessage, onRetry }) => {
  // useId keeps the gradient def unique if this chart is ever mounted twice.
  const gradientId = `revenueEarnings${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const hasEarnings = chartData.some((d) => d.value > 0);

  return (
    <Panel>
      <PanelHead
        icon={LineChart}
        title="Earnings over time"
        blurb="Confirmed booking value for the selected period."
        aside={
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className={cn("h-9 w-[116px] text-[12.5px] font-semibold", CONTROL)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={BRAND_VARS} data-console-portal="">
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value} className={SELECT_ITEM}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <div className="p-5">
          <div className="h-[260px] rounded-xl bg-muted/60 animate-pulse" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertCircle}
          title="We couldn't load your earnings"
          description={errorMessage || "The request didn't go through. Try again in a moment."}
          actionLabel={onRetry ? "Try again" : undefined}
          onAction={onRetry}
        />
      ) : !hasEarnings ? (
        /* A flat zero line is indistinguishable from real data that happens to
           be zero, so say it in words instead of drawing an empty chart. */
        <EmptyState
          icon={LineChart}
          title="No earnings in this period"
          description="Once bookings are confirmed and paid, the trend shows up here."
        />
      ) : (
        <div className="h-[280px] p-5 pl-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#117479" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#117479" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-border"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-muted-foreground"
                interval="preserveStartEnd"
                dy={4}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-muted-foreground"
                tickFormatter={(v) => inrCompact(Number(v))}
                width={56}
              />
              <Tooltip
                cursor={{ stroke: "#117479", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={<ChartTooltip valueFormatter={(v) => inr(v)} />}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#117479"
                strokeWidth={2.25}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff", fill: "#117479" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
};
