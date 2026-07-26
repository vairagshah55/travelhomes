import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Eye,
  CheckSquare,
  ClipboardCheck,
  Wallet,
  MousePointer,
  Users,
  ArrowUpDown,
  MapPinOff,
  Plus,
  Calendar,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import {
  bookingDetailsApi,
  vendorAnalyticsApi,
  BookingDetailDTO,
  VendorAnalyticsCounts,
} from "../lib/api";
import { formatDate, isPast, isFuture } from "date-fns";

const BRAND = "#0d9488";

// ─── count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(start + diff * ease));
      if (p < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const Sk = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800/80 ${className}`} />
);

const bookingStatus = (checkIn: string, checkOut: string) => {
  if (isFuture(new Date(checkIn)))
    return {
      label: "Upcoming",
      dot: "bg-blue-400",
      pill: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    };
  if (isPast(new Date(checkOut)))
    return {
      label: "Completed",
      dot: "bg-emerald-400",
      pill: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    };
  return {
    label: "Ongoing",
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  };
};

const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
const avatarCls = (n: string) =>
  (
    [
      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
      "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
      "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
    ] as const
  )[n.charCodeAt(0) % 5];

// ChartCard / earningsConfig / visitorsConfig removed along with the Total
// Earnings + Total Visitors panels. If charts come back, restore from git
// history rather than re-introducing the dead config here.

// ─── BookingTable ─────────────────────────────────────────────────────────────
const BookingTable = ({ data, loading }: { data: BookingDetailDTO[]; loading: boolean }) => {
  const [selected, setSelected] = useState<BookingDetailDTO | null>(null);
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Calendar size={15} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-[13.5px] font-bold text-gray-900 dark:text-white tracking-tight">
              Recent Bookings
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
              {loading ? "Loading…" : `${data.length} record${data.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="h-8 w-auto text-xs border-gray-200 dark:border-gray-700 rounded-xl gap-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/bookings")}
            className="h-8 px-3 text-xs font-semibold rounded-xl gap-1 text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            All Bookings <ArrowRight size={13} />
          </Button>
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-50 dark:border-gray-800/60 hover:bg-transparent bg-gray-50/50 dark:bg-gray-800/20">
              {["Booking", "Client", "Service", "Check In", "Check Out", "Status", "Guests"].map(
                (h, i) => (
                  <TableHead
                    key={h}
                    className={`text-[10.5px] font-semibold uppercase tracking-[0.07em] text-gray-400 dark:text-gray-500 ${i === 0 ? "pl-6" : ""} ${i === 6 ? "pr-6" : ""}`}
                  >
                    {h.includes("Check") ? (
                      <div className="flex items-center gap-1">
                        {h} <ArrowUpDown size={10} />
                      </div>
                    ) : (
                      h
                    )}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-gray-50 dark:border-gray-800/40">
                  <TableCell className="pl-6">
                    <Sk className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Sk className="w-8 h-8 rounded-full" />
                      <Sk className="h-4 w-28" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Sk className="h-4 w-36" />
                  </TableCell>
                  <TableCell>
                    <Sk className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Sk className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Sk className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="pr-6">
                    <Sk className="h-4 w-8" />
                  </TableCell>
                </TableRow>
              ))}

            {!loading && data.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                      <MapPinOff
                        size={26}
                        className="text-gray-300 dark:text-gray-600"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        No bookings yet
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-600">
                        Guest bookings will appear here once received
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate("/offering/add")}
                      className="rounded-xl text-xs gap-1.5 h-8"
                      style={{ background: BRAND, color: "#fff" }}
                    >
                      <Plus size={13} /> Add your first listing
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {data.map((b, i) => {
              const s = bookingStatus(b.checkIn, b.checkOut);
              return (
                <TableRow
                  key={i}
                  onClick={() => setSelected(b)}
                  className="border-gray-50 dark:border-gray-800/40 hover:bg-gray-50/80 dark:hover:bg-white/[0.025] transition-colors cursor-pointer group"
                >
                  <TableCell className="pl-6">
                    <span className="text-[12.5px] font-bold tabular-nums" style={{ color: BRAND }}>
                      #{b.id?.slice(-6).toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarCls(b.clientName ?? "A")}`}
                      >
                        {initials(b.clientName ?? "?")}
                      </div>
                      <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {b.clientName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[12.5px] text-gray-500 dark:text-gray-400 max-w-[160px] truncate block">
                      {b.serviceName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Clock size={11} className="text-gray-300 dark:text-gray-600 shrink-0" />
                      <span className="text-[12.5px] text-gray-600 dark:text-gray-400">
                        {formatDate(b.checkIn, "dd MMM yyyy")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[12.5px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(b.checkOut, "dd MMM yyyy")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${s.pill}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                      {s.label}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center gap-1.5">
                      <Users size={11} className="text-gray-300 dark:text-gray-600" />
                      <span className="text-[12.5px] font-medium text-gray-600 dark:text-gray-400">
                        {b.guests}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* detail modal */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md w-full rounded-2xl">
          <DialogHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
            <DialogTitle className="flex items-center gap-2.5 text-base font-bold">
              Booking Details
              {selected && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${bookingStatus(selected.checkIn, selected.checkOut).pill}`}
                >
                  {bookingStatus(selected.checkIn, selected.checkOut).label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                ["Booking ID", `#${selected.id?.slice(-6).toUpperCase()}`],
                ["Client", selected.clientName],
                ["Service", selected.serviceName],
                ["Price", `₹${selected.servicePrice}`],
                ["Check In", formatDate(selected.checkIn, "dd MMM yyyy")],
                ["Check Out", formatDate(selected.checkOut, "dd MMM yyyy")],
                ["Guests", String(selected.guests)],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                    {label}
                  </p>
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white leading-snug">
                    {val}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── AnimatedStatCard ────────────────────────────────────────────────────────
const AnimatedStatCard = ({
  icon: Icon,
  label,
  value,
  border,
  iconCls,
  index,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  border: string;
  iconCls: string;
  index: number;
}) => {
  const rawNum = parseInt(String(value).replace(/[^0-9]/g, ""), 10);
  const isNum = !isNaN(rawNum) && !String(value).startsWith("₹");
  const animated = useCountUp(isNum ? rawNum : 0);
  const displayValue = isNum ? animated.toLocaleString() : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.28, ease: "easeOut" }}
      className={`group bg-white dark:bg-gray-900 rounded-2xl p-5 border-t-[3px] border border-gray-100 dark:border-gray-800 ${border} hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-950/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110 ${iconCls}`}
      >
        <Icon size={16} />
      </div>
      <p className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-1.5">
        {displayValue}
      </p>
      <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">{label}</p>
    </motion.div>
  );
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // ─── Dashboard data — three parallel queries keyed by user id. ──────────
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

  // ── 5 stat cards ──
  const statCards = [
    {
      icon: Eye,
      label: "Impressions",
      value: stats?.metrics?.impressions?.toLocaleString() ?? "0",
      border: "border-t-cyan-400",
      iconCls: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500",
    },
    {
      icon: MousePointer,
      label: "Clicks",
      value: stats?.metrics?.clicks?.toLocaleString() ?? "0",
      border: "border-t-amber-400",
      iconCls: "bg-amber-50 dark:bg-amber-500/10 text-amber-500",
    },
    {
      icon: Users,
      label: "Visitors",
      value: stats?.metrics?.visitors?.toLocaleString() ?? "0",
      border: "border-t-pink-400",
      iconCls: "bg-pink-50 dark:bg-pink-500/10 text-pink-500",
    },
    {
      icon: CheckSquare,
      label: "Total Bookings",
      value: stats?.total?.toLocaleString() ?? "0",
      border: "border-t-blue-400",
      iconCls: "bg-blue-50 dark:bg-blue-500/10 text-blue-500",
    },
    {
      icon: ClipboardCheck,
      label: "Listed Properties",
      value: stats?.properties?.approved?.toLocaleString() ?? "0",
      border: "border-t-violet-400",
      iconCls: "bg-violet-50 dark:bg-violet-500/10 text-violet-500",
    },
    {
      icon: Wallet,
      label: "Total Earnings",
      value: `₹${stats?.payments?.received?.toLocaleString() ?? "0"}`,
      border: "border-t-emerald-400",
      iconCls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500",
    },
  ];

  // ── booking status strip ──
  const statusStrip = [
    {
      label: "Upcoming",
      value: stats?.upcoming,
      dot: "bg-blue-400",
      text: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Completed",
      value: stats?.past,
      dot: "bg-emerald-400",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Cancelled",
      value: stats?.cancelled,
      dot: "bg-red-400",
      text: "text-red-500 dark:text-red-400",
    },
    {
      label: "Pending",
      value: stats?.properties?.pending,
      dot: "bg-amber-400",
      text: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <DashboardLayout
      title="Dashboard"
      contentClassName="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide"
    >
      <div className="p-5 lg:p-7 space-y-5">
        {/* ── STAT CARDS ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(({ icon: Icon, label, value, border, iconCls }, i) => {
            const rawNum = parseInt(String(value).replace(/[^0-9]/g, ""), 10);
            const isNum = !isNaN(rawNum) && !String(value).startsWith("₹");
            return loading ? (
              <div
                key={label}
                className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border-t-[3px] border border-gray-100 dark:border-gray-800 ${border}`}
              >
                <Sk className="w-9 h-9 rounded-xl mb-4" />
                <Sk className="w-20 h-7 mb-2" />
                <Sk className="w-24 h-3.5" />
              </div>
            ) : (
              <AnimatedStatCard
                key={label}
                icon={Icon}
                label={label}
                value={value}
                border={border}
                iconCls={iconCls}
                index={i}
              />
            );
          })}
        </div>

        {/* ── BOOKING STATUS STRIP ────────────────────────────────────── */}
        {!loading && stats && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-x divide-gray-100 dark:divide-gray-800 flex overflow-hidden">
            {statusStrip.map(({ label, value, dot, text }) => (
              <div
                key={label}
                className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                    {label}
                  </span>
                </div>
                <p className={`text-xl font-bold tracking-tight ${text}`}>{value ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* Total Earnings / Total Visitors charts removed from the vendor
                dashboard — the numbers were misleading until the graph data
                feed was vendor-scoped, and the Revenue page already covers
                earnings in more detail. */}

        {/* ── BOOKINGS TABLE ──────────────────────────────────────────── */}
        <BookingTable data={bookings} loading={loading} />
      </div>

      <ChangePasswordModal isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
    </DashboardLayout>
  );
};

export default Dashboard;
