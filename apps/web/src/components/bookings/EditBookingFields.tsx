/**
 * The edit-booking form body and its validation.
 *
 * Lifted out of the EditBookingModal slide-panel when editing moved to its own
 * page (pages/EditBooking.tsx), the same way New Booking moved out of a panel.
 * Sections render as kit SubPanels so the form matches the rest of the console.
 */
import React, { useMemo } from "react";
import {
  Calendar as CalendarIcon,
  CreditCard,
  FileText,
  IndianRupee,
  User,
  Users,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRAND_VARS, CONTROL, CONTROL_ERROR, SELECT_ITEM, SubPanel } from "@/components/shared";
import { cn } from "@/lib/utils";
import { type BookingData } from "./api";
import { PanelField, PanelInput, DatePickerField } from "./FormPrimitives";

const STATUSES: BookingData["status"][] = ["Confirmed", "Checked-in", "Checked-out", "Cancelled"];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online payment" },
];

const PAYMENT_STATUSES = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partially paid" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
];

/**
 * Zero is a legitimate amount, so these can't be falsy checks — `!0` is true,
 * which made every booking with no extra charges (the common case) fail
 * validation and silently refuse to save.
 */
const isBlank = (v: unknown) => v === null || v === undefined || String(v).trim() === "";

/** Field-level validation for the edit form. Empty object == valid. */
export const useEditBookingErrors = (booking: BookingData | null) =>
  useMemo(() => {
    const e: Record<string, string> = {};
    if (!booking) return e;
    if (!booking.guestName?.trim()) e.guestName = "Guest name is required";
    if (!booking.phoneNumber?.trim()) e.phoneNumber = "Phone is required";
    else if (booking.phoneNumber.replace(/\D/g, "").length < 10)
      e.phoneNumber = "Phone must be at least 10 digits";
    if (!booking.email?.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) e.email = "Invalid email";
    if (isBlank(booking.basePrice)) e.basePrice = "Base price is required";
    else if (Number(booking.basePrice) < 0) e.basePrice = "Cannot be negative";
    if (isBlank(booking.extraCharges)) e.extraCharges = "Extra charges is required";
    else if (Number(booking.extraCharges) < 0) e.extraCharges = "Cannot be negative";
    if (booking.startDate && booking.endDate && booking.startDate > booking.endDate)
      e.endDate = "Must be after the start date";
    if (Number(booking.paidAmount || 0) < 0) e.paidAmount = "Cannot be negative";
    return e;
  }, [booking]);

/** Read-only computed value — same rhythm as an input, visibly not editable. */
const Derived = ({ children, accent }: { children: React.ReactNode; accent?: boolean }) => (
  <div
    className={cn(
      "w-full h-11 px-3.5 flex items-center rounded-xl border border-dashed tabular-nums",
      accent
        ? "text-[14px] font-bold text-brand bg-brand/[0.09] border-brand/25 tracking-[-0.01em]"
        : "text-[13.5px] font-semibold text-foreground bg-muted/50 dark:bg-white/5 border-border",
    )}
  >
    {children}
  </div>
);

const toInputDate = (d?: Date | string | null) => {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

export const EditBookingFields = ({
  booking,
  setBooking,
  errFor,
  markTouched,
}: {
  booking: BookingData;
  setBooking: React.Dispatch<React.SetStateAction<BookingData | null>>;
  errFor: (field: string) => string | undefined;
  markTouched: (field: string) => void;
}) => {
  const setField = (field: string, value: any) => {
    setBooking((p) => (p ? { ...p, [field]: value } : null));
    markTouched(field);
  };
  const setNumeric = (field: string, value: string) => setField(field, value.replace(/\D/g, ""));

  const base = Number(booking.basePrice || 0);
  const extra = Number(booking.extraCharges || 0);
  const total = base + extra;
  const paid = Number(booking.paidAmount || 0);
  const pending = Math.max(0, total - paid);
  const guests = Number(booking.adults || 0) + Number(booking.children || 0);

  return (
    <div className="space-y-4">
      <SubPanel icon={User} title="Guest" blurb="Who the booking is for">
        <div className="grid gap-4 sm:grid-cols-2">
          <PanelField label="Guest Name" required error={errFor("guestName")}>
            <PanelInput
              value={booking.guestName}
              onChange={(v) => setField("guestName", v)}
              error={!!errFor("guestName")}
            />
          </PanelField>
          <PanelField label="Phone" required error={errFor("phoneNumber")}>
            <PanelInput
              value={booking.phoneNumber || ""}
              onChange={(v) => setNumeric("phoneNumber", v)}
              placeholder="10-digit mobile number"
              maxLength={12}
              error={!!errFor("phoneNumber")}
            />
          </PanelField>
          <PanelField label="Email" required error={errFor("email")}>
            <PanelInput
              value={booking.email || ""}
              onChange={(v) => setField("email", v)}
              type="email"
              error={!!errFor("email")}
            />
          </PanelField>
          <PanelField label="Service">
            <Derived>{booking.resourceName || "—"}</Derived>
          </PanelField>
        </div>
      </SubPanel>

      <SubPanel icon={CalendarIcon} title="Dates and status">
        <div className="grid gap-4 sm:grid-cols-2">
          <PanelField label="Start Date">
            <DatePickerField
              value={toInputDate(booking.startDate)}
              onChange={(v) => setField("startDate", v ? new Date(`${v}T00:00:00`) : null)}
              placeholder="Select start date"
            />
          </PanelField>
          <PanelField label="End Date" error={errFor("endDate")}>
            <DatePickerField
              value={toInputDate(booking.endDate)}
              onChange={(v) => setField("endDate", v ? new Date(`${v}T00:00:00`) : null)}
              placeholder="Select end date"
              minDate={booking.startDate ? new Date(booking.startDate) : undefined}
              error={!!errFor("endDate")}
            />
          </PanelField>
          <PanelField label="Status" required>
            <Select value={booking.status} onValueChange={(v: any) => setField("status", v)}>
              <SelectTrigger className={cn("h-11 border", CONTROL)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={BRAND_VARS} data-console-portal="" className="z-[60]">
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className={SELECT_ITEM}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PanelField>
          <PanelField label="Nights (auto)">
            <Derived>{booking.totalDays || "—"}</Derived>
          </PanelField>
        </div>
      </SubPanel>

      <SubPanel icon={Users} title="Party size">
        <div className="grid gap-4 sm:grid-cols-3">
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
            <Derived>{guests}</Derived>
          </PanelField>
        </div>
      </SubPanel>

      <SubPanel icon={IndianRupee} title="Pricing">
        <div className="grid gap-4 sm:grid-cols-3">
          <PanelField label="Base Price (₹)" required error={errFor("basePrice")}>
            <PanelInput
              value={booking.basePrice}
              onChange={(v) => setNumeric("basePrice", v)}
              placeholder="₹ 0"
              error={!!errFor("basePrice")}
            />
          </PanelField>
          <PanelField label="Extra Charges (₹)" required error={errFor("extraCharges")}>
            <PanelInput
              value={booking.extraCharges}
              onChange={(v) => setNumeric("extraCharges", v)}
              placeholder="₹ 0"
              error={!!errFor("extraCharges")}
            />
          </PanelField>
          <PanelField label="Total Amount (auto)">
            <Derived accent>₹ {total.toLocaleString("en-IN")}</Derived>
          </PanelField>
        </div>
      </SubPanel>

      <SubPanel icon={CreditCard} title="Payment">
        <div className="grid gap-4 sm:grid-cols-2">
          <PanelField label="Method">
            <Select
              value={booking.paymentMethod || ""}
              onValueChange={(v: any) => setField("paymentMethod", v)}
            >
              <SelectTrigger className={cn("h-11 border", CONTROL)}>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent style={BRAND_VARS} data-console-portal="" className="z-[60]">
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className={SELECT_ITEM}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PanelField>
          <PanelField label="Payment Status">
            <Select
              value={booking.paymentStatus || ""}
              onValueChange={(v: any) => setField("paymentStatus", v)}
            >
              <SelectTrigger className={cn("h-11 border", CONTROL)}>
                <SelectValue placeholder="Unpaid" />
              </SelectTrigger>
              <SelectContent style={BRAND_VARS} data-console-portal="" className="z-[60]">
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value} className={SELECT_ITEM}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PanelField>
          <PanelField label="Paid Amount (₹)" error={errFor("paidAmount")}>
            <PanelInput
              value={booking.paidAmount || ""}
              onChange={(v) => setNumeric("paidAmount", v)}
              placeholder="₹ 0"
              error={!!errFor("paidAmount")}
            />
          </PanelField>
          <PanelField label="Pending (auto)">
            <Derived>₹ {pending.toLocaleString("en-IN")}</Derived>
          </PanelField>
        </div>
      </SubPanel>

      <SubPanel icon={FileText} title="Notes" blurb="Only your team sees these">
        <div className="grid gap-4 sm:grid-cols-2">
          <PanelField label="Notes">
            <Textarea
              value={booking.notes || ""}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Internal notes about this booking…"
              rows={3}
              className={cn("resize-none py-2.5", CONTROL)}
            />
          </PanelField>
          <PanelField label="Special Requests">
            <Textarea
              value={booking.specialRequests || ""}
              onChange={(e) => setField("specialRequests", e.target.value)}
              placeholder="Anything the guest has requested…"
              rows={3}
              className={cn("resize-none py-2.5", CONTROL)}
            />
          </PanelField>
        </div>
      </SubPanel>
    </div>
  );
};
