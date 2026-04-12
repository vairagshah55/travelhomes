import React from "react";
import {
  User,
  MapPin,
  Calendar,
  Heart,
  ShieldCheck,
  ChevronDown,
  Upload,
  ImageIcon,
  Fingerprint,
} from "lucide-react";
import { getImageUrl } from "@/lib/utils";

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
  // Location dropdowns
  locationData: any[];
  selectedState: string;
  selectedCity: string;
  countryName: string;
  onStateChange: (val: string) => void;
  onCityChange: (val: string) => void;
  // ID proof
  idProofImage: string | null;
  onIdProofUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadError?: string;
}

// ── Style helpers ───────────────────────────────────────────────────────────

const fieldCls = (hasError?: boolean) =>
  `w-full h-11 px-3.5 border rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--th-accent)]/20 ${
    hasError
      ? "border-red-400 focus:border-red-400"
      : "border-gray-200 dark:border-gray-600 focus:border-[var(--th-accent)]"
  }`;

const withIconCls = (hasError?: boolean) =>
  `flex items-center border rounded-xl overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-[var(--th-accent)]/20 bg-white dark:bg-gray-800 ${
    hasError
      ? "border-red-400 focus-within:border-red-400"
      : "border-gray-200 dark:border-gray-600 focus-within:border-[var(--th-accent)]"
  }`;

const selectWrapCls = (hasError?: boolean) =>
  `relative flex items-center border rounded-xl overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-[var(--th-accent)]/20 bg-white dark:bg-gray-800 ${
    hasError
      ? "border-red-400 focus-within:border-red-400"
      : "border-gray-200 dark:border-gray-600 focus-within:border-[var(--th-accent)]"
  }`;

// ── Sub-components ──────────────────────────────────────────────────────────

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
}> = ({ icon, title, children, delay = 0 }) => (
  <div
    className="onb-fade-up flex flex-col gap-4 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center gap-2 pb-1 border-b border-gray-100 dark:border-gray-700">
      <div className="w-7 h-7 rounded-lg bg-[var(--th-accent-subtle)] dark:bg-[var(--th-accent)]/10 flex items-center justify-center text-[var(--th-accent)]">
        {icon}
      </div>
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </span>
    </div>
    {children}
  </div>
);

const FieldLabel: React.FC<{
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}> = ({ children, required, optional }) => (
  <div className="flex items-center gap-1.5">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {children}
    </label>
    {required && <span className="text-red-500 text-xs">*</span>}
    {optional && (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
        Optional
      </span>
    )}
  </div>
);

const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? <p className="text-xs text-red-500 mt-0.5">{msg}</p> : null;

const IconBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center justify-center px-3 h-11 flex-shrink-0 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-400">
    {children}
  </div>
);

const SelectArrow = () => (
  <ChevronDown
    size={14}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
  />
);

// ── Main component ──────────────────────────────────────────────────────────

const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  values,
  errors,
  onChange,
  locationData,
  selectedState,
  selectedCity,
  countryName,
  onStateChange,
  onCityChange,
  idProofImage,
  onIdProofUpload,
  uploadError,
}) => {
  const statesForCountry =
    locationData.find((c) => c.name === countryName)?.states ?? [];
  const citiesForState =
    statesForCountry.find((s: any) => s.name === selectedState)?.cities ?? [];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="onb-fade-up text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[var(--th-accent-subtle)] dark:bg-[var(--th-accent)]/10 flex items-center justify-center">
          <User size={22} className="text-[var(--th-accent)]" />
        </div>
        <div className="space-y-1">
          <h1
            className="text-2xl lg:text-[32px] font-bold text-gray-900 dark:text-white leading-tight"
            style={{ fontFamily: "var(--th-font-heading)" }}
          >
            Personal Details
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Tell us a bit about yourself for account verification
          </p>
        </div>
      </div>

      <div className="w-full flex flex-col gap-4">
        {/* ── Personal Info ──────────────────────────────────────────── */}
        <Section icon={<User size={14} />} title="Personal Info" delay={60}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>First Name</FieldLabel>
              <div className={withIconCls(!!errors.firstName)}>
                <IconBox><User size={14} /></IconBox>
                <input
                  type="text"
                  value={values.firstName}
                  onChange={(e) => onChange("firstName", e.target.value)}
                  placeholder="e.g. Riya"
                  maxLength={30}
                  className="flex-1 h-11 px-3 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none"
                />
              </div>
              <FieldError msg={errors.firstName} />
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Last Name</FieldLabel>
              <div className={withIconCls(!!errors.lastName)}>
                <IconBox><User size={14} /></IconBox>
                <input
                  type="text"
                  value={values.lastName}
                  onChange={(e) => onChange("lastName", e.target.value)}
                  placeholder="e.g. Shah"
                  maxLength={30}
                  className="flex-1 h-11 px-3 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none"
                />
              </div>
              <FieldError msg={errors.lastName} />
            </div>
          </div>
        </Section>

        {/* ── Date of Birth & Marital Status ─────────────────────────── */}
        <Section icon={<Calendar size={14} />} title="Personal Details" delay={120}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date of Birth */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Date of Birth</FieldLabel>
              <div className={withIconCls(!!errors.dateOfBirth)}>
                <IconBox><Calendar size={14} /></IconBox>
                <input
                  type="date"
                  value={values.dateOfBirth}
                  onChange={(e) => onChange("dateOfBirth", e.target.value)}
                  className="flex-1 h-11 px-3 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none"
                />
              </div>
              <FieldError msg={errors.dateOfBirth} />
            </div>

            {/* Marital Status */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel optional>Marital Status</FieldLabel>
              <div className={selectWrapCls(!!errors.maritalStatus)}>
                <IconBox><Heart size={14} /></IconBox>
                <select
                  value={values.maritalStatus}
                  onChange={(e) => onChange("maritalStatus", e.target.value)}
                  className="flex-1 h-11 px-3 pr-9 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                </select>
                <SelectArrow />
              </div>
              <FieldError msg={errors.maritalStatus} />
            </div>
          </div>
        </Section>

        {/* ── Address ────────────────────────────────────────────────── */}
        <Section icon={<MapPin size={14} />} title="Personal Address" delay={180}>
          {/* Country + Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Country — disabled */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Country</FieldLabel>
              <div className="flex items-center border rounded-xl overflow-hidden border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 opacity-70 cursor-not-allowed">
                <div className="flex items-center justify-center px-3 h-11 flex-shrink-0 border-r border-gray-200 dark:border-gray-600">
                  <span className="text-sm">🇮🇳</span>
                </div>
                <span className="flex-1 h-11 px-3 text-sm flex items-center text-gray-500 dark:text-gray-400">
                  India
                </span>
              </div>
            </div>

            {/* Pincode */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Pincode</FieldLabel>
              <div className={withIconCls(!!errors.personalPincode)}>
                <IconBox><MapPin size={14} /></IconBox>
                <input
                  type="text"
                  inputMode="numeric"
                  value={values.pincode}
                  onChange={(e) =>
                    onChange("pincode", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="e.g. 400001"
                  maxLength={6}
                  className="flex-1 h-11 px-3 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none tracking-widest"
                />
              </div>
              <FieldError msg={errors.personalPincode} />
            </div>
          </div>

          {/* State + City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* State */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>State</FieldLabel>
              <div className={selectWrapCls(!!errors.personalState)}>
                <IconBox><MapPin size={14} /></IconBox>
                <select
                  value={selectedState}
                  onChange={(e) => onStateChange(e.target.value)}
                  className="flex-1 h-11 px-3 pr-9 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Select State
                  </option>
                  {statesForCountry.map((state: any, idx: number) => (
                    <option key={idx} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
                <SelectArrow />
              </div>
              <FieldError msg={errors.personalState} />
            </div>

            {/* City */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>City</FieldLabel>
              <div className={selectWrapCls(!!errors.personalCity)}>
                <IconBox><MapPin size={14} /></IconBox>
                <select
                  value={selectedCity}
                  onChange={(e) => onCityChange(e.target.value)}
                  disabled={!selectedState}
                  className={`flex-1 h-11 px-3 pr-9 text-sm bg-transparent focus:outline-none appearance-none ${
                    !selectedState
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-800 dark:text-white cursor-pointer"
                  }`}
                >
                  <option value="" disabled>
                    Select City
                  </option>
                  {citiesForState.map((city: any, idx: number) => (
                    <option key={idx} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
                <SelectArrow />
              </div>
              <FieldError msg={errors.personalCity} />
            </div>
          </div>
        </Section>

        {/* ── Identity Verification ──────────────────────────────────── */}
        <Section
          icon={<ShieldCheck size={14} />}
          title="Identity Verification"
          delay={240}
        >
          {/* ID Proof Type */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>ID Proof Type</FieldLabel>
            <div className={selectWrapCls(!!errors.idProof)}>
              <IconBox><Fingerprint size={14} /></IconBox>
              <select
                value={values.idProof}
                onChange={(e) => onChange("idProof", e.target.value)}
                className="flex-1 h-11 px-3 pr-9 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">Select document type</option>
                <option value="aadhar">Aadhaar Card</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
              </select>
              <SelectArrow />
            </div>
            <FieldError msg={errors.idProof} />
          </div>

          {/* ID Photo Upload */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Upload ID Photo</FieldLabel>
            <div className="relative group">
              <label
                className={`flex flex-col items-center justify-center w-full h-44 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden ${
                  uploadError || errors.idPhotos
                    ? "border-red-300 bg-red-50 dark:bg-red-900/10"
                    : idProofImage
                      ? "border-[var(--th-accent)] bg-[var(--th-accent-subtle)] dark:bg-[var(--th-accent)]/5"
                      : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-[var(--th-accent)] hover:bg-[var(--th-accent-subtle)] dark:hover:bg-[var(--th-accent)]/5"
                }`}
              >
                {idProofImage ? (
                  <>
                    <img
                      src={getImageUrl(idProofImage)}
                      alt="ID Proof"
                      className="w-full h-full object-cover absolute inset-0"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Upload size={18} className="text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white">
                        Change Photo
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--th-accent-subtle)] dark:bg-[var(--th-accent)]/10 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                      <ImageIcon
                        size={22}
                        className="text-[var(--th-accent)]"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Click to upload ID photo
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPG, PNG or PDF &middot; Max 5 MB
                      </p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={onIdProofUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </label>

              {(uploadError || errors.idPhotos) && (
                <p className="text-xs text-red-500 mt-1.5">
                  {uploadError || errors.idPhotos}
                </p>
              )}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default PersonalDetailsStep;
