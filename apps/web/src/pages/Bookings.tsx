import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  Search,
  Package,
  Calendar as CalendarIcon,
  CalendarPlus,
  IndianRupee,
  Clock,
  Sun,
  ChevronDown,
  Pencil,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import {
  AdminDetailDrawer,
  DetailField,
  DetailNote,
  DetailSection,
} from "@/components/admin/AdminDetailDrawer";
import {
  BRAND_VARS,
  BTN_NEUTRAL,
  BTN_PRIMARY,
  BTN_RAW,
  CONTROL,
  EmptyState,
  PANEL_FLUSH,
  PANEL_FOOTER,
  PANEL_HEAD,
  PILL_NEUTRAL,
  StatTile,
  StatTileSkeleton,
  StatusBadge,
  TabStrip,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBookingResources } from "@/hooks/useBookingResources";
import { useTableUrlState } from "@/components/admin/useTableUrlState";
import { avatarTint } from "@/components/bookings/BookingDrawer";
import { getInitials } from "@/utils/getInitials";

import {
  type BookingData,
  fetchBookings,
  updateBookingDates,
  CalendarGrid,
  DateNavigation,
} from "@/components/bookings";
import { currencyINR, toAmount } from "@/utils/currency";

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
          "inline-flex items-center gap-2 h-9 px-3 rounded-lg border whitespace-nowrap",
          "text-[13px] font-semibold text-foreground/85 bg-card border-border",
          "outline-none transition-colors duration-150 hover:bg-muted",
          "focus-visible:ring-4 focus-visible:ring-brand/15 focus-visible:border-brand",
        )}
      >
        {icon}
        <span className="max-w-[140px] truncate">{label}</span>
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      style={BRAND_VARS}
      data-console-portal=""
      className="w-52 p-1.5"
    >
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

/* ── Calendar booking inspector ───────────────────────────────────────────────
   Clicking a bar used to navigate straight to `/bookings/:id/edit`, so glancing
   at a reservation cost you the month you were reading and dropped you into a
   six-group form. It opens beside the grid now; Edit is one click from the
   footer for when editing is actually what you meant. */

const CalendarBookingDrawer = ({
  booking,
  open,
  onClose,
  onEdit,
}: {
  booking: BookingData | null;
  open: boolean;
  onClose: () => void;
  onEdit: (b: BookingData) => void;
}) => {
  if (!booking) return null;

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const pending = toAmount(booking.pendingAmount);

  return (
    <AdminDetailDrawer
      open={open}
      onClose={onClose}
      portalScope="vendor"
      eyebrow="Booking"
      title={booking.guestName || "Guest"}
      subtitle={`${booking.bookingId} · ${booking.resourceName}`}
      media={
        <span
          className={cn(
            "grid place-items-center w-11 h-11 rounded-full text-[14px] font-bold",
            avatarTint(booking.guestName ?? "?"),
          )}
          aria-hidden
        >
          {getInitials(booking.guestName || "?")}
        </span>
      }
      status={
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={booking.status} size="sm" />
          <StatusBadge status={booking.paymentStatus} size="sm" />
          {pending > 0 && (
            <span className="text-[11.5px] font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              {currencyINR(pending)} outstanding
            </span>
          )}
        </div>
      }
      footer={
        <>
          <button onClick={onClose} className={`${BTN_RAW} ${BTN_NEUTRAL}`}>
            Close
          </button>
          <button onClick={() => onEdit(booking)} className={`${BTN_RAW} ${BTN_PRIMARY}`}>
            <Pencil size={14} strokeWidth={2.2} />
            Edit booking
          </button>
        </>
      }
    >
      <DetailSection title="Stay" columns={2}>
        <DetailField label="Check in" value={fmt(booking.startDate)} />
        <DetailField label="Check out" value={fmt(booking.endDate)} />
        <DetailField label="Nights" value={booking.totalDays} />
        <DetailField label="Service" value={booking.resourceName} />
        <DetailField label="Adults" value={booking.adults} />
        <DetailField label="Children" value={booking.children} />
      </DetailSection>

      <DetailSection title="Payment" columns={2}>
        <DetailField label="Base price" value={currencyINR(toAmount(booking.basePrice))} />
        <DetailField label="Extra charges" value={currencyINR(toAmount(booking.extraCharges))} />
        <DetailField label="Total" value={currencyINR(toAmount(booking.totalAmount))} />
        <DetailField label="Paid" value={currencyINR(toAmount(booking.paidAmount))} />
        <DetailField label="Outstanding" value={currencyINR(pending)} />
        <DetailField label="Method" value={booking.paymentMethod} />
      </DetailSection>

      <DetailSection title="Guest" columns={2}>
        <DetailField label="Name" value={booking.guestName} />
        <DetailField label="Total guests" value={booking.totalGuests} />
        <DetailField label="Phone" value={booking.phoneNumber} />
        <DetailField label="Email" value={booking.email} />
        {booking.specialRequests && <DetailNote>{booking.specialRequests}</DetailNote>}
        {booking.notes && <DetailNote>{booking.notes}</DetailNote>}
      </DetailSection>
    </AdminDetailDrawer>
  );
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

const Bookings = () => {
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();
  const queryClient = useQueryClient();
  const token = authToken ?? undefined;

  /* View state lives in the URL: the month you are looking at, what you searched
     for, which service you filtered to and which booking is open. A vendor can
     now send "the calendar I'm looking at" as a link, and a refresh mid-task
     doesn't drop them back on the current month with an empty search — which is
     what `useState` did on every one of these. */
  const url = useTableUrlState({
    filters: [
      { key: "service", type: "select" },
      { key: "month", type: "select" },
      { key: "year", type: "select" },
    ],
  });

  const now = new Date();
  const currentMonth = Number(url.filters.month ?? now.getMonth());
  const currentYear = Number(url.filters.year ?? now.getFullYear());
  const serviceFilter = (url.filters.service as string) ?? "all";
  const searchQuery = url.q;

  const setMonth = (m: number) => url.setFilters({ ...url.filters, month: String(m) });
  const setYear = (y: number) => url.setFilters({ ...url.filters, year: String(y) });
  const setServiceFilter = (s: string) =>
    url.setFilters({ ...url.filters, service: s === "all" ? "" : s });

  const [vehicleNames, setVehicleNames] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<{ date: number; resource: string } | null>(null);

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

  const openBooking = useMemo(
    () => filteredBookings.find((b) => b._id === url.selectedId) ?? null,
    [filteredBookings, url.selectedId],
  );

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

  /* Calendar and list are two views of one dataset, so they belong on one tab
     strip rather than being two unrelated rail entries a vendor has to know
     about. The strip lives on the header band's bottom edge — switching it
     visibly swaps the whole body. */
  const tabs = (
    <TabStrip
      variant="flush"
      tabs={[
        { key: "calendar", label: "Calendar" },
        { key: "list", label: "All records" },
      ]}
      activeKey="calendar"
      onChange={(k) => k === "list" && navigate("/bookings/details")}
    />
  );

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      title="Bookings"
      subtitle="Every reservation across your offerings — drag to move a stay, click an empty cell to create one."
      tabs={tabs}
      headerActions={
        <button onClick={() => goToNewBooking()} className={`${BTN_RAW} ${BTN_PRIMARY}`}>
          <CalendarPlus size={15} strokeWidth={2.4} />
          New booking
        </button>
      }
      /* Wider than the other console pages on purpose — this is a month ×
         resource grid, and squeezing it to the standard container only adds
         horizontal scrolling. */
      contentClassName="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 lg:pb-10"
    >
      <div style={BRAND_VARS} className="space-y-5">
        {/* ── Metrics ── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatTileSkeleton key={i} />)
          ) : (
            <>
              <StatTile
                icon={CalendarIcon}
                label="Bookings"
                hint={monthLabel}
                value={stats.total}
                index={0}
              />
              <StatTile
                icon={IndianRupee}
                label="Billed"
                hint="Total for this month"
                value={currencyINR(stats.revenue)}
                index={1}
              />
              <StatTile
                icon={Clock}
                label="Outstanding"
                hint={stats.pending > 0 ? "Yet to collect" : "Everything collected"}
                value={currencyINR(stats.pending)}
                index={2}
              />
              <StatTile
                icon={Sun}
                label="In-house today"
                hint="Guests currently staying"
                value={stats.today}
                index={3}
              />
            </>
          )}
        </div>

        {/* ── Calendar ──
            The toolbar is the card's OWN header row rather than a separate
            floating bar above it: search + filters describe the grid below
            them, and a second card in between made the page read as two
            unrelated panels stacked. */}
        <section className={PANEL_FLUSH}>
          <div className={cn(PANEL_HEAD, "flex-wrap items-center gap-2.5")}>
            <div className="relative flex-1 min-w-[180px] max-w-[320px]">
              <Search
                size={14}
                strokeWidth={2.2}
                aria-hidden
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
              />
              <Input
                value={searchQuery}
                onChange={(e) => url.setQ(e.target.value)}
                placeholder="Search guest, booking ID or service"
                aria-label="Search bookings"
                className={cn(CONTROL, "h-9 pl-9 text-[13px]")}
              />
            </div>

            <FilterPill
              icon={<Package size={14} className="text-muted-foreground" aria-hidden />}
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
            <div className="flex items-center gap-1.5 h-9 pl-3 pr-1 rounded-lg border border-border bg-card">
              <CalendarIcon size={14} className="text-muted-foreground" aria-hidden />
              <DateNavigation
                currentMonth={currentMonth}
                currentYear={currentYear}
                onMonthChange={setMonth}
                onYearChange={setYear}
              />
            </div>

            {url.hasActiveQuery && (
              <button
                onClick={url.clearQuery}
                className={cn(PILL_NEUTRAL, "h-9 hover:bg-muted/70 transition-colors")}
              >
                <X size={13} strokeWidth={2.4} aria-hidden />
                Clear
              </button>
            )}

            <span className="ml-auto hidden md:inline-flex items-center text-[12px] tabular-nums text-muted-foreground">
              {filteredBookings.length} shown
            </span>
          </div>

          <div className="p-3" key={`${currentYear}-${currentMonth}`}>
            {loading ? (
              /* Grid-shaped skeleton, not a spinner: the calendar is ~420px
                 tall and a centred spinner collapses the panel, so the page
                 jumps the moment data lands. */
              <div className="space-y-2" aria-label="Loading bookings">
                <div className="h-8 rounded-lg bg-muted animate-pulse" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredBookings.length === 0 && url.hasActiveQuery ? (
              <EmptyState
                icon={Search}
                title="No bookings match your filters"
                description="Try a different service, a different month, or clear the search."
                actionLabel="Clear filters"
                onAction={url.clearQuery}
              />
            ) : (
              <CalendarGrid
                currentMonth={currentMonth}
                currentYear={currentYear}
                bookings={filteredBookings}
                onBookingClick={(b) => url.setSelectedId(b._id)}
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
                  <span className={cn("w-2 h-2 rounded-full", l.dot)} aria-hidden />
                  {l.label}
                </span>
              ))}
            </div>
            <p className="hidden sm:block text-[11.5px] text-muted-foreground">
              {vehicleNames.length} service{vehicleNames.length === 1 ? "" : "s"}
            </p>
          </footer>
        </section>
      </div>

      <CalendarBookingDrawer
        booking={openBooking}
        open={!!openBooking}
        onClose={() => url.setSelectedId(null)}
        onEdit={(b) => navigate(`/bookings/${b._id}/edit`)}
      />
    </DashboardLayout>
  );
};

export default Bookings;
