import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Minus, ChevronDown } from "lucide-react";

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
}

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
}) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full h-full">
      <h1 className="text-3xl font-bold text-black dark:text-white text-center">
        Pricing Details
      </h1>

      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Regular Price */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pl-1">
            <Label className="text-base text-[#334054]">
              Regular Price (in Rupees)
            </Label>
          </div>
          <Input
            type="number"
            value={regularPrice}
            onChange={(e) => onUpdateFormData("regularPrice", e.target.value)}
            placeholder=" e.g., 1500"
            className={`border ${errors.regularPrice ? "border-red-500" : "border-gray-200"}`}
          />
          {errors.regularPrice && (
            <p className="text-sm text-red-500 pl-1">{errors.regularPrice}</p>
          )}
        </div>

        {/* Person Capacity */}
        <div className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="text-base font-semibold text-black">
                Person Capacity
              </div>
              <div className="text-sm text-[#334054]">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit,
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  onUpdateFormData(
                    "personCapacity",
                    Math.max(1, personCapacity - 1),
                  )
                }
                className="w-8 h-8 border border-gray-200 rounded-full flex items-center justify-center"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-base text-[#334054] w-4 text-center">
                {personCapacity}
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateFormData(
                    "personCapacity",
                    personCapacity + 1,
                  )
                }
                className="w-8 h-8 border border-gray-200 rounded-full flex items-center justify-center"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Time Duration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pl-1">
            <Label className="text-base text-[#334054]">
              Time Duration
            </Label>
          </div>
          <div className="relative border border-gray-200 rounded-lg">
            <Input
              value={timeDuration}
              onChange={(e) => onUpdateFormData("timeDuration", e.target.value)}
              className="border-0 pr-10"
              placeholder="1 hour"
            />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Address with Country (India only) */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 pl-1">
            <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
              Address
            </label>

            <input
              type="text"
              placeholder="Enter your address"
              value={address || ""}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-lg border border-[#EAECF0]"
            />
          </div>

          <div className="w-full flex flex-col gap-5">
            <div className="w-full flex justify-between gap-5 md:items-center max-md:flex-col">
              <div className="flex-1 relative">
                <select
                  name="country"
                  value={locality}
                  onChange={(e) => {
                    const countryVal = e.target.value;
                    setFormData((prev: any) => ({
                      ...prev,
                      locality: countryVal,
                      state: "",
                      city: "",
                    }));
                  }}
                  className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)] appearance-none"
                >
                  <option value="India">India</option>
                </select>
                <svg
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                    stroke="#292D32"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex-1 relative">
                <select
                  name="state"
                  value={state}
                  onChange={(e) => {
                    const stateVal = e.target.value;
                    setFormData((prev: any) => ({
                      ...prev,
                      state: stateVal,
                      city: "",
                    }));
                  }}
                  className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)] appearance-none"
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
                </select>
                <svg
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                    stroke="#292D32"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex-1 relative">
                <select
                  name="city"
                  value={city}
                  onChange={(e) => {
                    const cityVal = e.target.value;
                    setFormData((prev: any) => ({
                      ...prev,
                      city: cityVal,
                    }));
                  }}
                  className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)] appearance-none"
                >
                  <option value="" disabled>
                    Select City
                  </option>
                  {locationData
                    .find((country: any) => country.name === locality)
                    ?.states.find((s: any) => s.name === state)
                    ?.cities.map((c: any, idx: number) => (
                      <option key={idx} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
                <svg
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                    stroke="#292D32"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <input
                type="text"
                value={pincode}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    pincode: e.target.value.replace(/\D/g, ""),
                  }))
                }
                maxLength={6}
                inputMode="numeric"
                placeholder="Pincode"
                className="flex-1 h-[50px] px-3 py-3 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingStep;
