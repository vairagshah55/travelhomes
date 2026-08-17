import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { formatDate } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Clock,
  IndianRupee,
  Package,
  PackagePlus,
  Tag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ActionCenter,
  BRAND_VARS,
  BTN_PRIMARY,
  BTN_RAW,
  BTN_SOFT,
  ChartTooltip,
  EmptyState,
  PANEL,
  PANEL_FLUSH,
  PANEL_FOOTER,
  PANEL_HEAD,
  PANEL_INTERACTIVE,
  SectionHeader,
  StatTile,
  StatTileSkeleton,
  StatusBadge,
  type ActionItem,
} from "@/components/shared";
import { TabStrip } from "@/components/shared/TabStrip";
import { BookingDrawer, avatarTint, bookingRef, timingOf } from "@/components/bookings/BookingDrawer";
import { getInitials } from "@/utils/getInitials";
import { cn } from "@/lib/utils";
import {
  bookingDetailsApi,
  vendorAnalyticsApi,
  type BookingDetailDTO,
  type VendorAnalyticsCounts,
} from "../lib/api";
import { currencyINR, toAmount } from "@/utils/currency";
import { inrCompact } from "@/components/revenue/format";

/** How many bookings the dashboard shows before deferring to /bookings. */
const RECENT_LIMIT = 6;
const DAY = 86_400_000;

/* ── Period ───────────────────────────────────────────────────────────────────
   Every number on this page is scoped to ONE period, chosen once in the header
   band. Previously the KPIs were all-time totals while the table below them had
   its own private date filter, so "6 bookings" in the panel and "142 bookings"
   in the card above described the same business and disagreed. */

const PERIODS = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

const periodDays = (key: PeriodKey) => PERIODS.find((p) => p.key === key)!.days;

/** Midnight today, so "last 7 days" means 7 whole days and not 7×24 hours. */
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** A booking's own timestamp — check-in is the closest thing the DTO carries. */
const bookingTime = (b: BookingDetailDTO) => {
  const t = new Date(b.checkIn).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/** Signed percentage change, rounded. `null` when there is no base to compare. */
const deltaPct = (current: number, previous: number): number | undefined => {
  if (previous <= 0) return undefined;
  return Math.round(((current - previous) / previous) * 100);
};

/* ── Derived business summary ─────────────────────────────────────────────────
   All of this is computed from data the page ALREADY fetches — the two queries
   below are untouched. That matters: the brief is a redesign, not a change to
   what the console asks the API for. What changes is that the numbers now carry
   a period, a comparison and a trend instead of being bare all-time counts. */

interface Summary {
  revenue: number;
  revenuePrev: number;
  bookings: number;
  bookingsPrev: number;
  pending: number;
  avgValue: number;
  avgValuePrev: number;
  series: { label: string; revenue: number; bookings: number }[];
}

const summarise = (rows: BookingDetailDTO[], days: number): Summary => {
  const today = startOfToday();
  const from = today - (days - 1) * DAY;
  const prevFrom = from - days * DAY;

  const inWindow = (b: BookingDetailDTO, lo: number, hi: number) => {
    const t = bookingTime(b);
    return t >= lo && t < hi;
  };

  // Cancelled bookings are excluded from money and volume: counting revenue a
  // vendor will never receive is the fastest way to make a dashboard untrusted.
  const live = rows.filter((b) => b.status !== "cancelled");
  const current = live.filter((b) => inWindow(b, from, today + DAY));
  const previous = live.filter((b) => inWindow(b, prevFrom, from));

  const sum = (list: BookingDetailDTO[]) =>
    list.reduce((total, b) => total + toAmount(b.servicePrice), 0);

  const revenue = sum(current);
  const revenuePrev = sum(previous);

  /* Daily buckets for the trend. Long windows are grouped into ~12 columns so a
     90-day chart doesn't render 90 unreadable 3px bars. */
  const buckets = Math.min(days, 12);
  const bucketSize = Math.ceil(days / buckets);
  const series = Array.from({ length: buckets }, (_, i) => {
    const lo = from + i * bucketSize * DAY;
    const hi = lo + bucketSize * DAY;
    const slice = live.filter((b) => inWindow(b, lo, hi));
    return {
      label: formatDate(new Date(lo), bucketSize > 1 ? "d MMM" : "EEE"),
      revenue: sum(slice),
      bookings: slice.length,
    };
  });

  return {
    revenue,
    revenuePrev,
    bookings: current.length,
    bookingsPrev: previous.length,
    pending: rows.filter((b) => b.status === "pending").length,
    avgValue: current.length ? Math.round(revenue / current.length) : 0,
    avgValuePrev: previous.length ? Math.round(revenuePrev / previous.length) : 0,
    series,
  };
};

/* ── Quick actions ────────────────────────────────────────────────────────── */

const QUICK_ACTIONS = [
  { label: "Add offering", icon: PackagePlus, path: "/offering/add" },
  { label: "New booking", icon: CalendarPlus, path: "/bookings/new" },
  { label: "Create offer", icon: Tag, path: "/marketing/offers" },
  { label: "View revenue", icon: Wallet, path: "/revenue" },
] as const;

const QuickActions = () => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.path}
          onClick={() => navigate(action.path)}
          className={cn(
            PANEL,
            PANEL_INTERACTIVE,
            "group flex items-center gap-2.5 px-3.5 py-3 text-left outline-none",
            "focus-visible:ring-4 focus-visible:ring-brand/20",
          )}
        >
          <action.icon
            size={16}
            strokeWidth={2}
            aria-hidden
            className="shrink-0 text-muted-foreground transition-colors group-hover:text-brand"
          />
          <span className="text-[13px] font-semibold text-foreground truncate">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

/* ── Performance chart ────────────────────────────────────────────────────── */

const PerformanceChart = ({
  series,
  loading,
  periodLabel,
  className,
}: {
  series: Summary["series"];
  loading: boolean;
  periodLabel: string;
  className?: string;
}) => {
  const [metric, setMetric] = useState<"revenue" | "bookings">("revenue");
  const empty = !loading && series.every((point) => point.revenue === 0 && point.bookings === 0);

  return (
    <section className={cn(PANEL, "overflow-hidden flex flex-col", className)}>
      <header className={PANEL_HEAD}>
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold tracking-[-0.01em] text-foreground">Performance</h3>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {metric === "revenue" ? "Revenue" : "Bookings"} over the last {periodLabel}
          </p>
        </div>
        {/* Two metrics on one axis would need a second scale and a legend for
            what is fundamentally an either/or question. A toggle answers it. */}
        <TabStrip
          variant="flush"
          tabs={[
            { key: "revenue", label: "Revenue" },
            { key: "bookings", label: "Bookings" },
          ]}
          activeKey={metric}
          onChange={(k) => setMetric(k as "revenue" | "bookings")}
          className="-mr-1 -mt-1"
        />
      </header>

      <div className="flex-1 min-h-[240px] p-4 pt-5">
        {loading ? (
          <div className="h-[240px] rounded-lg bg-muted animate-pulse" />
        ) : empty ? (
          <EmptyState
            icon={TrendingUp}
            title="No activity in this period"
            description="Once bookings come in, this chart shows how revenue and volume move week to week."
          />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={series} margin={{ top: 4, right: 6, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="dashTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0} />
                </linearGradient>
              </defs>
              {/* Horizontal rules only. A full grid draws 40 lines behind 12
                  data points and the data stops being the loudest thing. */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={58}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: number) => (metric === "revenue" ? inrCompact(v) : String(v))}
              />
              <Tooltip
                cursor={{ stroke: "hsl(var(--brand))", strokeWidth: 1, strokeOpacity: 0.35 }}
                content={
                  <ChartTooltip
                    valueFormatter={(v: number) =>
                      metric === "revenue" ? currencyINR(v) : `${v} booking${v === 1 ? "" : "s"}`
                    }
                  />
                }
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="hsl(var(--brand))"
                strokeWidth={2}
                fill="url(#dashTrend)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};

/* ── Recent bookings ──────────────────────────────────────────────────────── */

const RecentBookings = ({
  rows,
  loading,
  onOpen,
}: {
  rows: BookingDetailDTO[];
  loading: boolean;
  onOpen: (b: BookingDetailDTO) => void;
}) => {
  const navigate = useNavigate();
  const visible = rows.slice(0, RECENT_LIMIT);

  return (
    <section className={PANEL_FLUSH}>
      <header className={PANEL_HEAD}>
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold tracking-[-0.01em] text-foreground">
            Recent bookings
          </h3>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {loading ? "Loading…" : "Newest first"}
          </p>
        </div>
        <button
          onClick={() => navigate("/bookings")}
          className={`${BTN_RAW} ${BTN_SOFT} hidden sm:inline-flex`}
        >
          All bookings
          <ArrowRight size={14} strokeWidth={2.3} />
        </button>
      </header>

      {loading ? (
        <div className="divide-y divide-border">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-24 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No bookings yet"
          description="Guest bookings land here as they come in. Your offerings have to be live before anyone can book one."
          actionLabel="Add your first offering"
          onAction={() => navigate("/offering/add")}
        />
      ) : (
        /* A list, not a table. At this width a table would show two columns and
           truncate both; the row below carries the same five facts and stays
           readable on a phone. The full table lives at /bookings. */
        <ul className="divide-y divide-border">
          {visible.map((b) => {
            const timing = timingOf(b);
            return (
              <li key={b._id ?? b.id}>
                <button
                  onClick={() => onOpen(b)}
                  className="group w-full flex items-center gap-3 px-4 py-3 text-left
                    transition-colors duration-150 hover:bg-muted/60 dark:hover:bg-white/[0.03]
                    outline-none focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
                >
                  <span
                    className={cn(
                      "grid place-items-center w-8 h-8 rounded-full shrink-0 text-[11px] font-bold",
                      avatarTint(b.clientName ?? "?"),
                    )}
                    aria-hidden
                  >
                    {getInitials(b.clientName || "?")}
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline gap-2">
                      <span className="text-[13px] font-semibold text-foreground truncate">
                        {b.clientName}
                      </span>
                      <span className="text-[11px] font-medium tabular-nums text-muted-foreground/70 shrink-0">
                        {bookingRef(b)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <Clock size={11} strokeWidth={2} aria-hidden className="shrink-0" />
                      <span className="tabular-nums">
                        {formatDate(new Date(b.checkIn), "dd MMM")}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="truncate">{b.serviceName}</span>
                    </span>
                  </span>

                  <span className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[13px] font-bold tabular-nums text-foreground">
                      {currencyINR(toAmount(b.servicePrice))}
                    </span>
                    <span className={cn("text-[11px] font-semibold", timing.text)}>
                      {timing.label}
                    </span>
                  </span>

                  <StatusBadge status={b.status} size="sm" className="shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && rows.length > RECENT_LIMIT && (
        <footer className={PANEL_FOOTER}>
          <p className="text-[11.5px] text-muted-foreground">
            Showing <span className="font-semibold tabular-nums text-foreground/80">{visible.length}</span>{" "}
            of <span className="font-semibold tabular-nums text-foreground/80">{rows.length}</span>
          </p>
          <button onClick={() => navigate("/bookings")} className={`${BTN_RAW} ${BTN_SOFT}`}>
            View all
            <ArrowRight size={14} strokeWidth={2.3} />
          </button>
        </footer>
      )}
    </section>
  );
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // ─── Dashboard data — two parallel queries keyed by user id. ──────────
  // Unchanged from before the redesign: same endpoints, same keys, same
  // cadence. Everything new on this page is derived from these two results.
  const token = authToken ?? undefined;
  const enabled = !!user && !!token;

  const params: Record<string, any> = { mine: true };
  if (user?.userType === "vendor" && user?.id) params.vendorId = user.id;

  const statsQuery = useQuery<VendorAnalyticsCounts | null>({
    queryKey: ["dashboard", "stats", user?.id],
    enabled,
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getCounts(token!);
      return res.success ? res.data : null;
    },
  });

  const bookingsQuery = useQuery<BookingDetailDTO[]>({
    queryKey: ["dashboard", "bookings", user?.id],
    enabled,
    queryFn: async () => {
      const res = await bookingDetailsApi.list(token!, params);
      return res.success ? res.data : [];
    },
  });

  const stats = statsQuery.data ?? null;
  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const loading = statsQuery.isLoading || bookingsQuery.isLoading;

  const summary = useMemo(() => summarise(bookings, periodDays(period)), [bookings, period]);

  /** Newest first — the panel says "recent", so it has to be sorted. */
  const recent = useMemo(
    () => [...bookings].sort((a, b) => bookingTime(b) - bookingTime(a)),
    [bookings],
  );

  /* ── What needs attention ───────────────────────────────────────────────
     Only genuine work items, and only when the count is above zero: a list
     padded with "0 pending bookings" trains the vendor to stop reading it. */
  const actions = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];

    if (summary.pending > 0) {
      items.push({
        id: "pending-bookings",
        icon: CalendarDays,
        label: `${summary.pending} booking${summary.pending === 1 ? "" : "s"} awaiting confirmation`,
        detail: "Guests are waiting on your answer",
        count: summary.pending,
        tone: "urgent",
        onClick: () => navigate("/bookings?status=pending"),
      });
    }

    const pendingListings = stats?.properties?.pending ?? 0;
    if (pendingListings > 0) {
      items.push({
        id: "pending-listings",
        icon: Package,
        label: `${pendingListings} offering${pendingListings === 1 ? "" : "s"} under review`,
        detail: "Not bookable until approved",
        count: pendingListings,
        tone: "attention",
        onClick: () => navigate("/offering?status=pending"),
      });
    }

    const duePayments = stats?.payments?.pending ?? 0;
    if (duePayments > 0) {
      items.push({
        id: "pending-payouts",
        icon: IndianRupee,
        label: "Payout pending",
        detail: `${currencyINR(duePayments)} not yet settled`,
        tone: "attention",
        onClick: () => navigate("/revenue"),
      });
    }

    if ((stats?.properties?.approved ?? 0) === 0 && !loading) {
      items.push({
        id: "no-listings",
        icon: AlertTriangle,
        label: "You have no live offerings",
        detail: "Travellers can't book you until one is published",
        tone: "urgent",
        onClick: () => navigate("/offering/add"),
      });
    }

    return items;
  }, [summary.pending, stats, loading, navigate]);

  /* ── Greeting ───────────────────────────────────────────────────────────
     Moved out of a gradient hero card and into the page-header band, which is
     where every other page puts its title. The hero was ~120px of decoration
     above the fold repeating a name the account menu already shows. */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.firstName || (user?.name ?? "").split(" ")[0];

  const periodLabel = PERIODS.find((p) => p.key === period)!.label;

  const subtitle = loading
    ? "Pulling in your latest numbers…"
    : actions.length > 0
      ? `${actions.length} thing${actions.length === 1 ? "" : "s"} need your attention today.`
      : summary.bookings > 0
        ? `${summary.bookings} booking${summary.bookings === 1 ? "" : "s"} in the last ${periodLabel} — nothing needs your attention right now.`
        : "Nothing needs your attention right now.";

  const headerActions = (
    <>
      <TabStrip
        variant="flush"
        tabs={PERIODS.map((p) => ({ key: p.key, label: p.label }))}
        activeKey={period}
        onChange={(k) => setPeriod(k as PeriodKey)}
      />
      <button onClick={() => navigate("/offering/add")} className={`${BTN_RAW} ${BTN_PRIMARY}`}>
        <PackagePlus size={15} strokeWidth={2.4} />
        Add offering
      </button>
    </>
  );

  const openBooking = openIndex !== null ? (recent[openIndex] ?? null) : null;

  return (
    <DashboardLayout
      title={`${greeting}${firstName ? `, ${firstName}` : ""}`}
      subtitle={subtitle}
      headerActions={headerActions}
    >
      <div style={BRAND_VARS} className="space-y-5 md:space-y-6">
        {/* ── The four numbers that answer "how is my business doing" ──
            Impressions / clicks / visitors moved to Analytics, where they can
            be read against each other. On the dashboard they sat at the same
            weight as revenue, which said a page view and a paid booking matter
            equally. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatTileSkeleton key={i} />)
          ) : (
            <>
              <StatTile
                index={0}
                icon={Wallet}
                label="Revenue"
                value={summary.revenue}
                prefix="₹"
                format={(v) => Math.round(v).toLocaleString("en-IN")}
                delta={deltaPct(summary.revenue, summary.revenuePrev)}
                deltaLabel={`vs previous ${periodLabel}`}
                trend={summary.series.map((p) => p.revenue)}
                onClick={() => navigate("/revenue")}
              />
              <StatTile
                index={1}
                icon={CalendarDays}
                label="Bookings"
                value={summary.bookings}
                delta={deltaPct(summary.bookings, summary.bookingsPrev)}
                deltaLabel={`vs previous ${periodLabel}`}
                trend={summary.series.map((p) => p.bookings)}
                onClick={() => navigate("/bookings")}
              />
              <StatTile
                index={2}
                icon={Clock}
                label="Awaiting you"
                value={summary.pending}
                hint={summary.pending > 0 ? "Confirm to secure the stay" : "All caught up"}
                onClick={() => navigate("/bookings?status=pending")}
              />
              <StatTile
                index={3}
                icon={Users}
                /* "Avg booking value" truncated to "AVG BOOKING V…" in a phone's
                   half-width card; the shorter label survives at every size and
                   the hint under it supplies the rest. */
                label="Avg booking"
                value={summary.avgValue}
                prefix="₹"
                format={(v) => Math.round(v).toLocaleString("en-IN")}
                delta={deltaPct(summary.avgValue, summary.avgValuePrev)}
                deltaLabel={`vs previous ${periodLabel}`}
                onClick={() => navigate("/analytics")}
              />
            </>
          )}
        </div>

        {/* ── Performance beside the work queue ──
            60/40 rather than stacked: "how am I doing" and "what do I do next"
            are the dashboard's two questions and both belong above the fold. */}
        <div className="grid gap-4 lg:grid-cols-5">
          <PerformanceChart
            className="lg:col-span-3"
            series={summary.series}
            loading={loading}
            periodLabel={periodLabel}
          />
          <div className="lg:col-span-2">
            <ActionCenter items={actions} isLoading={loading} className="h-full" />
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader
            title="Quick actions"
            description="The four things vendors do most, one click from anywhere on this page."
          />
          <QuickActions />
        </div>

        <RecentBookings
          rows={recent}
          loading={loading}
          onOpen={(b) => setOpenIndex(recent.findIndex((r) => (r._id ?? r.id) === (b._id ?? b.id)))}
        />
      </div>

      {/* The list stays on screen behind it — see BookingDrawer's note. */}
      <BookingDrawer
        booking={openBooking}
        open={openIndex !== null}
        onClose={() => setOpenIndex(null)}
        position={
          openIndex !== null ? { index: openIndex + 1, total: recent.length } : undefined
        }
        onPrev={openIndex !== null && openIndex > 0 ? () => setOpenIndex(openIndex - 1) : undefined}
        onNext={
          openIndex !== null && openIndex < recent.length - 1
            ? () => setOpenIndex(openIndex + 1)
            : undefined
        }
      />
    </DashboardLayout>
  );
};

export default Dashboard;
