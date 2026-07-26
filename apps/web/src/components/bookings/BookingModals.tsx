import React, { useState } from "react";
import {
  Edit,
  Save,
  Trash2,
  Printer,
  User,
  MapPin,
  Calendar as CalendarIcon,
  Users,
  IndianRupee,
  CreditCard,
  FileText,
  Info,
  Clock,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type BookingData } from "./api";
import { SlidePanel } from "./SlidePanel";
import {
  SELECT_ITEM_CLASS,
  SectionHeader,
  PanelField,
  PanelInput,
  DatePickerField,
  tealBtn,
  ghostBtn,
} from "./FormPrimitives";

/* ═══════════════════════════════════════════════════════════════════════════ */
/* EDIT BOOKING PANEL                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
export const EditBookingModal = ({
  open,
  onOpenChange,
  booking,
  setBooking,
  onUpdate,
  onDelete,
  onPrint,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  booking: BookingData | null;
  setBooking: React.Dispatch<React.SetStateAction<BookingData | null>>;
  onUpdate: () => void;
  onDelete: (id: string) => void;
  onPrint: (b: BookingData) => void;
}) => {
  if (!booking) return null;

  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (field: string, value: any) => {
    setBooking((p) => (p ? { ...p, [field]: value } : null));
    if (errors[field])
      setErrors((p) => {
        const n = { ...p };
        delete n[field];
        return n;
      });
  };
  const setNumeric = (field: string, value: string) => setField(field, value.replace(/\D/g, ""));

  /**
   * Zero is a legitimate amount, so these can't be falsy checks — `!0` is true,
   * which made every booking with no extra charges (the common case) fail
   * validation and silently refuse to save.
   */
  const isBlank = (v: unknown) => v === null || v === undefined || String(v).trim() === "";

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!booking.guestName?.trim()) e.guestName = "Guest name is required";
    if (!booking.phoneNumber?.trim()) e.phoneNumber = "Phone is required";
    if (!booking.email?.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) e.email = "Invalid email";
    if (isBlank(booking.basePrice)) e.basePrice = "Base price is required";
    else if (Number(booking.basePrice) < 0) e.basePrice = "Cannot be negative";
    if (isBlank(booking.extraCharges)) e.extraCharges = "Extra charges is required";
    else if (Number(booking.extraCharges) < 0) e.extraCharges = "Cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpdate = () => {
    if (validate()) onUpdate();
  };

  return (
    <SlidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      title={`Edit — ${booking.bookingId}`}
      icon={<Edit size={16} className="text-th-brand" />}
      width={540}
      footer={
        <>
          <button
            type="button"
            onClick={() => onPrint(booking)}
            className="h-10 px-4 rounded-[11px] border border-th-warm-border bg-transparent text-[13px] font-semibold text-th-warm-text-dark cursor-pointer flex items-center gap-1.5 mr-auto"
          >
            <Printer size={14} /> Print
          </button>
          <button
            type="button"
            onClick={() => onDelete(booking._id)}
            className="h-10 px-4 rounded-[11px] border border-th-error-bright-soft bg-th-error-bright-bg text-[13px] font-bold text-th-error-bright cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 size={14} /> Delete
          </button>
          {ghostBtn(() => onOpenChange(false), "Cancel")}
          {tealBtn(handleUpdate, <Save size={14} />, "Update")}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* ── Read-only summary banner ── */}
        <div className="p-3.5 bg-th-brand-soft rounded-[12px] border border-th-brand-border-soft">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: <User size={13} className="text-th-brand" />,
                label: "Guest",
                value: booking.guestName,
              },
              {
                icon: <MapPin size={13} className="text-th-brand" />,
                label: "Service",
                value: booking.resourceName,
              },
              {
                icon: <CalendarIcon size={13} className="text-th-brand" />,
                label: "Duration",
                value: `${booking.totalDays || "—"} days`,
              },
              {
                icon: <Users size={13} className="text-th-brand" />,
                label: "Guests",
                value:
                  booking.totalGuests ||
                  `${Number(booking.adults || 0) + Number(booking.children || 0)}`,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                {item.icon}
                <div className="min-w-0">
                  <p className="text-[10px] text-th-warm-text-muted uppercase tracking-[0.04em] font-bold">
                    {item.label}
                  </p>
                  <p className="truncate text-[12px] font-bold text-th-text-primary">
                    {item.value || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {(booking.createdAt || booking.createdBy) && (
            <div className="mt-2 pt-2 flex items-center gap-2 border-t border-th-brand-border-soft text-[11px] text-th-warm-text-dark">
              <Clock size={11} className="text-th-warm-text-muted" />
              Created
              {booking.createdAt && (
                <span className="text-th-text-primary font-semibold">
                  {new Date(booking.createdAt).toLocaleString()}
                </span>
              )}
              {booking.createdBy && <span>· by {booking.createdBy}</span>}
            </div>
          )}
        </div>

        {/* ── Guest Information ── */}
        <SectionHeader
          icon={<User size={13} className="text-th-brand" />}
          title="Guest Information"
        />
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Guest Name" required error={errors.guestName}>
            <PanelInput
              value={booking.guestName}
              onChange={(v) => setField("guestName", v)}
              error={!!errors.guestName}
            />
          </PanelField>
          <PanelField label="Phone" required error={errors.phoneNumber}>
            <PanelInput
              value={booking.phoneNumber || ""}
              onChange={(v) => setNumeric("phoneNumber", v)}
              placeholder="+91 XXXXXXXXXX"
              maxLength={12}
              error={!!errors.phoneNumber}
            />
          </PanelField>
        </div>
        <PanelField label="Email" required error={errors.email}>
          <PanelInput
            value={booking.email || ""}
            onChange={(v) => setField("email", v)}
            error={!!errors.email}
          />
        </PanelField>

        {/* ── Booking Dates + Status ── */}
        <SectionHeader
          icon={<CalendarIcon size={13} className="text-th-brand" />}
          title="Booking Dates & Status"
        />
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Start Date">
            <DatePickerField
              value={
                booking.startDate ? new Date(booking.startDate).toISOString().slice(0, 10) : ""
              }
              onChange={(v) => setField("startDate", v ? new Date(`${v}T00:00:00`) : null)}
              placeholder="Select start date"
            />
          </PanelField>
          <PanelField label="End Date">
            <DatePickerField
              value={booking.endDate ? new Date(booking.endDate).toISOString().slice(0, 10) : ""}
              onChange={(v) => setField("endDate", v ? new Date(`${v}T00:00:00`) : null)}
              placeholder="Select end date"
              minDate={booking.startDate ? new Date(booking.startDate) : undefined}
            />
          </PanelField>
        </div>
        <PanelField label="Status" required>
          <Select value={booking.status} onValueChange={(v: any) => setField("status", v)}>
            <SelectTrigger className="figma-input h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[60]">
              <SelectItem value="Confirmed" className={SELECT_ITEM_CLASS}>
                Confirmed
              </SelectItem>
              <SelectItem value="Checked-in" className={SELECT_ITEM_CLASS}>
                Checked-in
              </SelectItem>
              <SelectItem value="Checked-out" className={SELECT_ITEM_CLASS}>
                Checked-out
              </SelectItem>
              <SelectItem value="Cancelled" className={SELECT_ITEM_CLASS}>
                Cancelled
              </SelectItem>
            </SelectContent>
          </Select>
        </PanelField>

        {/* ── Guests count ── */}
        <SectionHeader icon={<Users size={13} className="text-th-brand" />} title="Guests" />
        <div className="grid grid-cols-3 gap-3">
          <PanelField label="Adults">
            <PanelInput
              value={booking.adults || ""}
              onChange={(v) => setNumeric("adults", v)}
              placeholder="0"
            />
          </PanelField>
          <PanelField label="Children">
            <PanelInput
              value={booking.children || ""}
              onChange={(v) => setNumeric("children", v)}
              placeholder="0"
            />
          </PanelField>
          <PanelField label="Total (auto)">
            <div className="w-full h-11 px-3.5 flex items-center text-[13px] font-semibold text-th-text-primary bg-th-warm-surface border border-dashed border-th-warm-border rounded-[11px]">
              {Number(booking.adults || 0) + Number(booking.children || 0)}
            </div>
          </PanelField>
        </div>

        {/* ── Pricing ── */}
        <SectionHeader icon={<IndianRupee size={13} className="text-th-brand" />} title="Pricing" />
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Base Price (₹)" required error={errors.basePrice}>
            <PanelInput
              value={booking.basePrice}
              onChange={(v) => setNumeric("basePrice", v)}
              placeholder="₹ 0"
              error={!!errors.basePrice}
            />
          </PanelField>
          <PanelField label="Extra Charges (₹)" required error={errors.extraCharges}>
            <PanelInput
              value={booking.extraCharges}
              onChange={(v) => setNumeric("extraCharges", v)}
              placeholder="₹ 0"
              error={!!errors.extraCharges}
            />
          </PanelField>
        </div>
        <PanelField label="Total Amount (auto)">
          <div className="w-full h-11 px-3.5 flex items-center text-[14px] font-extrabold text-th-brand bg-th-brand-soft border border-th-brand-border-soft rounded-[11px] tracking-[-0.01em]">
            ₹ {Number(booking.basePrice || 0) + Number(booking.extraCharges || 0)}
          </div>
        </PanelField>

        {/* ── Payment ── */}
        <SectionHeader icon={<CreditCard size={13} className="text-th-brand" />} title="Payment" />
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Method">
            <Select
              value={booking.paymentMethod || ""}
              onValueChange={(v: any) => setField("paymentMethod", v)}
            >
              <SelectTrigger className="figma-input h-[44px]">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent className="z-[60]">
                <SelectItem value="cash" className={SELECT_ITEM_CLASS}>
                  Cash
                </SelectItem>
                <SelectItem value="card" className={SELECT_ITEM_CLASS}>
                  Card
                </SelectItem>
                <SelectItem value="upi" className={SELECT_ITEM_CLASS}>
                  UPI
                </SelectItem>
                <SelectItem value="bank_transfer" className={SELECT_ITEM_CLASS}>
                  Bank Transfer
                </SelectItem>
                <SelectItem value="cheque" className={SELECT_ITEM_CLASS}>
                  Cheque
                </SelectItem>
                <SelectItem value="online" className={SELECT_ITEM_CLASS}>
                  Online Payment
                </SelectItem>
              </SelectContent>
            </Select>
          </PanelField>
          <PanelField label="Payment Status">
            <Select
              value={booking.paymentStatus || ""}
              onValueChange={(v: any) => setField("paymentStatus", v)}
            >
              <SelectTrigger className="figma-input h-[44px]">
                <SelectValue placeholder="Unpaid" />
              </SelectTrigger>
              <SelectContent className="z-[60]">
                <SelectItem value="unpaid" className={SELECT_ITEM_CLASS}>
                  Unpaid
                </SelectItem>
                <SelectItem value="partial" className={SELECT_ITEM_CLASS}>
                  Partially Paid
                </SelectItem>
                <SelectItem value="paid" className={SELECT_ITEM_CLASS}>
                  Paid
                </SelectItem>
                <SelectItem value="refunded" className={SELECT_ITEM_CLASS}>
                  Refunded
                </SelectItem>
              </SelectContent>
            </Select>
          </PanelField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Paid Amount (₹)">
            <PanelInput
              value={booking.paidAmount || ""}
              onChange={(v) => setNumeric("paidAmount", v)}
              placeholder="₹ 0"
            />
          </PanelField>
          <PanelField label="Pending (auto)">
            <div className="w-full h-11 px-3.5 flex items-center text-[13px] font-bold text-th-text-primary bg-th-warm-surface border border-dashed border-th-warm-border rounded-[11px]">
              ₹{" "}
              {Math.max(
                0,
                Number(booking.basePrice || 0) +
                  Number(booking.extraCharges || 0) -
                  Number(booking.paidAmount || 0),
              )}
            </div>
          </PanelField>
        </div>

        {/* ── Additional Information ── */}
        <SectionHeader
          icon={<FileText size={13} className="text-th-brand" />}
          title="Additional Information"
        />
        <PanelField label="Notes">
          <Textarea
            value={booking.notes || ""}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="Internal notes about this booking…"
            rows={2}
            className="figma-input"
          />
        </PanelField>
        <PanelField label="Special Requests">
          <Textarea
            value={booking.specialRequests || ""}
            onChange={(e) => setField("specialRequests", e.target.value)}
            placeholder="Anything the guest has requested…"
            rows={2}
            className="figma-input"
          />
        </PanelField>

        {/* Read-only ID footer */}
        <div className="flex items-center gap-2 mt-1 text-[11px] text-th-warm-text-muted">
          <Info size={11} />
          Booking ID:
          <span className="text-th-text-primary font-bold">{booking.bookingId}</span>
        </div>
      </div>
    </SlidePanel>
  );
};
