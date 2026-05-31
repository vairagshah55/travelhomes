import React, { useState } from "react";
import { format } from "date-fns";
import {
  Plus,
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
  Phone,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { type BookingData, type NewBookingForm } from "./api";
import { SlidePanel } from "./SlidePanel";

// Sentinel value emitted by Bookings.tsx when the vendor has no services yet.
const NO_SERVICE_SENTINEL = "No Service Available";

/* ─── Section header inside the panel ────────────────────────────────────── */
const SectionHeader = ({
  icon,
  title,
  hint,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
}) => (
  <div className="flex items-center gap-2 mt-1 mb-1">
    {icon && (
      <span className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-lg bg-th-brand-soft border border-th-brand-border-soft">
        {icon}
      </span>
    )}
    <p className="text-[11px] font-extrabold text-th-text-primary uppercase tracking-[0.06em]">
      {title}
    </p>
    {hint && <p className="text-[11px] text-th-warm-text-muted ml-1">{hint}</p>}
    <div className="flex-1 h-px bg-th-warm-border ml-1.5" />
  </div>
);

/* ─── Field wrapper with error ────────────────────────────────────────────── */
const PanelField = ({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-th-warm-text-dark uppercase tracking-[0.03em]">
      {label}{required && <span className="text-th-error-bright ml-[3px]">*</span>}
    </label>
    {children}
    {error && (
      <div className="flex items-center gap-1.5">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5.25" stroke="#ef4444" strokeWidth="1.5" />
          <path d="M6 3.5v3M6 8.25v.25" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-[11px] text-th-error-bright">{error}</p>
      </div>
    )}
  </div>
);

/* ─── Styled input with focus/error via CSS ────────────────────────────────── */
const PanelInput = ({ value, onChange, onBlur, placeholder, type = "text", error, ...rest }: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type" | "onBlur">) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    placeholder={placeholder}
    className={cn(
      "w-full h-11 px-3.5 text-[13px] text-th-text-primary font-[450]",
      "rounded-[11px] outline-none transition-all duration-150 border-[1.5px]",
      "bg-th-warm-surface focus:bg-th-surface-0",
      error
        ? "border-th-error-bright-soft focus:shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
        : "border-transparent focus:border-th-brand focus:shadow-[0_0_0_3px_var(--th-ring)]",
    )}
    {...rest}
  />
);

const tealBtn = (onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex items-center gap-1.5 h-10 px-5 rounded-[11px] border-none bg-th-brand text-[13px] font-bold text-th-text-inverse shadow-[0_4px_16px_rgba(15,92,138,0.30)] transition-all duration-150",
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
    )}
  >
    {icon} {label}
  </button>
);

const ghostBtn = (onClick: () => void, label: string) => (
  <button
    type="button"
    onClick={onClick}
    className="h-10 px-[18px] rounded-[11px] border border-th-warm-border bg-transparent text-[13px] font-semibold text-th-warm-text-dark cursor-pointer"
  >
    {label}
  </button>
);

/* ─── Date picker (Popover + Calendar) ────────────────────────────────────── */
const DatePickerField = ({
  value,
  onChange,
  onBlur,
  error,
  placeholder = "Pick a date",
  minDate,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: boolean;
  placeholder?: string;
  minDate?: Date;
}) => {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const hasValue = !!selected && !Number.isNaN(selected.getTime());

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onBlur?.();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full h-11 px-3.5 flex items-center gap-2.5 text-[13px] font-[450] rounded-[11px] outline-none transition-all duration-150 border-[1.5px] cursor-pointer text-left",
            hasValue ? "text-th-text-primary" : "text-th-warm-text-muted",
            open ? "bg-th-surface-0" : "bg-th-warm-surface",
            error
              ? "border-th-error-bright-soft shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
              : open
                ? "border-th-brand shadow-[0_0_0_3px_var(--th-ring)]"
                : "border-transparent",
          )}
        >
          <CalendarIcon size={14} className={open ? "text-th-brand" : "text-th-warm-text-muted"} />
          <span className="flex-1">
            {hasValue ? format(selected!, "EEE, MMM d, yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0 z-[60]"
      >
        {/* Quick-pick shortcuts */}
        <div className="flex flex-wrap gap-1.5 p-2 border-b border-th-warm-border">
          {[
            { label: "Today", offset: 0 },
            { label: "Tomorrow", offset: 1 },
            { label: "+2 days", offset: 2 },
            { label: "+1 week", offset: 7 },
            { label: "+2 weeks", offset: 14 },
          ].map(({ label, offset }) => {
            const target = new Date();
            target.setHours(0, 0, 0, 0);
            target.setDate(target.getDate() + offset);
            const disabled = !!minDate && target < minDate;
            return (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange(format(target, "yyyy-MM-dd"));
                  setOpen(false);
                }}
                className={cn(
                  "text-[11px] font-semibold px-2.5 py-[5px] rounded-full border border-th-warm-border transition-all duration-150",
                  disabled
                    ? "bg-transparent text-th-warm-text-muted cursor-not-allowed opacity-50"
                    : "bg-th-surface-0 text-th-text-primary cursor-pointer hover:bg-th-brand-soft hover:border-th-brand hover:text-th-brand",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (!d) return;
            onChange(format(d, "yyyy-MM-dd"));
            setOpen(false);
          }}
          disabled={minDate ? { before: minDate } : undefined}
          initialFocus
          className="p-2"
          classNames={{
            months: "flex flex-col",
            month: "space-y-2",
            caption: "flex justify-center pt-1 pb-1 relative items-center",
            caption_label: "text-sm font-semibold",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-gray-200",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "text-gray-400 rounded-md w-8 font-medium text-[11px] uppercase tracking-wide",
            row: "flex w-full mt-1",
            cell: "h-8 w-8 text-center text-[12.5px] p-0 relative focus-within:relative focus-within:z-20",
            day: "h-8 w-8 p-0 font-normal rounded-md hover:bg-gray-100 aria-selected:opacity-100 inline-flex items-center justify-center",
            day_selected:
              "bg-[#0F5C8A] text-white hover:bg-[#0F5C8A] hover:text-white focus:bg-[#0F5C8A] focus:text-white",
            day_today: "bg-gray-100 font-semibold text-[#0F5C8A]",
            day_outside: "text-gray-300 opacity-50",
            day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/* NEW BOOKING PANEL                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */
export type ServiceOption = {
  name: string;
  type: "camper-van" | "unique-stay" | "activity";
};

export const NewBookingModal = ({ open, onOpenChange, form, setForm, vehicleNames, services, onCreate, onAddService }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  form: NewBookingForm; setForm: React.Dispatch<React.SetStateAction<NewBookingForm>>;
  vehicleNames: string[]; onCreate: () => void;
  services?: ServiceOption[];
  onAddService?: () => void;
}) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);

  const set = (field: keyof NewBookingForm, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
  };
  const setNumeric = (field: keyof NewBookingForm, value: string) => set(field, value.replace(/\D/g, ""));
  const markTouched = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  React.useEffect(() => {
    if (open) {
      setTouched({});
      setAttempted(false);
    }
  }, [open]);

  const realServices = vehicleNames.filter((v) => v !== NO_SERVICE_SENTINEL);
  const hasServices = realServices.length > 0;

  const groupedServices = React.useMemo(() => {
    if (!services || services.length === 0) return null;
    const groups: { type: ServiceOption["type"]; label: string; items: string[] }[] = [
      { type: "camper-van", label: "Camper Vans", items: [] },
      { type: "unique-stay", label: "Unique Stays", items: [] },
      { type: "activity", label: "Activities", items: [] },
    ];
    for (const s of services) {
      if (s.name === NO_SERVICE_SENTINEL) continue;
      const g = groups.find((g) => g.type === s.type);
      if (g) g.items.push(s.name);
    }
    return groups.filter((g) => g.items.length > 0);
  }, [services]);

  const errors: Record<string, string> = React.useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.guestName.trim()) e.guestName = "Guest name is required";
    if (!form.resourceName || form.resourceName === NO_SERVICE_SENTINEL)
      e.resourceName = "Service is required";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    else if (form.startDate && new Date(form.startDate) > new Date(form.endDate))
      e.endDate = "Must be after start date";
    if (!form.phoneNumber.trim()) e.phoneNumber = "Phone is required";
    else if (form.phoneNumber.replace(/\D/g, "").length < 10)
      e.phoneNumber = "Phone must be at least 10 digits";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.adults) e.adults = "Adults is required";
    else if (Number(form.adults) < 1) e.adults = "At least 1 adult required";
    if (form.children === "") e.children = "Children is required";
    if (!form.basePrice) e.basePrice = "Base price is required";
    else if (Number(form.basePrice) < 0) e.basePrice = "Cannot be negative";
    if (form.extraCharges === "") e.extraCharges = "Extra charges is required";
    if (!form.paymentMethod) e.paymentMethod = "Payment method is required";
    const total =
      form.totalAmount ||
      String(Number(form.basePrice || 0) + Number(form.extraCharges || 0));
    if (!total || total === "0") e.totalAmount = "Total amount is required";
    return e;
  }, [form]);

  const errFor = (field: string): string | undefined =>
    attempted || touched[field] ? errors[field] : undefined;

  const handleCreate = () => {
    setAttempted(true);
    if (Object.keys(errors).length === 0) onCreate();
  };

  return (
    <SlidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      title="New Booking"
      icon={<Plus size={16} className="text-th-brand" />}
      width={540}
      footer={<>{ghostBtn(() => onOpenChange(false), "Cancel")} {tealBtn(handleCreate, <Save size={14} />, "Create Booking")}</>}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader icon={<User size={13} className="text-th-brand" />} title="Guest Information" />
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Guest Name" required error={errFor("guestName")}>
            <PanelInput
              value={form.guestName}
              onChange={(v) => set("guestName", v)}
              onBlur={() => markTouched("guestName")}
              placeholder="Enter guest name"
              error={!!errFor("guestName")}
            />
          </PanelField>
          <PanelField label="Service Name" required error={errFor("resourceName")}>
            <Select
              value={form.resourceName === NO_SERVICE_SENTINEL ? "" : form.resourceName}
              onValueChange={(v) => {
                set("resourceName", v);
                markTouched("resourceName");
              }}
              disabled={!hasServices}
            >
              <SelectTrigger
                onBlur={() => markTouched("resourceName")}
                className={`figma-input h-[44px] ${errFor("resourceName") ? "border-red-400" : ""}`}
              >
                <SelectValue
                  placeholder={hasServices ? "Select service" : "No services yet"}
                />
              </SelectTrigger>
              <SelectContent className="z-[60]">
                {groupedServices ? (
                  groupedServices.map((g) => (
                    <SelectGroup key={g.type}>
                      <SelectLabel className="text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400 px-2 py-1.5">
                        {g.label}
                      </SelectLabel>
                      {g.items.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))
                ) : (
                  realServices.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!hasServices && (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onAddService?.();
                }}
                className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-th-brand bg-none border-none p-0 cursor-pointer text-left"
              >
                <Plus size={12} strokeWidth={2.5} />
                Add a service to get started
              </button>
            )}
          </PanelField>
        </div>

        <SectionHeader icon={<CalendarIcon size={13} className="text-th-brand" />} title="Booking Dates" />
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Start Date" required error={errFor("startDate")}>
            <DatePickerField
              value={form.startDate}
              onChange={(v) => {
                set("startDate", v);
                markTouched("startDate");
                if (form.endDate && new Date(v) > new Date(form.endDate)) set("endDate", v);
              }}
              onBlur={() => markTouched("startDate")}
              error={!!errFor("startDate")}
              placeholder="Select start date"
            />
          </PanelField>
          <PanelField label="End Date" required error={errFor("endDate")}>
            <DatePickerField
              value={form.endDate}
              onChange={(v) => {
                set("endDate", v);
                markTouched("endDate");
              }}
              onBlur={() => markTouched("endDate")}
              error={!!errFor("endDate")}
              placeholder="Select end date"
              minDate={form.startDate ? new Date(`${form.startDate}T00:00:00`) : undefined}
            />
          </PanelField>
        </div>

        <SectionHeader icon={<Phone size={13} className="text-th-brand" />} title="Contact" />
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Phone Number" required error={errFor("phoneNumber")}>
            <PanelInput
              value={form.phoneNumber}
              onChange={(v) => setNumeric("phoneNumber", v)}
              onBlur={() => markTouched("phoneNumber")}
              placeholder="Enter phone"
              maxLength={12}
              error={!!errFor("phoneNumber")}
            />
          </PanelField>
          <PanelField label="Email" required error={errFor("email")}>
            <PanelInput
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              onBlur={() => markTouched("email")}
              placeholder="Enter email"
              error={!!errFor("email")}
            />
          </PanelField>
        </div>

        <SectionHeader icon={<Users size={13} className="text-th-brand" />} title="Guests" />
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Adults" required error={errFor("adults")}>
            <PanelInput
              value={form.adults}
              onChange={(v) => setNumeric("adults", v)}
              onBlur={() => markTouched("adults")}
              placeholder="0"
              error={!!errFor("adults")}
            />
          </PanelField>
          <PanelField label="Children" required error={errFor("children")}>
            <PanelInput
              value={form.children}
              onChange={(v) => setNumeric("children", v)}
              onBlur={() => markTouched("children")}
              placeholder="0"
              error={!!errFor("children")}
            />
          </PanelField>
        </div>

        <SectionHeader icon={<IndianRupee size={13} className="text-th-brand" />} title="Pricing" />
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Base Price (₹)" required error={errFor("basePrice")}>
            <PanelInput
              value={form.basePrice}
              onChange={(v) => setNumeric("basePrice", v)}
              onBlur={() => markTouched("basePrice")}
              placeholder="₹ 0"
              error={!!errFor("basePrice")}
            />
          </PanelField>
          <PanelField label="Extra Charges (₹)" required error={errFor("extraCharges")}>
            <PanelInput
              value={form.extraCharges}
              onChange={(v) => setNumeric("extraCharges", v)}
              onBlur={() => markTouched("extraCharges")}
              placeholder="₹ 0"
              error={!!errFor("extraCharges")}
            />
          </PanelField>
        </div>

        <SectionHeader icon={<CreditCard size={13} className="text-th-brand" />} title="Payment" />
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Payment Method" required error={errFor("paymentMethod")}>
            <select
              value={form.paymentMethod}
              onChange={(e) => {
                set("paymentMethod", e.target.value);
                markTouched("paymentMethod");
              }}
              onBlur={() => markTouched("paymentMethod")}
              className={cn(
                "w-full h-11 px-3.5 text-[13px] font-[450] rounded-[11px] outline-none appearance-none cursor-pointer transition-all duration-150 border-[1.5px] bg-th-warm-surface",
                form.paymentMethod ? "text-th-text-primary" : "text-th-warm-text-muted",
                errFor("paymentMethod") ? "border-th-error-bright-soft" : "border-transparent",
              )}
            >
              <option value="" disabled>Select method</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online Payment</option>
            </select>
          </PanelField>
          <PanelField label="Total Amount" required error={errFor("totalAmount")}>
            <PanelInput
              value={form.totalAmount || (form.basePrice || form.extraCharges ? String(Number(form.basePrice || 0) + Number(form.extraCharges || 0)) : "")}
              onChange={(v) => set("totalAmount", v.replace(/\D/g, ""))}
              onBlur={() => markTouched("totalAmount")}
              placeholder="₹ 0"
              error={!!errFor("totalAmount")}
            />
          </PanelField>
        </div>

        <SectionHeader icon={<FileText size={13} className="text-th-brand" />} title="Additional Information" />
        <PanelField label="Notes">
          <Textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Internal notes about this booking…"
            rows={2}
            className="figma-input"
          />
        </PanelField>
        <PanelField label="Special Requests">
          <Textarea
            value={form.specialRequests}
            onChange={(e) => set("specialRequests", e.target.value)}
            placeholder="Anything the guest has requested…"
            rows={2}
            className="figma-input"
          />
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
              { icon: <User size={13} className="text-th-brand" />, label: "Guest", value: booking.guestName },
              { icon: <MapPin size={13} className="text-th-brand" />, label: "Service", value: booking.resourceName },
              { icon: <CalendarIcon size={13} className="text-th-brand" />, label: "Duration", value: `${booking.totalDays || "—"} days` },
              { icon: <Users size={13} className="text-th-brand" />, label: "Guests", value: booking.totalGuests || `${Number(booking.adults || 0) + Number(booking.children || 0)}` },
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
        <SectionHeader icon={<User size={13} className="text-th-brand" />} title="Guest Information" />
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
        <SectionHeader icon={<CalendarIcon size={13} className="text-th-brand" />} title="Booking Dates & Status" />
        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Start Date">
            <DatePickerField
              value={booking.startDate ? new Date(booking.startDate).toISOString().slice(0, 10) : ""}
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
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Checked-in">Checked-in</SelectItem>
              <SelectItem value="Checked-out">Checked-out</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="online">Online Payment</SelectItem>
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
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partially Paid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
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
        <SectionHeader icon={<FileText size={13} className="text-th-brand" />} title="Additional Information" />
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
