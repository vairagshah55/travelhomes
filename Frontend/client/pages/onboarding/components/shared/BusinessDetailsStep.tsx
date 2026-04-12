import React from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { IoIosArrowBack } from "react-icons/io";
import { DropdownArrowSvg, type CountryOption } from "./types";

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
  // Country code picker
  selectedCountry: CountryOption | null;
  onCountrySelect: (c: CountryOption) => void;
  countryDialogOpen: boolean;
  setCountryDialogOpen: (open: boolean) => void;
  countries: CountryOption[];
  // Location dropdowns
  locationData: any[];
  selectedState: string;
  selectedCity: string;
  countryName: string;
  onStateChange: (val: string) => void;
  onCityChange: (val: string) => void;
  mapSrc?: string;
}

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
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
      <div className="text-center space-y-2">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Business Details
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tell us about your business for verification
        </p>
      </div>

      <div className="w-full flex flex-col gap-5">
        {/* Brand Name & Legal Company Name */}
        <div className="flex w-full gap-5 max-md:flex-col">
          <div className="flex-1 flex flex-col gap-3">
            <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
              Brand Name
            </label>
            <input
              type="text"
              value={values.brandName}
              onChange={(e) => onChange("brandName", e.target.value)}
              placeholder="Enter Brand Name"
              maxLength={50}
              className={`w-full h-[50px] px-3 border ${
                errors.brandName ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
              } rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)]`}
            />
            {errors.brandName && (
              <span className="text-red-500 text-xs mt-1">{errors.brandName}</span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
              Legal Company Name
            </label>
            <input
              type="text"
              value={values.companyName}
              onChange={(e) => onChange("companyName", e.target.value)}
              placeholder="Enter Company Name"
              maxLength={50}
              className={`w-full h-[50px] px-3 border ${
                errors.companyName ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
              } rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)]`}
            />
            {errors.companyName && (
              <span className="text-red-500 text-xs mt-1">{errors.companyName}</span>
            )}
          </div>
        </div>

        {/* GST Number & Business Email */}
        <div className="flex w-full gap-5 max-md:flex-col">
          <div className="flex-1 flex flex-col gap-3">
            <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
              GST Number
            </label>
            <input
              type="text"
              value={values.gstNumber}
              onChange={(e) => onChange("gstNumber", e.target.value)}
              placeholder=" GST Number (Optional)"
              maxLength={15}
              className="w-full h-[50px] px-3 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)]"
            />
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
              Business Email ID
            </label>
            <input
              type="email"
              value={values.businessEmail}
              onChange={(e) => onChange("businessEmail", e.target.value)}
              placeholder="Enter Business Email ID (Optional)"
              className={`w-full h-[50px] px-3 border ${
                errors.businessEmail ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
              } rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)]`}
            />
            {errors.businessEmail && (
              <span className="text-red-500 text-xs mt-1">{errors.businessEmail}</span>
            )}
          </div>
        </div>

        {/* Business Phone Number */}
        <div className="flex flex-col gap-3">
          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
            Business Phone number
          </label>
          <div className="flex gap-3">
            <div onClick={() => setCountryDialogOpen(true)} className="cursor-pointer">
              {selectedCountry && (
                <span className="flex h-[50px] items-center px-5 py-2 border rounded-xl gap-2 text-base text-[#717171] font-['Plus_Jakarta_Sans']">
                  {React.createElement((Flags as any)[selectedCountry.isoCode], {
                    title: selectedCountry.name,
                    style: { width: "24px" },
                  })}
                  {selectedCountry.dialCode?.charAt(0) !== "+"
                    ? `+${selectedCountry.dialCode}`
                    : selectedCountry.dialCode}
                </span>
              )}
            </div>

            <Dialog open={countryDialogOpen} onClose={() => setCountryDialogOpen(false)}>
              <DialogBackdrop
                transition
                className="inset-0 data-closed:opacity-1 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
              />
              <div className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50">
                <DialogPanel className="w-[150px] shadow-md bg-[#f9fafc] shadow-[#717171] h-[330px] scrollbar-hide rounded-xl px-4 max-h-[80%] overflow-y-auto">
                  <button
                    onClick={() => setCountryDialogOpen(false)}
                    className="fixed w-auto bg-[#f9fafc] p-3 text-[#717171] text-[16px]"
                  >
                    <span className="font-[22px] flex gap-0 items-center">
                      <IoIosArrowBack size={24} />
                      Back
                    </span>
                  </button>
                  <ul className="mt-6 py-5">
                    {countries.map((c) => (
                      <li
                        key={c.isoCode}
                        onClick={() => {
                          onCountrySelect(c);
                          setCountryDialogOpen(false);
                        }}
                        className="flex items-center rounded-[5px] text-[#717171] text-sm font-normal px-3 py-2 cursor-pointer"
                      >
                        {React.createElement((Flags as any)[c.isoCode], {
                          title: c.name,
                          style: { width: "25px", marginRight: "12px" },
                        })}{" "}
                        {c.dialCode?.charAt(0) !== "+" ? `+${c.dialCode}` : c.dialCode}
                      </li>
                    ))}
                  </ul>
                </DialogPanel>
              </div>
            </Dialog>

            <input
              type="text"
              value={values.businessPhone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                onChange("businessPhone", value);
              }}
              maxLength={10}
              className={`w-full h-[50px] px-3 border ${
                errors.businessPhone ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
              } rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)]`}
              placeholder="Mobile Number"
            />
          </div>
          {errors.businessPhone && (
            <span className="text-red-500 text-xs mt-1">{errors.businessPhone}</span>
          )}
        </div>
      </div>

      <div className="w-full flex flex-col gap-3">
        <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
          Business Address
        </label>
        <input
          type="text"
          className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)]"
          placeholder="Business Address"
        />
        <div className="flex gap-5 max-md:flex-wrap">
          <div className="w-full relative">
            <select
              name="Country"
              value="India"
              disabled
              className="w-full h-[50px] px-3 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-gray-100 dark:bg-gray-700 cursor-not-allowed appearance-none"
            >
              <option value="India">India</option>
            </select>
            <DropdownArrowSvg />
          </div>

          <div className="w-full relative">
            <select
              name="state"
              value={selectedState}
              onChange={(e) => onStateChange(e.target.value)}
              className="w-full h-[50px] px-3 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)] appearance-none"
            >
              <option value="" disabled>
                Select State
              </option>
              {locationData
                .find((c) => c.name === countryName)
                ?.states?.map((state: any, idx: number) => (
                  <option key={idx} value={state.name}>
                    {state.name}
                  </option>
                ))}
            </select>
            <DropdownArrowSvg />
            {errors.state && (
              <span className="text-red-500 text-xs mt-1 block">{errors.state}</span>
            )}
          </div>

          <div className="w-full relative">
            <select
              name="city"
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="w-full h-[50px] px-3 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)] appearance-none"
            >
              <option value="" disabled>
                Select City
              </option>
              {locationData
                .find((country) => country.name === countryName)
                ?.states.find((state: any) => state.name === selectedState)
                ?.cities.map((city: any, idx: number) => (
                  <option key={idx} value={city.name}>
                    {city.name}
                  </option>
                ))}
            </select>
            <DropdownArrowSvg />
            {errors.city && (
              <span className="text-red-500 text-xs mt-1 block">{errors.city}</span>
            )}
          </div>

          <div className="flex flex-col flex-1">
            <input
              type="text"
              value={values.pincode}
              onChange={(e) => onChange("pincode", e.target.value.replace(/\D/g, ""))}
              placeholder="Pincode"
              maxLength={6}
              inputMode="numeric"
              className={`flex-1 h-[50px] px-3 py-3 border ${
                errors.businessPincode ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
              } rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)]`}
            />
            {errors.businessPincode && (
              <span className="text-red-500 text-xs mt-1">{errors.businessPincode}</span>
            )}
          </div>
        </div>

        {/* Map */}
        {mapSrc && (
          <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <iframe
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Selected Location Map"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDetailsStep;
