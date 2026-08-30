import React from "react";
import { Briefcase, MapPin, Navigation, Users } from "lucide-react";
import { ErrorMsg, SectionCard, StepHeader, Stepper } from "../shared/primitives";
import { cn } from "@/lib/utils";
import { SEAT_HINT_BY_CLASS, type VehicleClass } from "./vehicleConfig";

interface VehicleCapacityStepProps {
  vehicleClass: VehicleClass | null;
  seatingCapacity: number;
  luggageCapacity: number;
  pickupPoints: string[];
  errors?: Record<string, string>;
  onAdjustCapacity: (type: "seating" | "luggage", direction: "increase" | "decrease") => void;
  onPickupPointChange: (value: string) => void;
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
  pickupPoints,
  errors = {},
  onAdjustCapacity,
  onPickupPointChange,
  clearError,
  embedded,
}) => {
  const clear = (field: string) => clearError?.(field);

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
        title="Pickup point"
        subtitle="Where a guest can collect the vehicle"
        required
      >
        {/* One point, not a list. The Add-point button, the empty-state CTA and
            the per-row remove control are gone; `pickupPoints` stays a string[]
            on the model and the API so nothing downstream had to change, and
            this writes index 0 of it. */}
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-[12px] px-[10px] py-[5px]",
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
            value={pickupPoints[0] || ""}
            onChange={(e) => {
              onPickupPointChange(e.target.value);
              clear("pickupPoints");
            }}
            placeholder="e.g. Andheri East branch, Mumbai airport"
            maxLength={160}
            className="flex-1 h-[34px] px-1 text-[13px] text-th-text-primary font-[450] bg-transparent border-none outline-none"
          />
        </div>
        <ErrorMsg message={errors.pickupPoints} />
      </SectionCard>
    </>
  );

  if (embedded) {
    return <div className="w-full flex flex-col gap-4">{sections}</div>;
  }
  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">
      <StepHeader
        kicker="Capacity & Pickup"
        subtitle="Set what the vehicle carries and where guests collect it."
      />
      <div className="w-full flex flex-col gap-4">{sections}</div>
    </div>
  );
};

export default VehicleCapacityStep;
