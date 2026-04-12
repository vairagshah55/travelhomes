import React, { useState, useMemo } from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import {
  Building2,
  Briefcase,
  Mail,
  Phone,
  Receipt,
  MapPin,
  Search,
  X,
  ChevronDown,
} from "lucide-react";
import { type CountryOption } from "./types";

interface BusinessDetailsStepProps {
  values: {
    brandName: string;
    companyName: string;
    gstNumber: string;
    businessEmail: string;
    businessPhone: string;
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

// ─── Shared field primitives ────────────────────────────────────────────────

const fieldCls = (hasError?: boolean) =>
  `w-full h-11 px-3.5 border rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--th-accent)]/20 ${
    hasError
      ? "border-red-400 focus:border-red-400"
      : "border-gray-200 dark:border-gray-600 focus:border-[var(--th-accent)]"
  }`;

const withIconCls = (hasError?: boolean) =>
  `flex items-center border rounded-xl overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-[var(--th-accent)]/20 ${
    hasError
      ? "border-red-400 focus-within:border-red-400"
      : "border-gray-200 dark:border-gray-600 focus-within:border-[var(--th-accent)]"
  }`;

const IconBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center px-3 h-11 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 flex-shrink-0 text-gray-400">
    {children}
  </div>
);

const FieldLabel: React.FC<{ label: string; optional?: boolean; required?: boolean }> = ({
  label,
  optional,
  required,
}) => (
  <div className="flex items-center gap-1.5">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    {required && <span className="text-red-500 text-xs">*</span>}
    {optional && (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
        Optional
      </span>
    )}
  </div>
);

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className="text-xs text-red-500 mt-0.5">{message}</p> : null;

const SelectArrow = () => (
  <ChevronDown
    size={14}
    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
  />
);

const selectCls =
  "w-full h-11 px-3.5 pr-9 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)] appearance-none transition-colors";

// ─── Section wrapper ─────────────────────────────────────────────────────────

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <div className="flex flex-col gap-4 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
    <div className="flex items-center gap-2 pb-1 border-b border-gray-100 dark:border-gray-700">
      <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400">
        {icon}
      </div>
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </span>
    </div>
    {children}
  </div>
);

// ─── Country Picker Modal ─────────────────────────────────────────────────────

const CountryPickerModal: React.FC<{
  open: boolean;
  onClose: () => void;
  countries: CountryOption[];
  selected: CountryOption | null;
  onSelect: (c: CountryOption) => void;
}> = ({ open, onClose, countries, selected, onSelect }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.dialCode ?? "").includes(q)
    );
  }, [countries, search]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-4">
        <DialogPanel className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[75vh]">
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              Select Country Code
            </p>
            <button
              onClick={() => { onClose(); setSearch(""); }}
              className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
            >
              <X size={13} className="text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code…"
                autoFocus
                className="w-full h-9 pl-8 pr-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[var(--th-accent)] transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Country list */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                <Search size={20} className="text-gray-300" />
                <p className="text-sm">No results for "{search}"</p>
              </div>
            ) : (
              <ul className="py-2">
                {filtered.map((c) => {
                  const isSelected = selected?.isoCode === c.isoCode;
                  const FlagIcon = (Flags as any)[c.isoCode];
                  const dialCode =
                    c.dialCode?.charAt(0) !== "+" ? `+${c.dialCode}` : c.dialCode;

                  return (
                    <li key={c.isoCode}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(c);
                          onClose();
                          setSearch("");
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          isSelected
                            ? "bg-[var(--th-accent)]/5 text-[var(--th-accent)] font-medium"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {FlagIcon && (
                          <FlagIcon style={{ width: "22px", flexShrink: 0 }} title={c.name} />
                        )}
                        <span className="flex-1 text-left truncate">{c.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{dialCode}</span>
                        {isSelected && (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: "var(--th-accent)" }}
                          >
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4l2 2L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

// ─── Main component ───────────────────────────────────────────────────────────

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
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Business Details
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tell us about your business for verification
        </p>
      </div>

      <div className="w-full flex flex-col gap-4">
        {/* ── Company Info ── */}
        <Section icon={<Briefcase size={14} />} title="Company Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand Name */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Brand Name" required />
              <div className={withIconCls(!!errors.brandName)}>
                <IconBox><Building2 size={14} /></IconBox>
                <input
                  type="text"
                  value={values.brandName}
                  onChange={(e) => onChange("brandName", e.target.value)}
                  placeholder="e.g. Sunset Stays"
                  maxLength={50}
                  className="flex-1 h-11 px-3 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none"
                />
              </div>
              <FieldError message={errors.brandName} />
            </div>

            {/* Legal Company Name */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Legal Company Name" required />
              <div className={withIconCls(!!errors.companyName)}>
                <IconBox><Briefcase size={14} /></IconBox>
                <input
                  type="text"
                  value={values.companyName}
                  onChange={(e) => onChange("companyName", e.target.value)}
                  placeholder="e.g. Sunset Stays Pvt. Ltd."
                  maxLength={50}
                  className="flex-1 h-11 px-3 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none"
                />
              </div>
              <FieldError message={errors.companyName} />
            </div>
          </div>

          {/* GST Number */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="GST Number" optional />
            <div className={withIconCls()}>
              <IconBox><Receipt size={14} /></IconBox>
              <input
                type="text"
                value={values.gstNumber}
                onChange={(e) => onChange("gstNumber", e.target.value.toUpperCase())}
                placeholder="e.g. 22AAAAA0000A1Z5"
                maxLength={15}
                className="flex-1 h-11 px-3 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none tracking-wide font-mono"
              />
              <span className="pr-3 text-xs text-gray-400 flex-shrink-0">
                {values.gstNumber.length}/15
              </span>
            </div>
          </div>
        </Section>

        {/* ── Contact ── */}
        <Section icon={<Phone size={14} />} title="Contact">
          {/* Business Email */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Business Email" optional />
            <div className={withIconCls(!!errors.businessEmail)}>
              <IconBox><Mail size={14} /></IconBox>
              <input
                type="email"
                value={values.businessEmail}
                onChange={(e) => onChange("businessEmail", e.target.value)}
                placeholder="e.g. hello@yourbusiness.com"
                className="flex-1 h-11 px-3 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none"
              />
            </div>
            <FieldError message={errors.businessEmail} />
          </div>

          {/* Business Phone */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Business Phone" required />
            <div className={`flex gap-2 ${errors.businessPhone ? "items-start" : "items-center"}`}>
              {/* Dial code trigger */}
              <button
                type="button"
                onClick={() => setCountryDialogOpen(true)}
                className="flex items-center gap-2 h-11 px-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex-shrink-0"
              >
                {selectedCountry && (Flags as any)[selectedCountry.isoCode] ? (
                  React.createElement((Flags as any)[selectedCountry.isoCode], {
                    style: { width: "20px" },
                    title: selectedCountry.name,
                  })
                ) : (
                  <span className="w-5 h-4 bg-gray-200 rounded" />
                )}
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  {dialCode}
                </span>
                <ChevronDown size={12} className="text-gray-400" />
              </button>

              {/* Phone input */}
              <div className={`flex-1 ${withIconCls(!!errors.businessPhone)}`}>
                <IconBox><Phone size={14} /></IconBox>
                <input
                  type="text"
                  value={values.businessPhone}
                  onChange={(e) => onChange("businessPhone", e.target.value.replace(/\D/g, ""))}
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="10-digit number"
                  className="flex-1 h-11 px-3 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none"
                />
              </div>
            </div>
            <FieldError message={errors.businessPhone} />
          </div>
        </Section>

        {/* ── Location ── */}
        <Section icon={<MapPin size={14} />} title="Business Address">
          {/* Street address */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Street Address" />
            <div className={withIconCls()}>
              <IconBox><MapPin size={14} /></IconBox>
              <input
                type="text"
                placeholder="e.g. 12 MG Road, Bandra West"
                className="flex-1 h-11 px-3 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Country + Pincode */}
          <div className="grid grid-cols-2 gap-3">
            {/* Country — disabled */}
            <div className="relative">
              <select
                value="India"
                disabled
                className="w-full h-11 px-3.5 pr-9 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 cursor-not-allowed appearance-none"
              >
                <option>India</option>
              </select>
              <SelectArrow />
            </div>

            {/* Pincode */}
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={values.pincode}
                onChange={(e) => onChange("pincode", e.target.value.replace(/\D/g, ""))}
                placeholder="Pincode"
                maxLength={6}
                inputMode="numeric"
                className={fieldCls(!!errors.businessPincode)}
              />
              <FieldError message={errors.businessPincode} />
            </div>
          </div>

          {/* State + City */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => onStateChange(e.target.value)}
                  className={selectCls}
                >
                  <option value="" disabled>Select State</option>
                  {locationData
                    .find((c) => c.name === countryName)
                    ?.states?.map((s: any, idx: number) => (
                      <option key={idx} value={s.name}>{s.name}</option>
                    ))}
                </select>
                <SelectArrow />
              </div>
              <FieldError message={errors.state} />
            </div>

            <div className="flex flex-col gap-1">
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => onCityChange(e.target.value)}
                  className={selectCls}
                >
                  <option value="" disabled>Select City</option>
                  {locationData
                    .find((c) => c.name === countryName)
                    ?.states.find((s: any) => s.name === selectedState)
                    ?.cities.map((city: any, idx: number) => (
                      <option key={idx} value={city.name}>{city.name}</option>
                    ))}
                </select>
                <SelectArrow />
              </div>
              <FieldError message={errors.city} />
            </div>
          </div>

          {/* Map preview */}
          {mapSrc && (
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 h-56 mt-1">
              <iframe
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Business Location Map"
              />
            </div>
          )}
        </Section>
      </div>

      {/* Country picker modal */}
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
