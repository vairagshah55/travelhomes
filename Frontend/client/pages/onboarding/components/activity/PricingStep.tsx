import React from "react";
import { Minus, Plus, IndianRupee, Clock, Users, MapPin } from "lucide-react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL       = "#07e4e4";
const TEAL_BG    = "rgba(7, 228, 228, 0.07)";
const TEAL_FOCUS = "rgba(7, 228, 228, 0.15)";
const BLACK      = "#131313";
const GRAY_500   = "#6b6b6b";
const GRAY_400   = "#9a9a9a";
const GRAY_200   = "#e4e4e4";
const WHITE      = "#ffffff";
const SURFACE    = "#F7F8FA";
const ERROR      = "#ef4444";
const ERROR_BG   = "rgba(239,68,68,0.04)";
const ERROR_RING = "rgba(239,68,68,0.1)";

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
  "30 minutes", "1 hour", "2 hours", "3 hours",
  "Half day (4 hrs)", "Full day (8 hrs)", "Multi-day",
];

/* ─── Section card ────────────────────────────────────────────────────────── */
const SectionCard = ({
  icon, title, subtitle, children,
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
          width: 36, height: 36, borderRadius: 11,
          backgroundColor: TEAL_BG,
          border: "1.5px solid rgba(7,228,228,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
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
  label, required, error, children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label
      style={{
        fontSize: 12, fontWeight: 600,
        color: error ? ERROR : GRAY_500,
        letterSpacing: "0.03em", textTransform: "uppercase",
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
  value, onChange, placeholder, maxLength, inputMode, error,
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
        width: "100%", height: 52, padding: "0 16px",
        fontSize: 14, color: BLACK,
        backgroundColor: error ? ERROR_BG : focused ? WHITE : SURFACE,
        border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`,
        borderRadius: 13, outline: "none",
        boxShadow: focused && !error
          ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
          : error ? `0 0 0 3px ${ERROR_RING}` : "none",
        transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.2s",
        fontWeight: 450,
      }}
    />
  );
};

/* ─── Styled select ───────────────────────────────────────────────────────── */
const StyledSelect = ({
  value, onChange, children, error,
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
          width: "100%", height: 52, padding: "0 40px 0 16px",
          fontSize: 14, color: value ? BLACK : GRAY_400,
          backgroundColor: error ? ERROR_BG : focused ? WHITE : SURFACE,
          border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`,
          borderRadius: 13, outline: "none", appearance: "none",
          boxShadow: focused && !error
            ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
            : error ? `0 0 0 3px ${ERROR_RING}` : "none",
          transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.2s",
          cursor: "pointer", fontWeight: 450,
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

/* ─── Main component ──────────────────────────────────────────────────────── */
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

      {/* ── Header ── */}
      <div className="text-center space-y-2 pb-1">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
          <span
            style={{
              fontSize: 10.5, fontWeight: 700,
              letterSpacing: "0.13em", textTransform: "uppercase", color: GRAY_400,
            }}
          >
            Pricing & Location
          </span>
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
        </div>
        <h1
          style={{
            fontSize: "clamp(22px, 3.5vw, 30px)",
            fontWeight: 800, color: BLACK,
            letterSpacing: "-0.03em", lineHeight: 1.15,
          }}
        >
          Pricing &amp; Location
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Set your price, capacity and where the activity takes place.
        </p>
      </div>

      <div className="w-full flex flex-col gap-4">

        {/* ── Pricing card ── */}
        <SectionCard
          icon={<IndianRupee size={16} color={TEAL} strokeWidth={2.5} />}
          title="Pricing"
          subtitle="How much guests pay per booking"
        >
          <div className="flex flex-col gap-5">

            {/* Price per person */}
            <Field label="Price per Person" required error={errors.regularPrice}>
              <div
                style={{
                  display: "flex", alignItems: "center",
                  borderRadius: 13, overflow: "hidden",
                  border: `1.5px solid ${errors.regularPrice ? "#fca5a5" : "transparent"}`,
                  backgroundColor: errors.regularPrice ? ERROR_BG : SURFACE,
                  boxShadow: errors.regularPrice ? `0 0 0 3px ${ERROR_RING}` : "none",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "0 14px", height: 52,
                    borderRight: `1.5px solid ${GRAY_200}`,
                    backgroundColor: SURFACE, flexShrink: 0,
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
                    flex: 1, height: 52, padding: "0 16px",
                    fontSize: 18, fontWeight: 700,
                    color: regularPrice ? BLACK : GRAY_400,
                    backgroundColor: "transparent",
                    border: "none", outline: "none",
                    letterSpacing: "-0.02em",
                  }}
                />
                {regularPrice && Number(regularPrice) > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: TEAL, paddingRight: 14, flexShrink: 0 }}>
                    / person
                  </span>
                )}
              </div>
            </Field>

            {/* Duration */}
            <Field label="Duration">
              <div style={{ position: "relative" }}>
                <Clock
                  size={15} color={GRAY_400}
                  style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                />
                <input
                  type="text"
                  value={timeDuration}
                  onChange={(e) => onUpdateFormData("timeDuration", e.target.value)}
                  placeholder="e.g. 3 hours"
                  list="duration-options"
                  style={{
                    width: "100%", height: 52, padding: "0 16px 0 42px",
                    fontSize: 14, color: BLACK,
                    backgroundColor: SURFACE,
                    border: "1.5px solid transparent",
                    borderRadius: 13, outline: "none", fontWeight: 450,
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
                  {DURATION_OPTIONS.map((opt) => <option key={opt} value={opt} />)}
                </datalist>
              </div>
            </Field>

          </div>
        </SectionCard>

        {/* ── Capacity card ── */}
        <SectionCard
          icon={<Users size={16} color={TEAL} strokeWidth={2.5} />}
          title="Capacity"
          subtitle="Maximum participants per session"
        >
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 18px", borderRadius: 14,
              backgroundColor: SURFACE, border: "1.5px solid transparent",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 38, height: 38, borderRadius: 11,
                  backgroundColor: WHITE, border: "1.5px solid #EBEBEB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <Users size={17} color={GRAY_400} />
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: BLACK }}>Person Capacity</p>
                <p style={{ fontSize: 11.5, color: GRAY_400, marginTop: 2 }}>Max participants per session</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onUpdateFormData("personCapacity", Math.max(1, personCapacity - 1))}
                disabled={personCapacity <= 1}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  border: `1.5px solid ${GRAY_200}`, backgroundColor: WHITE,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: personCapacity <= 1 ? "not-allowed" : "pointer",
                  opacity: personCapacity <= 1 ? 0.35 : 1,
                  transition: "all 0.15s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
                onMouseEnter={(e) => {
                  if (personCapacity > 1) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = ERROR;
                    (e.currentTarget as HTMLButtonElement).style.color = ERROR;
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200;
                  (e.currentTarget as HTMLButtonElement).style.color = BLACK;
                }}
              >
                <Minus size={14} />
              </button>

              <span style={{ width: 36, textAlign: "center", fontSize: 17, fontWeight: 700, color: BLACK }}>
                {personCapacity}
              </span>

              <button
                type="button"
                onClick={() => onUpdateFormData("personCapacity", personCapacity + 1)}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  border: `1.5px solid ${GRAY_200}`, backgroundColor: WHITE,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.15s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL;
                  (e.currentTarget as HTMLButtonElement).style.color = TEAL;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200;
                  (e.currentTarget as HTMLButtonElement).style.color = BLACK;
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </SectionCard>

        {/* ── Location card ── */}
        <SectionCard
          icon={<MapPin size={16} color={TEAL} strokeWidth={2.5} />}
          title="Location"
          subtitle="Where the activity takes place"
        >
          <div className="flex flex-col gap-4">

            <Field label="Street Address" error={errors.address}>
              <StyledInput
                value={address || ""}
                onChange={(v) => { setFormData((prev: any) => ({ ...prev, address: v })); clearError("address"); }}
                placeholder="e.g. 12, MG Road, Lal Chowk"
                error={!!errors.address}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Country" required>
                <StyledSelect
                  value={locality}
                  onChange={(v) => { setFormData((prev: any) => ({ ...prev, locality: v, state: "", city: "" })); clearError("locality"); }}
                >
                  <option value="India">India</option>
                </StyledSelect>
              </Field>

              <Field label="Pincode" required error={errors.pincode}>
                <StyledInput
                  value={pincode}
                  onChange={(v) => { setFormData((prev: any) => ({ ...prev, pincode: v.replace(/\D/g, "") })); clearError("pincode"); }}
                  placeholder="6-digit code"
                  maxLength={6}
                  inputMode="numeric"
                  error={!!errors.pincode}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="State" required error={errors.state}>
                <StyledSelect
                  value={state}
                  onChange={(v) => { setFormData((prev: any) => ({ ...prev, state: v, city: "" })); clearError("state"); clearError("city"); }}
                  error={!!errors.state}
                >
                  <option value="" disabled>Select State</option>
                  {locationData
                    .find((c: any) => c.name === locality)
                    ?.states?.map((s: any, idx: number) => (
                      <option key={idx} value={s.name}>{s.name}</option>
                    ))}
                </StyledSelect>
              </Field>

              <Field label="City" required error={errors.city}>
                <StyledSelect
                  value={city}
                  onChange={(v) => { setFormData((prev: any) => ({ ...prev, city: v })); clearError("city"); }}
                  error={!!errors.city}
                >
                  <option value="" disabled>Select City</option>
                  {locationData
                    .find((c: any) => c.name === locality)
                    ?.states?.find((s: any) => s.name === state)
                    ?.cities?.map((c: any, idx: number) => (
                      <option key={idx} value={c.name}>{c.name}</option>
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
