import React from "react";
import { Users, BedDouble, Minus, Plus, MapPin, Navigation } from "lucide-react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL      = "#07e4e4";
const TEAL_BG   = "rgba(7, 228, 228, 0.07)";
const TEAL_FOCUS= "rgba(7, 228, 228, 0.15)";
const BLACK     = "#131313";
const GRAY_500  = "#6b6b6b";
const GRAY_400  = "#9a9a9a";
const GRAY_200  = "#e4e4e4";
const WHITE     = "#ffffff";
const SURFACE   = "#F7F8FA";
const ERROR     = "#ef4444";
const ERROR_BG  = "rgba(239,68,68,0.04)";
const ERROR_RING= "rgba(239,68,68,0.1)";

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

/* ─── Section card ────────────────────────────────────────────────────────── */
const SectionCard = ({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div
    style={{
      backgroundColor: WHITE,
      border: "1.5px solid #EBEBEB",
      borderRadius: 20,
      padding: "20px 22px 22px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
    }}
  >
    <div className="flex items-center gap-3 mb-5">
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: TEAL_BG,
          border: "1.5px solid rgba(7,228,228,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: BLACK, letterSpacing: "-0.01em" }}>{title}</p>
        {subtitle && <p style={{ fontSize: 11, color: GRAY_400, marginTop: 1 }}>{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

/* ─── Field wrapper ───────────────────────────────────────────────────────── */
const Field = ({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: error ? ERROR : GRAY_500,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
      }}
    >
      {label}
      {required && <span style={{ color: ERROR, marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {error && (
      <div className="flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" />
          <path d="M6 3.5v3M6 8.25v.25" stroke={ERROR} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p style={{ fontSize: 11.5, color: ERROR }}>{error}</p>
      </div>
    )}
  </div>
);

/* ─── Styled input ────────────────────────────────────────────────────────── */
const StyledInput = ({
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: boolean;
}) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      maxLength={maxLength}
      inputMode={inputMode}
      style={{
        width: "100%",
        height: 52,
        padding: "0 16px",
        fontSize: 14,
        color: BLACK,
        backgroundColor: error ? ERROR_BG : focused ? WHITE : SURFACE,
        border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`,
        borderRadius: 13,
        outline: "none",
        boxShadow: focused && !error
          ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
          : error
          ? `0 0 0 3px ${ERROR_RING}`
          : "none",
        transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.2s",
        fontWeight: 450,
      }}
    />
  );
};

/* ─── Styled select ───────────────────────────────────────────────────────── */
const StyledSelect = ({
  value,
  onChange,
  children,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  error?: boolean;
}) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          height: 52,
          padding: "0 40px 0 16px",
          fontSize: 14,
          color: value ? BLACK : GRAY_400,
          backgroundColor: error ? ERROR_BG : focused ? WHITE : SURFACE,
          border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`,
          borderRadius: 13,
          outline: "none",
          appearance: "none",
          boxShadow: focused && !error
            ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
            : error
            ? `0 0 0 3px ${ERROR_RING}`
            : "none",
          transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.2s",
          cursor: "pointer",
          fontWeight: 450,
        }}
      >
        {children}
      </select>
      <svg
        style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        width="16" height="16" viewBox="0 0 16 16" fill="none"
      >
        <path d="M4 6l4 4 4-4" stroke={GRAY_400} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/* ─── Capacity row ────────────────────────────────────────────────────────── */
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
      border: `1.5px solid ${error ? "#fca5a5" : "transparent"}`,
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
          border: "1.5px solid #EBEBEB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: BLACK, letterSpacing: "-0.01em" }}>{label}</p>
        {description && <p style={{ fontSize: 11.5, color: GRAY_400, marginTop: 2 }}>{description}</p>}
      </div>
    </div>

    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onDecrease}
        disabled={value <= min}
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: `1.5px solid ${value <= min ? GRAY_200 : GRAY_200}`,
          backgroundColor: WHITE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: value <= min ? "not-allowed" : "pointer",
          opacity: value <= min ? 0.35 : 1,
          transition: "all 0.15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
        onMouseEnter={e => {
          if (value > min) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = ERROR;
            (e.currentTarget as HTMLButtonElement).style.color = ERROR;
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200;
          (e.currentTarget as HTMLButtonElement).style.color = BLACK;
        }}
      >
        <Minus size={14} />
      </button>

      <span
        style={{
          width: 36,
          textAlign: "center",
          fontSize: 17,
          fontWeight: 700,
          color: value > 0 ? BLACK : GRAY_400,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={value >= max}
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: `1.5px solid ${TEAL}`,
          backgroundColor: TEAL_BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: value >= max ? "not-allowed" : "pointer",
          opacity: value >= max ? 0.35 : 1,
          transition: "all 0.15s",
          color: TEAL,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
        onMouseEnter={e => {
          if (value < max) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(7,228,228,0.18)";
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL_BG;
        }}
      >
        <Plus size={14} />
      </button>
    </div>
  </div>
  {error && (
    <div className="flex items-center gap-1.5">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" />
        <path d="M6 3.5v3M6 8.25v.25" stroke={ERROR} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p style={{ fontSize: 11.5, color: ERROR }}>{error}</p>
    </div>
  )}
  </div>
);

/* ─── Main component ──────────────────────────────────────────────────────── */
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

      {/* ── Header ── */}
      <div className="text-center space-y-2 pb-1">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: GRAY_400 }}>
            Setup
          </span>
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
        </div>
        <h1
          style={{
            fontSize: "clamp(22px, 3.5vw, 30px)",
            fontWeight: 800,
            color: BLACK,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}
        >
          Capacity &amp; Location
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Set your caravan's capacity and where guests can find it.
        </p>
      </div>

      <div className="w-full flex flex-col gap-4">

        {/* ── Capacity card ── */}
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
              onIncrease={() => { onAdjustCapacity("sleeping", "increase"); clear("sleepingCapacity"); }}
              min={0}
              max={20}
              error={errors.sleepingCapacity}
            />
          </div>
        </SectionCard>

        {/* ── Location card ── */}
        <SectionCard
          icon={<MapPin size={16} color={TEAL} strokeWidth={2.5} />}
          title="Location"
          subtitle="Where guests can find your caravan"
        >
          <div className="flex flex-col gap-4">

            {/* Street address */}
            <Field label="Street Address" required error={errors.address}>
              <StyledInput
                value={address}
                onChange={(v) => { onAddressChange(v); clear("address"); }}
                placeholder="e.g. 12 MG Road, Bengaluru"
                error={!!errors.address}
              />
            </Field>

            {/* Country + Pincode */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Country" required error={errors.locality}>
                <StyledSelect
                  value={locality}
                  onChange={(v) => { onLocalityChange(v); clear("locality"); }}
                  error={!!errors.locality}
                >
                  <option value="India">India</option>
                </StyledSelect>
              </Field>

              <Field label="Pincode" required error={errors.pincode}>
                <StyledInput
                  value={pincode}
                  onChange={(v) => { onPincodeChange(v.replace(/\D/g, "")); clear("pincode"); }}
                  placeholder="e.g. 560001"
                  maxLength={6}
                  inputMode="numeric"
                  error={!!errors.pincode}
                />
              </Field>
            </div>

            {/* State + City */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="State" required error={errors.state}>
                <StyledSelect
                  value={state}
                  onChange={(v) => { onStateChange(v); clear("state"); }}
                  error={!!errors.state}
                >
                  <option value="" disabled>Select State</option>
                  {locationData
                    .find((c: any) => c.name === locality)
                    ?.states?.map((st: any, idx: number) => (
                      <option key={idx} value={st.name}>{st.name}</option>
                    ))}
                </StyledSelect>
              </Field>

              <Field label="City" required error={errors.city}>
                <StyledSelect
                  value={city}
                  onChange={(v) => { onCityChange(v); clear("city"); }}
                  error={!!errors.city}
                >
                  <option value="" disabled>Select City</option>
                  {locationData
                    .find((c: any) => c.name === locality)
                    ?.states?.find((st: any) => st.name === state)
                    ?.cities?.map((ct: any, idx: number) => (
                      <option key={idx} value={ct.name}>{ct.name}</option>
                    ))}
                </StyledSelect>
              </Field>
            </div>

          </div>
        </SectionCard>

        {/* ── Map preview ── */}
        {mapSrc && (
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              border: "1.5px solid #EBEBEB",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="flex items-center gap-2"
              style={{
                padding: "12px 18px",
                backgroundColor: WHITE,
                borderBottom: "1.5px solid #EBEBEB",
              }}
            >
              <Navigation size={13} color={TEAL} />
              <span style={{ fontSize: 12, fontWeight: 600, color: GRAY_500 }}>
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
