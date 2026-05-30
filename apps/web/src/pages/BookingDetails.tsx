import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  Plus,
  Users,
  Car,
  Home,
  MapPin,
  Pencil,
  Trash2,
  Ban,
  Printer,
  Eye,
  Save,
  Calendar,
  User,
  Mail,
  Phone,
  IndianRupee,
  Clock,
  CalendarX,
  Search,
  ChevronDown,
  Activity,
  CalendarDays,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/DashboardLayout";
import { bookingDetailsApi, offersApi, activitiesApi, type BookingDetailDTO } from "@/lib/api";
import { formatDate } from "@/utils/formateTime";
import { SlidePanel } from "@/components/bookings";
import {
  TEAL,
  TEAL_BG,
  BLACK,
  GRAY_500,
  GRAY_400,
  GRAY_200,
  WHITE,
  SURFACE,
} from "@/components/offering";
import {
  PanelInput,
  PanelSelect,
  InfoRow,
  parseBookingDate,
  isDateInRange,
  categorizeBooking,
  LOCATIONS,
} from "@/components/bookings/BookingDetailsHelpers";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";

const ITEMS_PER_PAGE = 15;

/* ── Stats card ─────────────────────────────────────────────────────────── */
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
      {hint && <p style={{ fontSize: 10.5, color: GRAY_500, marginTop: 2 }}>{hint}</p>}
    </div>
  </div>
);

/* ── Filter dropdown pill ──────────────────────────────────────────────── */
const FilterPill: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
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
          whiteSpace: "nowrap",
        }}
      >
        {label}
        <ChevronDown size={14} color={GRAY_400} />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-48 p-1.5">
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);

const FILTER_ITEM_CLASS =
  "cursor-pointer rounded-md px-2.5 py-2 text-[13px] font-medium text-[#131313] " +
  "transition-colors " +
  "focus:bg-[rgba(15,92,138,0.10)] focus:text-[#0F5C8A] " +
  "data-[highlighted]:bg-[rgba(15,92,138,0.10)] data-[highlighted]:text-[#0F5C8A]";

const BookingDetails = () => {
  const { user, token: authToken } = useAuth();
  const token = authToken ?? undefined;

  const [activeTab, setActiveTab] = useState("upcoming");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "confirmed" | "active" | "cancelled"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Panel states
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    variant: "danger" | "warning";
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({
    serviceName: "",
    customerName: "",
    email: "",
    phone: "",
    checkInDate: "",
    checkInTime: "",
    checkOutDate: "",
    checkOutTime: "",
    locationFrom: "",
    locationTo: "",
    pickupLocation: "",
    servicePrice: "",
    guests: "",
    status: "pending",
    serviceType: "van",
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Edit form
  const [editForm, setEditForm] = useState({
    serviceName: "",
    customerName: "",
    email: "",
    phone: "",
    checkInDate: "",
    checkInTime: "",
    checkOutDate: "",
    checkOutTime: "",
    locationFrom: "",
    servicePrice: "",
    guests: "",
    status: "pending",
  });

  // Reset to page 1 when tab or filter changes
  React.useEffect(() => { setCurrentPage(1); }, [activeTab, timeFilter]);

  // ─── Data loading ──────────────────────────────────────────────────────────
  const bookingsKey = ["bookingDetails", "list", user?.id, token] as const;
  const { data: bookings = [], isLoading, isError, refetch } = useQuery<BookingDetailDTO[]>({
    queryKey: bookingsKey,
    enabled: !!(user || token),
    queryFn: async () => {
      const params: Record<string, any> = { mine: true };
      if (user?.userType === "vendor" && user.email) {
        params.vendorEmail = user.email;
        if (user.id) params.vendorId = user.id;
      }
      try {
        const res = await bookingDetailsApi.list(token, params);
        return (res as any)?.data || [];
      } catch (e: any) {
        toast.error(e?.message || "Failed to load bookings");
        throw e;
      }
    },
  });

  const { data: availableServices = [] } = useQuery<
    { name: string; type: string; vendorId?: string }[]
  >({
    queryKey: ["bookingDetails", "services", user?.id, token],
    enabled: !!(user || token),
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (user?.userType === "vendor" && user?.id) {
        params.vendorId = user.id;
        params.mine = true;
      }
      const res = await offersApi.list(undefined, token, params);
      const svcs: { name: string; type: string; vendorId?: string }[] = [];
      if (res.success) {
        svcs.push(
          ...res.data.map((o) => ({
            name: o.name,
            type: o.category?.toLowerCase().includes("stay") ? "unique-stays" : "van",
            vendorId: o.vendorId,
          })),
        );
      }
      let acts: any[] = [];
      if (token && user?.userType === "vendor") {
        const r = await activitiesApi.myList(token);
        if (r.success) acts = r.data;
      } else {
        const r = await activitiesApi.list();
        if (r.success) acts = r.data;
      }
      if (acts.length > 0) {
        svcs.push(
          ...acts.map((a: any) => ({ name: a.title, type: "activity", vendorId: a.vendorId })),
        );
      }
      return svcs;
    },
  });

  // ─── Filtering ─────────────────────────────────────────────────────────────
  // Vendor visibility + tab + time + status + search. The vendor + tab + time
  // checks were already here; status + search are new.
  const visibleBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (user?.userType === "vendor") {
        const svcNames = availableServices.map((s) => s.name);
        const isTheirs =
          svcNames.includes(b.serviceName) ||
          (b as any).vendorId === user.id ||
          (b.contactEmail && b.contactEmail === user.email);
        if (!isTheirs) return false;
      }
      return true;
    });
  }, [bookings, user, availableServices]);

  // Counts per tab — used in the tab labels so the user can see distribution
  // at a glance.
  const tabCounts = useMemo(() => {
    const counts = { upcoming: 0, past: 0, cancelled: 0 };
    for (const b of visibleBookings) {
      const c = categorizeBooking(b);
      if (c === "upcoming") counts.upcoming += 1;
      else if (c === "past") counts.past += 1;
      else if (c === "cancelled") counts.cancelled += 1;
    }
    return counts;
  }, [visibleBookings]);

  // KPI stats — derived from the visible-to-user set so vendors see their
  // own numbers, not platform-wide totals.
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let todayCount = 0;
    let activeCount = 0;
    let revenue = 0;
    for (const b of visibleBookings) {
      const ci = parseBookingDate(b.checkIn);
      const co = parseBookingDate(b.checkOut);
      if (ci && co) {
        const ciD = new Date(ci); ciD.setHours(0, 0, 0, 0);
        const coD = new Date(co); coD.setHours(0, 0, 0, 0);
        if (today >= ciD && today <= coD && b.status !== "cancelled") todayCount += 1;
      }
      if (b.status === "active") activeCount += 1;
      if (b.status !== "cancelled") {
        const price = Number((b.servicePrice || "").replace(/[^\d.]/g, "")) || 0;
        revenue += price;
      }
    }
    return { total: visibleBookings.length, today: todayCount, active: activeCount, revenue };
  }, [visibleBookings]);

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleBookings.filter((b) => {
      if (categorizeBooking(b) !== activeTab) return false;
      if (!isDateInRange(parseBookingDate(b.checkIn), timeFilter)) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (q) {
        const hay = `${b.id} ${b.clientName} ${b.serviceName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visibleBookings, activeTab, timeFilter, statusFilter, searchQuery]);

  const currencyINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  // ─── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const paginatedRows = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const hasActiveQuery =
    timeFilter !== "all" || statusFilter !== "all" || searchQuery.trim().length > 0;

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleView = (b: any) => {
    setSelectedBooking(b);
    setDetailOpen(true);
  };

  const handleEdit = (b: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const parseDT = (s: string) => {
      try {
        const [dp, tp] = (s || "").split(", ");
        const [d, m, y] = (dp || "").split("/");
        return {
          date: y && m && d ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : "",
          time: tp || "",
        };
      } catch {
        return { date: "", time: "" };
      }
    };
    const ci = parseDT(b.checkIn);
    const co = parseDT(b.checkOut);
    const loc = b.location?.split(" → ") || [""];
    setEditForm({
      serviceName: b.serviceName || "",
      customerName: b.clientName || "",
      email: b.contactEmail || "",
      phone: b.contactPhone || "",
      checkInDate: ci.date,
      checkInTime: ci.time,
      checkOutDate: co.date,
      checkOutTime: co.time,
      locationFrom: loc[0] || "",
      servicePrice: b.servicePrice || "",
      guests: String(b.guests || 1),
      status: b.status || "pending",
    });
    setSelectedBooking(b);
    setEditOpen(true);
  };

  const handleCreate = async () => {
    const errs: Record<string, string> = {};
    if (!createForm.serviceName) errs.serviceName = "Required";
    if (!createForm.customerName) errs.customerName = "Required";
    if (!createForm.email) errs.email = "Required";
    if (!createForm.phone) errs.phone = "Required";
    if (!createForm.checkInDate) errs.checkInDate = "Required";
    if (!createForm.checkOutDate) errs.checkOutDate = "Required";
    setCreateErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const svc = availableServices.find((s) => s.name === createForm.serviceName);
      const payload: any = {
        clientName: createForm.customerName,
        serviceName: createForm.serviceName,
        servicePrice: createForm.servicePrice || "-",
        checkIn: `${createForm.checkInDate} ${createForm.checkInTime}`.trim(),
        checkOut: `${createForm.checkOutDate} ${createForm.checkOutTime}`.trim(),
        guests: createForm.guests || 1,
        status: createForm.status,
        location: createForm.locationFrom,
        contactEmail: createForm.email,
        contactPhone: createForm.phone,
        pickupLocation: createForm.pickupLocation,
        serviceType: svc?.type || createForm.serviceType,
        vendorId: svc?.vendorId,
      };
      const res = await bookingDetailsApi.create(payload, token);
      if ((res as any)?.success) {
        queryClient.setQueryData<BookingDetailDTO[]>(bookingsKey, (p) => [
          (res as any).data,
          ...(p ?? []),
        ]);
        toast.success("Booking created!");
        setCreateOpen(false);
      } else {
        toast.error("Failed to create");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedBooking) return;
    setSaving(true);
    try {
      const id = selectedBooking._id || selectedBooking.id;
      const payload: any = {
        clientName: editForm.customerName,
        serviceName: editForm.serviceName,
        servicePrice: editForm.servicePrice,
        checkIn: `${editForm.checkInDate} ${editForm.checkInTime}`.trim(),
        checkOut: `${editForm.checkOutDate} ${editForm.checkOutTime}`.trim(),
        guests: editForm.guests || 1,
        status: editForm.status,
        location: editForm.locationFrom,
        contactEmail: editForm.email,
        contactPhone: editForm.phone,
      };
      const res = await bookingDetailsApi.update(id, payload, token);
      if ((res as any)?.success) {
        queryClient.setQueryData<BookingDetailDTO[]>(bookingsKey, (p) =>
          (p ?? []).map((b) =>
            b._id === id || b.id === selectedBooking.id ? { ...b, ...(res as any).data } : b,
          ),
        );
        toast.success("Updated!");
        setEditOpen(false);
      } else {
        toast.error("Failed");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (b: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmDialog({
      title: "Delete booking?",
      description: `Booking ${b.id} will be permanently removed and cannot be undone.`,
      variant: "danger",
      confirmLabel: "Delete",
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const id = b._id || b.id;
          const res = await bookingDetailsApi.remove(id, token);
          if ((res as any)?.success) {
            queryClient.setQueryData<BookingDetailDTO[]>(bookingsKey, (p) =>
              (p ?? []).filter((x) => x._id !== id && x.id !== b.id),
            );
            toast.success("Deleted!");
          }
        } catch (err: any) {
          toast.error(err?.message || "Failed");
        } finally {
          setConfirmLoading(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleCancel = (b: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmDialog({
      title: "Cancel booking?",
      description: `Booking ${b.id} will be marked as cancelled.`,
      variant: "warning",
      confirmLabel: "Cancel booking",
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const id = b._id || b.id;
          const res = await bookingDetailsApi.update(id, { status: "cancelled" }, token);
          if ((res as any)?.success) {
            queryClient.setQueryData<BookingDetailDTO[]>(bookingsKey, (p) =>
              (p ?? []).map((x) =>
                x._id === id || x.id === b.id ? { ...x, status: "cancelled" } : x,
              ),
            );
            toast.success("Cancelled!");
          }
        } catch (err: any) {
          toast.error(err?.message || "Failed");
        } finally {
          setConfirmLoading(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  const handlePrint = async (id: string) => {
    try {
      const res = await bookingDetailsApi.invoice(id, token);
      if (res?.success) {
        const d = (res as any).data.printData || (res as any).data.invoiceData || {};
        const w = window.open("", "_blank");
        if (w) {
          w.document.write(
            `<html><head><title>Invoice ${d.bookingId || id}</title><style>body{font-family:sans-serif;padding:40px;color:#333}h1{color:#0F5C8A}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #e4e4e4;padding:12px;text-align:left}th{background:#F7F8FA;font-size:12px;text-transform:uppercase;color:#6b6b6b}@media print{body{padding:20px}}</style></head><body><h1>Travel Homes — Invoice</h1><p><strong>Booking:</strong> ${d.bookingId || id} | <strong>Date:</strong> ${new Date().toLocaleDateString()}</p><table><tr><th>Guest</th><td>${d.clientName || ""}</td><th>Service</th><td>${d.serviceName || ""}</td></tr><tr><th>Check-in</th><td>${d.checkIn || ""}</td><th>Check-out</th><td>${d.checkOut || ""}</td></tr><tr><th>Guests</th><td>${d.guests || ""}</td><th>Price</th><td>${d.servicePrice || ""}</td></tr><tr><th>Status</th><td>${d.status || ""}</td><th>Location</th><td>${d.location || ""}</td></tr></table><p style="text-align:center;color:#9a9a9a;margin-top:40px">Thank you for choosing Travel Homes!</p><script>window.onload=function(){window.print()}</script></body></html>`,
          );
          w.document.close();
        }
        toast.success("Invoice generated!");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    }
  };

  const TABS = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const TIME_FILTERS = [
    { key: "all", label: "All Time" },
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ];

  // ─── Table columns ─────────────────────────────────────────────────────────
  const columns: ColumnDef<BookingDetailDTO>[] = [
    {
      key: "id",
      header: "Booking ID",
      cell: (b) => (
        <span className="flex items-center gap-1 font-bold" style={{ color: TEAL, whiteSpace: "nowrap" }}>
          {b.id}
        </span>
      ),
    },
    {
      key: "clientName",
      header: "Client",
      cell: (b) => <span style={{ fontWeight: 500, color: BLACK }}>{b.clientName}</span>,
    },
    {
      key: "serviceName",
      header: "Service",
      hideBelow: "md",
      cell: (b) => <span style={{ fontWeight: 600, color: GRAY_500 }}>{b.serviceName}</span>,
    },
    {
      key: "checkIn",
      header: "Check In",
      hideBelow: "lg",
      cell: (b) => <span style={{ color: GRAY_500 }}>{formatDate(b.checkIn)}</span>,
    },
    {
      key: "checkOut",
      header: "Check Out",
      hideBelow: "lg",
      cell: (b) => <span style={{ color: GRAY_500 }}>{formatDate(b.checkOut)}</span>,
    },
    {
      key: "guests",
      header: "Guests",
      hideBelow: "md",
      align: "center",
      cell: (b) => (
        <span className="flex items-center gap-1 justify-center" style={{ color: GRAY_500 }}>
          <Users size={14} /> {b.guests}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (b) => <StatusBadge status={b.status} />,
    },
  ];

  const rowActions: RowAction<BookingDetailDTO>[] = [
    {
      label: "View",
      icon: Eye,
      onClick: (b) => handleView(b),
    },
    {
      label: "Edit",
      icon: Pencil,
      onClick: (b) => handleEdit(b),
    },
    {
      label: "Cancel",
      icon: Ban,
      onClick: (b) => handleCancel(b),
      hidden: (b) => b.status === "cancelled",
    },
    {
      label: "Print Invoice",
      icon: Printer,
      onClick: (b) => handlePrint(b.id),
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: (b) => handleDelete(b),
      variant: "danger",
    },
  ];

  const tealBtn = (
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    disabled?: boolean,
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        height: 40,
        padding: "0 18px",
        borderRadius: 11,
        border: "none",
        backgroundColor: TEAL,
        fontSize: 13,
        fontWeight: 700,
        color: BLACK,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: "0 4px 16px rgba(7,228,228,0.3)",
        transition: "all 0.15s",
      }}
    >
      {icon} {label}
    </button>
  );

  const ghostBtn = (onClick: () => void, label: string) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 40,
        padding: "0 18px",
        borderRadius: 11,
        border: `1.5px solid ${GRAY_200}`,
        backgroundColor: "transparent",
        fontSize: 13,
        fontWeight: 600,
        color: GRAY_500,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout title="Booking Details" outerClassName="overflow-hidden" contentClassName="flex-1 overflow-auto p-3 lg:p-5">
          <div
            style={{
              backgroundColor: WHITE,
              border: "1.5px solid #EBEBEB",
              borderRadius: 20,
              padding: "20px 22px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              minHeight: "100%",
            }}
          >
            {/* Header */}
            <div
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-4"
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
                  Bookings
                </h1>
                <p style={{ fontSize: 13, color: GRAY_400, marginTop: 3 }}>
                  Manage reservations and schedules
                </p>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <StatCard
                icon={<CalendarDays size={15} color={TEAL} strokeWidth={2.2} />}
                label="Total"
                value={String(stats.total)}
                hint="All bookings"
              />
              <StatCard
                icon={<Calendar size={15} color="#8b5cf6" strokeWidth={2.2} />}
                label="Today"
                value={String(stats.today)}
                hint="Active stays"
                accent="#8b5cf6"
              />
              <StatCard
                icon={<Activity size={15} color="#22c55e" strokeWidth={2.2} />}
                label="Active"
                value={String(stats.active)}
                hint="Currently active"
                accent="#22c55e"
              />
              <StatCard
                icon={<IndianRupee size={15} color="#f59e0b" strokeWidth={2.2} />}
                label="Revenue"
                value={currencyINR(stats.revenue)}
                hint="Total billed"
                accent="#f59e0b"
              />
            </div>

            {/* Filters row */}
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search bookings, client, ID…"
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

              {/* Status filter */}
              <FilterPill
                label={
                  statusFilter === "all"
                    ? "All Statuses"
                    : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
                }
              >
                {([
                  ["all", "All Statuses"],
                  ["pending", "Pending"],
                  ["confirmed", "Confirmed"],
                  ["active", "Active"],
                  ["cancelled", "Cancelled"],
                ] as const).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    className={FILTER_ITEM_CLASS}
                    onClick={() => {
                      setStatusFilter(key);
                      setCurrentPage(1);
                    }}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </FilterPill>

              {/* Date / time filter */}
              <FilterPill
                label={
                  TIME_FILTERS.find((f) => f.key === timeFilter)?.label ?? "All Time"
                }
              >
                {TIME_FILTERS.map((f) => (
                  <DropdownMenuItem
                    key={f.key}
                    className={FILTER_ITEM_CLASS}
                    onClick={() => {
                      setTimeFilter(f.key as any);
                      setCurrentPage(1);
                    }}
                  >
                    {f.label}
                  </DropdownMenuItem>
                ))}
              </FilterPill>

              {/* Spacer + New Booking */}
              <div className="ml-auto">
                {tealBtn(() => setCreateOpen(true), <Plus size={15} />, "New Booking")}
              </div>
            </div>

            {/* Tabs with counts */}
            <div
              className="flex gap-1 mb-4"
              style={{ backgroundColor: SURFACE, borderRadius: 12, padding: 3, width: "fit-content" }}
            >
              {TABS.map((t) => {
                const active = activeTab === t.key;
                const count =
                  t.key === "upcoming"
                    ? tabCounts.upcoming
                    : t.key === "past"
                      ? tabCounts.past
                      : tabCounts.cancelled;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(t.key);
                      setCurrentPage(1);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 9,
                      border: `1.5px solid ${active ? `${TEAL}30` : "transparent"}`,
                      backgroundColor: active ? WHITE : "transparent",
                      color: active ? TEAL : GRAY_400,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    {t.label}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "1px 7px",
                        borderRadius: 999,
                        backgroundColor: active ? `${TEAL}14` : "#EBEBEB",
                        color: active ? TEAL : GRAY_500,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div style={{ border: "1.5px solid #EBEBEB", borderRadius: 14, overflow: "hidden" }}>
              <AdminDataTable<BookingDetailDTO>
                columns={columns}
                data={paginatedRows}
                isLoading={isLoading}
                isError={isError}
                errorMessage="Failed to load bookings. Check your connection and try again."
                onRetry={() => refetch()}
                hasActiveQuery={hasActiveQuery}
                emptyIcon={CalendarX}
                emptyTitle="No bookings yet"
                emptyDescription="Create your first booking using the button above."
                noResultsTitle="No bookings found"
                noResultsDescription="Try adjusting your search, status, or time filter."
                onRowClick={(b) => handleView(b)}
                rowActions={rowActions}
                pagination={{
                  currentPage,
                  totalPages,
                  totalItems: filteredBookings.length,
                  onPageChange: setCurrentPage,
                }}
              />
            </div>
          </div>

          {/* ── Detail Panel (right slide) ── */}
          <SlidePanel
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            title="Booking Detail"
            icon={<Eye size={16} color={TEAL} />}
          >
            {selectedBooking && (
              <div className="flex flex-col gap-1">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: TEAL, fontFamily: "monospace" }}
                  >
                    {selectedBooking.id}
                  </span>
                  <StatusBadge status={selectedBooking.status} />
                </div>
                <InfoRow
                  icon={<User size={15} />}
                  label="Client Name"
                  value={selectedBooking.clientName}
                />
                <InfoRow
                  icon={<MapPin size={15} />}
                  label="Service"
                  value={selectedBooking.serviceName}
                />
                <InfoRow
                  icon={<Calendar size={15} />}
                  label="Check In"
                  value={selectedBooking.checkIn}
                />
                <InfoRow
                  icon={<Clock size={15} />}
                  label="Check Out"
                  value={selectedBooking.checkOut}
                />
                <InfoRow
                  icon={<Users size={15} />}
                  label="Guests"
                  value={String(selectedBooking.guests || "—")}
                />
                <InfoRow
                  icon={<IndianRupee size={15} />}
                  label="Price"
                  value={selectedBooking.servicePrice}
                />
                <InfoRow
                  icon={<MapPin size={15} />}
                  label="Location"
                  value={selectedBooking.location}
                />
                {selectedBooking.contactEmail && (
                  <InfoRow
                    icon={<Mail size={15} />}
                    label="Email"
                    value={selectedBooking.contactEmail}
                  />
                )}
                {selectedBooking.contactPhone && (
                  <InfoRow
                    icon={<Phone size={15} />}
                    label="Phone"
                    value={selectedBooking.contactPhone}
                  />
                )}
              </div>
            )}
          </SlidePanel>

          {/* ── Create Panel (right slide) ── */}
          <SlidePanel
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            title="New Booking"
            icon={<Plus size={16} color={TEAL} />}
            width={560}
            footer={
              <>
                {ghostBtn(() => setCreateOpen(false), "Cancel")}{" "}
                {tealBtn(
                  handleCreate,
                  <Save size={14} />,
                  saving ? "Creating…" : "Create Booking",
                  saving,
                )}
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 flex-wrap">
                {[
                  { v: "van", l: "Van", I: Car },
                  { v: "unique-stays", l: "Stays", I: Home },
                  { v: "activity", l: "Activity", I: MapPin },
                ].map(({ v, l, I }) => {
                  const active = createForm.serviceType === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCreateForm((p) => ({ ...p, serviceType: v }))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 14px",
                        borderRadius: 99,
                        border: `1.5px solid ${active ? TEAL : GRAY_200}`,
                        backgroundColor: active ? TEAL_BG : SURFACE,
                        color: active ? TEAL : GRAY_500,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <I size={14} /> {l}
                    </button>
                  );
                })}
              </div>
              <PanelSelect
                label="Service Name"
                required
                value={createForm.serviceName}
                onChange={(v) => {
                  setCreateForm((p) => ({ ...p, serviceName: v }));
                  if (createErrors.serviceName) setCreateErrors((p) => ({ ...p, serviceName: "" }));
                }}
                error={createErrors.serviceName}
              >
                <option value="">Select a service</option>
                {availableServices.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </PanelSelect>
              <div className="grid grid-cols-2 gap-3">
                <PanelInput
                  label="Customer Name"
                  required
                  value={createForm.customerName}
                  onChange={(v) => {
                    setCreateForm((p) => ({ ...p, customerName: v }));
                    if (createErrors.customerName)
                      setCreateErrors((p) => ({ ...p, customerName: "" }));
                  }}
                  error={createErrors.customerName}
                  placeholder="Guest name"
                />
                <PanelInput
                  label="Email"
                  required
                  value={createForm.email}
                  onChange={(v) => {
                    setCreateForm((p) => ({ ...p, email: v }));
                    if (createErrors.email) setCreateErrors((p) => ({ ...p, email: "" }));
                  }}
                  error={createErrors.email}
                  type="email"
                  placeholder="email@example.com"
                />
              </div>
              <PanelInput
                label="Phone"
                required
                value={createForm.phone}
                onChange={(v) => setCreateForm((p) => ({ ...p, phone: v.replace(/\D/g, "") }))}
                error={createErrors.phone}
                placeholder="+91 XXXXXXXXXX"
                maxLength={12}
              />
              <div className="grid grid-cols-2 gap-3">
                <PanelInput
                  label="Check-in Date"
                  required
                  value={createForm.checkInDate}
                  onChange={(v) => setCreateForm((p) => ({ ...p, checkInDate: v }))}
                  error={createErrors.checkInDate}
                  type="date"
                />
                <PanelInput
                  label="Check-in Time"
                  value={createForm.checkInTime}
                  onChange={(v) => setCreateForm((p) => ({ ...p, checkInTime: v }))}
                  type="time"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <PanelInput
                  label="Check-out Date"
                  required
                  value={createForm.checkOutDate}
                  onChange={(v) => setCreateForm((p) => ({ ...p, checkOutDate: v }))}
                  error={createErrors.checkOutDate}
                  type="date"
                />
                <PanelInput
                  label="Check-out Time"
                  value={createForm.checkOutTime}
                  onChange={(v) => setCreateForm((p) => ({ ...p, checkOutTime: v }))}
                  type="time"
                />
              </div>
              <PanelSelect
                label="Location"
                value={createForm.locationFrom}
                onChange={(v) => setCreateForm((p) => ({ ...p, locationFrom: v }))}
              >
                <option value="">Select location</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </PanelSelect>
              <div className="grid grid-cols-2 gap-3">
                <PanelInput
                  label="Price"
                  value={createForm.servicePrice}
                  onChange={(v) =>
                    setCreateForm((p) => ({ ...p, servicePrice: v.replace(/\D/g, "") }))
                  }
                  placeholder="₹ 0"
                />
                <PanelInput
                  label="Guests"
                  value={createForm.guests}
                  onChange={(v) => setCreateForm((p) => ({ ...p, guests: v.replace(/\D/g, "") }))}
                  placeholder="0"
                />
              </div>
            </div>
          </SlidePanel>

          {/* ── Edit Panel (right slide) ── */}
          <SlidePanel
            open={editOpen}
            onClose={() => setEditOpen(false)}
            title={`Edit — ${selectedBooking?.id || ""}`}
            icon={<Pencil size={16} color={TEAL} />}
            width={560}
            footer={
              <>
                {ghostBtn(() => setEditOpen(false), "Cancel")}{" "}
                {tealBtn(handleUpdate, <Save size={14} />, saving ? "Updating…" : "Update", saving)}
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <PanelInput
                  label="Customer Name"
                  value={editForm.customerName}
                  onChange={(v) => setEditForm((p) => ({ ...p, customerName: v }))}
                />
                <PanelInput
                  label="Phone"
                  value={editForm.phone}
                  onChange={(v) => setEditForm((p) => ({ ...p, phone: v.replace(/\D/g, "") }))}
                  maxLength={12}
                />
              </div>
              <PanelInput
                label="Email"
                value={editForm.email}
                onChange={(v) => setEditForm((p) => ({ ...p, email: v }))}
                type="email"
              />
              <PanelSelect
                label="Status"
                value={editForm.status}
                onChange={(v) => setEditForm((p) => ({ ...p, status: v }))}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
              </PanelSelect>
              <div className="grid grid-cols-2 gap-3">
                <PanelInput
                  label="Check-in Date"
                  value={editForm.checkInDate}
                  onChange={(v) => setEditForm((p) => ({ ...p, checkInDate: v }))}
                  type="date"
                />
                <PanelInput
                  label="Check-in Time"
                  value={editForm.checkInTime}
                  onChange={(v) => setEditForm((p) => ({ ...p, checkInTime: v }))}
                  type="time"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <PanelInput
                  label="Check-out Date"
                  value={editForm.checkOutDate}
                  onChange={(v) => setEditForm((p) => ({ ...p, checkOutDate: v }))}
                  type="date"
                />
                <PanelInput
                  label="Check-out Time"
                  value={editForm.checkOutTime}
                  onChange={(v) => setEditForm((p) => ({ ...p, checkOutTime: v }))}
                  type="time"
                />
              </div>
              <PanelInput
                label="Location"
                value={editForm.locationFrom}
                onChange={(v) => setEditForm((p) => ({ ...p, locationFrom: v }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <PanelInput
                  label="Price"
                  value={editForm.servicePrice}
                  onChange={(v) =>
                    setEditForm((p) => ({ ...p, servicePrice: v.replace(/\D/g, "") }))
                  }
                  placeholder="₹ 0"
                />
                <PanelInput
                  label="Guests"
                  value={editForm.guests}
                  onChange={(v) => setEditForm((p) => ({ ...p, guests: v.replace(/\D/g, "") }))}
                  placeholder="0"
                />
              </div>
            </div>
          </SlidePanel>

          <ConfirmModal
            open={!!confirmDialog}
            onClose={() => !confirmLoading && setConfirmDialog(null)}
            onConfirm={() => confirmDialog?.onConfirm()}
            title={confirmDialog?.title ?? ""}
            description={confirmDialog?.description}
            confirmLabel={confirmDialog?.confirmLabel}
            variant={confirmDialog?.variant}
            isLoading={confirmLoading}
          />
    </DashboardLayout>
  );
};

export default BookingDetails;
