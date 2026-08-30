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
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type CountryOption } from "./types";
import { SectionCard, Field, IconInput, StyledSelect, StepHeader } from "./primitives";

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
      (c) => c.name.toLowerCase().includes(q) || (c.dialCode ?? "").includes(q),
    );
  }, [countries, search]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogBackdrop className="fixed inset-0 bg-black/45 backdrop-blur-[4px] z-40" />
      <div className="fixed inset-0 flex items-end justify-center z-50 p-4">
        <DialogPanel className="w-full max-w-[400px] bg-th-surface-0 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden max-h-[75vh]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-th-warm-border flex-shrink-0">
            <p className="text-[14px] font-bold text-th-text-primary">Select Country Code</p>
            <button
              onClick={() => {
                onClose();
                setSearch("");
              }}
              className="w-[30px] h-[30px] rounded-full bg-th-warm-surface border-none flex items-center justify-center cursor-pointer"
            >
              <X size={13} className="text-th-warm-text-dark" />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-th-warm-border flex-shrink-0">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-th-warm-text-muted"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code…"
                autoFocus
                className={cn(
                  "w-full h-[40px] pl-9 pr-9 text-[13px] text-th-text-primary",
                  "bg-th-warm-surface border-[1.5px] border-th-warm-border rounded-[11px]",
                  "outline-none transition-[border-color,box-shadow] duration-150",
                  "focus:border-th-brand focus:shadow-[0_0_0_3px_var(--th-ring)]",
                )}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-[10px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer"
                >
                  <X size={12} className="text-th-warm-text-muted" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Search size={20} className="text-th-warm-border" />
                <p className="text-[13px] text-th-warm-text-muted">No results for "{search}"</p>
              </div>
            ) : (
              <ul className="py-2 m-0 list-none">
                {filtered.map((c) => {
                  const isSelected = selected?.isoCode === c.isoCode;
                  const FlagIcon = (Flags as any)[c.isoCode];
                  const dialCode = c.dialCode?.charAt(0) !== "+" ? `+${c.dialCode}` : c.dialCode;
                  return (
                    <li key={c.isoCode}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(c);
                          onClose();
                          setSearch("");
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-5 py-[10px]",
                          "border-none cursor-pointer transition-colors duration-100",
                          isSelected
                            ? "bg-th-brand-soft"
                            : "bg-transparent hover:bg-th-warm-surface",
                        )}
                      >
                        {FlagIcon && (
                          <FlagIcon
                            style={{ width: 22 }}
                            className="flex-shrink-0"
                            title={c.name}
                          />
                        )}
                        <span
                          className={cn(
                            "flex-1 text-[13px] text-left whitespace-nowrap overflow-hidden text-ellipsis",
                            isSelected
                              ? "text-th-brand font-bold"
                              : "text-th-text-primary font-normal",
                          )}
                        >
                          {c.name}
                        </span>
                        <span className="text-[12px] text-th-warm-text-muted flex-shrink-0">
                          {dialCode}
                        </span>
                        {isSelected && (
                          <div className="w-[18px] h-[18px] rounded-full bg-th-brand flex items-center justify-center flex-shrink-0">
                            <svg
                              width="9"
                              height="9"
                              viewBox="0 0 8 8"
                              fill="none"
                              className="text-th-text-inverse"
                            >
                              <path
                                d="M1.5 4l2 2L6.5 2"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
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
      <StepHeader
        kicker="Business Details"
        subtitle="Tell us about your business for verification."
      />

      <div className="w-full flex flex-col gap-4">
        <SectionCard
          icon={<Briefcase size={16} className="text-th-brand" strokeWidth={2.5} />}
          title="Company Info"
          subtitle="Your registered business identity"
          bodyGap
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Brand name" required error={errors.brandName}>
              <IconInput
                icon={<Building2 size={15} />}
                value={values.brandName}
                onChange={(v) => onChange("brandName", v)}
                placeholder="e.g. Sunset Stays"
                maxLength={50}
                error={!!errors.brandName}
              />
            </Field>

            <Field label="Legal company name" required error={errors.companyName}>
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

          <Field label="GST number" optional>
            <IconInput
              icon={<Receipt size={15} />}
              value={values.gstNumber}
              onChange={(v) => onChange("gstNumber", v.toUpperCase())}
              placeholder="e.g. 22AAAAA0000A1Z5"
              maxLength={15}
              mono
              suffix={
                <span className="pr-[14px] text-[11px] font-semibold text-th-warm-text-muted">
                  {values.gstNumber.length}/15
                </span>
              }
            />
          </Field>
        </SectionCard>

        <SectionCard
          icon={<Phone size={16} className="text-th-brand" strokeWidth={2.5} />}
          title="Contact"
          subtitle="How guests and your team can reach you"
          bodyGap
        >
          <Field label="Business email" optional error={errors.businessEmail}>
            <IconInput
              icon={<Mail size={15} />}
              value={values.businessEmail}
              onChange={(v) => onChange("businessEmail", v)}
              placeholder="e.g. hello@yourbusiness.com"
              type="email"
              error={!!errors.businessEmail}
            />
          </Field>

          <Field label="Business phone" required error={errors.businessPhone}>
            <div className="flex gap-2 items-start">
              <button
                type="button"
                onClick={() => setCountryDialogOpen(true)}
                className={cn(
                  "flex items-center gap-2 h-[52px] px-[14px]",
                  "bg-th-warm-surface border-[1.5px] rounded-[13px]",
                  "cursor-pointer flex-shrink-0 transition-all duration-150",
                  errors.businessPhone
                    ? "border-th-error-bright-soft shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
                    : "border-transparent",
                  "hover:border-th-brand hover:bg-th-brand-soft",
                )}
              >
                {selectedCountry && (Flags as any)[selectedCountry.isoCode] ? (
                  React.createElement((Flags as any)[selectedCountry.isoCode], {
                    style: { width: 20 },
                    title: selectedCountry.name,
                  })
                ) : (
                  <span className="w-[20px] h-[14px] bg-th-warm-border rounded-[3px] block" />
                )}
                <span className="text-[13.5px] font-semibold text-th-text-primary">{dialCode}</span>
                <ChevronDown size={13} className="text-th-warm-text-muted" />
              </button>

              <div className="flex-1">
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

        <SectionCard
          icon={<MapPin size={16} className="text-th-brand" strokeWidth={2.5} />}
          title="Business Address"
          subtitle="Where your business is registered"
          bodyGap
        >
          <Field label="Street address" required error={errors.businessAddress}>
            <IconInput
              icon={<MapPin size={15} />}
              value={values.businessAddress}
              onChange={(v) => onChange("businessAddress", v)}
              placeholder="e.g. 12 MG Road, Bandra West"
              error={!!errors.businessAddress}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="State" required error={errors.state}>
              <StyledSelect value={selectedState} onChange={onStateChange} error={!!errors.state}>
                <option value="" disabled>
                  Select State
                </option>
                {locationData
                  .find((c) => c.name === countryName)
                  ?.states?.map((s: any, idx: number) => (
                    <option key={idx} value={s.name}>
                      {s.name}
                    </option>
                  ))}
              </StyledSelect>
            </Field>

            <Field label="City" required error={errors.city}>
              <StyledSelect value={selectedCity} onChange={onCityChange} error={!!errors.city}>
                <option value="" disabled>
                  Select City
                </option>
                {locationData
                  .find((c) => c.name === countryName)
                  ?.states?.find((s: any) => s.name === selectedState)
                  ?.cities?.map((city: any, idx: number) => (
                    <option key={idx} value={city.name}>
                      {city.name}
                    </option>
                  ))}
              </StyledSelect>
            </Field>
          </div>

          {mapSrc && (
            <div className="rounded-[16px] overflow-hidden border-[1.5px] border-th-warm-border shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 px-4 py-[10px] bg-th-surface-0 border-b border-[1.5px] border-th-warm-border">
                <Navigation size={13} className="text-th-brand" />
                <span className="text-[12px] font-semibold text-th-text-primary">
                  {[selectedCity, selectedState].filter(Boolean).join(", ") || "Map Preview"}
                </span>
              </div>
              <iframe
                src={mapSrc}
                width="100%"
                height="220"
                className="border-0 block"
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
