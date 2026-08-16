import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BadgeCheck,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  Clock,
  Eye,
  IndianRupee,
  LineChart,
  MousePointer,
  Package,
  Target,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { vendorAnalyticsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  BRAND_VARS,
  CONTROL,
  ChartTooltip,
  PANEL,
  Panel,
  PanelHead,
  SELECT_ITEM,
  StatTile,
  StatTileSkeleton,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { currencyINR } from "@/utils/currency";


const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const periodLabel = (v: string) => PERIODS.find((p) => p.value === v)?.label ?? v;

/* ── Chart panel ──────────────────────────────────────────────────────────── */

const ChartPanel = ({
  icon,
  title,
  filter,
  onFilterChange,
  data,
  dataKey,
  color,
  loading,
  currency,
}: {
  icon: typeof LineChart;
  title: string;
  filter: string;
  onFilterChange: (v: string) => void;
  data: any[];
  dataKey: string;
  color: string;
  loading: boolean;
  currency?: boolean;
}) => {
  const gradientId = `grad-${dataKey}-${title.replace(/\s/g, "")}`;
  const total = useMemo(
    () => data.reduce((sum, row) => sum + Number(row?.[dataKey] || 0), 0),
    [data, dataKey],
  );

  return (
    <Panel>
      <PanelHead
        icon={icon}
        title={title}
        // The period is part of what the chart IS — the old titles said
        // "Monthly Earnings" no matter which period was selected.
        blurb={
          loading
            ? "Loading…"
            : `${periodLabel(filter)} · ${currency ? currencyINR(total) : total.toLocaleString("en-IN")} total`
        }
        aside={
          <Select value={filter} onValueChange={onFilterChange}>
            <SelectTrigger className={cn("h-9 w-[112px]", CONTROL)} aria-label={`${title} period`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={BRAND_VARS}>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value} className={SELECT_ITEM}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="p-4 pt-5">
        {loading ? (
          <div className="h-[200px] rounded-xl bg-muted animate-pulse" />
        ) : data.length === 0 ? (
          <div className="h-[200px] grid place-items-center text-center">
            <div>
              <span className="mx-auto grid place-items-center w-11 h-11 rounded-full bg-muted text-muted-foreground">
                <LineChart size={20} strokeWidth={1.9} />
              </span>
              <p className="mt-2.5 text-[13px] font-semibold text-foreground">Nothing to plot</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                No {periodLabel(filter).toLowerCase()} data for this period yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {/* Horizontal rules only — vertical ones fight the area fill. */}
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="text-border"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-muted-foreground"
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-muted-foreground"
                  width={38}
                />
                <Tooltip content={<ChartTooltip valuePrefix={currency ? "₹" : ""} />} />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Panel>
  );
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

const Analytics = () => {
  const [monthlyFilter, setMonthlyFilter] = useState("monthly");
  const [yearlyFilter, setYearlyFilter] = useState("yearly");
  const [dailyFilter, setDailyFilter] = useState("daily");

  const { token: authToken } = useAuth();
  const token = authToken ?? undefined;

  // Counts + metrics + payments + properties — single endpoint, single cache.
  const countsQuery = useQuery({
    queryKey: ["analytics", "counts"],
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getCounts(token);
      return res?.success && res.data ? res.data : null;
    },
  });

  // Three separate graph queries keyed by their filter so flipping
  // monthly/yearly/daily refetches only that bucket.
  const monthlyQuery = useQuery<any[]>({
    queryKey: ["analytics", "graphs", "monthly", monthlyFilter],
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getGraphs(token, monthlyFilter);
      return res.success && res.data ? res.data : [];
    },
  });
  const yearlyQuery = useQuery<any[]>({
    queryKey: ["analytics", "graphs", "yearly", yearlyFilter],
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getGraphs(token, yearlyFilter);
      return res.success && res.data ? res.data : [];
    },
  });
  const dailyQuery = useQuery<any[]>({
    queryKey: ["analytics", "graphs", "daily", dailyFilter],
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getGraphs(token, dailyFilter);
      return res.success && res.data ? res.data : [];
    },
  });

  const data = countsQuery.data;
  const loading = countsQuery.isLoading;

  const impressions = data?.metrics?.impressions ?? 0;
  const clicks = data?.metrics?.clicks ?? 0;
  const visitors = data?.metrics?.visitors ?? 0;
  const payments = data?.payments ?? { received: 0, pending: 0 };
  const properties = data?.properties ?? { approved: 0, pending: 0 };

  /** Clicks per impression — the number that says whether reach is working. */
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  const bookingSegments = [
    { label: "Total", value: data?.total ?? 0, dot: "bg-brand", icon: CalendarCheck },
    { label: "Upcoming", value: data?.upcoming ?? 0, dot: "bg-blue-400", icon: CalendarClock },
    { label: "Past", value: data?.past ?? 0, dot: "bg-emerald-400", icon: CalendarCheck },
    { label: "Cancelled", value: data?.cancelled ?? 0, dot: "bg-red-400", icon: CalendarX },
  ];

  return (
    <DashboardLayout
      title="Analytics"
      contentClassName="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6 bg-muted/40 dark:bg-transparent"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto pb-24 lg:pb-12 space-y-5">
        {/* ── Reach ── */}
        <section className="space-y-2.5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
            Reach
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {loading ? (
              <>
                <StatTileSkeleton />
                <StatTileSkeleton />
                <StatTileSkeleton />
                <StatTileSkeleton />
              </>
            ) : (
              <>
                <StatTile
                  icon={Eye}
                  label="Impressions"
                  hint="Times your listings were shown"
                  value={impressions}
                  color="#06b6d4"
                  index={0}
                />
                <StatTile
                  icon={MousePointer}
                  label="Clicks"
                  hint="Opened from search"
                  value={clicks}
                  color="#f59e0b"
                  index={1}
                />
                <StatTile
                  icon={Target}
                  label="Click-through rate"
                  hint="Clicks ÷ impressions"
                  value={`${ctr.toFixed(1)}%`}
                  color="#a855f7"
                  index={2}
                />
                <StatTile
                  icon={Users}
                  label="Visitors"
                  hint="People who viewed your offers"
                  value={visitors}
                  color="#ec4899"
                  index={3}
                />
              </>
            )}
          </div>
        </section>

        {/* ── Bookings ── */}
        <section className="space-y-2.5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
            Bookings
          </h2>
          {loading ? (
            <div className={cn(PANEL, "h-[92px] animate-pulse")} />
          ) : (
            <Panel>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border/70">
                {bookingSegments.map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col items-center justify-center gap-1.5 py-4 transition-colors duration-150 hover:bg-muted/50 dark:hover:bg-white/[0.02]"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", s.dot)} />
                      <span className="text-[11.5px] font-semibold text-muted-foreground">
                        {s.label}
                      </span>
                    </span>
                    <p className="text-[20px] font-bold tracking-[-0.02em] tabular-nums text-foreground">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </section>

        {/* ── Money and catalog ── */}
        <section className="space-y-2.5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
            Payments and listings
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {loading ? (
              <>
                <StatTileSkeleton />
                <StatTileSkeleton />
                <StatTileSkeleton />
                <StatTileSkeleton />
              </>
            ) : (
              <>
                {/* These are SUMS of payment amounts, not counts — the old
                    labels ("No. of Payment Received") read a rupee total as a
                    quantity. */}
                <StatTile
                  icon={IndianRupee}
                  label="Payments received"
                  hint="Completed and paid"
                  value={payments.received}
                  format={currencyINR}
                  color="#10b981"
                  index={0}
                />
                <StatTile
                  icon={Clock}
                  label="Payments pending"
                  hint="Awaiting settlement"
                  value={payments.pending}
                  format={currencyINR}
                  color="#f43f5e"
                  index={1}
                />
                <StatTile
                  icon={BadgeCheck}
                  label="Approved listings"
                  hint="Live on the site"
                  value={properties.approved}
                  color="#22c55e"
                  index={2}
                />
                <StatTile
                  icon={Package}
                  label="Pending approval"
                  hint="With our review team"
                  value={properties.pending}
                  color="#f59e0b"
                  index={3}
                />
              </>
            )}
          </div>
        </section>

        {/* ── Trends ── */}
        <section className="space-y-2.5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
            Trends
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartPanel
              icon={IndianRupee}
              title="Earnings"
              filter={monthlyFilter}
              onFilterChange={setMonthlyFilter}
              data={monthlyQuery.data ?? []}
              dataKey="earnings"
              color="#117479"
              loading={monthlyQuery.isLoading}
              currency
            />
            <ChartPanel
              icon={LineChart}
              title="Earnings trend"
              filter={yearlyFilter}
              onFilterChange={setYearlyFilter}
              data={yearlyQuery.data ?? []}
              dataKey="earnings"
              color="#8b5cf6"
              loading={yearlyQuery.isLoading}
              currency
            />
          </div>

          <ChartPanel
            icon={Users}
            title="Visitors"
            filter={dailyFilter}
            onFilterChange={setDailyFilter}
            data={dailyQuery.data ?? []}
            dataKey="visitors"
            color="#0ea5e9"
            loading={dailyQuery.isLoading}
          />
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
