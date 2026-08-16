import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  Clock,
  Eye,
  MousePointer,
  Plus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BRAND_VARS,
  BTN_NEUTRAL,
  BTN_PRIMARY,
  BTN_SOFT,
  CONTROL,
  EmptyState,
  PANEL,
  PANEL_FOOTER,
  Panel,
  PanelHead,
  SELECT_ITEM,
  StatTile,
  StatTileSkeleton,
  StatusBadge,
} from "@/components/shared";
import { getInitials } from "@/utils/getInitials";
import { cn } from "@/lib/utils";
import {
  bookingDetailsApi,
  vendorAnalyticsApi,
  BookingDetailDTO,
  VendorAnalyticsCounts,
} from "../lib/api";
import { formatDate, isFuture, isPast } from "date-fns";
import { currencyINR, toAmount } from "@/utils/currency";

/** How many bookings the dashboard shows before deferring to /bookings. */
const RECENT_LIMIT = 8;

const Sk = ({ className = "" }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-lg bg-muted", className)} />
);

/* ── Booking timing ───────────────────────────────────────────────────────────
   `status` is what the vendor set (pending / confirmed / active / cancelled);
   timing is where the stay sits on the calendar. The old table showed ONLY the
   date-derived label, so a cancelled booking still read "Upcoming". Both are
   shown now: status as the badge, timing as the row's left accent + a hint
   under the check-in date. */

type Timing = { key: string; label: string; bar: string; text: string };

const timingOf = (b: BookingDetailDTO): Timing => {
  if (b.status === "cancelled")
    return {
      key: "cancelled",
      label: "Cancelled",
      bar: "bg-red-400",
      text: "text-red-500 dark:text-red-400",
    };
  if (isFuture(new Date(b.checkIn)))
    return {
      key: "upcoming",
      label: "Upcoming",
      bar: "bg-blue-400",
      text: "text-blue-600 dark:text-blue-400",
    };
  if (isPast(new Date(b.checkOut)))
    return {
      key: "completed",
      label: "Completed",
      bar: "bg-emerald-400",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  return {
    key: "ongoing",
    label: "Ongoing",
    bar: "bg-amber-400",
    text: "text-amber-600 dark:text-amber-400",
  };
};

/** Stable per-name avatar tint — same five hues as the bookings pages. */
const AVATAR_TINTS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
] as const;

const avatarTint = (name: string) => AVATAR_TINTS[(name.charCodeAt(0) || 0) % AVATAR_TINTS.length];

/* ── Date-range filter ────────────────────────────────────────────────────── */

const RANGES = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
] as const;

type RangeKey = (typeof RANGES)[number]["value"];

const DAY = 86_400_000;

/** Inclusive lower bound for a range, or null for "all time". */
const rangeStart = (key: RangeKey): number | null => {
  if (key === "all") return null;
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const start = midnight.getTime();
  if (key === "today") return start;
  if (key === "week") return start - 6 * DAY;
  return start - 29 * DAY;
};

/* ── Recent bookings ──────────────────────────────────────────────────────── */

const RecentBookings = ({
  data,
  loading,
  onOpen,
}: {
  data: BookingDetailDTO[];
  loading: boolean;
  onOpen: (b: BookingDetailDTO) => void;
}) => {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>("all");

  /* Newest first — the panel says "recent", so it has to be sorted. The list
     came back in API order before, which made the label a lie. */
  const filtered = useMemo(() => {
    const from = rangeStart(range);
    return [...data]
      .filter((b) => {
        if (from === null) return true;
        const t = new Date(b.checkIn).getTime();
        return !Number.isNaN(t) && t >= from;
      })
      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
  }, [data, range]);

  const rows = filtered.slice(0, RECENT_LIMIT);

  return (
    <Panel>
      <PanelHead
        icon={CalendarDays}
        title="Recent bookings"
        blurb={
          loading
            ? "Loading your latest activity…"
            : `${filtered.length} booking${filtered.length === 1 ? "" : "s"} · newest first`
        }
        aside={
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
              <SelectTrigger className={cn("h-9 w-[124px]", CONTROL)} aria-label="Filter by date">
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={BRAND_VARS}>
                {RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value} className={SELECT_ITEM}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              onClick={() => navigate("/bookings")}
              className={cn(BTN_SOFT, "hidden sm:inline-flex")}
            >
              All bookings
              <ArrowRight size={14} strokeWidth={2.3} />
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="divide-y divide-border/70">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <Sk className="h-4 w-16 shrink-0" />
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Sk className="w-8 h-8 rounded-full shrink-0" />
                <Sk className="h-3.5 w-32" />
              </div>
              <Sk className="hidden md:block h-3.5 w-28" />
              <Sk className="hidden lg:block h-3.5 w-20" />
              <Sk className="h-6 w-20 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No bookings yet"
          description="Guest bookings land here as they come in. Listings have to be live before anyone can book."
          actionLabel="Add your first listing"
          onAction={() => navigate("/offering/add")}
        />
      ) : filtered.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-[13px] text-muted-foreground">
            No bookings with a check-in {range === "today" ? "today" : `in the ${range}`}.
          </p>
          <button
            onClick={() => setRange("all")}
            className="mt-2 text-[12.5px] font-semibold text-brand hover:underline"
          >
            Show all time
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/70 hover:bg-transparent bg-muted/40 dark:bg-white/[0.02]">
                {[
                  { label: "Booking", cls: "pl-5" },
                  { label: "Client", cls: "" },
                  { label: "Service", cls: "hidden md:table-cell" },
                  { label: "Check in", cls: "hidden sm:table-cell" },
                  { label: "Check out", cls: "hidden lg:table-cell" },
                  { label: "Status", cls: "" },
                  { label: "Guests", cls: "pr-5 hidden xl:table-cell" },
                ].map((h) => (
                  <TableHead
                    key={h.label}
                    className={cn(
                      "h-9 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground",
                      h.cls,
                    )}
                  >
                    {h.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((b, i) => {
                const t = timingOf(b);
                return (
                  <motion.tr
                    key={b._id ?? b.id ?? i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i, 6) * 0.035 }}
                    onClick={() => onOpen(b)}
                    className={cn(
                      "group border-b border-border/70 cursor-pointer",
                      "transition-colors duration-150 hover:bg-brand/[0.035]",
                    )}
                  >
                    <TableCell className="relative pl-5">
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full",
                          t.bar,
                        )}
                      />
                      <span className="text-[12.5px] font-bold tabular-nums text-brand">
                        #{b.id?.slice(-6).toUpperCase()}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "grid place-items-center w-8 h-8 rounded-full shrink-0 text-[11px] font-bold",
                            avatarTint(b.clientName ?? "?"),
                          )}
                        >
                          {getInitials(b.clientName || "?")}
                        </span>
                        <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">
                          {b.clientName}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                      <span className="block max-w-[180px] truncate text-[12.5px] text-muted-foreground">
                        {b.serviceName}
                      </span>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <Clock size={11} className="shrink-0 text-muted-foreground/50" />
                        <span className="text-[12.5px] tabular-nums text-foreground/80">
                          {formatDate(b.checkIn, "dd MMM yyyy")}
                        </span>
                      </div>
                      <span className={cn("mt-0.5 block text-[11px] font-semibold", t.text)}>
                        {t.label}
                      </span>
                    </TableCell>

                    <TableCell className="hidden lg:table-cell">
                      <span className="text-[12.5px] tabular-nums whitespace-nowrap text-muted-foreground">
                        {formatDate(b.checkOut, "dd MMM yyyy")}
                      </span>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={b.status} size="sm" />
                    </TableCell>

                    <TableCell className="pr-5 hidden xl:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Users size={11} className="text-muted-foreground/50" />
                        <span className="text-[12.5px] font-semibold tabular-nums text-foreground/80">
                          {b.guests}
                        </span>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <footer className={PANEL_FOOTER}>
          <p className="text-[11.5px] text-muted-foreground">
            Showing{" "}
            <span className="font-semibold tabular-nums text-foreground/80">{rows.length}</span> of{" "}
            <span className="font-semibold tabular-nums text-foreground/80">{filtered.length}</span>
          </p>
          <Button variant="ghost" onClick={() => navigate("/bookings")} className={BTN_SOFT}>
            View all bookings
            <ArrowRight size={14} strokeWidth={2.3} />
          </Button>
        </footer>
      )}
    </Panel>
  );
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();
  const [selected, setSelected] = useState<BookingDetailDTO | null>(null);

  // ─── Dashboard data — two parallel queries keyed by user id. ──────────
  // Each query is independent so they can refresh on different cadences if
  // we ever want to (e.g. graphs every 5 min, counts every minute).
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
  const bookings = bookingsQuery.data ?? [];
  const loading = statsQuery.isLoading || bookingsQuery.isLoading;

  const statCards: {
    icon: LucideIcon;
    label: string;
    value: number;
    prefix?: string;
    color: string;
  }[] = [
    { icon: Eye, label: "Impressions", value: stats?.metrics?.impressions ?? 0, color: "#06b6d4" },
    { icon: MousePointer, label: "Clicks", value: stats?.metrics?.clicks ?? 0, color: "#f59e0b" },
    { icon: Users, label: "Visitors", value: stats?.metrics?.visitors ?? 0, color: "#ec4899" },
    { icon: CheckSquare, label: "Total bookings", value: stats?.total ?? 0, color: "#3b82f6" },
    {
      icon: ClipboardCheck,
      label: "Listed properties",
      value: stats?.properties?.approved ?? 0,
      color: "#a855f7",
    },
    {
      icon: Wallet,
      label: "Total earnings",
      value: stats?.payments?.received ?? 0,
      prefix: "₹",
      color: "#10b981",
    },
  ];

  const statusStrip = [
    { label: "Upcoming", value: stats?.upcoming, dot: "bg-blue-400" },
    { label: "Completed", value: stats?.past, dot: "bg-emerald-400" },
    { label: "Cancelled", value: stats?.cancelled, dot: "bg-red-400" },
    { label: "Pending listings", value: stats?.properties?.pending, dot: "bg-amber-400" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.firstName || (user?.name ?? "").split(" ")[0];

  const selectedTiming = selected ? timingOf(selected) : null;

  return (
    <DashboardLayout
      title="Dashboard"
      contentClassName="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6 bg-muted/40 dark:bg-transparent"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto pb-24 lg:pb-12 space-y-5">
        {/* ── Greeting + the two things a vendor comes here to do ── */}
        <Panel className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.08] via-brand/[0.02] to-transparent"
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <h2 className="text-[19px] font-bold tracking-[-0.015em] text-foreground">
                {greeting}
                {firstName ? `, ${firstName}` : ""}
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {loading
                  ? "Pulling in your latest numbers…"
                  : (stats?.upcoming ?? 0) > 0
                    ? `You have ${stats?.upcoming} upcoming booking${stats?.upcoming === 1 ? "" : "s"}.`
                    : "No upcoming bookings right now — a good moment to polish your listings."}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                onClick={() => navigate("/bookings")}
                className={cn(BTN_SOFT, "hidden sm:inline-flex")}
              >
                View bookings
              </Button>
              <Button onClick={() => navigate("/offering/add")} className={BTN_PRIMARY}>
                <Plus size={15} strokeWidth={2.5} />
                Add listing
              </Button>
            </div>
          </div>
        </Panel>

        {/* ── Metrics ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {statCards.map((card, i) =>
            loading ? (
              <StatTileSkeleton key={card.label} />
            ) : (
              <StatTile key={card.label} index={i} {...card} />
            ),
          )}
        </div>

        {/* ── Booking status strip ── */}
        {!loading && stats && (
          <Panel>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border/70">
              {statusStrip.map(({ label, value, dot }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center gap-1.5 py-4 transition-colors duration-150 hover:bg-muted/50 dark:hover:bg-white/[0.02]"
                >
                  <span className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", dot)} />
                    <span className="text-[11.5px] font-semibold text-muted-foreground">
                      {label}
                    </span>
                  </span>
                  <p className="text-[20px] font-bold tracking-[-0.02em] tabular-nums text-foreground">
                    {value ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* ── Recent bookings ── */}
        <RecentBookings data={bookings} loading={loading} onOpen={setSelected} />
      </div>

      {/* ── Booking detail ── */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent
          style={BRAND_VARS}
          className="sm:max-w-[520px] p-0 gap-0 overflow-hidden rounded-[18px] bg-card border-border/70"
        >
          {selected && selectedTiming && (
            <>
              <div className="px-6 pt-6 pb-4 border-b border-border/70">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.status} size="sm" />
                  <span className={cn("text-[11.5px] font-semibold", selectedTiming.text)}>
                    {selectedTiming.label}
                  </span>
                </div>
                <DialogTitle className="mt-3 pr-8 text-left text-[18px] font-bold leading-6 tracking-[-0.01em] text-foreground">
                  {selected.clientName}
                </DialogTitle>
                <p className="mt-1 text-[12px] tabular-nums text-muted-foreground">
                  Booking #{selected.id?.slice(-6).toUpperCase()}
                </p>
              </div>

              <dl className="divide-y divide-border/70 max-h-[52vh] overflow-y-auto">
                {(
                  [
                    ["Service", selected.serviceName],
                    // `servicePrice` is already "₹ 5000" on mapped rows and a
                    // bare Number on raw BookingDetail rows, so interpolating
                    // it into "₹{…}" rendered "₹₹ 5000" for half the list.
                    ["Price", currencyINR(toAmount(selected.servicePrice))],
                    ["Check in", formatDate(selected.checkIn, "dd MMM yyyy")],
                    ["Check out", formatDate(selected.checkOut, "dd MMM yyyy")],
                    ["Guests", String(selected.guests)],
                    ["Location", selected.location],
                    ["Contact", selected.contactPhone || selected.contactEmail],
                  ] as [string, string | undefined][]
                )
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label} className="flex gap-4 px-6 py-3">
                      <dt className="w-[110px] shrink-0 text-[12.5px] text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="min-w-0 text-[13.5px] font-medium text-foreground break-words">
                        {value}
                      </dd>
                    </div>
                  ))}
              </dl>

              <footer className={cn(PANEL_FOOTER, "px-6 justify-end gap-2")}>
                <Button variant="ghost" onClick={() => setSelected(null)} className={BTN_NEUTRAL}>
                  Close
                </Button>
                <Button variant="ghost" onClick={() => navigate("/bookings")} className={BTN_SOFT}>
                  Open in bookings
                  <ArrowRight size={14} strokeWidth={2.3} />
                </Button>
              </footer>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Dashboard;
