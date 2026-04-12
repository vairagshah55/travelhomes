import React, { useState } from "react";
import { Plus, Edit, Save, Trash2, Printer, User, MapPin, Calendar } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type BookingData, type NewBookingForm } from "./api";
import { SlidePanel } from "./SlidePanel";

const TEAL       = "#07e4e4";
const TEAL_FOCUS = "rgba(7, 228, 228, 0.15)";
const BLACK      = "#131313";
const GRAY_500   = "#6b6b6b";
const GRAY_400   = "#9a9a9a";
const GRAY_200   = "#e4e4e4";
const WHITE      = "#ffffff";
const SURFACE    = "#F7F8FA";
const ERROR      = "#ef4444";
const ERROR_BG   = "rgba(239,68,68,0.04)";
const ERROR_RING = "rgba(239,68,68,0.1)";

/* ─── Field wrapper with error ────────────────────────────────────────────── */
const PanelField = ({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label style={{ fontSize: 11, fontWeight: 700, color: error ? ERROR : GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
      {label}{required && <span style={{ color: ERROR, marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {error && (
      <div className="flex items-center gap-1.5">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" /><path d="M6 3.5v3M6 8.25v.25" stroke={ERROR} strokeWidth="1.5" strokeLinecap="round" /></svg>
        <p style={{ fontSize: 11, color: ERROR }}>{error}</p>
      </div>
    )}
  </div>
);

/* ─── Styled input with error ─────────────────────────────────────────────── */
const PanelInput = ({ value, onChange, placeholder, type = "text", error, ...rest }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type">) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder}
      style={{
        width: "100%", height: 44, padding: "0 14px", fontSize: 13, color: BLACK, fontWeight: 450,
        backgroundColor: error ? ERROR_BG : focused ? WHITE : SURFACE,
        border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`,
        borderRadius: 11, outline: "none",
        boxShadow: focused && !error ? `0 0 0 3px ${TEAL_FOCUS}` : error ? `0 0 0 3px ${ERROR_RING}` : "none",
        transition: "all 0.15s",
      }}
      {...rest}
    />
  );
};

const tealBtn = (onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean) => (
  <button type="button" onClick={onClick} disabled={disabled}
    style={{ display: "flex", alignItems: "center", gap: 6, height: 40, padding: "0 20px", borderRadius: 11, border: "none", backgroundColor: TEAL, fontSize: 13, fontWeight: 700, color: BLACK, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, boxShadow: "0 4px 16px rgba(7,228,228,0.3)", transition: "all 0.15s" }}>
    {icon} {label}
  </button>
);

const ghostBtn = (onClick: () => void, label: string) => (
  <button type="button" onClick={onClick}
    style={{ height: 40, padding: "0 18px", borderRadius: 11, border: `1.5px solid ${GRAY_200}`, backgroundColor: "transparent", fontSize: 13, fontWeight: 600, color: GRAY_500, cursor: "pointer" }}>
    {label}
  </button>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
/* NEW BOOKING PANEL                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */
export const NewBookingModal = ({ open, onOpenChange, form, setForm, vehicleNames, onCreate }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  form: NewBookingForm; setForm: React.Dispatch<React.SetStateAction<NewBookingForm>>;
  vehicleNames: string[]; onCreate: () => void;
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: keyof NewBookingForm, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };
  const setNumeric = (field: keyof NewBookingForm, value: string) => set(field, value.replace(/\D/g, ""));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.guestName.trim()) e.guestName = "Guest name is required";
    if (!form.resourceName) e.resourceName = "Service is required";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) e.endDate = "Must be after start date";
    if (!form.phoneNumber.trim()) e.phoneNumber = "Phone is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.adults) e.adults = "Adults is required";
    if (!form.children) e.children = "Children is required";
    if (!form.basePrice) e.basePrice = "Base price is required";
    if (!form.extraCharges) e.extraCharges = "Extra charges is required";
    const total = form.totalAmount || String(Number(form.basePrice || 0) + Number(form.extraCharges || 0));
    if (!total || total === "0") e.totalAmount = "Total amount is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => { if (validate()) onCreate(); };

  return (
    <SlidePanel open={open} onClose={() => onOpenChange(false)} title="New Booking" icon={<Plus size={16} color={TEAL} />} width={540}
      footer={<>{ghostBtn(() => onOpenChange(false), "Cancel")} {tealBtn(handleCreate, <Save size={14} />, "Create Booking")}</>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Guest Name" required error={errors.guestName}>
            <PanelInput value={form.guestName} onChange={(v) => set("guestName", v)} placeholder="Enter guest name" error={!!errors.guestName} />
          </PanelField>
          <PanelField label="Service Name" required error={errors.resourceName}>
            <Select value={form.resourceName} onValueChange={(v) => set("resourceName", v)}>
              <SelectTrigger className={`figma-input h-[44px] ${errors.resourceName ? "border-red-400" : ""}`}><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>{vehicleNames.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </PanelField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Start Date" required error={errors.startDate}>
            <PanelInput type="date" value={form.startDate} onChange={(v) => set("startDate", v)} error={!!errors.startDate} />
          </PanelField>
          <PanelField label="End Date" required error={errors.endDate}>
            <PanelInput type="date" value={form.endDate} onChange={(v) => set("endDate", v)} error={!!errors.endDate} />
          </PanelField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Phone Number" required error={errors.phoneNumber}>
            <PanelInput value={form.phoneNumber} onChange={(v) => setNumeric("phoneNumber", v)} placeholder="Enter phone" maxLength={12} error={!!errors.phoneNumber} />
          </PanelField>
          <PanelField label="Email" required error={errors.email}>
            <PanelInput type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="Enter email" error={!!errors.email} />
          </PanelField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Adults" required error={errors.adults}>
            <PanelInput value={form.adults} onChange={(v) => setNumeric("adults", v)} placeholder="0" error={!!errors.adults} />
          </PanelField>
          <PanelField label="Children" required error={errors.children}>
            <PanelInput value={form.children} onChange={(v) => setNumeric("children", v)} placeholder="0" error={!!errors.children} />
          </PanelField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Base Price (₹)" required error={errors.basePrice}>
            <PanelInput value={form.basePrice} onChange={(v) => setNumeric("basePrice", v)} placeholder="₹ 0" error={!!errors.basePrice} />
          </PanelField>
          <PanelField label="Extra Charges (₹)" required error={errors.extraCharges}>
            <PanelInput value={form.extraCharges} onChange={(v) => setNumeric("extraCharges", v)} placeholder="₹ 0" error={!!errors.extraCharges} />
          </PanelField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Payment Method" required error={errors.paymentMethod}>
            <select value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}
              style={{ width: "100%", height: 44, padding: "0 14px", fontSize: 13, color: form.paymentMethod ? BLACK : GRAY_400, fontWeight: 450, backgroundColor: errors.paymentMethod ? ERROR_BG : SURFACE, border: `1.5px solid ${errors.paymentMethod ? "#fca5a5" : "transparent"}`, borderRadius: 11, outline: "none", appearance: "none", cursor: "pointer", transition: "all 0.15s" }}>
              <option value="" disabled>Select method</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online Payment</option>
            </select>
          </PanelField>
          <PanelField label="Total Amount" required error={errors.totalAmount}>
            <PanelInput value={form.totalAmount || (form.basePrice || form.extraCharges ? String(Number(form.basePrice || 0) + Number(form.extraCharges || 0)) : "")} onChange={(v) => set("totalAmount", v.replace(/\D/g, ""))} placeholder="₹ 0" error={!!errors.totalAmount} />
          </PanelField>
        </div>
        <PanelField label="Notes">
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any notes…" rows={2} className="figma-input" />
        </PanelField>
        <PanelField label="Special Requests">
          <Textarea value={form.specialRequests} onChange={(e) => set("specialRequests", e.target.value)} placeholder="Any special requests…" rows={2} className="figma-input" />
        </PanelField>
      </div>
    </SlidePanel>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/* EDIT BOOKING PANEL                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
export const EditBookingModal = ({ open, onOpenChange, booking, setBooking, onUpdate, onDelete, onPrint }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  booking: BookingData | null; setBooking: React.Dispatch<React.SetStateAction<BookingData | null>>;
  onUpdate: () => void; onDelete: (id: string) => void; onPrint: (b: BookingData) => void;
}) => {
  if (!booking) return null;

  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (field: string, value: any) => {
    setBooking((p) => (p ? { ...p, [field]: value } : null));
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };
  const setNumeric = (field: string, value: string) => setField(field, value.replace(/\D/g, ""));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!booking.guestName?.trim()) e.guestName = "Guest name is required";
    if (!booking.phoneNumber?.trim()) e.phoneNumber = "Phone is required";
    if (!booking.email?.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) e.email = "Invalid email";
    if (!booking.basePrice) e.basePrice = "Base price is required";
    if (!booking.extraCharges) e.extraCharges = "Extra charges is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpdate = () => { if (validate()) onUpdate(); };

  return (
    <SlidePanel open={open} onClose={() => onOpenChange(false)} title={`Edit — ${booking.bookingId}`} icon={<Edit size={16} color={TEAL} />} width={540}
      footer={
        <>
          <button type="button" onClick={() => onPrint(booking)} style={{ height: 40, padding: "0 16px", borderRadius: 11, border: `1.5px solid ${GRAY_200}`, backgroundColor: "transparent", fontSize: 13, fontWeight: 600, color: GRAY_500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginRight: "auto" }}>
            <Printer size={14} /> Print
          </button>
          <button type="button" onClick={() => onDelete(booking._id)} style={{ height: 40, padding: "0 16px", borderRadius: 11, border: "1.5px solid #fca5a5", backgroundColor: ERROR_BG, fontSize: 13, fontWeight: 700, color: ERROR, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Trash2 size={14} /> Delete
          </button>
          {ghostBtn(() => onOpenChange(false), "Cancel")}
          {tealBtn(handleUpdate, <Save size={14} />, "Update")}
        </>
      }>
      <div className="flex flex-col gap-4">
        {/* Info banner */}
        <div className="grid grid-cols-3 gap-3" style={{ padding: 12, backgroundColor: SURFACE, borderRadius: 12, border: `1.5px solid ${GRAY_200}` }}>
          {[
            { icon: <User size={14} color={TEAL} />, label: "Guest", value: booking.guestName },
            { icon: <MapPin size={14} color={TEAL} />, label: "Service", value: booking.resourceName },
            { icon: <Calendar size={14} color={TEAL} />, label: "Duration", value: `${booking.totalDays} days` },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.icon}
              <div><p style={{ fontSize: 10, color: GRAY_400 }}>{item.label}</p><p style={{ fontSize: 12, fontWeight: 700, color: BLACK }}>{item.value}</p></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Guest Name" required error={errors.guestName}>
            <PanelInput value={booking.guestName} onChange={(v) => setField("guestName", v)} error={!!errors.guestName} />
          </PanelField>
          <PanelField label="Phone" required error={errors.phoneNumber}>
            <PanelInput value={booking.phoneNumber || ""} onChange={(v) => setNumeric("phoneNumber", v)} placeholder="+91 XXXXXXXXXX" maxLength={12} error={!!errors.phoneNumber} />
          </PanelField>
        </div>
        <PanelField label="Email" required error={errors.email}>
          <PanelInput value={booking.email || ""} onChange={(v) => setField("email", v)} error={!!errors.email} />
        </PanelField>
        <PanelField label="Status" required>
          <Select value={booking.status} onValueChange={(v: any) => setField("status", v)}>
            <SelectTrigger className="figma-input h-[44px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Confirmed">Confirmed</SelectItem><SelectItem value="Checked-in">Checked-in</SelectItem>
              <SelectItem value="Checked-out">Checked-out</SelectItem><SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </PanelField>
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Base Price (₹)" required error={errors.basePrice}>
            <PanelInput value={booking.basePrice} onChange={(v) => setNumeric("basePrice", v)} placeholder="₹ 0" error={!!errors.basePrice} />
          </PanelField>
          <PanelField label="Extra Charges (₹)" required error={errors.extraCharges}>
            <PanelInput value={booking.extraCharges} onChange={(v) => setNumeric("extraCharges", v)} placeholder="₹ 0" error={!!errors.extraCharges} />
          </PanelField>
        </div>
        <PanelField label="Notes" required>
          <Textarea value={booking.notes || ""} onChange={(e) => setField("notes", e.target.value)} rows={2} className="figma-input" />
        </PanelField>
      </div>
    </SlidePanel>
  );
};
