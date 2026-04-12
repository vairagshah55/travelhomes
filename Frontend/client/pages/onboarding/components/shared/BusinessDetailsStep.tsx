import React, { useState, useMemo } from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import {
  Building2, Briefcase, Mail, Phone, Receipt,
  MapPin, Search, X, ChevronDown, Navigation,
} from "lucide-react";
import { type CountryOption } from "./types";

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

interface BusinessDetailsStepProps {
  values: {
    brandName: string;
    companyName: string;
    gstNumber: string;
    businessEmail: string;
    businessPhone: string;
    businessAddress: string;
    pincode: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  selectedCountry: CountryOption | null;
  onCountrySelect: (c: CountryOption) => void;
  countryDialogOpen: boolean;
  setCountryDialogOpen: (open: boolean) => void;
  countries: CountryOption[];
  locationData: any[];
  selectedState: string;
  selectedCity: string;
  countryName: string;
  onStateChange: (val: string) => void;
  onCityChange: (val: string) => void;
  mapSrc?: string;
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
  label,
  required,
  optional,
  error,
  children,
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
  icon,
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode,
  type = "text",
  mono,
  suffix,
  error,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
  mono?: boolean;
  suffix?: React.ReactNode;
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
          fontWeight: 450, letterSpacing: mono ? "0.08em" : "-0.005em",
          fontFamily: mono ? "monospace" : "inherit",
        }}
      />
      {suffix}
    </div>
  );
};

/* ─── Styled select ───────────────────────────────────────────────────────── */
const StyledSelect = ({
  value,
  onChange,
  disabled,
  children,
  error,
}: {
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  error?: boolean;
}) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        style={{
          width: "100%", height: 52,
          padding: "0 40px 0 16px",
          fontSize: 14, color: value ? (disabled ? GRAY_400 : BLACK) : GRAY_400,
          backgroundColor: disabled ? SURFACE : error ? ERROR_BG : focused ? WHITE : SURFACE,
          border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`,
          borderRadius: 13, outline: "none", appearance: "none",
          boxShadow: focused && !error
            ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
            : error ? `0 0 0 3px ${ERROR_RING}` : "none",
          transition: "all 0.15s",
          cursor: disabled ? "not-allowed" : "pointer",
          fontWeight: 450,
        }}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        style={{
          position: "absolute", right: 14, top: "50%",
          transform: "translateY(-50%)", pointerEvents: "none",
          color: GRAY_400,
        }}
      />
    </div>
  );
};

/* ─── Country picker modal ────────────────────────────────────────────────── */
const CountryPickerModal = ({
  open,
  onClose,
  countries,
  selected,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  countries: CountryOption[];
  selected: CountryOption | null;
  onSelect: (c: CountryOption) => void;
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.dialCode ?? "").includes(q)
    );
  }, [countries, search]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogBackdrop
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 40,
        }}
      />
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50, padding: 16 }}>
        <DialogPanel
          style={{
            width: "100%", maxWidth: 400,
            backgroundColor: WHITE,
            borderRadius: 24,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            display: "flex", flexDirection: "column",
            overflow: "hidden", maxHeight: "75vh",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: `1px solid ${GRAY_200}`,
              flexShrink: 0,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 700, color: BLACK }}>Select Country Code</p>
            <button
              onClick={() => { onClose(); setSearch(""); }}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                backgroundColor: SURFACE, border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={13} color={GRAY_500} />
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${GRAY_200}`, flexShrink: 0 }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: GRAY_400 }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code…"
                autoFocus
                style={{
                  width: "100%", height: 40, paddingLeft: 36, paddingRight: 36,
                  fontSize: 13, color: BLACK,
                  backgroundColor: SURFACE,
                  border: `1.5px solid ${GRAY_200}`,
                  borderRadius: 11, outline: "none",
                  transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
                onFocus={e => { e.target.style.borderColor = TEAL; e.target.style.boxShadow = `0 0 0 3px ${TEAL_FOCUS}`; }}
                onBlur={e => { e.target.style.borderColor = GRAY_200; e.target.style.boxShadow = "none"; }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={12} color={GRAY_400} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 8 }}>
                <Search size={20} color={GRAY_200} />
                <p style={{ fontSize: 13, color: GRAY_400 }}>No results for "{search}"</p>
              </div>
            ) : (
              <ul style={{ padding: "8px 0", margin: 0, listStyle: "none" }}>
                {filtered.map((c) => {
                  const isSelected = selected?.isoCode === c.isoCode;
                  const FlagIcon = (Flags as any)[c.isoCode];
                  const dialCode = c.dialCode?.charAt(0) !== "+" ? `+${c.dialCode}` : c.dialCode;
                  return (
                    <li key={c.isoCode}>
                      <button
                        type="button"
                        onClick={() => { onSelect(c); onClose(); setSearch(""); }}
                        style={{
                          width: "100%",
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 20px",
                          backgroundColor: isSelected ? TEAL_BG : "transparent",
                          border: "none", cursor: "pointer",
                          transition: "background-color 0.1s",
                        }}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = SURFACE; }}
                        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                      >
                        {FlagIcon && <FlagIcon style={{ width: 22, flexShrink: 0 }} title={c.name} />}
                        <span style={{ flex: 1, fontSize: 13, color: isSelected ? TEAL : BLACK, fontWeight: isSelected ? 700 : 400, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.name}
                        </span>
                        <span style={{ fontSize: 12, color: GRAY_400, flexShrink: 0 }}>{dialCode}</span>
                        {isSelected && (
                          <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: TEAL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4l2 2L6.5 2" stroke={BLACK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

/* ─── Main component ──────────────────────────────────────────────────────── */
const BusinessDetailsStep: React.FC<BusinessDetailsStepProps> = ({
  values,
  errors,
  onChange,
  selectedCountry,
  onCountrySelect,
  countryDialogOpen,
  setCountryDialogOpen,
  countries,
  locationData,
  selectedState,
  selectedCity,
  countryName,
  onStateChange,
  onCityChange,
  mapSrc,
}) => {
  const dialCode = selectedCountry
    ? selectedCountry.dialCode?.charAt(0) !== "+"
      ? `+${selectedCountry.dialCode}`
      : selectedCountry.dialCode
    : "+91";

  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">

      {/* ── Header ── */}
      <div className="text-center space-y-2 pb-1">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: GRAY_400 }}>
            Verification
          </span>
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
        </div>
        <h1
          style={{
            fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: 800,
            color: BLACK, letterSpacing: "-0.03em", lineHeight: 1.15,
          }}
        >
          Business Details
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Tell us about your business for verification.
        </p>
      </div>

      <div className="w-full flex flex-col gap-4">

        {/* ── Company Info ── */}
        <SectionCard
          icon={<Briefcase size={16} color={TEAL} strokeWidth={2.5} />}
          title="Company Info"
          subtitle="Your registered business identity"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Brand Name" required error={errors.brandName}>
              <IconInput
                icon={<Building2 size={15} />}
                value={values.brandName}
                onChange={(v) => onChange("brandName", v)}
                placeholder="e.g. Sunset Stays"
                maxLength={50}
                error={!!errors.brandName}
              />
            </Field>

            <Field label="Legal Company Name" required error={errors.companyName}>
              <IconInput
                icon={<Briefcase size={15} />}
                value={values.companyName}
                onChange={(v) => onChange("companyName", v)}
                placeholder="e.g. Sunset Stays Pvt. Ltd."
                maxLength={50}
                error={!!errors.companyName}
              />
            </Field>
          </div>

          <Field label="GST Number" optional>
            <IconInput
              icon={<Receipt size={15} />}
              value={values.gstNumber}
              onChange={(v) => onChange("gstNumber", v.toUpperCase())}
              placeholder="e.g. 22AAAAA0000A1Z5"
              maxLength={15}
              mono
              suffix={
                <span style={{ paddingRight: 14, fontSize: 11, fontWeight: 600, color: GRAY_400 }}>
                  {values.gstNumber.length}/15
                </span>
              }
            />
          </Field>
        </SectionCard>

        {/* ── Contact ── */}
        <SectionCard
          icon={<Phone size={16} color={TEAL} strokeWidth={2.5} />}
          title="Contact"
          subtitle="How guests and your team can reach you"
        >
          <Field label="Business Email" optional error={errors.businessEmail}>
            <IconInput
              icon={<Mail size={15} />}
              value={values.businessEmail}
              onChange={(v) => onChange("businessEmail", v)}
              placeholder="e.g. hello@yourbusiness.com"
              type="email"
              error={!!errors.businessEmail}
            />
          </Field>

          <Field label="Business Phone" required error={errors.businessPhone}>
            <div className="flex gap-2 items-start">
              {/* Dial code trigger */}
              <button
                type="button"
                onClick={() => setCountryDialogOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  height: 52, padding: "0 14px",
                  backgroundColor: SURFACE,
                  border: `1.5px solid ${errors.businessPhone ? "#fca5a5" : "transparent"}`,
                  borderRadius: 13,
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s",
                  boxShadow: errors.businessPhone ? `0 0 0 3px ${ERROR_RING}` : "none",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL; (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL_BG; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = errors.businessPhone ? "#fca5a5" : "transparent"; (e.currentTarget as HTMLButtonElement).style.backgroundColor = SURFACE; }}
              >
                {selectedCountry && (Flags as any)[selectedCountry.isoCode] ? (
                  React.createElement((Flags as any)[selectedCountry.isoCode], {
                    style: { width: 20 }, title: selectedCountry.name,
                  })
                ) : (
                  <span style={{ width: 20, height: 14, backgroundColor: GRAY_200, borderRadius: 3, display: "block" }} />
                )}
                <span style={{ fontSize: 13.5, fontWeight: 600, color: BLACK }}>{dialCode}</span>
                <ChevronDown size={13} color={GRAY_400} />
              </button>

              {/* Phone input */}
              <div style={{ flex: 1 }}>
                <IconInput
                  icon={<Phone size={15} />}
                  value={values.businessPhone}
                  onChange={(v) => onChange("businessPhone", v.replace(/\D/g, ""))}
                  placeholder="10-digit number"
                  maxLength={10}
                  inputMode="numeric"
                  error={!!errors.businessPhone}
                />
              </div>
            </div>
          </Field>
        </SectionCard>

        {/* ── Business Address ── */}
        <SectionCard
          icon={<MapPin size={16} color={TEAL} strokeWidth={2.5} />}
          title="Business Address"
          subtitle="Where your business is registered"
        >
          <Field label="Street Address" required error={errors.businessAddress}>
            <IconInput
              icon={<MapPin size={15} />}
              value={values.businessAddress}
              onChange={(v) => onChange("businessAddress", v)}
              placeholder="e.g. 12 MG Road, Bandra West"
              error={!!errors.businessAddress}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Country">
              <StyledSelect value="India" disabled>
                <option>India</option>
              </StyledSelect>
            </Field>

            <Field label="Pincode" required error={errors.businessPincode}>
              <IconInput
                icon={<MapPin size={15} />}
                value={values.pincode}
                onChange={(v) => onChange("pincode", v.replace(/\D/g, ""))}
                placeholder="e.g. 560001"
                maxLength={6}
                inputMode="numeric"
                error={!!errors.businessPincode}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="State" required error={errors.state}>
              <StyledSelect
                value={selectedState}
                onChange={onStateChange}
                error={!!errors.state}
              >
                <option value="" disabled>Select State</option>
                {locationData
                  .find((c) => c.name === countryName)
                  ?.states?.map((s: any, idx: number) => (
                    <option key={idx} value={s.name}>{s.name}</option>
                  ))}
              </StyledSelect>
            </Field>

            <Field label="City" required error={errors.city}>
              <StyledSelect
                value={selectedCity}
                onChange={onCityChange}
                error={!!errors.city}
              >
                <option value="" disabled>Select City</option>
                {locationData
                  .find((c) => c.name === countryName)
                  ?.states?.find((s: any) => s.name === selectedState)
                  ?.cities?.map((city: any, idx: number) => (
                    <option key={idx} value={city.name}>{city.name}</option>
                  ))}
              </StyledSelect>
            </Field>
          </div>

          {/* Map preview */}
          {mapSrc && (
            <div
              style={{
                borderRadius: 16, overflow: "hidden",
                border: `1.5px solid #EBEBEB`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="flex items-center gap-2"
                style={{ padding: "10px 16px", backgroundColor: WHITE, borderBottom: "1.5px solid #EBEBEB" }}
              >
                <Navigation size={13} color={TEAL} />
                <span style={{ fontSize: 12, fontWeight: 600, color: GRAY_500 }}>
                  {[selectedCity, selectedState].filter(Boolean).join(", ") || "Map Preview"}
                </span>
              </div>
              <iframe
                src={mapSrc}
                width="100%"
                height="220"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Business Location Map"
              />
            </div>
          )}
        </SectionCard>

      </div>

      <CountryPickerModal
        open={countryDialogOpen}
        onClose={() => setCountryDialogOpen(false)}
        countries={countries}
        selected={selectedCountry}
        onSelect={onCountrySelect}
      />
    </div>
  );
};

export default BusinessDetailsStep;
