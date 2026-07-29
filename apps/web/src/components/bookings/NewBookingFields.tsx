/**
 * The New Booking form body and its validation.
 *
 * Split out of the old NewBookingModal so the fields live independently of the
 * shell that frames them — they now render inside pages/NewBooking.tsx as a
 * full page rather than a right-side SlidePanel.
 */
import React, { useMemo } from "react";
import {
  Plus,
  User,
  Calendar as CalendarIcon,
  Users,
  IndianRupee,
  CreditCard,
  FileText,
  Phone,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type NewBookingForm } from "./api";
import {
  NO_SERVICE_SENTINEL,
  SELECT_ITEM_CLASS,
  SectionHeader,
  PanelField,
  PanelInput,
  DatePickerField,
} from "./FormPrimitives";

export type ServiceOption = {
  name: string;
  type: "camper-van" | "unique-stay" | "activity";
};

/** Field-level validation for the new-booking form. Empty object == valid. */
export const useNewBookingErrors = (form: NewBookingForm) =>
  useMemo(() => {
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
      form.totalAmount || String(Number(form.basePrice || 0) + Number(form.extraCharges || 0));
    if (!total || total === "0") e.totalAmount = "Total amount is required";
    return e;
  }, [form]);

export const NewBookingFields = ({
  form,
  setForm,
  vehicleNames,
  services,
  onAddService,
  errFor,
  markTouched,
  /** Two columns inside the old 540px panel; the page can go wider. */
  columns = 2,
}: {
  form: NewBookingForm;
  setForm: React.Dispatch<React.SetStateAction<NewBookingForm>>;
  vehicleNames: string[];
  services?: ServiceOption[];
  onAddService?: () => void;
  errFor: (field: string) => string | undefined;
  markTouched: (field: string) => void;
  columns?: 2 | 3;
}) => {
  const set = (field: keyof NewBookingForm, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));
  const setNumeric = (field: keyof NewBookingForm, value: string) =>
    set(field, value.replace(/\D/g, ""));

  const realServices = vehicleNames.filter((v) => v !== NO_SERVICE_SENTINEL);
  const hasServices = realServices.length > 0;

  const groupedServices = useMemo(() => {
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

  const grid = cn("grid gap-3", columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2");

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader icon={<User size={13} className="text-brand" />} title="Guest Information" />
      <div className={grid}>
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
              <SelectValue placeholder={hasServices ? "Select service" : "No services yet"} />
            </SelectTrigger>
            <SelectContent className="z-[60]">
              {groupedServices
                ? groupedServices.map((g) => (
                    <SelectGroup key={g.type}>
                      <SelectLabel className="text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400 px-2 py-1.5">
                        {g.label}
                      </SelectLabel>
                      {g.items.map((name) => (
                        <SelectItem key={name} value={name} className={SELECT_ITEM_CLASS}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))
                : realServices.map((v) => (
                    <SelectItem key={v} value={v} className={SELECT_ITEM_CLASS}>
                      {v}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
          {!hasServices && (
            <button
              type="button"
              onClick={() => onAddService?.()}
              className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand bg-none border-none p-0 cursor-pointer text-left"
            >
              <Plus size={12} strokeWidth={2.5} />
              Add a service to get started
            </button>
          )}
        </PanelField>
      </div>

      <SectionHeader
        icon={<CalendarIcon size={13} className="text-brand" />}
        title="Booking Dates"
      />
      <div className={grid}>
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

      <SectionHeader icon={<Phone size={13} className="text-brand" />} title="Contact" />
      <div className={grid}>
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

      <SectionHeader icon={<Users size={13} className="text-brand" />} title="Guests" />
      <div className={grid}>
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

      <SectionHeader icon={<IndianRupee size={13} className="text-brand" />} title="Pricing" />
      <div className={grid}>
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

      <SectionHeader icon={<CreditCard size={13} className="text-brand" />} title="Payment" />
      <div className={grid}>
        <PanelField label="Payment Method" required error={errFor("paymentMethod")}>
          <select
            value={form.paymentMethod}
            onChange={(e) => {
              set("paymentMethod", e.target.value);
              markTouched("paymentMethod");
            }}
            onBlur={() => markTouched("paymentMethod")}
            className={cn(
              "w-full h-11 px-3.5 text-[13px] font-[450] rounded-[11px] outline-none appearance-none cursor-pointer transition-all duration-150 border-[1.5px] bg-muted/50",
              form.paymentMethod ? "text-foreground" : "text-muted-foreground",
              errFor("paymentMethod") ? "border-red-300" : "border-transparent",
            )}
          >
            <option value="" disabled>
              Select method
            </option>
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
            value={
              form.totalAmount ||
              (form.basePrice || form.extraCharges
                ? String(Number(form.basePrice || 0) + Number(form.extraCharges || 0))
                : "")
            }
            onChange={(v) => set("totalAmount", v.replace(/\D/g, ""))}
            onBlur={() => markTouched("totalAmount")}
            placeholder="₹ 0"
            error={!!errFor("totalAmount")}
          />
        </PanelField>
      </div>

      <SectionHeader
        icon={<FileText size={13} className="text-brand" />}
        title="Additional Information"
      />
      <div className={grid}>
        <PanelField label="Notes">
          <Textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Internal notes about this booking…"
            rows={3}
            className="figma-input"
          />
        </PanelField>
        <PanelField label="Special Requests">
          <Textarea
            value={form.specialRequests}
            onChange={(e) => set("specialRequests", e.target.value)}
            placeholder="Anything the guest has requested…"
            rows={3}
            className="figma-input"
          />
        </PanelField>
      </div>
    </div>
  );
};
