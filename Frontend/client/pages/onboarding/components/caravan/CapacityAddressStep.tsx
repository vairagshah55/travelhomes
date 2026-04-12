import React from "react";
import { Users, BedDouble, Minus, Plus, MapPin } from "lucide-react";

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
  onAdjustCapacity: (type: "seating" | "sleeping", direction: "increase" | "decrease") => void;
  onAddressChange: (value: string) => void;
  onLocalityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onPincodeChange: (value: string) => void;
}

interface CapacityRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
}

const CapacityRow: React.FC<CapacityRowProps> = ({
  icon,
  label,
  description,
  value,
  onDecrease,
  onIncrease,
  min = 1,
}) => (
  <div className="flex items-center justify-between py-4 px-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-white">{label}</p>
        {description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onDecrease}
        disabled={value <= min}
        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center transition-colors hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus size={14} className="text-gray-600 dark:text-gray-300" />
      </button>
      <span className="w-6 text-center text-base font-semibold text-gray-800 dark:text-white">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center transition-colors hover:border-gray-400"
      >
        <Plus size={14} className="text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  </div>
);

const SelectArrow = () => (
  <svg
    className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
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
  onAdjustCapacity,
  onAddressChange,
  onLocalityChange,
  onStateChange,
  onCityChange,
  onPincodeChange,
}) => {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Capacity &amp; Location
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set your caravan's capacity and where guests can find it
        </p>
      </div>

      <div className="w-full flex flex-col gap-8">
        {/* Capacity Section */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Capacity
          </label>
          <CapacityRow
            icon={<Users size={17} className="text-gray-500 dark:text-gray-400" />}
            label="Seating Capacity"
            description="Guests who can sit during the journey"
            value={seatingCapacity}
            onDecrease={() => onAdjustCapacity("seating", "decrease")}
            onIncrease={() => onAdjustCapacity("seating", "increase")}
          />
          <CapacityRow
            icon={<BedDouble size={17} className="text-gray-500 dark:text-gray-400" />}
            label="Sleeping Capacity"
            description="Guests who can sleep overnight"
            value={sleepingCapacity}
            onDecrease={() => onAdjustCapacity("sleeping", "decrease")}
            onIncrease={() => onAdjustCapacity("sleeping", "increase")}
          />
        </div>

        {/* Address Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-gray-400" />
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Location
            </label>
          </div>

          {/* Street Address */}
          <input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Street address"
            className={inputCls}
          />

          {/* Country / State / City / Pincode */}
          <div className="grid grid-cols-2 gap-3">
            {/* Country */}
            <div className="relative">
              <select
                value={locality}
                onChange={(e) => onLocalityChange(e.target.value)}
                className={selectCls}
              >
                <option value="India">India</option>
              </select>
              <SelectArrow />
            </div>

            {/* Pincode */}
            <input
              type="text"
              value={pincode}
              onChange={(e) => onPincodeChange(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              inputMode="numeric"
              placeholder="Pincode"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* State */}
            <div className="relative">
              <select
                value={state}
                onChange={(e) => onStateChange(e.target.value)}
                className={selectCls}
              >
                <option value="" disabled>
                  Select State
                </option>
                {locationData
                  .find((c: any) => c.name === locality)
                  ?.states?.map((st: any, idx: number) => (
                    <option key={idx} value={st.name}>
                      {st.name}
                    </option>
                  ))}
              </select>
              <SelectArrow />
            </div>

            {/* City */}
            <div className="relative">
              <select
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
                className={selectCls}
              >
                <option value="" disabled>
                  Select City
                </option>
                {locationData
                  .find((country: any) => country.name === locality)
                  ?.states.find((st: any) => st.name === state)
                  ?.cities.map((ct: any, idx: number) => (
                    <option key={idx} value={ct.name}>
                      {ct.name}
                    </option>
                  ))}
              </select>
              <SelectArrow />
            </div>
          </div>
        </div>

        {/* Map */}
        {mapSrc && (
          <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 h-64">
            <iframe
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
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
