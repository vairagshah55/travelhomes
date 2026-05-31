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
import { cn } from "@/lib/utils";

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
        className="inline-flex items-center gap-2 h-[42px] px-3.5 rounded-[12px] border border-th-warm-border bg-th-surface-0 text-[13px] font-semibold text-th-text-primary cursor-pointer tracking-[-0.005em] whitespace-nowrap"
      >
        {icon}
        {label}
        <ChevronDown size={14} className="text-th-warm-text-muted" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-52 p-1.5">
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);

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
}> = ({ icon, label, value, hint, accent = "#0F5C8A" }) => (
  <div className="bg-th-surface-0 border border-th-warm-border rounded-[16px] px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3">
    <div
      className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0 border-[1.5px]"
      style={{
        backgroundColor: `${accent}14`,
        borderColor: `${accent}30`,
      }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10.5px] font-bold text-th-warm-text-muted uppercase tracking-[0.04em] mb-[2px]">
        {label}
      </p>
      <p className="text-[18px] font-extrabold text-th-text-primary tracking-[-0.02em] leading-[1.1] whitespace-nowrap overflow-hidden text-ellipsis">
        {value}
      </p>
      {hint && (
        <p className="text-[10.5px] text-th-warm-text-dark mt-[2px]">{hint}</p>
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
  const [services, setServices] = useState<
    { name: string; type: "camper-van" | "unique-stay" | "activity" }[]
  >([]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [selectedDate, setSelectedDate] = useState<{ date: number; resource: string } | null>(null);
  const [newBookingForm, setNewBookingForm] = useState<NewBookingForm>(EMPTY_BOOKING_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      <div className="bg-th-surface-0 border border-[#EBEBEB] rounded-[20px] px-[22px] py-5 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)] min-h-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-5 pb-4 gap-4 border-b border-[#EBEBEB]">
          <div>
            <h1 className="text-[22px] font-extrabold text-th-text-primary tracking-[-0.025em] leading-[1.2]">
              Calendar
            </h1>
            <p className="text-[13px] text-th-warm-text-muted mt-[3px]">
              Manage appointments and schedules
            </p>
          </div>
          <button
            type="button"
            onClick={handleNewBooking}
            className="flex items-center gap-2 h-[42px] px-5 rounded-[13px] border-none bg-th-brand text-[13px] font-bold text-th-text-inverse cursor-pointer shadow-[0_4px_16px_rgba(15,92,138,0.30)] w-fit"
          >
            <Plus size={16} strokeWidth={2.5} /> New Booking
          </button>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          {/* Search */}
          <div
            className="flex items-center gap-2 h-[42px] px-3 rounded-[12px] border border-th-warm-border bg-th-surface-0"
            style={{ flex: "1 1 220px", minWidth: 200, maxWidth: 320 }}
          >
            <Search size={15} className="text-th-warm-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookings, guest, ID…"
              className="flex-1 h-full border-none outline-none text-[13px] text-th-text-primary bg-transparent font-[450]"
            />
          </div>

          {/* Service filter */}
          <FilterPill
            icon={<Package size={14} className="text-th-warm-text-muted" />}
            label={serviceFilter === "all" ? "All Services" : serviceFilter}
          >
            <DropdownMenuItem className={FILTER_ITEM_CLASS} onClick={() => setServiceFilter("all")}>
              All Services
            </DropdownMenuItem>
            {vehicleNames.map((name) => (
              <DropdownMenuItem key={name} className={FILTER_ITEM_CLASS} onClick={() => setServiceFilter(name)}>
                {name}
              </DropdownMenuItem>
            ))}
          </FilterPill>

          {/* Month selector */}
          <div className="flex items-center h-[42px] pl-3 pr-1.5 rounded-[12px] border border-th-warm-border bg-th-surface-0 gap-1.5">
            <CalendarIcon size={14} className="text-th-warm-text-muted" />
            <DateNavigation
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={setCurrentMonth}
              onYearChange={setCurrentYear}
            />
          </div>

          {/* View mode */}
          <FilterPill
            icon={<LayoutGrid size={14} className="text-th-warm-text-muted" />}
            label={viewMode === "month" ? "Month View" : "Week View"}
          >
            <DropdownMenuItem className={FILTER_ITEM_CLASS} onClick={() => setViewMode("month")}>
              Month View
            </DropdownMenuItem>
            <DropdownMenuItem className={FILTER_ITEM_CLASS} onClick={() => setViewMode("week")} disabled>
              Week View (soon)
            </DropdownMenuItem>
          </FilterPill>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard
            icon={<CalendarIcon size={15} className="text-th-brand" strokeWidth={2.2} />}
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
            <div className="flex items-center justify-center h-64 gap-2 text-th-warm-text-muted">
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
