import React from "react";
import { Minus, Plus, IndianRupee, Clock, Users, MapPin } from "lucide-react";

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

const SelectArrow = () => (
  <svg
    className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400"
    viewBox="0 0 16 16"
    fill="none"
  >
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const selectCls =
  "w-full h-11 px-3.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)] appearance-none transition-colors";

const inputCls =
  "w-full h-11 px-3.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)] transition-colors";

const DURATION_OPTIONS = [
  "30 minutes",
  "1 hour",
  "2 hours",
  "3 hours",
  "Half day (4 hrs)",
  "Full day (8 hrs)",
  "Multi-day",
];

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
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Pricing &amp; Location
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set your price, capacity and where the activity takes place
        </p>
      </div>

      <div className="w-full flex flex-col gap-7">
        {/* Price */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Price per person <span className="text-red-500">*</span>
          </label>
          <div
            className={`flex items-center border rounded-xl overflow-hidden focus-within:border-[var(--th-accent)] transition-colors ${
              errors.regularPrice ? "border-red-400" : "border-gray-200 dark:border-gray-600"
            }`}
          >
            <div className="flex items-center gap-1 px-3 h-11 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <IndianRupee size={13} className="text-gray-400" />
              <span className="text-xs text-gray-400">INR</span>
            </div>
            <input
              type="number"
              value={regularPrice}
              onChange={(e) => onUpdateFormData("regularPrice", e.target.value)}
              placeholder="e.g. 1500"
              className="flex-1 h-11 px-3 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none"
            />
            <span className="pr-4 text-xs text-gray-400 whitespace-nowrap">per person</span>
          </div>
          {errors.regularPrice && (
            <p className="text-xs text-red-500">{errors.regularPrice}</p>
          )}
        </div>

        {/* Person Capacity */}
        <div className="flex items-center justify-between py-4 px-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
              <Users size={17} className="text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Person Capacity</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Maximum participants per session
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onUpdateFormData("personCapacity", Math.max(1, personCapacity - 1))}
              disabled={personCapacity <= 1}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center transition-colors hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus size={14} className="text-gray-600 dark:text-gray-300" />
            </button>
            <span className="w-6 text-center text-base font-semibold text-gray-800 dark:text-white">
              {personCapacity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateFormData("personCapacity", personCapacity + 1)}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center transition-colors hover:border-gray-400"
            >
              <Plus size={14} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Time Duration */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Duration
          </label>
          <div className="relative flex items-center">
            <Clock size={15} className="absolute left-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={timeDuration}
              onChange={(e) => onUpdateFormData("timeDuration", e.target.value)}
              placeholder="e.g. 3 hours"
              list="duration-options"
              className="w-full h-11 pl-9 pr-3.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[var(--th-accent)] transition-colors"
            />
            <datalist id="duration-options">
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Location */}
        <div className="flex flex-col gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-gray-400" />
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Location
            </label>
          </div>

          <input
            type="text"
            value={address || ""}
            onChange={(e) =>
              setFormData((prev: any) => ({ ...prev, address: e.target.value }))
            }
            placeholder="Street address"
            className={inputCls}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                value={locality}
                onChange={(e) => {
                  setFormData((prev: any) => ({
                    ...prev,
                    locality: e.target.value,
                    state: "",
                    city: "",
                  }));
                }}
                className={selectCls}
              >
                <option value="India">India</option>
              </select>
              <SelectArrow />
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
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                value={state}
                onChange={(e) => {
                  setFormData((prev: any) => ({
                    ...prev,
                    state: e.target.value,
                    city: "",
                  }));
                }}
                className={selectCls}
              >
                <option value="" disabled>Select State</option>
                {locationData
                  .find((c: any) => c.name === locality)
                  ?.states?.map((s: any, idx: number) => (
                    <option key={idx} value={s.name}>{s.name}</option>
                  ))}
              </select>
              <SelectArrow />
            </div>

            <div className="relative">
              <select
                value={city}
                onChange={(e) => {
                  setFormData((prev: any) => ({ ...prev, city: e.target.value }));
                }}
                className={selectCls}
              >
                <option value="" disabled>Select City</option>
                {locationData
                  .find((country: any) => country.name === locality)
                  ?.states.find((s: any) => s.name === state)
                  ?.cities.map((c: any, idx: number) => (
                    <option key={idx} value={c.name}>{c.name}</option>
                  ))}
              </select>
              <SelectArrow />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingStep;
