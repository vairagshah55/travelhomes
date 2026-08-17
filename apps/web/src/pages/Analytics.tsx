import { useMemo, useState } from "react";
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
  Clock,
  Eye,
  IndianRupee,
  LineChart,
  Package,
  Target,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { vendorAnalyticsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  BRAND_VARS,
  CONTROL,
  ChartTooltip,
  PANEL_HEAD,
  Panel,
  SELECT_ITEM,
  SectionHeader,
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
import { inrCompact } from "@/components/revenue/format";

const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const periodLabel = (v: string) => PERIODS.find((p) => p.value === v)?.label ?? v;

/* ── Funnel ───────────────────────────────────────────────────────────────────
   The single most useful thing this endpoint's data can say, and the page
   never said it. Impressions, clicks, visitors and bookings were four cards in
   a row of eight, so the numbers were all present and the RELATIONSHIP between
   them — the only reason to look at them together — was invisible.

   Four stages, each bar proportional to the widest, each gap labelled with the
   conversion between them. It answers "where am I losing people": a healthy
   impression count with a 0.3% click rate is a listing-photo problem, and the
   same impressions with a 9% click rate and no bookings is a pricing problem.
   Those are different weeks of work and the old layout couldn't tell them
   apart. */

const FunnelStage = ({
  label,
  value,
  hint,
  widthPct,
  conversion,
  conversionLabel,
}: {
  label: string;
  value: number;
  hint: string;
  widthPct: number;
  conversion?: number;
  conversionLabel?: string;
}) => (
  <div className="py-3 first:pt-0 last:pb-0">
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-[12.5px] font-semibold text-foreground">{label}</p>
      <p className="text-[15px] font-bold tabular-nums text-foreground">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
    <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-500"
        /* A computed proportion is exactly what Rule 1 in CONVENTIONS.md allows
           an inline style for — there is no class for "37.4% wide". */
        style={{ width: `${Math.max(widthPct, 1.5)}%` }}
      />
    </div>
    <div className="mt-1.5 flex items-baseline justify-between gap-3">
      <p className="text-[11.5px] text-muted-foreground">{hint}</p>
      {conversion !== undefined && (
        <p className="text-[11.5px] font-semibold tabular-nums text-muted-foreground">
          {conversion.toFixed(1)}% {conversionLabel}
        </p>
      )}
    </div>
  </div>
);

/* ── Chart panel ──────────────────────────────────────────────────────────── */

const ChartPanel = ({
  title,
  blurb,
  filter,
  onFilterChange,
  data,
  dataKey,
  loading,
  currency,
  className,
}: {
  title: string;
  blurb: string;
  filter: string;
  onFilterChange: (v: string) => void;
  data: any[];
  dataKey: string;
  loading: boolean;
  currency?: boolean;
  className?: string;
}) => {
  const gradientId = `grad-${dataKey}`;
  const total = useMemo(
    () => data.reduce((sum, row) => sum + Number(row?.[dataKey] || 0), 0),
    [data, dataKey],
  );

  return (
    <Panel className={className}>
      <header className={PANEL_HEAD}>
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold tracking-[-0.01em] text-foreground">{title}</h3>
          {/* The period is part of what the chart IS — the old titles said
              "Monthly Earnings" no matter which period was selected. */}
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {loading
              ? "Loading…"
              : `${periodLabel(filter)} · ${currency ? currencyINR(total) : total.toLocaleString("en-IN")} total · ${blurb}`}
          </p>
        </div>
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className={cn(CONTROL, "h-9 w-[112px]")} aria-label={`${title} period`}>
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
      </header>

      <div className="p-4 pt-5">
        {loading ? (
          <div className="h-[220px] rounded-lg bg-muted animate-pulse" />
        ) : data.length === 0 ? (
          <div className="h-[220px] grid place-items-center text-center">
            <div>
              <LineChart
                size={20}
                strokeWidth={1.8}
                aria-hidden
                className="mx-auto text-muted-foreground"
              />
              <p className="mt-2.5 text-[13px] font-semibold text-foreground">Nothing to plot</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                No {periodLabel(filter).toLowerCase()} data for this period yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--brand))" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="hsl(var(--brand))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {/* Horizontal rules only — vertical ones fight the area fill. */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval="preserveStartEnd"
                  minTickGap={16}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  width={currency ? 56 : 40}
                  tickFormatter={(v: number) => (currency ? inrCompact(v) : String(v))}
                />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--brand))", strokeWidth: 1, strokeOpacity: 0.35 }}
                  content={
                    <ChartTooltip
                      valueFormatter={(v: number) =>
                        currency ? currencyINR(v) : v.toLocaleString("en-IN")
                      }
                    />
                  }
                />
                {/* Series colour is the brand token, not a per-chart hex. Two
                    charts of the same measure used to be drawn in teal and
                    violet, which implied they were different series. */}
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke="hsl(var(--brand))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
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
  /* Two chart periods, not three. The page used to render "Earnings" and
     "Earnings trend" side by side — the SAME series from the SAME endpoint,
     differing only in the period each had selected and the colour each was
     drawn in. Two charts of one measure is not more insight, it is a reader
     comparing a chart against itself. One earnings chart with a period
     selector, one visitors chart. */
  const [earningsPeriod, setEarningsPeriod] = useState("monthly");
  const [visitorsPeriod, setVisitorsPeriod] = useState("daily");

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

  const earningsQuery = useQuery<any[]>({
    queryKey: ["analytics", "graphs", "earnings", earningsPeriod],
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getGraphs(token, earningsPeriod);
      return res.success && res.data ? res.data : [];
    },
  });
  const visitorsQuery = useQuery<any[]>({
    queryKey: ["analytics", "graphs", "visitors", visitorsPeriod],
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getGraphs(token, visitorsPeriod);
      return res.success && res.data ? res.data : [];
    },
  });

  const data = countsQuery.data;
  const loading = countsQuery.isLoading;

  const impressions = data?.metrics?.impressions ?? 0;
  const clicks = data?.metrics?.clicks ?? 0;
  const visitors = data?.metrics?.visitors ?? 0;
  const bookings = data?.total ?? 0;
  const payments = data?.payments ?? { received: 0, pending: 0 };
  const properties = data?.properties ?? { approved: 0, pending: 0 };

  /** Clicks per impression — the number that says whether reach is working. */
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  /** Bookings per visitor — the number that says whether the listing sells. */
  const conversion = visitors > 0 ? (bookings / visitors) * 100 : 0;

  const funnel = useMemo(() => {
    const stages = [
      {
        label: "Impressions",
        value: impressions,
        hint: "Times a listing appeared in search",
      },
      {
        label: "Clicks",
        value: clicks,
        hint: "Opened from a search result",
        conversion: impressions > 0 ? (clicks / impressions) * 100 : undefined,
        conversionLabel: "of impressions",
      },
      {
        label: "Visitors",
        value: visitors,
        hint: "People who reached a listing page",
        conversion: clicks > 0 ? (visitors / clicks) * 100 : undefined,
        conversionLabel: "of clicks",
      },
      {
        label: "Bookings",
        value: bookings,
        hint: "Reservations made",
        conversion: visitors > 0 ? (bookings / visitors) * 100 : undefined,
        conversionLabel: "of visitors",
      },
    ];
    // Scale to the widest stage rather than to impressions: if a vendor somehow
    // has more visitors than impressions (different counters, different
    // windows), scaling to the first stage would draw a bar past the container.
    const peak = Math.max(...stages.map((s) => s.value), 1);
    return stages.map((s) => ({ ...s, widthPct: (s.value / peak) * 100 }));
  }, [impressions, clicks, visitors, bookings]);

  const funnelEmpty = impressions === 0 && clicks === 0 && visitors === 0 && bookings === 0;

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Where travellers find you, how many of them book, and what that's worth."
    >
      <div style={BRAND_VARS} className="space-y-5 md:space-y-6">
        {/* ── Headline numbers ──
            Four cards, each a different question. The page previously ran eight
            across two sections, four of which restated the funnel below. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatTileSkeleton key={i} />)
          ) : (
            <>
              <StatTile
                icon={Eye}
                label="Impressions"
                hint="Times your listings were shown"
                value={impressions}
                index={0}
              />
              <StatTile
                icon={Target}
                label="Click-through rate"
                hint={`${clicks.toLocaleString("en-IN")} clicks from ${impressions.toLocaleString("en-IN")} views`}
                value={`${ctr.toFixed(1)}%`}
                index={1}
              />
              <StatTile
                icon={CalendarCheck}
                label="Visitor conversion"
                hint={`${bookings} booking${bookings === 1 ? "" : "s"} from ${visitors.toLocaleString("en-IN")} visitors`}
                value={`${conversion.toFixed(1)}%`}
                index={2}
              />
              <StatTile
                icon={IndianRupee}
                label="Earned"
                hint="Received and settled"
                value={payments.received}
                format={currencyINR}
                index={3}
              />
            </>
          )}
        </div>

        {/* ── Funnel + catalog health, side by side ── */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Panel className="lg:col-span-3">
            <header className={PANEL_HEAD}>
              <div className="min-w-0">
                <h3 className="text-[14px] font-bold tracking-[-0.01em] text-foreground">
                  From search to booking
                </h3>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  Where travellers drop off on the way to a reservation
                </p>
              </div>
            </header>
            <div className="px-4 py-4">
              {loading ? (
                <div className="space-y-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                      <div className="h-2 rounded-full bg-muted animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : funnelEmpty ? (
                <div className="py-10 text-center">
                  <p className="text-[13px] font-semibold text-foreground">No traffic yet</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground max-w-[42ch] mx-auto">
                    Once your offerings start appearing in search, this shows how many people see
                    them, click through, and go on to book.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {funnel.map((stage) => (
                    <FunnelStage key={stage.label} {...stage} />
                  ))}
                </div>
              )}
            </div>
          </Panel>

          <Panel className="lg:col-span-2">
            <header className={PANEL_HEAD}>
              <div className="min-w-0">
                <h3 className="text-[14px] font-bold tracking-[-0.01em] text-foreground">
                  Catalog and payments
                </h3>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  What's live, and what you're owed
                </p>
              </div>
            </header>
            <dl className="divide-y divide-border">
              {[
                {
                  icon: BadgeCheck,
                  label: "Live offerings",
                  value: String(properties.approved),
                  hint: "Bookable right now",
                },
                {
                  icon: Package,
                  label: "Under review",
                  value: String(properties.pending),
                  hint: "With our review team",
                },
                {
                  icon: IndianRupee,
                  label: "Settled",
                  value: currencyINR(payments.received),
                  hint: "Paid out to you",
                },
                {
                  icon: Clock,
                  label: "Awaiting settlement",
                  value: currencyINR(payments.pending),
                  hint: "Collected, not yet paid out",
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 px-4 py-3.5">
                  <row.icon
                    size={15}
                    strokeWidth={2}
                    aria-hidden
                    className="shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0 flex-1">
                    <dt className="text-[13px] font-semibold text-foreground">{row.label}</dt>
                    <dd className="text-[11.5px] text-muted-foreground">{row.hint}</dd>
                  </div>
                  <dd className="shrink-0 text-[14px] font-bold tabular-nums text-foreground">
                    {loading ? "—" : row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>

        {/* ── Trends ── */}
        <div className="space-y-3">
          <SectionHeader
            title="Trends"
            description="Both charts read the same series the revenue page does — change the period to compare a week against a year."
          />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartPanel
              title="Earnings"
              blurb="what guests paid"
              filter={earningsPeriod}
              onFilterChange={setEarningsPeriod}
              data={earningsQuery.data ?? []}
              dataKey="earnings"
              loading={earningsQuery.isLoading}
              currency
            />
            <ChartPanel
              title="Visitors"
              blurb="people who opened a listing"
              filter={visitorsPeriod}
              onFilterChange={setVisitorsPeriod}
              data={visitorsQuery.data ?? []}
              dataKey="visitors"
              loading={visitorsQuery.isLoading}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
