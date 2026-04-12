// ─── Types ───────────────────────────────────────────────────────────────────
export interface BookingData {
  _id: string;
  bookingId: string;
  guestName: string;
  resourceName: string;
  startDate: Date;
  endDate: Date;
  totalDays: string;
  color: string;
  phoneNumber?: string;
  email?: string;
  adults: string;
  children: string;
  totalGuests: string;
  basePrice: string;
  extraCharges: string;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  status: "Confirmed" | "Checked-in" | "Checked-out" | "Cancelled";
  notes?: string;
  specialRequests?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  vendorId?: string;
  service?: { vendorId?: string };
  resource?: { vendorId?: string };
}

export interface NewBookingForm {
  guestName: string;
  resourceName: string;
  startDate: string;
  endDate: string;
  phoneNumber: string;
  email: string;
  adults: string;
  children: string;
  basePrice: string;
  extraCharges: string;
  totalAmount: string;
  paymentMethod: string;
  notes: string;
  specialRequests: string;
}

export const EMPTY_BOOKING_FORM: NewBookingForm = {
  guestName: "", resourceName: "", startDate: "", endDate: "",
  phoneNumber: "", email: "", adults: "", children: "",
  basePrice: "", extraCharges: "", totalAmount: "", paymentMethod: "cash",
  notes: "", specialRequests: "",
};

// ─── API base ────────────────────────────────────────────────────────────────
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api`;

const parseBooking = (b: any): BookingData => ({
  ...b,
  startDate: new Date(b.startDate),
  endDate: new Date(b.endDate),
  createdAt: new Date(b.createdAt),
  updatedAt: new Date(b.updatedAt),
});

const authHeaders = (token?: string): Record<string, string> => {
  const h: Record<string, string> = {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

// ─── Fetch bookings ──────────────────────────────────────────────────────────
export const fetchBookings = async (month: number, year: number, token?: string, vendorId?: string, vendorEmail?: string): Promise<BookingData[]> => {
  try {
    const qs = new URLSearchParams();
    qs.append("month", (month + 1).toString());
    qs.append("year", year.toString());
    if (vendorId) qs.append("vendorId", vendorId);
    if (vendorEmail) qs.append("vendorEmail", vendorEmail);
    const res = await fetch(`${API_BASE_URL}/calendarbooking?${qs}`, { headers: authHeaders(token) });
    const data = await res.json();
    return data.success ? data.data.map(parseBooking) : [];
  } catch (e) { console.error("Error fetching bookings:", e); return []; }
};

// ─── Create booking ──────────────────────────────────────────────────────────
export const createBooking = async (form: NewBookingForm, token?: string, userEmail?: string): Promise<BookingData | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/calendarbooking`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ ...form, totalAmount: form.basePrice + form.extraCharges, createdBy: userEmail || "admin" }),
    });
    const data = await res.json();
    return data.success ? parseBooking(data.data) : null;
  } catch (e) { console.error("Error creating booking:", e); return null; }
};

// ─── Update booking ──────────────────────────────────────────────────────────
export const updateBooking = async (id: string, bookingData: Partial<BookingData>, token?: string): Promise<BookingData | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/calendarbooking/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(bookingData),
    });
    const data = await res.json();
    return data.success ? parseBooking(data.data) : null;
  } catch (e) { console.error("Error updating booking:", e); return null; }
};

// ─── Update dates (drag) ─────────────────────────────────────────────────────
export const updateBookingDates = async (id: string, startDate: Date, endDate: Date, action: string, token?: string): Promise<BookingData | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/calendarbooking/${id}/dates`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ startDate: startDate.toISOString(), endDate: endDate.toISOString(), action }),
    });
    const data = await res.json();
    return data.success ? parseBooking(data.data) : null;
  } catch (e) { console.error("Error updating booking dates:", e); return null; }
};

// ─── Delete booking ──────────────────────────────────────────────────────────
export const deleteBooking = async (id: string, token?: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/calendarbooking/${id}`, { method: "DELETE", headers: authHeaders(token) });
    const data = await res.json();
    return data.success;
  } catch (e) { console.error("Error deleting booking:", e); return false; }
};

// ─── Generate invoice ────────────────────────────────────────────────────────
export const generateInvoiceData = async (id: string, token?: string): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/calendarbooking/${id}/invoice`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to generate invoice");
  return data.data;
};

// ─── Print invoice ───────────────────────────────────────────────────────────
export const printInvoice = async (booking: BookingData, token?: string) => {
  const inv = await generateInvoiceData(booking._id, token);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px">
      <h1 style="text-align:center;color:#333">INVOICE</h1>
      <div style="border-bottom:2px solid #333;margin-bottom:20px"></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:30px">
        <div><h3>Travel Homes</h3><p>Booking Management System</p></div>
        <div style="text-align:right"><p><strong>Date:</strong> ${new Date(inv.generatedAt).toLocaleDateString()}</p><p><strong>ID:</strong> ${inv.bookingId}</p></div>
      </div>
      <div style="margin-bottom:30px"><h3>Guest Details</h3><p><strong>Name:</strong> ${inv.guestName}</p><p><strong>Phone:</strong> ${inv.phoneNumber || "N/A"}</p><p><strong>Email:</strong> ${inv.email || "N/A"}</p></div>
      <div style="margin-bottom:30px"><h3>Booking Details</h3><p><strong>Service:</strong> ${inv.resourceName}</p><p><strong>Check-in:</strong> ${new Date(inv.startDate).toLocaleDateString()}</p><p><strong>Check-out:</strong> ${new Date(inv.endDate).toLocaleDateString()}</p><p><strong>Duration:</strong> ${inv.totalDays} days</p><p><strong>Guests:</strong> ${inv.adults} Adults, ${inv.children} Children</p><p><strong>Status:</strong> ${inv.status}</p></div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:30px">
        <thead><tr style="background:#f5f5f5"><th style="border:1px solid #ddd;padding:12px;text-align:left">Description</th><th style="border:1px solid #ddd;padding:12px;text-align:right">Amount</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #ddd;padding:12px">Base Price (${inv.totalDays} days)</td><td style="border:1px solid #ddd;padding:12px;text-align:right">₹${inv.basePrice.toLocaleString()}</td></tr>
          <tr><td style="border:1px solid #ddd;padding:12px">Extra Charges</td><td style="border:1px solid #ddd;padding:12px;text-align:right">₹${inv.extraCharges.toLocaleString()}</td></tr>
          <tr style="background:#f5f5f5;font-weight:bold"><td style="border:1px solid #ddd;padding:12px">Total</td><td style="border:1px solid #ddd;padding:12px;text-align:right">₹${inv.totalAmount.toLocaleString()}</td></tr>
          <tr><td style="border:1px solid #ddd;padding:12px">Paid</td><td style="border:1px solid #ddd;padding:12px;text-align:right">₹${inv.paidAmount.toLocaleString()}</td></tr>
          <tr style="color:${inv.pendingAmount > 0 ? "red" : "green"}"><td style="border:1px solid #ddd;padding:12px">Pending</td><td style="border:1px solid #ddd;padding:12px;text-align:right">₹${inv.pendingAmount.toLocaleString()}</td></tr>
        </tbody>
      </table>
      <p><strong>Payment:</strong> ${inv.paymentMethod} — ${inv.paymentStatus}</p>
      ${inv.notes ? `<p><strong>Notes:</strong> ${inv.notes}</p>` : ""}
      ${inv.specialRequests ? `<p><strong>Requests:</strong> ${inv.specialRequests}</p>` : ""}
      <div style="text-align:center;margin-top:50px;font-size:12px;color:#666"><p>Thank you for choosing Travel Homes!</p></div>
    </div>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${inv.bookingId}</title></head><body>${html}</body></html>`); w.document.close(); w.print(); }
};

// ─── Utilities ───────────────────────────────────────────────────────────────
export const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();

export const formatDateShort = (date: Date) => `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;

export const formatDateRange = (start: Date, end: Date) => start.getTime() === end.getTime() ? formatDateShort(start) : `${formatDateShort(start)} - ${formatDateShort(end)}`;

export const isDateBooked = (date: number, month: number, year: number, bookings: BookingData[], resource: string) => {
  const check = new Date(year, month, date); check.setHours(0, 0, 0, 0);
  return bookings.some((b) => {
    if (b.resourceName !== resource || b.status === "Cancelled") return false;
    const s = new Date(b.startDate); s.setHours(0, 0, 0, 0);
    const e = new Date(b.endDate); e.setHours(0, 0, 0, 0);
    return check >= s && check <= e;
  });
};
