import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { Plus } from "lucide-react";
import { Sidebar } from "@/components/Navigation";
import { DashboardHeader } from "@/components/Header";
import { offersApi, activitiesApi } from "@/lib/api";

import {
  type BookingData, type NewBookingForm, EMPTY_BOOKING_FORM,
  fetchBookings, createBooking, updateBooking, updateBookingDates, deleteBooking, printInvoice,
  CalendarGrid, DateNavigation, NewBookingModal, EditBookingModal,
} from "@/components/bookings";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL    = "#07e4e4";
const BLACK   = "#131313";
const GRAY_400 = "#9a9a9a";

const Bookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem("travel_auth_token") || sessionStorage.getItem("travel_auth_token") || undefined;

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [vehicleNames, setVehicleNames] = useState<string[]>([]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [selectedDate, setSelectedDate] = useState<{ date: number; resource: string } | null>(null);
  const [newBookingForm, setNewBookingForm] = useState<NewBookingForm>(EMPTY_BOOKING_FORM);

  // ─── Toast helper ──────────────────────────────────────────────────────────
  const notify = (type: "success" | "error", message: string) => {
    const styles: Record<string, any> = {
      success: { background: "#10B981", color: "#fff", fontWeight: 500, borderRadius: 12, padding: 16, boxShadow: "0 10px 25px rgba(16,185,129,0.4)" },
      error: { background: "#EF4444", color: "#fff", fontWeight: 500, borderRadius: 12, padding: 16, boxShadow: "0 10px 25px rgba(239,68,68,0.4)" },
    };
    type === "success" ? toast.success(message, { duration: 4000, position: "top-right", style: styles.success }) : toast.error(message, { duration: 4000, position: "top-right", style: styles.error });
  };

  // ─── Load resources ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const params: Record<string, any> = {};
        if (user.userType === "vendor" && user.id) { params.vendorId = user.id; params.mine = true; }
        const resOffers = await offersApi.list(undefined, token, params);

        let activityData: any[] = [];
        if (token && user.userType === "vendor") {
          const my = await activitiesApi.myList(token);
          if (my.success) activityData = my.data;
        } else {
          const all = await activitiesApi.list();
          if (all.success) activityData = all.data;
        }

        const names: string[] = [];
        if (resOffers.success) {
          let offers = resOffers.data;
          if (user.userType === "vendor" && user.id) offers = offers.filter((o) => o.vendorId === user.id);
          names.push(...offers.map((o) => o.name));
        }
        if (activityData.length > 0) names.push(...activityData.map((a: any) => a.title));
        setVehicleNames(names.length > 0 ? names : ["No Service Available"]);
      } catch (e) { console.error("Failed to fetch resources", e); }
    };
    load();
  }, [token, user]);

  // ─── Load bookings ─────────────────────────────────────────────────────────
  useEffect(() => { if (user) loadBookings(); }, [currentMonth, currentYear, user, token]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const isVendor = user?.userType === "vendor";
      const data = await fetchBookings(currentMonth, currentYear, token, isVendor ? user?.id : undefined, isVendor ? user?.email : undefined);
      setBookings(data);
      if (data.length > 0) {
        const booked = Array.from(new Set(data.map((b) => b.resourceName)));
        setVehicleNames((prev) => {
          const combined = Array.from(new Set([...prev, ...booked])).filter((n) => n !== "Default Service" || combined.length === 1);
          return combined.length > 0 ? combined : ["Default Service"];
        });
      }
    } catch { notify("error", "Failed to load bookings"); }
    finally { setLoading(false); }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleNewBooking = () => {
    if (selectedDate) {
      const ds = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${selectedDate.date.toString().padStart(2, "0")}`;
      setNewBookingForm((p) => ({ ...p, resourceName: selectedDate.resource, startDate: ds, endDate: ds }));
    }
    setIsNewModalOpen(true);
  };

  const handleBookingClick = (b: BookingData) => { setSelectedBooking(b); setIsEditModalOpen(true); };

  const handleDateClick = (date: number, resource: string) => {
    const ds = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${date.toString().padStart(2, "0")}`;
    setSelectedDate({ date, resource });
    setNewBookingForm((p) => ({ ...p, resourceName: resource, startDate: ds, endDate: ds }));
    setIsNewModalOpen(true);
  };

  const handleBookingDrag = async (id: string, start: Date, end: Date) => {
    try {
      const updated = await updateBookingDates(id, start, end, "move", token);
      if (updated) { setBookings((p) => p.map((b) => (b._id === id ? updated : b))); notify("success", "Booking moved"); }
    } catch (e: any) { notify("error", e.message || "Failed to move"); }
  };

  const handleCreateBooking = async () => {
    if (!newBookingForm.guestName || !newBookingForm.resourceName || !newBookingForm.startDate || !newBookingForm.endDate) { notify("error", "Please fill all required fields"); return; }
    if (new Date(newBookingForm.startDate) > new Date(newBookingForm.endDate)) { notify("error", "End date must be after start date"); return; }
    try {
      const nb = await createBooking(newBookingForm, token, user?.email);
      if (nb) {
        setBookings((p) => [...p, nb]); setIsNewModalOpen(false); setNewBookingForm(EMPTY_BOOKING_FORM); setSelectedDate(null);
        notify("success", "Booking created");
        setTimeout(() => { try { printInvoice(nb, token); } catch {} }, 500);
      }
    } catch (e: any) { notify("error", e.message || "Failed to create"); }
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    try {
      const base = Number(selectedBooking.basePrice || 0), extra = Number(selectedBooking.extraCharges || 0), paid = Number(selectedBooking.paidAmount || 0);
      const updated = await updateBooking(selectedBooking._id, { ...selectedBooking, totalAmount: String(base + extra), pendingAmount: String(base + extra - paid) }, token);
      if (updated) { setBookings((p) => p.map((b) => (b._id === selectedBooking._id ? updated : b))); setIsEditModalOpen(false); setSelectedBooking(null); notify("success", "Booking updated"); }
    } catch (e: any) { notify("error", e.message || "Failed to update"); }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      if (await deleteBooking(id, token)) { setBookings((p) => p.filter((b) => b._id !== id)); setIsEditModalOpen(false); setSelectedBooking(null); notify("success", "Booking deleted"); }
    } catch (e: any) { notify("error", e.message || "Failed to delete"); }
  };

  const filteredBookings = bookings.filter((b) => {
    if (user?.userType !== "vendor") return true;
    return vehicleNames.includes(b.resourceName) || b.createdBy === user.email;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 font-plus-jakarta overflow-hidden">
      <div className="hidden lg:block flex-shrink-0"><Sidebar /></div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader Headtitle="Bookings" />

        <main className="flex-1 overflow-auto p-3 lg:p-5">
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-5 pb-4 gap-4" style={{ borderBottom: "1.5px solid #EBEBEB" }}>
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div style={{ width: 20, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GRAY_400 }}>Calendar</span>
                </div>
                <DateNavigation currentMonth={currentMonth} currentYear={currentYear} onMonthChange={setCurrentMonth} onYearChange={setCurrentYear} />
              </div>
              <button type="button" onClick={handleNewBooking}
                style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 20px", borderRadius: 13, border: "none", backgroundColor: TEAL, fontSize: 13, fontWeight: 700, color: BLACK, cursor: "pointer", boxShadow: "0 4px 16px rgba(7,228,228,0.3)", width: "fit-content" }}>
                <Plus size={16} strokeWidth={2.5} /> New Booking
              </button>
            </div>

            {/* Calendar */}
            <div className="overflow-auto" key={`${currentYear}-${currentMonth}`}>
              {loading ? (
                <div className="flex items-center justify-center h-64 gap-2" style={{ color: GRAY_400 }}>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span style={{ fontSize: 13 }}>Loading bookings…</span>
                </div>
              ) : (
                <CalendarGrid
                  currentMonth={currentMonth} currentYear={currentYear}
                  bookings={filteredBookings} onBookingClick={handleBookingClick}
                  onBookingDrag={handleBookingDrag} onDateClick={handleDateClick}
                  selectedDate={selectedDate} vehicleNames={vehicleNames}
                />
              )}
            </div>
          </div>

          <NewBookingModal open={isNewModalOpen} onOpenChange={setIsNewModalOpen} form={newBookingForm} setForm={setNewBookingForm} vehicleNames={vehicleNames} onCreate={handleCreateBooking} />
          <EditBookingModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} booking={selectedBooking} setBooking={setSelectedBooking} onUpdate={handleUpdateBooking} onDelete={handleDeleteBooking} onPrint={(b) => { try { printInvoice(b, token); } catch { notify("error", "Failed to print invoice"); } }} />
        </main>
      </div>

      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: 14, fontWeight: 500, borderRadius: 12, padding: 16, maxWidth: 400 } }} />
    </div>
  );
};

export default Bookings;
