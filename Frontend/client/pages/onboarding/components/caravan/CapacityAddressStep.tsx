import React from "react";

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
    <div className="w-full flex flex-col gap-9">
      <h1 className="text-[32px] font-bold text-black dark:text-white font-sanse text-center">
        Caravan Capacity and Address
      </h1>

      <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
        {/* Seating Capacity */}
        <div className="flex items-center justify-between py-3 px-3">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-black dark:text-white font-['Plus_Jakarta_Sans']">
              Seating Capacity
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onAdjustCapacity("seating", "decrease")}
              className="w-[30px] h-[30px] flex items-center justify-center rounded-full border border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.3337 8H2.66699"
                  stroke="#666666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="text-base text-[#334054] dark:text-gray-300 font-medium font-['Plus_Jakarta_Sans']">
              {seatingCapacity}
            </span>
            <button
              onClick={() => onAdjustCapacity("seating", "increase")}
              className="w-[30px] h-[30px] flex items-center justify-center rounded-full border border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.00033 2.66666V13.3333M13.3337 7.99999L2.66699 7.99999"
                  stroke="#666666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <hr className="border-[#EAECF0] dark:border-gray-600" />

        {/* Sleeping Capacity */}
        <div className="flex items-center justify-between py-3 px-3">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-black dark:text-white font-['Plus_Jakarta_Sans']">
              Sleeping Capacity
            </h3>
            <p className="text-sm text-[#334054] dark:text-gray-400 font-['Plus_Jakarta_Sans'] leading-[150%]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit,
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onAdjustCapacity("sleeping", "decrease")}
              className="w-[30px] h-[30px] flex items-center justify-center rounded-full border border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.3337 8H2.66699"
                  stroke="#666666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="text-base text-[#334054] dark:text-gray-300 font-medium font-['Plus_Jakarta_Sans']">
              {sleepingCapacity}
            </span>
            <button
              onClick={() => onAdjustCapacity("sleeping", "increase")}
              className="w-[30px] h-[30px] flex items-center justify-center rounded-full border border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.00033 2.66666V13.3333M13.3337 7.99999L2.66699 7.99999"
                  stroke="#666666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <hr className="border-[#EAECF0] dark:border-gray-600" />

        {/* Address */}
        <div className="flex flex-col gap-5">
         <div className="flex flex-col gap-2 pl-1">
  <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
    Address
  </label>
 <input
  type="text"
  placeholder="Enter your address"
  value={address}
  onChange={(e) => onAddressChange(e.target.value)}
  className="w-full px-4 py-3 rounded-lg border border-[#EAECF0]"
/>

</div>
            <div className="w-full flex flex-col gap-5">
          <div className="w-full flex justify-between gap-5 md:items-center max-md:flex-col">
            <div className="flex-1 relative">
              <select
                name="country"
                value={locality}
                onChange={(e) => onLocalityChange(e.target.value)}
                className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)] appearance-none"
              >
                <option value="India">
                  India
                </option>
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
                onChange={(e) => onStateChange(e.target.value)}
                className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)] appearance-none"
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
                onChange={(e) => onCityChange(e.target.value)}
                className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)] appearance-none"
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
  onChange={(e) => onPincodeChange(e.target.value.replace(/\D/g, ""))}
  maxLength={6}
  inputMode="numeric"
  placeholder="Pincode"
  className="flex-1 h-[50px] px-3 max-md:py-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)]"
/>

          </div>
        </div>
        </div>

       {/* Map Integration */}
          <div className="h-96 max-md:mb-14 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
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

      </div>
    </div>
  );
};

export default CapacityAddressStep;
