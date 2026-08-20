import React from "react";
import { Briefcase, MapPin, Navigation, Plus, Users, X } from "lucide-react";
import {
  ErrorMsg,
  Field,
  SearchableSelect,
  SectionCard,
  StepHeader,
  Stepper,
  StyledInput,
  StyledSelect,
} from "../shared/primitives";
import { cn } from "@/lib/utils";
import { SEAT_HINT_BY_CLASS, type VehicleClass } from "./vehicleConfig";

interface VehicleCapacityStepProps {
  vehicleClass: VehicleClass | null;
  seatingCapacity: number;
  luggageCapacity: number;
  address: string;
  locality: string;
  state: string;
  city: string;
  pincode: string;
  pickupPoints: string[];
  locationData: any[];
  mapSrc: string;
  errors?: Record<string, string>;
  onAdjustCapacity: (type: "seating" | "luggage", direction: "increase" | "decrease") => void;
  onAddressChange: (value: string) => void;
  onLocalityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onPincodeChange: (value: string) => void;
  onAddPickupPoint: () => void;
  onUpdatePickupPoint: (index: number, value: string) => void;
  onRemovePickupPoint: (index: number) => void;
  clearError?: (field: string) => void;
  embedded?: boolean;
}

/** Same visual row as the caravan capacity step, with a hint slot. */
const CapacityRow = ({
  icon,
  label,
  description,
  value,
  onDecrease,
  onIncrease,
  min = 0,
  max = 60,
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

/**
 * Capacity, pickup points, and where the vehicle lives.
 *
 * Separate from the caravan capacity step rather than a prop-flag variant of it:
 * a caravan's second number is sleeping capacity, a rental vehicle's is luggage,
 * and rentals additionally need pickup points — which is a repeatable list, not
 * a stepper. Threading all three differences through one component would have
 * made both harder to read than two files are.
 */
const VehicleCapacityStep: React.FC<VehicleCapacityStepProps> = ({
  vehicleClass,
  seatingCapacity,
  luggageCapacity,
  address,
  locality,
  state,
  city,
  pincode,
  pickupPoints,
  locationData,
  mapSrc,
  errors = {},
  onAdjustCapacity,
  onAddressChange,
  onLocalityChange,
  onStateChange,
  onCityChange,
  onPincodeChange,
  onAddPickupPoint,
  onUpdatePickupPoint,
  onRemovePickupPoint,
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

  // Advisory only. The classes genuinely overlap — a large MPV is sold as both
  // a car and a van — so an out-of-range seat count is worth mentioning and not
  // worth blocking. validateVehicleStep never rejects on this.
  const seatHint = vehicleClass ? SEAT_HINT_BY_CLASS[vehicleClass] : null;
  const seatOutOfHint =
    !!seatHint && (seatingCapacity < seatHint.min || seatingCapacity > seatHint.max);

  const sections = (
    <>
      <SectionCard
        icon={<Users size={16} className="text-th-brand" strokeWidth={2.5} />}
        title="Capacity"
        subtitle="What this vehicle can carry"
      >
        <div className="flex flex-col gap-3">
          <CapacityRow
            icon={<Users size={16} className="text-th-brand" />}
            label="Seating Capacity"
            description="Passenger seats, excluding the driver"
            value={seatingCapacity}
            onDecrease={() => onAdjustCapacity("seating", "decrease")}
            onIncrease={() => {
              onAdjustCapacity("seating", "increase");
              clear("seatingCapacity");
            }}
            min={1}
            max={60}
            error={errors.seatingCapacity}
          />
          {seatOutOfHint && seatHint && (
            <p className="text-[11.5px] text-th-warm-text-muted px-1 -mt-1">
              Most {vehicleClass}s seat {seatHint.min}–{seatHint.max}. Yours is fine if that's
              genuinely the count on the RC.
            </p>
          )}
          <CapacityRow
            icon={<Briefcase size={16} className="text-th-brand" />}
            label="Luggage Capacity"
            description="Large bags that fit in the boot"
            value={luggageCapacity}
            onDecrease={() => onAdjustCapacity("luggage", "decrease")}
            onIncrease={() => onAdjustCapacity("luggage", "increase")}
            min={0}
            max={40}
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={<Navigation size={16} className="text-th-brand" strokeWidth={2.5} />}
        title="Pickup points"
        subtitle="Where a guest can collect the vehicle"
        required
        action={
          <button
            type="button"
            onClick={onAddPickupPoint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[1.5px] border-th-warm-border bg-th-surface-0 text-[12px] font-semibold text-th-text-primary cursor-pointer transition-all duration-150 hover:border-th-brand hover:text-th-brand"
          >
            <Plus size={13} />
            Add point
          </button>
        }
      >
        {pickupPoints.length === 0 ? (
          <button
            type="button"
            onClick={onAddPickupPoint}
            className="w-full py-5 rounded-[14px] border-[1.5px] border-dashed border-th-warm-border bg-th-warm-surface text-[13px] font-medium text-th-warm-text-dark cursor-pointer transition-all duration-150 hover:border-th-brand hover:text-th-brand"
          >
            Add your first pickup point — e.g. “Andheri branch” or “Mumbai airport”
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            {pickupPoints.map((point, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2.5 rounded-[12px] px-[10px] py-[5px] pr-2",
                  "bg-th-surface-0 border border-th-warm-border",
                  "transition-[border-color,box-shadow] duration-150",
                  "hover:border-[color:var(--onb-border-hover,#a9c5c2)]",
                  "focus-within:border-th-brand focus-within:shadow-[0_0_0_3px_var(--th-ring)]",
                )}
              >
                <div className="w-[22px] h-[22px] rounded-full bg-th-brand-soft flex items-center justify-center flex-shrink-0">
                  <MapPin size={11} className="text-th-brand" strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  value={point}
                  onChange={(e) => {
                    onUpdatePickupPoint(index, e.target.value);
                    clear("pickupPoints");
                  }}
                  placeholder="e.g. Andheri East branch"
                  maxLength={160}
                  className="flex-1 h-[34px] px-1 text-[13px] text-th-text-primary font-[450] bg-transparent border-none outline-none"
                />
                <button
                  type="button"
                  onClick={() => onRemovePickupPoint(index)}
                  aria-label="Remove pickup point"
                  className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-th-warm-text-muted cursor-pointer transition-all duration-150 hover:bg-th-error-bright-bg hover:text-th-error-bright"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <ErrorMsg message={errors.pickupPoints} />
      </SectionCard>

      <SectionCard
        icon={<MapPin size={16} className="text-th-brand" strokeWidth={2.5} />}
        title="Location"
        subtitle="The city guests will find this vehicle under"
      >
        <div className="flex flex-col gap-4">
          <Field label="Street Address" required error={errors.address}>
            <StyledInput
              value={address}
              onChange={(v) => {
                onAddressChange(v);
                clear("address");
              }}
              placeholder="e.g. 12 MG Road, Bengaluru"
              error={!!errors.address}
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
        subtitle="Set what the vehicle carries and where guests pick it up."
      />
      <div className="w-full flex flex-col gap-4">{sections}</div>
    </div>
  );
};

export default VehicleCapacityStep;
