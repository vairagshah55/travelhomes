import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  Plus,
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
import { ConfirmModal } from "@/components/shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { offersApi, activitiesApi } from "@/lib/api";
import { TEAL, BLACK, GRAY_400 } from "@/components/offering";

import {
  type BookingData,
  type NewBookingForm,
  EMPTY_BOOKING_FORM,
  fetchBookings,
  createBooking,
  updateBooking,
  updateBookingDates,
  deleteBooking,
  printInvoice,
  CalendarGrid,
  DateNavigation,
  NewBookingModal,
  EditBookingModal,
} from "@/components/bookings";

// Local brand tokens kept in sync with the rest of the bookings UI.
const GRAY_200 = "#e4e4e4";
const GRAY_500 = "#6b6b6b";
const WHITE = "#ffffff";

/* ── Filter dropdown trigger (search-row chip) ──────────────────────────────── */
const FilterPill: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}> = ({ icon, label, children }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 42,
          padding: "0 14px",
          borderRadius: 12,
          border: `1.5px solid ${GRAY_200}`,
          backgroundColor: WHITE,
          fontSize: 13,
          fontWeight: 600,
          color: BLACK,
          cursor: "pointer",
          letterSpacing: "-0.005em",
          whiteSpace: "nowrap",
        }}
      >
        {icon}
        {label}
        <ChevronDown size={14} color={GRAY_400} />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-52 p-1.5">
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);

// Tailwind classes for the filter dropdown items. The project's default
// `focus:bg-accent` was rendering with a near-invisible tint; this explicit
// teal-pill highlight makes hover and keyboard navigation legible.
const FILTER_ITEM_CLASS =
  "cursor-pointer rounded-md px-2.5 py-2 text-[13px] font-medium text-[#131313] " +
  "transition-colors " +
  "focus:bg-[rgba(15,92,138,0.10)] focus:text-[#0F5C8A] " +
  "data-[highlighted]:bg-[rgba(15,92,138,0.10)] data-[highlighted]:text-[#0F5C8A] " +
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed";

/* ── Stats card ─────────────────────────────────────────────────────────────── */
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}> = ({ icon, label, value, hint, accent = TEAL }) => (
  <div
    style={{
      backgroundColor: WHITE,
      border: `1.5px solid ${GRAY_200}`,
      borderRadius: 16,
      padding: "14px 16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: `${accent}14`,
        border: `1.5px solid ${accent}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <p
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: GRAY_400,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 2,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: BLACK,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </p>
      {hint && (
        <p style={{ fontSize: 10.5, color: GRAY_500, marginTop: 2 }}>{hint}</p>
      )}
    </div>
  </div>
);

const Bookings = () => {
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();
  const queryClient = useQueryClient();
  const token = authToken ?? undefined;

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [vehicleNames, setVehicleNames] = useState<string[]>([]);
  // Structured service list with category metadata, so the New Booking modal
  // can render a grouped dropdown (Camper Vans / Unique Stays / Activities)
  // instead of a flat name list.
  const [services, setServices] = useState<
    { name: string; type: "camper-van" | "unique-stay" | "activity" }[]
  >([]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [selectedDate, setSelectedDate] = useState<{ date: number; resource: string } | null>(null);
  const [newBookingForm, setNewBookingForm] = useState<NewBookingForm>(EMPTY_BOOKING_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter / view-mode UI state. viewMode is a placeholder — only Month view
  // is wired into CalendarGrid today; Week is shown in the dropdown for
  // parity with the design and will route through here when implemented.
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

  // ─── Resources (offers + activities) used to populate vehicleNames ─────────
  // Stable cache key per (user, token) — reuses across month/year navigation.
  useQuery({
    queryKey: ["bookings", "resources", user?.id, token],
    enabled: !!user,
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (user!.userType === "vendor" && user!.id) {
        params.vendorId = user!.id;
        params.mine = true;
      }
      const resOffers = await offersApi.list(undefined, token, params);

      let activityData: any[] = [];
      if (token && user!.userType === "vendor") {
        const my = await activitiesApi.myList(token);
        if (my.success) activityData = my.data;
      } else {
        const all = await activitiesApi.list();
        if (all.success) activityData = all.data;
      }

      const names: string[] = [];
      const structured: { name: string; type: "camper-van" | "unique-stay" | "activity" }[] = [];
      if (resOffers.success) {
        let offers = resOffers.data;
        if (user!.userType === "vendor" && user!.id) {
          offers = offers.filter((o) => o.vendorId === user!.id);
        }
        for (const o of offers) {
          names.push(o.name);
          const t = (o.serviceType || "").toLowerCase();
          structured.push({
            name: o.name,
            // Fall back to camper-van for legacy rows missing serviceType.
            type: t === "unique-stay" ? "unique-stay" : t === "activity" ? "activity" : "camper-van",
          });
        }
      }
      if (activityData.length > 0) {
        for (const a of activityData) {
          names.push(a.title);
          structured.push({ name: a.title, type: "activity" });
        }
      }

      const next = names.length > 0 ? names : ["No Service Available"];
      setVehicleNames(next);
      setServices(structured);
      return next;
    },
  });

  // ─── Bookings list — keyed by (month, year, user, token) ───────────────────
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
  const handleNewBooking = () => {
    if (selectedDate) {
      const ds = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${selectedDate.date.toString().padStart(2, "0")}`;
      setNewBookingForm((p) => ({
        ...p,
        resourceName: selectedDate.resource,
        startDate: ds,
        endDate: ds,
      }));
    }
    setIsNewModalOpen(true);
  };

  const handleBookingClick = (b: BookingData) => {
    setSelectedBooking(b);
    setIsEditModalOpen(true);
  };

  const handleDateClick = (date: number, resource: string) => {
    const ds = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${date.toString().padStart(2, "0")}`;
    setSelectedDate({ date, resource });
    setNewBookingForm((p) => ({ ...p, resourceName: resource, startDate: ds, endDate: ds }));
    setIsNewModalOpen(true);
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

  const handleCreateBooking = async () => {
    if (
      !newBookingForm.guestName ||
      !newBookingForm.resourceName ||
      !newBookingForm.startDate ||
      !newBookingForm.endDate
    ) {
      notify("error", "Please fill all required fields");
      return;
    }
    if (new Date(newBookingForm.startDate) > new Date(newBookingForm.endDate)) {
      notify("error", "End date must be after start date");
      return;
    }
    try {
      const nb = await createBooking(newBookingForm, token, user?.email);
      if (nb) {
        queryClient.setQueryData<BookingData[]>(bookingsKey, (p) => [...(p ?? []), nb]);
        setIsNewModalOpen(false);
        setNewBookingForm(EMPTY_BOOKING_FORM);
        setSelectedDate(null);
        notify("success", "Booking created");
        setTimeout(() => {
          try {
            printInvoice(nb, token);
          } catch {}
        }, 500);
      }
    } catch (e: any) {
      notify("error", e.message || "Failed to create");
    }
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    try {
      const base = Number(selectedBooking.basePrice || 0),
        extra = Number(selectedBooking.extraCharges || 0),
        paid = Number(selectedBooking.paidAmount || 0);
      const updated = await updateBooking(
        selectedBooking._id,
        {
          ...selectedBooking,
          totalAmount: String(base + extra),
          pendingAmount: String(base + extra - paid),
        },
        token,
      );
      if (updated) {
        queryClient.setQueryData<BookingData[]>(bookingsKey, (p) =>
          (p ?? []).map((b) => (b._id === selectedBooking._id ? updated : b)),
        );
        setIsEditModalOpen(false);
        setSelectedBooking(null);
        notify("success", "Booking updated");
      }
    } catch (e: any) {
      notify("error", e.message || "Failed to update");
    }
  };

  const handleDeleteBooking = (id: string) => {
    setConfirmDeleteId(id);
  };

  const doDeleteBooking = async (id: string) => {
    try {
      if (await deleteBooking(id, token)) {
        queryClient.setQueryData<BookingData[]>(bookingsKey, (p) =>
          (p ?? []).filter((b) => b._id !== id),
        );
        setIsEditModalOpen(false);
        setSelectedBooking(null);
        notify("success", "Booking deleted");
      }
    } catch (e: any) {
      notify("error", e.message || "Failed to delete");
    }
  };

  // Vendor visibility + UI filters (search by guest/booking, service dropdown).
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

  // Stats — derived from the same filtered set, so changing the service or
  // search query immediately updates the cards.
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let revenue = 0;
    let pending = 0;
    let todayCount = 0;
    for (const b of filteredBookings) {
      revenue += Number(b.totalAmount || 0);
      pending += Number(b.pendingAmount || 0);
      const s = new Date(b.startDate); s.setHours(0, 0, 0, 0);
      const e = new Date(b.endDate); e.setHours(0, 0, 0, 0);
      if (today >= s && today <= e && b.status !== "Cancelled") todayCount += 1;
    }
    return { total: filteredBookings.length, revenue, pending, today: todayCount };
  }, [filteredBookings]);

  const currencyINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      title="Bookings"
      outerClassName="overflow-hidden"
      contentClassName="flex-1 overflow-auto p-3 lg:p-5"
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1.5px solid #EBEBEB",
          borderRadius: 20,
          padding: "20px 22px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
          minHeight: "100%",
        }}
      >
        {/* Header */}
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between mb-5 pb-4 gap-4"
          style={{ borderBottom: "1.5px solid #EBEBEB" }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: BLACK,
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              Calendar
            </h1>
            <p style={{ fontSize: 13, color: GRAY_400, marginTop: 3 }}>
              Manage appointments and schedules
            </p>
          </div>
          <button
            type="button"
            onClick={handleNewBooking}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 42,
              padding: "0 20px",
              borderRadius: 13,
              border: "none",
              backgroundColor: TEAL,
              fontSize: 13,
              fontWeight: 700,
              color: WHITE,
              cursor: "pointer",
              // Drop shadow tinted with the actual brand teal — the previous
              // cyan rgba was a leftover from the older palette.
              boxShadow: "0 4px 16px rgba(15, 92, 138, 0.30)",
              width: "fit-content",
            }}
          >
            <Plus size={16} strokeWidth={2.5} /> New Booking
          </button>
        </div>

        {/* Filters row — search + service + month + view selectors */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          {/* Search */}
          <div
            className="flex items-center"
            style={{
              flex: "1 1 220px",
              minWidth: 200,
              maxWidth: 320,
              height: 42,
              borderRadius: 12,
              border: `1.5px solid ${GRAY_200}`,
              backgroundColor: WHITE,
              padding: "0 12px",
              gap: 8,
            }}
          >
            <Search size={15} color={GRAY_400} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookings, guest, ID…"
              style={{
                flex: 1,
                height: "100%",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: BLACK,
                backgroundColor: "transparent",
                fontWeight: 450,
              }}
            />
          </div>

          {/* Service filter */}
          <FilterPill
            icon={<Package size={14} color={GRAY_400} />}
            label={serviceFilter === "all" ? "All Services" : serviceFilter}
          >
            <DropdownMenuItem
              className={FILTER_ITEM_CLASS}
              onClick={() => setServiceFilter("all")}
            >
              All Services
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

          {/* Month selector — reuses the existing DateNavigation dropdown */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 42,
              padding: "0 6px 0 12px",
              borderRadius: 12,
              border: `1.5px solid ${GRAY_200}`,
              backgroundColor: WHITE,
              gap: 6,
            }}
          >
            <CalendarIcon size={14} color={GRAY_400} />
            <DateNavigation
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={setCurrentMonth}
              onYearChange={setCurrentYear}
            />
          </div>

          {/* View mode — placeholder until Week view ships */}
          <FilterPill
            icon={<LayoutGrid size={14} color={GRAY_400} />}
            label={viewMode === "month" ? "Month View" : "Week View"}
          >
            <DropdownMenuItem
              className={FILTER_ITEM_CLASS}
              onClick={() => setViewMode("month")}
            >
              Month View
            </DropdownMenuItem>
            <DropdownMenuItem
              className={FILTER_ITEM_CLASS}
              onClick={() => setViewMode("week")}
              disabled
            >
              Week View (soon)
            </DropdownMenuItem>
          </FilterPill>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard
            icon={<CalendarIcon size={15} color={TEAL} strokeWidth={2.2} />}
            label="Bookings"
            value={String(stats.total)}
            hint="This month"
          />
          <StatCard
            icon={<IndianRupee size={15} color="#22c55e" strokeWidth={2.2} />}
            label="Revenue"
            value={currencyINR(stats.revenue)}
            hint="Total billed"
            accent="#22c55e"
          />
          <StatCard
            icon={<Clock size={15} color="#f59e0b" strokeWidth={2.2} />}
            label="Pending"
            value={currencyINR(stats.pending)}
            hint="Yet to collect"
            accent="#f59e0b"
          />
          <StatCard
            icon={<Sun size={15} color="#8b5cf6" strokeWidth={2.2} />}
            label="Today"
            value={String(stats.today)}
            hint="Active stays"
            accent="#8b5cf6"
          />
        </div>

        {/* Calendar */}
        <div className="overflow-auto" key={`${currentYear}-${currentMonth}`}>
          {loading ? (
            <div
              className="flex items-center justify-center h-64 gap-2"
              style={{ color: GRAY_400 }}
            >
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span style={{ fontSize: 13 }}>Loading bookings…</span>
            </div>
          ) : (
            <CalendarGrid
              currentMonth={currentMonth}
              currentYear={currentYear}
              bookings={filteredBookings}
              onBookingClick={handleBookingClick}
              onBookingDrag={handleBookingDrag}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
              vehicleNames={vehicleNames}
            />
          )}
        </div>
      </div>

      <NewBookingModal
        open={isNewModalOpen}
        onOpenChange={setIsNewModalOpen}
        form={newBookingForm}
        setForm={setNewBookingForm}
        vehicleNames={vehicleNames}
        services={services}
        onCreate={handleCreateBooking}
        onAddService={() => navigate("/offering/add")}
      />
      <EditBookingModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        booking={selectedBooking}
        setBooking={setSelectedBooking}
        onUpdate={handleUpdateBooking}
        onDelete={handleDeleteBooking}
        onPrint={(b) => {
          try {
            printInvoice(b, token);
          } catch {
            notify("error", "Failed to print invoice");
          }
        }}
      />
      <ConfirmModal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { if (confirmDeleteId) { doDeleteBooking(confirmDeleteId); setConfirmDeleteId(null); } }}
        title="Delete booking?"
        description="This booking will be permanently removed and cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </DashboardLayout>
  );
};

export default Bookings;
