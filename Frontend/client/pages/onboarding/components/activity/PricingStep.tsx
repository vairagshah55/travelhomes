import React from "react";
import { IndianRupee, Clock, Users, MapPin } from "lucide-react";
import {
  TEAL,
  TEAL_FOCUS,
  BLACK,
  WHITE,
  SURFACE,
  GRAY_400,
  GRAY_200,
  ERROR_BG,
  ERROR_RING,
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
          icon={<IndianRupee size={16} color={TEAL} strokeWidth={2.5} />}
          title="Pricing"
          subtitle="How much guests pay per booking"
        >
          <div className="flex flex-col gap-5">
            <Field label="Price per Person" required error={errors.regularPrice}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 13,
                  overflow: "hidden",
                  border: `1.5px solid ${errors.regularPrice ? "#fca5a5" : "transparent"}`,
                  backgroundColor: errors.regularPrice ? ERROR_BG : SURFACE,
                  boxShadow: errors.regularPrice ? `0 0 0 3px ${ERROR_RING}` : "none",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "0 14px",
                    height: 52,
                    borderRight: `1.5px solid ${GRAY_200}`,
                    backgroundColor: SURFACE,
                    flexShrink: 0,
                  }}
                >
                  <IndianRupee size={13} color={GRAY_400} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: GRAY_400 }}>INR</span>
                </div>
                <input
                  type="number"
                  value={regularPrice}
                  onChange={(e) => onUpdateFormData("regularPrice", e.target.value)}
                  placeholder="0"
                  min="0"
                  style={{
                    flex: 1,
                    height: 52,
                    padding: "0 16px",
                    fontSize: 18,
                    fontWeight: 700,
                    color: regularPrice ? BLACK : GRAY_400,
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    letterSpacing: "-0.02em",
                  }}
                />
                {regularPrice && Number(regularPrice) > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: TEAL,
                      paddingRight: 14,
                      flexShrink: 0,
                    }}
                  >
                    / person
                  </span>
                )}
              </div>
            </Field>

            <Field label="Duration">
              <div style={{ position: "relative" }}>
                <Clock
                  size={15}
                  color={GRAY_400}
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  value={timeDuration}
                  onChange={(e) => onUpdateFormData("timeDuration", e.target.value)}
                  placeholder="e.g. 3 hours"
                  list="duration-options"
                  style={{
                    width: "100%",
                    height: 52,
                    padding: "0 16px 0 42px",
                    fontSize: 14,
                    color: BLACK,
                    backgroundColor: SURFACE,
                    border: "1.5px solid transparent",
                    borderRadius: 13,
                    outline: "none",
                    fontWeight: 450,
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `1.5px solid ${TEAL}`;
                    e.currentTarget.style.backgroundColor = WHITE;
                    e.currentTarget.style.boxShadow = `0 0 0 4px ${TEAL_FOCUS}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1.5px solid transparent";
                    e.currentTarget.style.backgroundColor = SURFACE;
                    e.currentTarget.style.boxShadow = "none";
                  }}
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
          icon={<Users size={16} color={TEAL} strokeWidth={2.5} />}
          title="Capacity"
          subtitle="Maximum participants per session"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px",
              borderRadius: 14,
              backgroundColor: SURFACE,
              border: "1.5px solid transparent",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  backgroundColor: WHITE,
                  border: `1.5px solid ${GRAY_200}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <Users size={17} color={GRAY_400} />
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: BLACK }}>Person Capacity</p>
                <p style={{ fontSize: 11.5, color: GRAY_400, marginTop: 2 }}>
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
          icon={<MapPin size={16} color={TEAL} strokeWidth={2.5} />}
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

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
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
