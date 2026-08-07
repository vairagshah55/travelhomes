import React from "react";
import { IndianRupee, Clock, Users, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SectionCard,
  Field,
  StyledInput,
  StyledSelect,
  Stepper,
  StepHeader,
} from "../shared/primitives";

interface PricingStepProps {
  regularPrice: string;
  personCapacity: number;
  timeDuration: string;
  address: string;
  locality: string;
  state: string;
  city: string;
  pincode: string;
  errors: Record<string, string>;
  locationData: any[];
  onUpdateFormData: (field: string, value: any) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  clearError: (field: string) => void;
}

const DURATION_OPTIONS = [
  "30 minutes",
  "1 hour",
  "2 hours",
  "3 hours",
  "Half day (4 hrs)",
  "Full day (8 hrs)",
  "Multi-day",
];

const PricingStep: React.FC<PricingStepProps> = ({
  regularPrice,
  personCapacity,
  timeDuration,
  address,
  locality,
  state,
  city,
  pincode,
  errors,
  locationData,
  onUpdateFormData,
  setFormData,
  clearError,
}) => {
  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">
      <StepHeader
        kicker="Pricing & Location"
        title={<>Pricing &amp; Location</>}
        subtitle="Set your price, capacity and where the activity takes place."
      />

      <div className="w-full flex flex-col gap-4">
        <SectionCard
          icon={<IndianRupee size={16} strokeWidth={2.5} className="text-th-brand" />}
          title="Pricing"
          subtitle="How much guests pay per booking"
        >
          <div className="flex flex-col gap-5">
            <Field label="Price per Person" required error={errors.regularPrice}>
              <div
                className={cn(
                  "flex items-center rounded-[13px] overflow-hidden border-[1.5px] transition-all duration-150",
                  errors.regularPrice
                    ? "border-th-error-bright-soft bg-th-error-bright-bg shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
                    : "border-transparent bg-th-warm-surface",
                )}
              >
                <div className="flex items-center gap-1 px-[14px] h-[52px] border-r-[1.5px] border-th-warm-border bg-th-warm-surface shrink-0">
                  <IndianRupee size={13} className="text-th-warm-text-muted" />
                  <span className="text-[12px] font-bold text-th-warm-text-muted">INR</span>
                </div>
                <input
                  type="number"
                  value={regularPrice}
                  onChange={(e) => onUpdateFormData("regularPrice", e.target.value)}
                  placeholder="0"
                  min="0"
                  className={cn(
                    "flex-1 h-[52px] px-4 text-[18px] font-bold tracking-[-0.02em]",
                    "bg-transparent border-none outline-none",
                    regularPrice ? "text-th-text-primary" : "text-th-warm-text-muted",
                  )}
                />
                {regularPrice && Number(regularPrice) > 0 && (
                  <span className="text-[11px] font-semibold text-th-brand pr-[14px] shrink-0">
                    / person
                  </span>
                )}
              </div>
            </Field>

            <Field label="Duration">
              <div className="relative">
                <Clock
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-th-warm-text-muted"
                />
                <input
                  type="text"
                  value={timeDuration}
                  onChange={(e) => onUpdateFormData("timeDuration", e.target.value)}
                  placeholder="e.g. 3 hours"
                  list="duration-options"
                  className={cn(
                    "w-full h-[52px] pl-[42px] pr-4 text-[14px] font-[450] text-th-text-primary",
                    "bg-th-warm-surface border-[1.5px] border-transparent rounded-[13px] outline-none",
                    "transition-all duration-150",
                    "focus:border-th-brand focus:bg-th-surface-0",
                    "focus:shadow-[0_0_0_4px_var(--th-ring)]",
                  )}
                />
                <datalist id="duration-options">
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
              </div>
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={<Users size={16} strokeWidth={2.5} className="text-th-brand" />}
          title="Capacity"
          subtitle="Maximum participants per session"
        >
          <div className="flex items-center justify-between p-[16px_18px] rounded-[14px] bg-th-warm-surface border-[1.5px] border-transparent">
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-[11px] bg-th-surface-0 border-[1.5px] border-th-warm-border flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <Users size={17} className="text-th-warm-text-muted" />
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-th-text-primary">Person Capacity</p>
                <p className="text-[11.5px] text-th-warm-text-muted mt-0.5">
                  Max participants per session
                </p>
              </div>
            </div>
            <Stepper
              value={personCapacity}
              onDecrease={() => onUpdateFormData("personCapacity", Math.max(1, personCapacity - 1))}
              onIncrease={() => onUpdateFormData("personCapacity", personCapacity + 1)}
              min={1}
              outlined
            />
          </div>
        </SectionCard>

        <SectionCard
          icon={<MapPin size={16} strokeWidth={2.5} className="text-th-brand" />}
          title="Location"
          subtitle="Where the activity takes place"
        >
          <div className="flex flex-col gap-4">
            <Field label="Street Address" error={errors.address}>
              <StyledInput
                value={address || ""}
                onChange={(v) => {
                  setFormData((prev: any) => ({ ...prev, address: v }));
                  clearError("address");
                }}
                placeholder="e.g. 12, MG Road, Lal Chowk"
                error={!!errors.address}
                softErrorBg
                fontSize={14}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Country" required>
                <StyledSelect
                  value={locality}
                  onChange={(v) => {
                    setFormData((prev: any) => ({ ...prev, locality: v, state: "", city: "" }));
                    clearError("locality");
                  }}
                >
                  <option value="India">India</option>
                </StyledSelect>
              </Field>

              <Field label="Pincode" required error={errors.pincode}>
                <StyledInput
                  value={pincode}
                  onChange={(v) => {
                    setFormData((prev: any) => ({ ...prev, pincode: v.replace(/\D/g, "") }));
                    clearError("pincode");
                  }}
                  placeholder="6-digit code"
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
                <StyledSelect
                  value={state}
                  onChange={(v) => {
                    setFormData((prev: any) => ({ ...prev, state: v, city: "" }));
                    clearError("state");
                    clearError("city");
                  }}
                  error={!!errors.state}
                >
                  <option value="" disabled>
                    Select State
                  </option>
                  {locationData
                    .find((c: any) => c.name === locality)
                    ?.states?.map((s: any, idx: number) => (
                      <option key={idx} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                </StyledSelect>
              </Field>

              <Field label="City" required error={errors.city}>
                <StyledSelect
                  value={city}
                  onChange={(v) => {
                    setFormData((prev: any) => ({ ...prev, city: v }));
                    clearError("city");
                  }}
                  error={!!errors.city}
                >
                  <option value="" disabled>
                    Select City
                  </option>
                  {locationData
                    .find((c: any) => c.name === locality)
                    ?.states?.find((s: any) => s.name === state)
                    ?.cities?.map((c: any, idx: number) => (
                      <option key={idx} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </StyledSelect>
              </Field>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default PricingStep;
