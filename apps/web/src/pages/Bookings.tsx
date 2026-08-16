import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  Search,
  Package,
  Calendar as CalendarIcon,
  LayoutGrid,
  IndianRupee,
  Clock,
  Sun,
  ChevronDown,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import {
  BRAND_VARS,
  CONTROL,
  PANEL,
  PANEL_FOOTER,
  Panel,
  PanelHead,
  StatTile,
  StatTileSkeleton,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBookingResources } from "@/hooks/useBookingResources";

import {
  type BookingData,
  fetchBookings,
  updateBookingDates,
  CalendarGrid,
  DateNavigation,
} from "@/components/bookings";
import { currencyINR } from "@/utils/currency";

/* ── Filter dropdown trigger ─────────────────────────────────────────────── */
const FilterPill: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}> = ({ icon, label, children }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border whitespace-nowrap",
          "text-[13px] font-semibold text-foreground/85 bg-muted/50 dark:bg-white/5 border-border",
          "outline-none transition-colors duration-150 hover:bg-muted",
          "focus-visible:ring-4 focus-visible:ring-brand/15 focus-visible:border-brand",
        )}
      >
        {icon}
        {label}
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" style={BRAND_VARS} className="w-52 p-1.5">
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);

/* Radix's own `focus:bg-accent` resolves to an invalid colour in this app —
   see the SELECT_ITEM note in components/shared/Panel.tsx. */
const FILTER_ITEM_CLASS =
  "cursor-pointer rounded-lg px-2.5 py-2 text-[13px] font-medium text-foreground " +
  "transition-colors " +
  "focus:bg-brand/[0.1] focus:text-brand " +
  "data-[highlighted]:bg-brand/[0.1] data-[highlighted]:text-brand " +
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed";

/** Colour key for the booking bars — the calendar is unreadable without one. */
const LEGEND = [
  { label: "Confirmed", dot: "bg-blue-400" },
  { label: "Checked-in", dot: "bg-emerald-400" },
  { label: "Checked-out", dot: "bg-slate-300 dark:bg-slate-600" },
  { label: "Cancelled", dot: "bg-red-400" },
];

const Bookings = () => {
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();
  const queryClient = useQueryClient();
  const token = authToken ?? undefined;

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [vehicleNames, setVehicleNames] = useState<string[]>([]);

  const [selectedDate, setSelectedDate] = useState<{ date: number; resource: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // ─── Toast helper ──────────────────────────────────────────────────────────
  const notify = (type: "success" | "error", message: string) => {
    if (type === "success") {
      toast.success(message, { duration: 4000 });
    } else {
      toast.error(message, { duration: 4000 });
    }
  };

  // ─── Resources ─────────────────────────────────────────────────────────────
  // Shared with the New Booking page via the same query key, so navigating
  // between the two reuses one fetch. Mirrored into local state because the
  // bookings query below merges already-booked resource names in on top.
  const { data: resources } = useBookingResources();
  useEffect(() => {
    if (resources) setVehicleNames(resources.names);
  }, [resources]);

  // ─── Bookings list ─────────────────────────────────────────────────────────
  const bookingsKey = ["bookings", "calendar", currentMonth, currentYear, user?.id, token] as const;
  const { data: bookings = [], isLoading: loading } = useQuery<BookingData[]>({
    queryKey: bookingsKey,
    enabled: !!user,
    queryFn: async () => {
      const isVendor = user?.userType === "vendor";
      try {
        const data = await fetchBookings(
          currentMonth,
          currentYear,
          token,
          isVendor ? user?.id : undefined,
          isVendor ? user?.email : undefined,
        );
        if (data.length > 0) {
          const booked = Array.from(new Set(data.map((b) => b.resourceName)));
          setVehicleNames((prev) => {
            const combined = Array.from(new Set([...prev, ...booked]));
            const filtered = combined.filter(
              (n) => n !== "Default Service" || combined.length === 1,
            );
            return filtered.length > 0 ? filtered : ["Default Service"];
          });
        }
        return data;
      } catch (e) {
        notify("error", "Failed to load bookings");
        throw e;
      }
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────
  /**
   * New Booking is its own page (/bookings/new), not a side panel. A cell the
   * user already picked is forwarded as query params so the page can prefill.
   */
  const goToNewBooking = (date?: number, resource?: string) => {
    const params = new URLSearchParams();
    if (date !== undefined) {
      params.set(
        "date",
        `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${date.toString().padStart(2, "0")}`,
      );
    }
    if (resource) params.set("resource", resource);
    const qs = params.toString();
    navigate(qs ? `/bookings/new?${qs}` : "/bookings/new");
  };

  /* Editing is its own page (/bookings/:id/edit) — the old right-side panel put
     a six-group form in a 540px column. */
  const handleBookingClick = (b: BookingData) => navigate(`/bookings/${b._id}/edit`);

  const handleDateClick = (date: number, resource: string) => {
    setSelectedDate({ date, resource });
    goToNewBooking(date, resource);
  };

  const handleBookingDrag = async (id: string, start: Date, end: Date) => {
    try {
      const updated = await updateBookingDates(id, start, end, "move", token);
      if (updated) {
        queryClient.setQueryData<BookingData[]>(bookingsKey, (p) =>
          (p ?? []).map((b) => (b._id === id ? updated : b)),
        );
        notify("success", "Booking moved");
      }
    } catch (e: any) {
      notify("error", e.message || "Failed to move");
    }
  };

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      if (user?.userType === "vendor") {
        const ownVisible = vehicleNames.includes(b.resourceName) || b.createdBy === user.email;
        if (!ownVisible) return false;
      }
      if (serviceFilter !== "all" && b.resourceName !== serviceFilter) return false;
      if (q) {
        const hay = `${b.guestName} ${b.bookingId} ${b.resourceName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [bookings, user, vehicleNames, serviceFilter, searchQuery]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let revenue = 0;
    let pending = 0;
    let todayCount = 0;
    for (const b of filteredBookings) {
      revenue += Number(b.totalAmount || 0);
      pending += Number(b.pendingAmount || 0);
      const s = new Date(b.startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(b.endDate);
      e.setHours(0, 0, 0, 0);
      if (today >= s && today <= e && b.status !== "Cancelled") todayCount += 1;
    }
    return { total: filteredBookings.length, revenue, pending, today: todayCount };
  }, [filteredBookings]);


  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      title="Bookings"
    >
      {/* Wider than the other console pages on purpose — this is a month ×
          resource grid, and squeezing it to max-w-6xl only adds scrolling.
          pb clears the fixed MobileVendorNav. */}
      <div style={BRAND_VARS} className="max-w-[1400px] mx-auto pb-24 lg:pb-12 space-y-5">
        {/* ── Metrics ── */}
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
                icon={CalendarIcon}
                label="Bookings"
                hint="This month"
                value={stats.total}
                color="#117479"
                index={0}
              />
              <StatTile
                icon={IndianRupee}
                label="Revenue"
                hint="Total billed"
                value={currencyINR(stats.revenue)}
                color="#22c55e"
                index={1}
              />
              <StatTile
                icon={Clock}
                label="Pending"
                hint="Yet to collect"
                value={currencyINR(stats.pending)}
                color="#f59e0b"
                index={2}
              />
              <StatTile
                icon={Sun}
                label="Today"
                hint="Active stays"
                value={stats.today}
                color="#8b5cf6"
                index={3}
              />
            </>
          )}
        </div>

        {/* ── Toolbar ── */}
        <div className={cn(PANEL, "p-3")}>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-[320px]">
              <Search
                size={14}
                strokeWidth={2.2}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest, booking ID or service"
                aria-label="Search bookings"
                className={cn("h-10 pl-9", CONTROL)}
              />
            </div>

            <FilterPill
              icon={<Package size={14} className="text-muted-foreground" />}
              label={serviceFilter === "all" ? "All services" : serviceFilter}
            >
              <DropdownMenuItem
                className={FILTER_ITEM_CLASS}
                onClick={() => setServiceFilter("all")}
              >
                All services
              </DropdownMenuItem>
              {vehicleNames.map((name) => (
                <DropdownMenuItem
                  key={name}
                  className={FILTER_ITEM_CLASS}
                  onClick={() => setServiceFilter(name)}
                >
                  {name}
                </DropdownMenuItem>
              ))}
            </FilterPill>

            {/* Month selector */}
            <div className="flex items-center gap-1.5 h-10 pl-3 pr-1.5 rounded-xl border border-border bg-muted/50 dark:bg-white/5">
              <CalendarIcon size={14} className="text-muted-foreground" />
              <DateNavigation
                currentMonth={currentMonth}
                currentYear={currentYear}
                onMonthChange={setCurrentMonth}
                onYearChange={setCurrentYear}
              />
            </div>

            <FilterPill
              icon={<LayoutGrid size={14} className="text-muted-foreground" />}
              label={viewMode === "month" ? "Month view" : "Week view"}
            >
              <DropdownMenuItem className={FILTER_ITEM_CLASS} onClick={() => setViewMode("month")}>
                Month view
              </DropdownMenuItem>
              <DropdownMenuItem
                className={FILTER_ITEM_CLASS}
                onClick={() => setViewMode("week")}
                disabled
              >
                Week view (soon)
              </DropdownMenuItem>
            </FilterPill>
          </div>
        </div>

        {/* ── Calendar ── */}
        <Panel>
          <PanelHead
            icon={CalendarIcon}
            title={monthLabel}
            blurb="Click an empty cell to book it · drag a booking to move it"
            aside={
              <span className="hidden md:inline-flex items-center text-[11.5px] tabular-nums text-muted-foreground">
                {filteredBookings.length} shown
              </span>
            }
          />

          <div className="p-3" key={`${currentYear}-${currentMonth}`}>
            {loading ? (
              <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="text-[13px]">Loading bookings…</span>
              </div>
            ) : (
              <CalendarGrid
                currentMonth={currentMonth}
                currentYear={currentYear}
                bookings={filteredBookings}
                onBookingClick={handleBookingClick}
                onBookingDrag={handleBookingDrag}
                onDateClick={handleDateClick}
                onNewBooking={(resource) => goToNewBooking(undefined, resource)}
                selectedDate={selectedDate}
                vehicleNames={vehicleNames}
              />
            )}
          </div>

          <footer className={PANEL_FOOTER}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {LEGEND.map((l) => (
                <span
                  key={l.label}
                  className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground"
                >
                  <span className={cn("w-2 h-2 rounded-full", l.dot)} />
                  {l.label}
                </span>
              ))}
            </div>
            <p className="hidden sm:block text-[11.5px] text-muted-foreground">
              {vehicleNames.length} service{vehicleNames.length === 1 ? "" : "s"}
            </p>
          </footer>
        </Panel>
      </div>
    </DashboardLayout>
  );
};

export default Bookings;
