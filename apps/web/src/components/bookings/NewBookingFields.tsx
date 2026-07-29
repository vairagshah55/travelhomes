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
import { BRAND_VARS, CONTROL, CONTROL_ERROR, SELECT_ITEM, SubPanel } from "@/components/shared";
import { cn } from "@/lib/utils";
import { type NewBookingForm } from "./api";
import { NO_SERVICE_SENTINEL, PanelField, PanelInput, DatePickerField } from "./FormPrimitives";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online payment" },
];

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

  const derivedTotal = Number(form.basePrice || 0) + Number(form.extraCharges || 0);
  const overridden = !!form.totalAmount && Number(form.totalAmount) !== derivedTotal;

  const grid = cn("grid gap-4", columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2");

  return (
    <div className="space-y-4">
      <SubPanel icon={User} title="Guest and service" blurb="Who's booking, and what for">
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
                className={cn("h-11 border", CONTROL, errFor("resourceName") && CONTROL_ERROR)}
              >
                <SelectValue placeholder={hasServices ? "Select service" : "No services yet"} />
              </SelectTrigger>
              <SelectContent style={BRAND_VARS} className="z-[60]">
                {groupedServices
                  ? groupedServices.map((g) => (
                      <SelectGroup key={g.type}>
                        <SelectLabel className="px-2 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                          {g.label}
                        </SelectLabel>
                        {g.items.map((name) => (
                          <SelectItem key={name} value={name} className={SELECT_ITEM}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))
                  : realServices.map((v) => (
                      <SelectItem key={v} value={v} className={SELECT_ITEM}>
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
      </SubPanel>

      <SubPanel icon={CalendarIcon} title="Dates" blurb="When the booking starts and ends">
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
      </SubPanel>

      <SubPanel icon={Phone} title="Contact" blurb="Where we reach the guest">
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
      </SubPanel>

      <SubPanel icon={Users} title="Party size">
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
      </SubPanel>

      <SubPanel icon={IndianRupee} title="Pricing">
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
      </SubPanel>

      <SubPanel icon={CreditCard} title="Payment">
        <div className={grid}>
          <PanelField label="Payment Method" required error={errFor("paymentMethod")}>
            <Select
              value={form.paymentMethod}
              onValueChange={(v) => {
                set("paymentMethod", v);
                markTouched("paymentMethod");
              }}
            >
              <SelectTrigger
                onBlur={() => markTouched("paymentMethod")}
                className={cn("h-11 border", CONTROL, errFor("paymentMethod") && CONTROL_ERROR)}
              >
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent style={BRAND_VARS} className="z-[60]">
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className={SELECT_ITEM}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PanelField>
          <PanelField label="Total Amount" required error={errFor("totalAmount")}>
            <PanelInput
              value={
                form.totalAmount ||
                (form.basePrice || form.extraCharges ? String(derivedTotal) : "")
              }
              onChange={(v) => set("totalAmount", v.replace(/\D/g, ""))}
              onBlur={() => markTouched("totalAmount")}
              placeholder="₹ 0"
              error={!!errFor("totalAmount")}
            />
            {overridden ? (
              <button
                type="button"
                onClick={() => set("totalAmount", "")}
                className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand hover:underline"
              >
                Overridden · reset to ₹{derivedTotal.toLocaleString("en-IN")}
              </button>
            ) : (
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                Base + extras. Type to override.
              </p>
            )}
          </PanelField>
        </div>
      </SubPanel>

      <SubPanel icon={FileText} title="Notes" blurb="Only your team sees these">
        <div className={grid}>
          <PanelField label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Internal notes about this booking…"
              rows={3}
              className={cn("resize-none py-2.5", CONTROL)}
            />
          </PanelField>
          <PanelField label="Special Requests">
            <Textarea
              value={form.specialRequests}
              onChange={(e) => set("specialRequests", e.target.value)}
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
