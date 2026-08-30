import React from "react";
import { Users, BedDouble, MapPin, Navigation } from "lucide-react";
import {
  SectionCard,
  Field,
  ErrorMsg,
  StyledInput,
  StyledSelect,
  SearchableSelect,
  Stepper,
  StepHeader,
} from "../shared/primitives";
import { cn } from "@/lib/utils";

interface CapacityAddressStepProps {
  seatingCapacity: number;
  sleepingCapacity: number;
  address: string;
  locality: string;
  state: string;
  city: string;
  pincode: string;
  locationData: any[];
  mapSrc: string;
  errors?: Record<string, string>;
  onAdjustCapacity: (type: "seating" | "sleeping", direction: "increase" | "decrease") => void;
  onAddressChange: (value: string) => void;
  onLocalityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onPincodeChange: (value: string) => void;
  clearError?: (field: string) => void;
  // Render without the StepHeader + centered max-width wrapper when used
  // inside an existing scrollable form (e.g. edit page).
  embedded?: boolean;
}

const CapacityRow = ({
  icon,
  label,
  description,
  value,
  onDecrease,
  onIncrease,
  min = 0,
  max = 20,
  error,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
  max?: number;
  error?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <div
      className={cn(
        "flex items-center justify-between px-[18px] py-4 rounded-[14px] bg-th-warm-surface transition-all duration-150",
        error ? "border-[1.5px] border-th-error-bright-soft" : "border-[1.5px] border-transparent",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-[38px] h-[38px] rounded-[11px] bg-th-brand-soft border-[1.5px] border-th-brand-border-soft flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          {icon}
        </div>
        <div>
          <p className="text-[13.5px] font-semibold text-th-text-primary tracking-[-0.01em]">
            {label}
          </p>
          {description && (
            <p className="text-[11.5px] text-th-warm-text-muted mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <Stepper value={value} onDecrease={onDecrease} onIncrease={onIncrease} min={min} max={max} />
    </div>
    <ErrorMsg message={error} />
  </div>
);

const CapacityAddressStep: React.FC<CapacityAddressStepProps> = ({
  seatingCapacity,
  sleepingCapacity,
  address,
  locality,
  state,
  city,
  pincode,
  locationData,
  mapSrc,
  errors = {},
  onAdjustCapacity,
  onAddressChange,
  onLocalityChange,
  onStateChange,
  onCityChange,
  onPincodeChange,
  clearError,
  embedded,
}) => {
  const clear = (field: string) => clearError?.(field);

  const country = React.useMemo(
    () => locationData.find((c: any) => c.name === locality),
    [locationData, locality],
  );
  const stateOptions = React.useMemo(
    () => (country?.states ?? []).map((st: any) => ({ label: st.name, value: st.name })),
    [country],
  );
  const cityOptions = React.useMemo(() => {
    const st = country?.states?.find((s: any) => s.name === state);
    return (st?.cities ?? []).map((ct: any) => ({ label: ct.name, value: ct.name }));
  }, [country, state]);

  const sections = (
    <>
      <SectionCard
        icon={<Users size={16} className="text-th-brand" strokeWidth={2.5} />}
        title="Capacity"
        subtitle="How many guests your caravan accommodates"
      >
        <div className="flex flex-col gap-3">
          <CapacityRow
            icon={<Users size={16} className="text-th-brand" />}
            label="Seating capacity"
            description="Guests who can sit during the journey"
            value={seatingCapacity}
            onDecrease={() => onAdjustCapacity("seating", "decrease")}
            onIncrease={() => onAdjustCapacity("seating", "increase")}
            min={1}
            max={20}
          />
          <CapacityRow
            icon={<BedDouble size={16} className="text-th-brand" />}
            label="Sleeping capacity"
            description="Guests who can sleep overnight"
            value={sleepingCapacity}
            onDecrease={() => onAdjustCapacity("sleeping", "decrease")}
            onIncrease={() => {
              onAdjustCapacity("sleeping", "increase");
              clear("sleepingCapacity");
            }}
            min={0}
            max={20}
            error={errors.sleepingCapacity}
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={<MapPin size={16} className="text-th-brand" strokeWidth={2.5} />}
        title="Location"
        subtitle="Where guests can find your caravan"
      >
        <div className="flex flex-col gap-4">
          <Field label="Street address" required error={errors.address}>
            <StyledInput
              value={address}
              onChange={(v) => {
                onAddressChange(v);
                clear("address");
              }}
              placeholder="e.g. 12 MG Road, Bengaluru"
              error={!!errors.address}
              softErrorBg
              fontSize={14}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Country" required error={errors.locality}>
              <StyledSelect
                value={locality}
                onChange={(v) => {
                  onLocalityChange(v);
                  clear("locality");
                }}
                error={!!errors.locality}
              >
                <option value="India">India</option>
              </StyledSelect>
            </Field>

            <Field label="Pincode" required error={errors.pincode}>
              <StyledInput
                value={pincode}
                onChange={(v) => {
                  onPincodeChange(v.replace(/\D/g, ""));
                  clear("pincode");
                }}
                placeholder="e.g. 560001"
                maxLength={6}
                inputMode="numeric"
                error={!!errors.pincode}
                softErrorBg
                fontSize={14}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="State" required error={errors.state}>
              <SearchableSelect
                value={state}
                onChange={(v) => {
                  onStateChange(v);
                  clear("state");
                }}
                options={stateOptions}
                placeholder="Select State"
                searchPlaceholder="Search states…"
                emptyMessage="No states found"
                error={!!errors.state}
              />
            </Field>

            <Field label="City" required error={errors.city}>
              <SearchableSelect
                value={city}
                onChange={(v) => {
                  onCityChange(v);
                  clear("city");
                }}
                options={cityOptions}
                placeholder={state ? "Select City" : "Select a state first"}
                searchPlaceholder="Search cities…"
                emptyMessage="No cities found"
                disabled={!state}
                error={!!errors.city}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      {mapSrc && (
        <div className="rounded-[20px] overflow-hidden border-[1.5px] border-th-warm-border shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 px-[18px] py-3 bg-th-surface-0 border-b-[1.5px] border-th-warm-border">
            <Navigation size={13} className="text-th-brand" />
            <span className="text-[12px] font-semibold text-th-text-primary">
              {[address, city, state].filter(Boolean).join(", ") || "Map Preview"}
            </span>
          </div>
          <iframe
            src={mapSrc}
            width="100%"
            height="240"
            style={{ border: 0, display: "block" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location Map"
          />
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div className="w-full flex flex-col gap-4">{sections}</div>;
  }
  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">
      <StepHeader
        kicker="Capacity & Location"
        subtitle="Set your caravan's capacity and where guests can find it."
      />
      <div className="w-full flex flex-col gap-4">{sections}</div>
    </div>
  );
};

export default CapacityAddressStep;
