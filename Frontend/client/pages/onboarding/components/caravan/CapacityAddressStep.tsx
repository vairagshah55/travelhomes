import React from "react";
import { Users, BedDouble, MapPin, Navigation } from "lucide-react";
import {
  TEAL,
  BLACK,
  WHITE,
  SURFACE,
  GRAY_400,
  GRAY_200,
  ERROR_SOFT,
  ERROR_BG,
  ERROR_RING,
  SectionCard,
  Field,
  ErrorMsg,
  StyledInput,
  StyledSelect,
  Stepper,
  StepHeader,
} from "../shared/primitives";

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
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 18px",
        borderRadius: 14,
        backgroundColor: error ? ERROR_BG : SURFACE,
        border: `1.5px solid ${error ? ERROR_SOFT : "transparent"}`,
        boxShadow: error ? `0 0 0 3px ${ERROR_RING}` : "none",
        transition: "all 0.15s",
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
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: BLACK, letterSpacing: "-0.01em" }}>
            {label}
          </p>
          {description && (
            <p style={{ fontSize: 11.5, color: GRAY_400, marginTop: 2 }}>{description}</p>
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
}) => {
  const clear = (field: string) => clearError?.(field);

  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">
      <StepHeader
        kicker="Setup"
        title={<>Capacity &amp; Location</>}
        subtitle="Set your caravan's capacity and where guests can find it."
      />

      <div className="w-full flex flex-col gap-4">
        <SectionCard
          icon={<Users size={16} color={TEAL} strokeWidth={2.5} />}
          title="Capacity"
          subtitle="How many guests your caravan accommodates"
        >
          <div className="flex flex-col gap-3">
            <CapacityRow
              icon={<Users size={16} color={GRAY_400} />}
              label="Seating Capacity"
              description="Guests who can sit during the journey"
              value={seatingCapacity}
              onDecrease={() => onAdjustCapacity("seating", "decrease")}
              onIncrease={() => onAdjustCapacity("seating", "increase")}
              min={1}
              max={20}
            />
            <CapacityRow
              icon={<BedDouble size={16} color={errors.sleepingCapacity ? "#f87171" : GRAY_400} />}
              label="Sleeping Capacity"
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
          icon={<MapPin size={16} color={TEAL} strokeWidth={2.5} />}
          title="Location"
          subtitle="Where guests can find your caravan"
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
                softErrorBg
                fontSize={14}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
              <Field label="State" required error={errors.state}>
                <StyledSelect
                  value={state}
                  onChange={(v) => {
                    onStateChange(v);
                    clear("state");
                  }}
                  error={!!errors.state}
                >
                  <option value="" disabled>
                    Select State
                  </option>
                  {locationData
                    .find((c: any) => c.name === locality)
                    ?.states?.map((st: any, idx: number) => (
                      <option key={idx} value={st.name}>
                        {st.name}
                      </option>
                    ))}
                </StyledSelect>
              </Field>

              <Field label="City" required error={errors.city}>
                <StyledSelect
                  value={city}
                  onChange={(v) => {
                    onCityChange(v);
                    clear("city");
                  }}
                  error={!!errors.city}
                >
                  <option value="" disabled>
                    Select City
                  </option>
                  {locationData
                    .find((c: any) => c.name === locality)
                    ?.states?.find((st: any) => st.name === state)
                    ?.cities?.map((ct: any, idx: number) => (
                      <option key={idx} value={ct.name}>
                        {ct.name}
                      </option>
                    ))}
                </StyledSelect>
              </Field>
            </div>
          </div>
        </SectionCard>

        {mapSrc && (
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              border: `1.5px solid ${GRAY_200}`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="flex items-center gap-2"
              style={{
                padding: "12px 18px",
                backgroundColor: WHITE,
                borderBottom: `1.5px solid ${GRAY_200}`,
              }}
            >
              <Navigation size={13} color={TEAL} />
              <span style={{ fontSize: 12, fontWeight: 600, color: BLACK }}>
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
      </div>
    </div>
  );
};

export default CapacityAddressStep;
