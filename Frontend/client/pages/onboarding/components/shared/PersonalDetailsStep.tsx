import React from "react";
import {
  User, MapPin, Calendar, Heart, ShieldCheck,
  ChevronDown, Upload, ImageIcon, Fingerprint,
} from "lucide-react";
import { getImageUrl } from "@/lib/utils";

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

interface PersonalDetailsStepProps {
  values: {
    firstName: string;
    lastName: string;
    pincode: string;
    dateOfBirth: string;
    maritalStatus: string;
    idProof: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  locationData: any[];
  selectedState: string;
  selectedCity: string;
  countryName: string;
  onStateChange: (val: string) => void;
  onCityChange: (val: string) => void;
  idProofImage: string | null;
  onIdProofUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadError?: string;
}

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
    <div className="flex flex-col gap-4">{children}</div>
  </div>
);

/* ─── Field wrapper ───────────────────────────────────────────────────────── */
const Field = ({
  label, required, optional, error, children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-2">
      <label
        style={{
          fontSize: 12, fontWeight: 600,
          color: error ? ERROR : GRAY_500,
          textTransform: "uppercase", letterSpacing: "0.03em",
        }}
      >
        {label}
        {required && <span style={{ color: ERROR, marginLeft: 3 }}>*</span>}
      </label>
      {optional && (
        <span
          style={{
            fontSize: 10, fontWeight: 600, color: GRAY_400,
            backgroundColor: SURFACE, border: `1px solid ${GRAY_200}`,
            borderRadius: 99, padding: "1px 7px",
          }}
        >
          Optional
        </span>
      )}
    </div>
    {children}
    {error && (
      <div className="flex items-center gap-1.5 mt-0.5">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" />
          <path d="M6 3.5v3M6 8.25v.25" stroke={ERROR} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p style={{ fontSize: 11.5, color: ERROR }}>{error}</p>
      </div>
    )}
  </div>
);

/* ─── Icon input ──────────────────────────────────────────────────────────── */
const IconInput = ({
  icon, value, onChange, placeholder, maxLength,
  inputMode, type = "text", error,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
  error?: boolean;
}) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      style={{
        display: "flex", alignItems: "center",
        borderRadius: 13, overflow: "hidden",
        border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`,
        backgroundColor: error ? ERROR_BG : focused ? WHITE : SURFACE,
        boxShadow: focused && !error
          ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
          : error ? `0 0 0 3px ${ERROR_RING}` : "none",
        transition: "all 0.15s",
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center",
          padding: "0 12px", height: 52,
          borderRight: `1.5px solid ${focused ? "rgba(7,228,228,0.25)" : GRAY_200}`,
          backgroundColor: focused ? TEAL_BG : SURFACE,
          flexShrink: 0, transition: "all 0.15s",
        }}
      >
        <span style={{ color: focused ? TEAL : GRAY_400 }}>{icon}</span>
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        style={{
          flex: 1, height: 52, padding: "0 14px",
          fontSize: 14, color: value ? BLACK : GRAY_400,
          backgroundColor: "transparent", border: "none", outline: "none",
          fontWeight: 450, letterSpacing: "-0.005em",
        }}
      />
    </div>
  );
};

/* ─── Icon select ─────────────────────────────────────────────────────────── */
const IconSelect = ({
  icon, value, onChange, disabled, children, error,
}: {
  icon: React.ReactNode;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  error?: boolean;
}) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      style={{
        display: "flex", alignItems: "center",
        borderRadius: 13, overflow: "hidden",
        border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`,
        backgroundColor: disabled ? SURFACE : error ? ERROR_BG : focused ? WHITE : SURFACE,
        boxShadow: focused && !error
          ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
          : error ? `0 0 0 3px ${ERROR_RING}` : "none",
        transition: "all 0.15s",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center",
          padding: "0 12px", height: 52,
          borderRight: `1.5px solid ${focused ? "rgba(7,228,228,0.25)" : GRAY_200}`,
          backgroundColor: focused && !disabled ? TEAL_BG : SURFACE,
          flexShrink: 0, transition: "all 0.15s",
        }}
      >
        <span style={{ color: focused && !disabled ? TEAL : GRAY_400 }}>{icon}</span>
      </div>
      <div style={{ position: "relative", flex: 1 }}>
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          style={{
            width: "100%", height: 52,
            padding: "0 36px 0 14px",
            fontSize: 14, color: value ? (disabled ? GRAY_400 : BLACK) : GRAY_400,
            backgroundColor: "transparent",
            border: "none", outline: "none", appearance: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            fontWeight: 450,
          }}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          style={{
            position: "absolute", right: 12, top: "50%",
            transform: "translateY(-50%)", pointerEvents: "none", color: GRAY_400,
          }}
        />
      </div>
    </div>
  );
};

/* ─── Main component ──────────────────────────────────────────────────────── */
const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  values, errors, onChange,
  locationData, selectedState, selectedCity, countryName,
  onStateChange, onCityChange,
  idProofImage, onIdProofUpload, uploadError,
}) => {
  const [uploadHovered, setUploadHovered] = React.useState(false);

  const statesForCountry = locationData.find((c) => c.name === countryName)?.states ?? [];
  const citiesForState = statesForCountry.find((s: any) => s.name === selectedState)?.cities ?? [];

  const uploadHasError = !!(uploadError || errors.idPhotos);

  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">

      {/* ── Header ── */}
      <div className="text-center space-y-2 pb-1">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: GRAY_400 }}>
            Account
          </span>
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
        </div>
        <h1
          style={{
            fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: 800,
            color: BLACK, letterSpacing: "-0.03em", lineHeight: 1.15,
          }}
        >
          Personal Details
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Tell us a bit about yourself for account verification.
        </p>
      </div>

      <div className="w-full flex flex-col gap-4">

        {/* ── Personal Info ── */}
        <SectionCard
          icon={<User size={16} color={TEAL} strokeWidth={2.5} />}
          title="Personal Info"
          subtitle="Your full legal name"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" required error={errors.firstName}>
              <IconInput
                icon={<User size={15} />}
                value={values.firstName}
                onChange={(v) => onChange("firstName", v)}
                placeholder="e.g. Riya"
                maxLength={30}
                error={!!errors.firstName}
              />
            </Field>

            <Field label="Last Name" required error={errors.lastName}>
              <IconInput
                icon={<User size={15} />}
                value={values.lastName}
                onChange={(v) => onChange("lastName", v)}
                placeholder="e.g. Shah"
                maxLength={30}
                error={!!errors.lastName}
              />
            </Field>
          </div>
        </SectionCard>

        {/* ── Personal Details ── */}
        <SectionCard
          icon={<Calendar size={16} color={TEAL} strokeWidth={2.5} />}
          title="Personal Details"
          subtitle="Date of birth and relationship status"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date of Birth" required error={errors.dateOfBirth}>
              <IconInput
                icon={<Calendar size={15} />}
                value={values.dateOfBirth}
                onChange={(v) => onChange("dateOfBirth", v)}
                type="date"
                error={!!errors.dateOfBirth}
              />
            </Field>

            <Field label="Marital Status" optional error={errors.maritalStatus}>
              <IconSelect
                icon={<Heart size={15} />}
                value={values.maritalStatus}
                onChange={(v) => onChange("maritalStatus", v)}
                error={!!errors.maritalStatus}
              >
                <option value="">Select status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
              </IconSelect>
            </Field>
          </div>
        </SectionCard>

        {/* ── Personal Address ── */}
        <SectionCard
          icon={<MapPin size={16} color={TEAL} strokeWidth={2.5} />}
          title="Personal Address"
          subtitle="Your current residential address"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Country">
              <div
                style={{
                  display: "flex", alignItems: "center",
                  height: 52, borderRadius: 13,
                  backgroundColor: SURFACE, opacity: 0.7,
                  border: "1.5px solid transparent",
                }}
              >
                <div
                  style={{
                    display: "flex", alignItems: "center",
                    padding: "0 12px", height: "100%",
                    borderRight: `1.5px solid ${GRAY_200}`,
                    fontSize: 18, flexShrink: 0,
                  }}
                >
                  🇮🇳
                </div>
                <span style={{ flex: 1, padding: "0 14px", fontSize: 14, color: GRAY_400, fontWeight: 450 }}>
                  India
                </span>
              </div>
            </Field>

            <Field label="Pincode" required error={errors.personalPincode}>
              <IconInput
                icon={<MapPin size={15} />}
                value={values.pincode}
                onChange={(v) => onChange("pincode", v.replace(/\D/g, ""))}
                placeholder="e.g. 400001"
                maxLength={6}
                inputMode="numeric"
                error={!!errors.personalPincode}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="State" required error={errors.personalState}>
              <IconSelect
                icon={<MapPin size={15} />}
                value={selectedState}
                onChange={onStateChange}
                error={!!errors.personalState}
              >
                <option value="" disabled>Select State</option>
                {statesForCountry.map((s: any, idx: number) => (
                  <option key={idx} value={s.name}>{s.name}</option>
                ))}
              </IconSelect>
            </Field>

            <Field label="City" required error={errors.personalCity}>
              <IconSelect
                icon={<MapPin size={15} />}
                value={selectedCity}
                onChange={onCityChange}
                disabled={!selectedState}
                error={!!errors.personalCity}
              >
                <option value="" disabled>Select City</option>
                {citiesForState.map((c: any, idx: number) => (
                  <option key={idx} value={c.name}>{c.name}</option>
                ))}
              </IconSelect>
            </Field>
          </div>
        </SectionCard>

        {/* ── Identity Verification ── */}
        <SectionCard
          icon={<ShieldCheck size={16} color={TEAL} strokeWidth={2.5} />}
          title="Identity Verification"
          subtitle="Government-issued ID for verification"
        >
          <Field label="ID Proof Type" required error={errors.idProof}>
            <IconSelect
              icon={<Fingerprint size={15} />}
              value={values.idProof}
              onChange={(v) => onChange("idProof", v)}
              error={!!errors.idProof}
            >
              <option value="">Select document type</option>
              <option value="aadhar">Aadhaar Card</option>
              <option value="passport">Passport</option>
              <option value="driving_license">Driving License</option>
            </IconSelect>
          </Field>

          <Field label="Upload ID Photo" required error={uploadError || errors.idPhotos}>
            <label
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                width: "100%", height: 180,
                borderRadius: 16, cursor: "pointer",
                border: `2px dashed ${uploadHasError ? "#fca5a5" : idProofImage ? TEAL : GRAY_200}`,
                backgroundColor: uploadHasError
                  ? ERROR_BG
                  : idProofImage
                  ? TEAL_BG
                  : uploadHovered ? TEAL_BG : SURFACE,
                boxShadow: uploadHasError
                  ? `0 0 0 3px ${ERROR_RING}`
                  : idProofImage
                  ? `0 0 0 3px rgba(7,228,228,0.12)`
                  : "none",
                overflow: "hidden", position: "relative",
                transition: "all 0.2s",
              }}
              onMouseEnter={() => setUploadHovered(true)}
              onMouseLeave={() => setUploadHovered(false)}
            >
              {idProofImage ? (
                <>
                  <img
                    src={getImageUrl(idProofImage)}
                    alt="ID Proof"
                    style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                  />
                  <div
                    style={{
                      position: "absolute", inset: 0,
                      backgroundColor: `rgba(0,0,0,${uploadHovered ? 0.45 : 0})`,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "background-color 0.2s",
                    }}
                  >
                    <div
                      style={{
                        opacity: uploadHovered ? 1 : 0,
                        transform: uploadHovered ? "translateY(0)" : "translateY(6px)",
                        transition: "opacity 0.2s, transform 0.2s",
                        backgroundColor: "rgba(255,255,255,0.92)",
                        backdropFilter: "blur(8px)",
                        borderRadius: 99, padding: "8px 18px",
                        display: "flex", alignItems: "center", gap: 7,
                      }}
                    >
                      <Upload size={14} color={BLACK} />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: BLACK }}>Change Photo</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <div
                    style={{
                      width: 50, height: 50, borderRadius: 15,
                      backgroundColor: WHITE,
                      border: `1.5px solid ${uploadHasError ? "#fca5a5" : GRAY_200}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
                      transition: "transform 0.2s",
                      transform: uploadHovered ? "scale(1.08)" : "scale(1)",
                    }}
                  >
                    <ImageIcon size={22} color={uploadHasError ? "#f87171" : GRAY_400} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: uploadHasError ? ERROR : BLACK }}>
                      Click to upload ID photo
                    </p>
                    <p style={{ fontSize: 11, color: GRAY_400, marginTop: 3 }}>
                      JPG, PNG or PDF · Max 5 MB
                    </p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={onIdProofUpload}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", zIndex: 10 }}
              />
            </label>
          </Field>
        </SectionCard>

      </div>
    </div>
  );
};

export default PersonalDetailsStep;
