import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  X,
  Users,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BRAND_VARS,
  BTN_NEUTRAL,
  BTN_PRIMARY,
  CONTROL,
  Panel,
  PanelHead,
  StatTile,
  StatTileSkeleton,
} from "@/components/shared";
import { bookingDetailsApi, offersApi, activitiesApi, type BookingDetailDTO } from "@/lib/api";
import { formatDate } from "@/utils/formateTime";
import { SlidePanel } from "@/components/bookings";
import { cn } from "@/lib/utils";
import {
  PanelInput,
  PanelSelect,
  InfoRow,
  parseBookingDate,
  isDateInRange,
  categorizeBooking,
} from "@/components/bookings/BookingDetailsHelpers";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";

const ITEMS_PER_PAGE = 15;

/* ── Filter dropdown pill ──────────────────────────────────────────────── */
const FilterPill: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
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
        {label}
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" style={BRAND_VARS} className="w-48 p-1.5">
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);

/** Dismissible summary of one active filter. */
const FilterChip = ({ label, onClear }: { label: string; onClear: () => void }) => (
  <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1 rounded-full bg-brand/[0.09] text-[11.5px] font-semibold text-brand capitalize">
    {label}
    <button
      type="button"
      onClick={onClear}
      aria-label={`Clear ${label} filter`}
      className="grid place-items-center w-4 h-4 rounded-full hover:bg-brand/20 transition-colors duration-150"
    >
      <X size={10} strokeWidth={3} />
    </button>
  </span>
);

/* Radix's own `focus:bg-accent` resolves to an invalid colour in this app —
   see the SELECT_ITEM note in components/shared/Panel.tsx. */
const FILTER_ITEM_CLASS =
  "cursor-pointer rounded-lg px-2.5 py-2 text-[13px] font-medium text-foreground " +
  "transition-colors " +
  "focus:bg-brand/[0.1] focus:text-brand " +
  "data-[highlighted]:bg-brand/[0.1] data-[highlighted]:text-brand";

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
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, timeFilter]);

  // ─── Data loading ──────────────────────────────────────────────────────────
  const bookingsKey = ["bookingDetails", "list", user?.id, token] as const;
  const {
    data: bookings = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<BookingDetailDTO[]>({
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
        const ciD = new Date(ci);
        ciD.setHours(0, 0, 0, 0);
        const coD = new Date(co);
        coD.setHours(0, 0, 0, 0);
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
            `<html><head><title>Invoice ${d.bookingId || id}</title><style>body{font-family:sans-serif;padding:40px;color:#333}h1{color:#0d9488}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #e4e4e4;padding:12px;text-align:left}th{background:#F7F8FA;font-size:12px;text-transform:uppercase;color:#6b6b6b}@media print{body{padding:20px}}</style></head><body><h1>Travel Homes — Invoice</h1><p><strong>Booking:</strong> ${d.bookingId || id} | <strong>Date:</strong> ${new Date().toLocaleDateString()}</p><table><tr><th>Guest</th><td>${d.clientName || ""}</td><th>Service</th><td>${d.serviceName || ""}</td></tr><tr><th>Check-in</th><td>${d.checkIn || ""}</td><th>Check-out</th><td>${d.checkOut || ""}</td></tr><tr><th>Guests</th><td>${d.guests || ""}</td><th>Price</th><td>${d.servicePrice || ""}</td></tr><tr><th>Status</th><td>${d.status || ""}</td><th>Location</th><td>${d.location || ""}</td></tr></table><p style="text-align:center;color:#9a9a9a;margin-top:40px">Thank you for choosing Travel Homes!</p><script>window.onload=function(){window.print()}</script></body></html>`,
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
        <span className="font-bold tabular-nums text-brand whitespace-nowrap">{b.id}</span>
      ),
    },
    {
      key: "clientName",
      header: "Client",
      cell: (b) => <span className="font-semibold text-foreground">{b.clientName}</span>,
    },
    {
      key: "serviceName",
      header: "Service",
      hideBelow: "md",
      cell: (b) => (
        <span className="block max-w-[200px] truncate text-muted-foreground">{b.serviceName}</span>
      ),
    },
    {
      key: "checkIn",
      header: "Check In",
      hideBelow: "lg",
      cell: (b) => <span className="tabular-nums text-foreground/80">{formatDate(b.checkIn)}</span>,
    },
    {
      key: "checkOut",
      header: "Check Out",
      hideBelow: "lg",
      cell: (b) => (
        <span className="tabular-nums text-muted-foreground">{formatDate(b.checkOut)}</span>
      ),
    },
    {
      key: "guests",
      header: "Guests",
      hideBelow: "md",
      align: "center",
      cell: (b) => (
        <span className="flex items-center gap-1.5 justify-center tabular-nums text-foreground/80">
          <Users size={13} className="text-muted-foreground/60" /> {b.guests}
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
    { label: "View", icon: Eye, onClick: (b) => handleView(b) },
    { label: "Edit", icon: Pencil, onClick: (b) => handleEdit(b) },
    {
      label: "Cancel",
      icon: Ban,
      onClick: (b) => handleCancel(b),
      hidden: (b) => b.status === "cancelled",
    },
    { label: "Print Invoice", icon: Printer, onClick: (b) => handlePrint(b.id) },
    { label: "Delete", icon: Trash2, onClick: (b) => handleDelete(b), variant: "danger" },
  ];

  const tealBtn = (
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    disabled?: boolean,
  ) => (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(BTN_PRIMARY, "h-9 disabled:opacity-45 disabled:shadow-none")}
    >
      {icon} {label}
    </Button>
  );

  const ghostBtn = (onClick: () => void, label: string) => (
    <Button variant="ghost" onClick={onClick} className={BTN_NEUTRAL}>
      {label}
    </Button>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      title="Booking Details"
      contentClassName="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6 bg-muted/40 dark:bg-transparent"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto pb-24 lg:pb-12 space-y-5">
        {/* ── Metrics ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {isLoading ? (
            <>
              <StatTileSkeleton />
              <StatTileSkeleton />
              <StatTileSkeleton />
              <StatTileSkeleton />
            </>
          ) : (
            <>
              <StatTile
                icon={CalendarDays}
                label="Total"
                hint="All bookings"
                value={stats.total}
                color="#0d9488"
                index={0}
              />
              <StatTile
                icon={Calendar}
                label="Today"
                hint="Active stays"
                value={stats.today}
                color="#8b5cf6"
                index={1}
              />
              <StatTile
                icon={Activity}
                label="Active"
                hint="Currently active"
                value={stats.active}
                color="#22c55e"
                index={2}
              />
              <StatTile
                icon={IndianRupee}
                label="Revenue"
                hint="Excludes cancelled"
                value={currencyINR(stats.revenue)}
                color="#f59e0b"
                index={3}
              />
            </>
          )}
        </div>

        {/* ── Bookings ── */}
        <Panel>
          <PanelHead
            icon={CalendarDays}
            title="Reservations"
            blurb={
              isLoading
                ? "Loading your bookings…"
                : `${filteredBookings.length} ${activeTab} booking${filteredBookings.length === 1 ? "" : "s"}`
            }
          />

          {/* Tabs + filters */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-5 py-3 border-b border-border/70">
            <div
              role="tablist"
              aria-label="Booking groups"
              className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 dark:bg-white/[0.04] w-fit shrink-0"
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
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setActiveTab(t.key);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "relative inline-flex items-center gap-1.5 h-8 px-3 rounded-lg",
                      "text-[12.5px] font-semibold outline-none transition-colors duration-150",
                      "focus-visible:ring-2 focus-visible:ring-brand/40",
                      active ? "text-brand" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="bookingTabPill"
                        className="absolute inset-0 rounded-lg bg-card shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative">{t.label}</span>
                    <span
                      className={cn(
                        "relative grid place-items-center min-w-[20px] h-[18px] px-1.5 rounded-full",
                        "text-[10.5px] font-bold tabular-nums",
                        active ? "bg-brand/15 text-brand" : "bg-muted-foreground/10",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              <div className="relative flex-1 min-w-[190px] lg:max-w-[260px]">
                <Search
                  size={14}
                  strokeWidth={2.2}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search client, ID or service"
                  aria-label="Search bookings"
                  className={cn("h-10 pl-9", CONTROL)}
                />
              </div>

              <FilterPill
                label={
                  statusFilter === "all"
                    ? "All statuses"
                    : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
                }
              >
                {(
                  [
                    ["all", "All statuses"],
                    ["pending", "Pending"],
                    ["confirmed", "Confirmed"],
                    ["active", "Active"],
                    ["cancelled", "Cancelled"],
                  ] as const
                ).map(([key, label]) => (
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

              <FilterPill
                label={TIME_FILTERS.find((f) => f.key === timeFilter)?.label ?? "All time"}
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
            </div>
          </div>

          {/* Active-filter pills — otherwise an empty table looks like no data. */}
          {hasActiveQuery && (
            <div className="flex flex-wrap items-center gap-1.5 px-5 py-2.5 border-b border-border/70 bg-muted/30 dark:bg-white/[0.015]">
              <span className="text-[11.5px] font-semibold text-muted-foreground">Filtered by</span>
              {searchQuery.trim() && (
                <FilterChip label={`“${searchQuery.trim()}”`} onClear={() => setSearchQuery("")} />
              )}
              {statusFilter !== "all" && (
                <FilterChip label={statusFilter} onClear={() => setStatusFilter("all")} />
              )}
              {timeFilter !== "all" && (
                <FilterChip
                  label={TIME_FILTERS.find((f) => f.key === timeFilter)?.label ?? timeFilter}
                  onClear={() => setTimeFilter("all")}
                />
              )}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setTimeFilter("all");
                  setCurrentPage(1);
                }}
                className="ml-1 text-[11.5px] font-semibold text-brand hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

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
            emptyDescription="Reservations appear here once guests book — or create one from Bookings › New Booking in the sidebar."
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
        </Panel>
      </div>

      {/* ── Detail Panel ── */}
      <SlidePanel
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Booking Detail"
        icon={<Eye size={16} className="text-brand" />}
      >
        {selectedBooking && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-bold text-brand tabular-nums">
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

      {/* ── Edit Panel ── */}
      <SlidePanel
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit — ${selectedBooking?.id || ""}`}
        icon={<Pencil size={16} className="text-brand" />}
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
              onChange={(v) => setEditForm((p) => ({ ...p, servicePrice: v.replace(/\D/g, "") }))}
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
