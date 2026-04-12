import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Plus, Users, Loader2, Car, Home, MapPin, MoreHorizontal,
  MapPinOff, Pencil, Trash2, Ban, Printer, Eye, Save,
  Calendar, User, Mail, Phone, IndianRupee, Clock, ArrowUpRight,
} from "lucide-react";
import { Sidebar } from "@/components/Navigation";
import { DashboardHeader } from "@/components/Header";
import { bookingDetailsApi, offersApi, activitiesApi, type BookingDetailDTO } from "@/lib/api";
import { formatDate } from "@/utils/formateTime";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MobileVendorNav from "@/components/MobileVendorNav";
import { SlidePanel } from "@/components/bookings";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL      = "#07e4e4";
const TEAL_BG   = "rgba(7, 228, 228, 0.07)";
const TEAL_FOCUS = "rgba(7, 228, 228, 0.15)";
const BLACK     = "#131313";
const GRAY_500  = "#6b6b6b";
const GRAY_400  = "#9a9a9a";
const GRAY_200  = "#e4e4e4";
const WHITE     = "#ffffff";
const SURFACE   = "#F7F8FA";
const ERROR     = "#ef4444";
const GREEN     = "#16a34a";
const AMBER     = "#d97706";
const BLUE      = "#2563eb";

// ─── Styled input for panels ─────────────────────────────────────────────────
const PanelInput = ({ label, required, value, onChange, type = "text", placeholder, error, ...rest }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type">) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontSize: 11, fontWeight: 700, color: error ? ERROR : GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}{required && <span style={{ color: ERROR, marginLeft: 3 }}>*</span>}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder}
        style={{ width: "100%", height: 44, padding: "0 14px", fontSize: 13, color: BLACK, fontWeight: 450, backgroundColor: error ? "rgba(239,68,68,0.04)" : focused ? WHITE : SURFACE, border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`, borderRadius: 11, outline: "none", boxShadow: focused && !error ? `0 0 0 3px ${TEAL_FOCUS}` : error ? "0 0 0 3px rgba(239,68,68,0.1)" : "none", transition: "all 0.15s" }}
        {...rest}
      />
      {error && <p style={{ fontSize: 11, color: ERROR }}>{error}</p>}
    </div>
  );
};

const PanelSelect = ({ label, required, value, onChange, children, error }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; children: React.ReactNode; error?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label style={{ fontSize: 11, fontWeight: 700, color: error ? ERROR : GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
      {label}{required && <span style={{ color: ERROR, marginLeft: 3 }}>*</span>}
    </label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", height: 44, padding: "0 14px", fontSize: 13, color: value ? BLACK : GRAY_400, fontWeight: 450, backgroundColor: error ? "rgba(239,68,68,0.04)" : SURFACE, border: `1.5px solid ${error ? "#fca5a5" : "transparent"}`, borderRadius: 11, outline: "none", appearance: "none", cursor: "pointer", transition: "all 0.15s" }}>
      {children}
    </select>
    {error && <p style={{ fontSize: 11, color: ERROR }}>{error}</p>}
  </div>
);

// ─── Info row for detail panel ───────────────────────────────────────────────
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3" style={{ padding: "10px 0", borderBottom: `1px solid #EBEBEB` }}>
    <span style={{ color: TEAL, flexShrink: 0 }}>{icon}</span>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 11, color: GRAY_400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: BLACK, marginTop: 1 }}>{value || "—"}</p>
    </div>
  </div>
);

// ─── Status helpers ──────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  pending:   { bg: "#fffbeb", color: AMBER, border: `${AMBER}25` },
  confirmed: { bg: "#eff6ff", color: BLUE, border: `${BLUE}25` },
  active:    { bg: "#f0fdf4", color: GREEN, border: `${GREEN}25` },
  cancelled: { bg: "#fef2f2", color: ERROR, border: `${ERROR}25` },
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: "capitalize" }}>
      {status}
    </span>
  );
};

// ─── Date utilities ──────────────────────────────────────────────────────────
const parseBookingDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  try {
    if (dateStr.includes("/")) {
      const [datePart, timePart] = dateStr.split(", ");
      const [day, month, year] = datePart.split("/");
      if (timePart) {
        const [time, period] = timePart.split(" ");
        const [hours, minutes] = time.split(":");
        let h = parseInt(hours);
        if (period?.toLowerCase() === "pm" && h !== 12) h += 12;
        if (period?.toLowerCase() === "am" && h === 12) h = 0;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), h, parseInt(minutes));
      }
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    const [ymd, hm] = dateStr.split(/[T ]/);
    if (/\d{4}-\d{2}-\d{2}/.test(ymd)) {
      const [y, m, d] = ymd.split("-");
      if (hm && /\d{2}:\d{2}/.test(hm)) { const [h, min] = hm.split(":"); return new Date(+y, +m - 1, +d, +h, +min); }
      return new Date(+y, +m - 1, +d);
    }
    return new Date(dateStr);
  } catch { return new Date(); }
};

const isDateInRange = (date: Date, range: string) => {
  if (range === "all") return true;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (range === "today") return date >= today && date < tomorrow;
  if (range === "week") { const ws = new Date(today); ws.setDate(today.getDate() - today.getDay()); const we = new Date(ws); we.setDate(ws.getDate() + 7); return date >= ws && date < we; }
  if (range === "month") { const ms = new Date(now.getFullYear(), now.getMonth(), 1); const me = new Date(now.getFullYear(), now.getMonth() + 1, 1); return date >= ms && date < me; }
  return true;
};

const categorizeBooking = (b: BookingDetailDTO): "upcoming" | "past" | "cancelled" => {
  if (b.status === "cancelled") return "cancelled";
  const d = parseBookingDate(b.checkIn);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const bd = new Date(d); bd.setHours(0, 0, 0, 0);
  return bd >= today ? "upcoming" : "past";
};

const LOCATIONS = ["Jamshedpur", "Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Goa", "Kerala"];

// ═════════════════════════════════════════════════════════════════════════════
const BookingDetails = () => {
  const { user } = useAuth();
  const token = localStorage.getItem("travel_auth_token") || sessionStorage.getItem("travel_auth_token") || undefined;

  const [activeTab, setActiveTab] = useState("upcoming");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingDetailDTO[]>([]);
  const [availableServices, setAvailableServices] = useState<{ name: string; type: string; vendorId?: string }[]>([]);

  // Panel states
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({ serviceName: "", customerName: "", email: "", phone: "", checkInDate: "", checkInTime: "", checkOutDate: "", checkOutTime: "", locationFrom: "", locationTo: "", pickupLocation: "", servicePrice: "", guests: "", status: "pending", serviceType: "van" });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Edit form
  const [editForm, setEditForm] = useState({ serviceName: "", customerName: "", email: "", phone: "", checkInDate: "", checkInTime: "", checkOutDate: "", checkOutTime: "", locationFrom: "", servicePrice: "", guests: "", status: "pending" });

  // ─── Filtering ─────────────────────────────────────────────────────────────
  const filteredBookings = bookings.filter((b) => {
    if (user?.userType === "vendor") {
      const svcNames = availableServices.map((s) => s.name);
      const isTheirs = svcNames.includes(b.serviceName) || (b as any).vendorId === user.id || (b.contactEmail && b.contactEmail === user.email);
      if (!isTheirs) return false;
    }
    if (categorizeBooking(b) !== activeTab) return false;
    if (!isDateInRange(parseBookingDate(b.checkIn), timeFilter)) return false;
    return true;
  });

  // ─── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user && !token) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, any> = { mine: true };
        if (user?.userType === "vendor" && user.email) { params.vendorEmail = user.email; if (user.id) params.vendorId = user.id; }
        const res = await bookingDetailsApi.list(token, params);
        setBookings((res as any)?.data || []);
      } catch (e: any) { toast.error(e?.message || "Failed to load bookings"); }
      finally { setIsLoading(false); }
    };
    const loadServices = async () => {
      try {
        const params: Record<string, any> = {};
        if (user?.userType === "vendor" && user?.id) { params.vendorId = user.id; params.mine = true; }
        const res = await offersApi.list(undefined, token, params);
        const svcs: { name: string; type: string; vendorId?: string }[] = [];
        if (res.success) svcs.push(...res.data.map((o) => ({ name: o.name, type: o.category?.toLowerCase().includes("stay") ? "unique-stays" : "van", vendorId: o.vendorId })));
        let acts: any[] = [];
        if (token && user?.userType === "vendor") { const r = await activitiesApi.myList(token); if (r.success) acts = r.data; } else { const r = await activitiesApi.list(); if (r.success) acts = r.data; }
        if (acts.length > 0) svcs.push(...acts.map((a: any) => ({ name: a.title, type: "activity", vendorId: a.vendorId })));
        setAvailableServices(svcs);
      } catch {}
    };
    load(); loadServices();
  }, [token, user]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleView = (b: any) => { setSelectedBooking(b); setDetailOpen(true); };

  const handleEdit = (b: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const parseDT = (s: string) => { try { const [dp, tp] = (s || "").split(", "); const [d, m, y] = (dp || "").split("/"); return { date: y && m && d ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : "", time: tp || "" }; } catch { return { date: "", time: "" }; } };
    const ci = parseDT(b.checkIn); const co = parseDT(b.checkOut);
    const loc = b.location?.split(" → ") || [""];
    setEditForm({ serviceName: b.serviceName || "", customerName: b.clientName || "", email: b.contactEmail || "", phone: b.contactPhone || "", checkInDate: ci.date, checkInTime: ci.time, checkOutDate: co.date, checkOutTime: co.time, locationFrom: loc[0] || "", servicePrice: b.servicePrice || "", guests: String(b.guests || 1), status: b.status || "pending" });
    setSelectedBooking(b); setEditOpen(true);
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
      const payload: any = { clientName: createForm.customerName, serviceName: createForm.serviceName, servicePrice: createForm.servicePrice || "-", checkIn: `${createForm.checkInDate} ${createForm.checkInTime}`.trim(), checkOut: `${createForm.checkOutDate} ${createForm.checkOutTime}`.trim(), guests: createForm.guests || 1, status: createForm.status, location: createForm.locationFrom, contactEmail: createForm.email, contactPhone: createForm.phone, pickupLocation: createForm.pickupLocation, serviceType: svc?.type || createForm.serviceType, vendorId: svc?.vendorId };
      const res = await bookingDetailsApi.create(payload, token);
      if ((res as any)?.success) { setBookings((p) => [(res as any).data, ...p]); toast.success("Booking created!"); setCreateOpen(false); } else { toast.error("Failed to create"); }
    } catch (e: any) { toast.error(e?.message || "Failed"); } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!selectedBooking) return;
    setSaving(true);
    try {
      const id = selectedBooking._id || selectedBooking.id;
      const payload: any = { clientName: editForm.customerName, serviceName: editForm.serviceName, servicePrice: editForm.servicePrice, checkIn: `${editForm.checkInDate} ${editForm.checkInTime}`.trim(), checkOut: `${editForm.checkOutDate} ${editForm.checkOutTime}`.trim(), guests: editForm.guests || 1, status: editForm.status, location: editForm.locationFrom, contactEmail: editForm.email, contactPhone: editForm.phone };
      const res = await bookingDetailsApi.update(id, payload, token);
      if ((res as any)?.success) { setBookings((p) => p.map((b) => (b._id === id || b.id === selectedBooking.id) ? { ...b, ...(res as any).data } : b)); toast.success("Updated!"); setEditOpen(false); } else { toast.error("Failed"); }
    } catch (e: any) { toast.error(e?.message || "Failed"); } finally { setSaving(false); }
  };

  const handleDelete = async (b: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(`Delete booking ${b.id}?`)) return;
    try { const id = b._id || b.id; const res = await bookingDetailsApi.remove(id, token); if ((res as any)?.success) { setBookings((p) => p.filter((x) => x._id !== id && x.id !== b.id)); toast.success("Deleted!"); } } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  const handleCancel = async (b: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(`Cancel booking ${b.id}?`)) return;
    try { const id = b._id || b.id; const res = await bookingDetailsApi.update(id, { status: "cancelled" }, token); if ((res as any)?.success) { setBookings((p) => p.map((x) => (x._id === id || x.id === b.id) ? { ...x, status: "cancelled" } : x)); toast.success("Cancelled!"); } } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  const handlePrint = async (id: string) => {
    try { const res = await bookingDetailsApi.invoice(id, token); if (res?.success) { const d = (res as any).data.printData || (res as any).data.invoiceData || {}; const w = window.open("", "_blank"); if (w) { w.document.write(`<html><head><title>Invoice ${d.bookingId || id}</title><style>body{font-family:sans-serif;padding:40px;color:#333}h1{color:#07e4e4}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #e4e4e4;padding:12px;text-align:left}th{background:#F7F8FA;font-size:12px;text-transform:uppercase;color:#6b6b6b}@media print{body{padding:20px}}</style></head><body><h1>Travel Homes — Invoice</h1><p><strong>Booking:</strong> ${d.bookingId||id} | <strong>Date:</strong> ${new Date().toLocaleDateString()}</p><table><tr><th>Guest</th><td>${d.clientName||""}</td><th>Service</th><td>${d.serviceName||""}</td></tr><tr><th>Check-in</th><td>${d.checkIn||""}</td><th>Check-out</th><td>${d.checkOut||""}</td></tr><tr><th>Guests</th><td>${d.guests||""}</td><th>Price</th><td>${d.servicePrice||""}</td></tr><tr><th>Status</th><td>${d.status||""}</td><th>Location</th><td>${d.location||""}</td></tr></table><p style="text-align:center;color:#9a9a9a;margin-top:40px">Thank you for choosing Travel Homes!</p><script>window.onload=function(){window.print()}</script></body></html>`); w.document.close(); } toast.success("Invoice generated!"); } } catch (e: any) { toast.error(e?.message || "Failed"); }
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

  const tealBtn = (onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean) => (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{ display: "flex", alignItems: "center", gap: 6, height: 40, padding: "0 18px", borderRadius: 11, border: "none", backgroundColor: TEAL, fontSize: 13, fontWeight: 700, color: BLACK, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, boxShadow: "0 4px 16px rgba(7,228,228,0.3)", transition: "all 0.15s" }}>
      {icon} {label}
    </button>
  );

  const ghostBtn = (onClick: () => void, label: string) => (
    <button type="button" onClick={onClick}
      style={{ height: 40, padding: "0 18px", borderRadius: 11, border: `1.5px solid ${GRAY_200}`, backgroundColor: "transparent", fontSize: 13, fontWeight: 600, color: GRAY_500, cursor: "pointer" }}>
      {label}
    </button>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-plus-jakarta overflow-hidden">
      <div className="hidden lg:block"><Sidebar /></div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader Headtitle="Booking Details" />

        <main className="flex-1 overflow-y-auto p-3 lg:p-5">
          <div style={{ backgroundColor: WHITE, border: "1.5px solid #EBEBEB", borderRadius: 20, padding: "20px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", minHeight: "100%" }}>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-4" style={{ borderBottom: "1.5px solid #EBEBEB" }}>
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div style={{ width: 20, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GRAY_400 }}>Management</span>
                </div>
                {/* Tabs */}
                <div className="flex gap-1 mt-2" style={{ backgroundColor: SURFACE, borderRadius: 12, padding: 3 }}>
                  {TABS.map((t) => {
                    const active = activeTab === t.key;
                    return (
                      <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                        style={{ padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${active ? `${TEAL}30` : "transparent"}`, backgroundColor: active ? WHITE : "transparent", color: active ? TEAL : GRAY_400, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.06)" : "none" }}>
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {tealBtn(() => setCreateOpen(true), <Plus size={15} />, "New Booking")}
            </div>

            {/* Time filters */}
            <div className="flex flex-wrap gap-2 mb-5">
              {TIME_FILTERS.map((f) => {
                const active = timeFilter === f.key;
                return (
                  <button key={f.key} type="button" onClick={() => setTimeFilter(f.key as any)}
                    style={{ padding: "6px 14px", borderRadius: 99, border: `1.5px solid ${active ? TEAL : GRAY_200}`, backgroundColor: active ? TEAL_BG : "transparent", color: active ? TEAL : GRAY_500, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div style={{ border: "1.5px solid #EBEBEB", borderRadius: 14, overflow: "hidden" }}>
              <div className="overflow-x-auto">
                <table style={{ width: "100%", minWidth: 900, fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: SURFACE }}>
                      {["Booking ID", "Client Name", "Service", "Check In", "Check Out", "Guests", "Status", "Action"].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={8} style={{ padding: 60, textAlign: "center" }}>
                        <div className="flex items-center justify-center gap-2" style={{ color: GRAY_400 }}>
                          <Loader2 size={18} className="animate-spin" /> Loading bookings…
                        </div>
                      </td></tr>
                    ) : filteredBookings.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: 60, textAlign: "center" }}>
                        <MapPinOff size={40} color={GRAY_200} style={{ margin: "0 auto 12px" }} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: GRAY_500 }}>No bookings found</p>
                        <p style={{ fontSize: 12, color: GRAY_400, marginTop: 4 }}>Try adjusting your filters or create a new booking.</p>
                      </td></tr>
                    ) : (
                      filteredBookings.map((b, i) => (
                        <tr key={b.id ?? i}
                          style={{ borderBottom: "1px solid #EBEBEB", cursor: "pointer", transition: "background-color 0.1s" }}
                          onClick={() => handleView(b)}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = TEAL_BG; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent"; }}>
                          <td style={{ padding: "12px 14px", fontWeight: 700, color: TEAL, whiteSpace: "nowrap" }}>
                            <span className="flex items-center gap-1">{b.id} <ArrowUpRight size={11} /></span>
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: 500, color: BLACK }}>{b.clientName}</td>
                          <td style={{ padding: "12px 14px", fontWeight: 600, color: GRAY_500 }}>{b.serviceName}</td>
                          <td style={{ padding: "12px 14px", color: GRAY_500 }}>{formatDate(b.checkIn)}</td>
                          <td style={{ padding: "12px 14px", color: GRAY_500 }}>{formatDate(b.checkOut)}</td>
                          <td style={{ padding: "12px 14px", color: GRAY_500 }}><span className="flex items-center gap-1"><Users size={14} /> {b.guests}</span></td>
                          <td style={{ padding: "12px 14px" }}><StatusBadge status={b.status} /></td>
                          <td style={{ padding: "12px 14px" }} onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${GRAY_200}`, backgroundColor: WHITE, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                  <MoreHorizontal size={14} color={GRAY_400} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(b)}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => handleEdit(b, e)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                {b.status !== "cancelled" && <DropdownMenuItem onClick={(e) => handleCancel(b, e)}><Ban className="mr-2 h-4 w-4" /> Cancel</DropdownMenuItem>}
                                <DropdownMenuItem onClick={() => handlePrint(b.id)}><Printer className="mr-2 h-4 w-4" /> Print</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={(e) => handleDelete(b, e)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Detail Panel (right slide) ── */}
          <SlidePanel open={detailOpen} onClose={() => setDetailOpen(false)} title="Booking Detail" icon={<Eye size={16} color={TEAL} />}>
            {selectedBooking && (
              <div className="flex flex-col gap-1">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEAL, fontFamily: "monospace" }}>{selectedBooking.id}</span>
                  <StatusBadge status={selectedBooking.status} />
                </div>
                <InfoRow icon={<User size={15} />} label="Client Name" value={selectedBooking.clientName} />
                <InfoRow icon={<MapPin size={15} />} label="Service" value={selectedBooking.serviceName} />
                <InfoRow icon={<Calendar size={15} />} label="Check In" value={selectedBooking.checkIn} />
                <InfoRow icon={<Clock size={15} />} label="Check Out" value={selectedBooking.checkOut} />
                <InfoRow icon={<Users size={15} />} label="Guests" value={String(selectedBooking.guests || "—")} />
                <InfoRow icon={<IndianRupee size={15} />} label="Price" value={selectedBooking.servicePrice} />
                <InfoRow icon={<MapPin size={15} />} label="Location" value={selectedBooking.location} />
                {selectedBooking.contactEmail && <InfoRow icon={<Mail size={15} />} label="Email" value={selectedBooking.contactEmail} />}
                {selectedBooking.contactPhone && <InfoRow icon={<Phone size={15} />} label="Phone" value={selectedBooking.contactPhone} />}
              </div>
            )}
          </SlidePanel>

          {/* ── Create Panel (right slide) ── */}
          <SlidePanel open={createOpen} onClose={() => setCreateOpen(false)} title="New Booking" icon={<Plus size={16} color={TEAL} />} width={560}
            footer={<>{ghostBtn(() => setCreateOpen(false), "Cancel")} {tealBtn(handleCreate, <Save size={14} />, saving ? "Creating…" : "Create Booking", saving)}</>}>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 flex-wrap">
                {[{ v: "van", l: "Van", I: Car }, { v: "unique-stays", l: "Stays", I: Home }, { v: "activity", l: "Activity", I: MapPin }].map(({ v, l, I }) => {
                  const active = createForm.serviceType === v;
                  return (
                    <button key={v} type="button" onClick={() => setCreateForm((p) => ({ ...p, serviceType: v }))}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99, border: `1.5px solid ${active ? TEAL : GRAY_200}`, backgroundColor: active ? TEAL_BG : SURFACE, color: active ? TEAL : GRAY_500, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                      <I size={14} /> {l}
                    </button>
                  );
                })}
              </div>
              <PanelSelect label="Service Name" required value={createForm.serviceName} onChange={(v) => { setCreateForm((p) => ({ ...p, serviceName: v })); if (createErrors.serviceName) setCreateErrors((p) => ({ ...p, serviceName: "" })); }} error={createErrors.serviceName}>
                <option value="">Select a service</option>
                {availableServices.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </PanelSelect>
              <div className="grid grid-cols-2 gap-3">
                <PanelInput label="Customer Name" required value={createForm.customerName} onChange={(v) => { setCreateForm((p) => ({ ...p, customerName: v })); if (createErrors.customerName) setCreateErrors((p) => ({ ...p, customerName: "" })); }} error={createErrors.customerName} placeholder="Guest name" />
                <PanelInput label="Email" required value={createForm.email} onChange={(v) => { setCreateForm((p) => ({ ...p, email: v })); if (createErrors.email) setCreateErrors((p) => ({ ...p, email: "" })); }} error={createErrors.email} type="email" placeholder="email@example.com" />
              </div>
              <PanelInput label="Phone" required value={createForm.phone} onChange={(v) => setCreateForm((p) => ({ ...p, phone: v.replace(/\D/g, "") }))} error={createErrors.phone} placeholder="+91 XXXXXXXXXX" maxLength={12} />
              <div className="grid grid-cols-2 gap-3">
                <PanelInput label="Check-in Date" required value={createForm.checkInDate} onChange={(v) => setCreateForm((p) => ({ ...p, checkInDate: v }))} error={createErrors.checkInDate} type="date" />
                <PanelInput label="Check-in Time" value={createForm.checkInTime} onChange={(v) => setCreateForm((p) => ({ ...p, checkInTime: v }))} type="time" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <PanelInput label="Check-out Date" required value={createForm.checkOutDate} onChange={(v) => setCreateForm((p) => ({ ...p, checkOutDate: v }))} error={createErrors.checkOutDate} type="date" />
                <PanelInput label="Check-out Time" value={createForm.checkOutTime} onChange={(v) => setCreateForm((p) => ({ ...p, checkOutTime: v }))} type="time" />
              </div>
              <PanelSelect label="Location" value={createForm.locationFrom} onChange={(v) => setCreateForm((p) => ({ ...p, locationFrom: v }))}>
                <option value="">Select location</option>
                {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </PanelSelect>
              <div className="grid grid-cols-2 gap-3">
                <PanelInput label="Price" value={createForm.servicePrice} onChange={(v) => setCreateForm((p) => ({ ...p, servicePrice: v.replace(/\D/g, "") }))} placeholder="₹ 0" />
                <PanelInput label="Guests" value={createForm.guests} onChange={(v) => setCreateForm((p) => ({ ...p, guests: v.replace(/\D/g, "") }))} placeholder="0" />
              </div>
            </div>
          </SlidePanel>

          {/* ── Edit Panel (right slide) ── */}
          <SlidePanel open={editOpen} onClose={() => setEditOpen(false)} title={`Edit — ${selectedBooking?.id || ""}`} icon={<Pencil size={16} color={TEAL} />} width={560}
            footer={<>{ghostBtn(() => setEditOpen(false), "Cancel")} {tealBtn(handleUpdate, <Save size={14} />, saving ? "Updating…" : "Update", saving)}</>}>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <PanelInput label="Customer Name" value={editForm.customerName} onChange={(v) => setEditForm((p) => ({ ...p, customerName: v }))} />
                <PanelInput label="Phone" value={editForm.phone} onChange={(v) => setEditForm((p) => ({ ...p, phone: v.replace(/\D/g, "") }))} maxLength={12} />
              </div>
              <PanelInput label="Email" value={editForm.email} onChange={(v) => setEditForm((p) => ({ ...p, email: v }))} type="email" />
              <PanelSelect label="Status" value={editForm.status} onChange={(v) => setEditForm((p) => ({ ...p, status: v }))}>
                <option value="pending">Pending</option><option value="confirmed">Confirmed</option>
                <option value="active">Active</option><option value="cancelled">Cancelled</option>
              </PanelSelect>
              <div className="grid grid-cols-2 gap-3">
                <PanelInput label="Check-in Date" value={editForm.checkInDate} onChange={(v) => setEditForm((p) => ({ ...p, checkInDate: v }))} type="date" />
                <PanelInput label="Check-in Time" value={editForm.checkInTime} onChange={(v) => setEditForm((p) => ({ ...p, checkInTime: v }))} type="time" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <PanelInput label="Check-out Date" value={editForm.checkOutDate} onChange={(v) => setEditForm((p) => ({ ...p, checkOutDate: v }))} type="date" />
                <PanelInput label="Check-out Time" value={editForm.checkOutTime} onChange={(v) => setEditForm((p) => ({ ...p, checkOutTime: v }))} type="time" />
              </div>
              <PanelInput label="Location" value={editForm.locationFrom} onChange={(v) => setEditForm((p) => ({ ...p, locationFrom: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <PanelInput label="Price" value={editForm.servicePrice} onChange={(v) => setEditForm((p) => ({ ...p, servicePrice: v.replace(/\D/g, "") }))} placeholder="₹ 0" />
                <PanelInput label="Guests" value={editForm.guests} onChange={(v) => setEditForm((p) => ({ ...p, guests: v.replace(/\D/g, "") }))} placeholder="0" />
              </div>
            </div>
          </SlidePanel>

        </main>
      </div>
      <div className="fixed top-0 right-0"><MobileVendorNav /></div>
    </div>
  );
};

export default BookingDetails;
