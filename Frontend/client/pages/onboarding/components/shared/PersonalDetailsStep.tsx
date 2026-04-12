import React from "react";
import { getImageUrl } from "@/lib/utils";
import { DropdownArrowSvg, UploadPlusSvg } from "./types";

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
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
      <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white font-geist leading-normal text-center">
        Personal Details
      </h1>

      <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
        {/* First Name & Last Name */}
        <div className="flex gap-5 max-md:flex-col">
          <div className="flex-1 flex flex-col gap-3">
            <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
              First Name
            </label>
            <input
              type="text"
              value={values.firstName}
              onChange={(e) => onChange("firstName", e.target.value)}
              placeholder="Enter Your First Name"
              maxLength={30}
              className={`w-full h-[50px] px-3 border ${
                errors.firstName ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
              } rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)]`}
            />
            {errors.firstName && (
              <span className="text-red-500 text-xs mt-1">{errors.firstName}</span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
              Last Name
            </label>
            <input
              type="text"
              value={values.lastName}
              onChange={(e) => onChange("lastName", e.target.value)}
              placeholder="Enter Your Last Name"
              maxLength={30}
              className={`w-full h-[50px] px-3 border ${
                errors.lastName ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
              } rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)]`}
            />
            {errors.lastName && (
              <span className="text-red-500 text-xs mt-1">{errors.lastName}</span>
            )}
          </div>
        </div>

        {/* Personal Address */}
        <div className="flex flex-col gap-3">
          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
            Personal Address
          </label>
          <div className="flex max-md:flex-wrap gap-5">
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
              {errors.personalState && (
                <span className="text-red-500 text-xs mt-1 block">{errors.personalState}</span>
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
              {errors.personalCity && (
                <span className="text-red-500 text-xs mt-1 block">{errors.personalCity}</span>
              )}
            </div>

            <div className="flex-1 flex flex-col">
              <input
                type="text"
                value={values.pincode}
                onChange={(e) => onChange("pincode", e.target.value.replace(/\D/g, ""))}
                placeholder="Pincode"
                maxLength={6}
                className={`flex-1 h-[50px] px-3 border ${
                  errors.personalPincode ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
                } rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)]`}
              />
              {errors.personalPincode && (
                <span className="text-red-500 text-xs mt-1">{errors.personalPincode}</span>
              )}
            </div>
          </div>
        </div>

        {/* Date of Birth & Marital Status */}
        <div className="flex gap-5">
          <div className="flex-1 flex flex-col gap-3">
            <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={values.dateOfBirth}
              onChange={(e) => onChange("dateOfBirth", e.target.value)}
              className={`w-full h-[50px] px-3 border ${
                errors.dateOfBirth ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
              } rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)]`}
            />
            {errors.dateOfBirth && (
              <span className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
              Marital Status
            </label>
            <div className="relative">
              <select
                value={values.maritalStatus}
                onChange={(e) => onChange("maritalStatus", e.target.value)}
                className={`w-full h-[50px] px-3 border ${
                  errors.maritalStatus ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
                } rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)] appearance-none`}
              >
                <option value="">Select</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
              </select>
              <DropdownArrowSvg />
            </div>
            {errors.maritalStatus && (
              <span className="text-red-500 text-xs mt-1">{errors.maritalStatus}</span>
            )}
          </div>
        </div>

        {/* ID Proof */}
        <div className="flex flex-col gap-3">
          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
            ID Proof
          </label>
          <div className="relative">
            <select
              value={values.idProof}
              onChange={(e) => onChange("idProof", e.target.value)}
              className={`w-full h-[50px] px-3 border ${
                errors.idProof ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
              } rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[var(--th-accent)] appearance-none`}
            >
              <option value="">Select</option>
              <option value="aadhar">Aadhar Card</option>
              <option value="passport">Passport</option>
              <option value="driving_license">Driving License</option>
            </select>
            <DropdownArrowSvg />
          </div>
          {errors.idProof && (
            <span className="text-red-500 text-xs mt-1">{errors.idProof}</span>
          )}
        </div>

        {/* ID Photos */}
        <div className="flex flex-col gap-5">
          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
            ID Photos
          </label>
          <div className="w-[242px] max-md:w-full h-[175px] flex flex-col items-center justify-center gap-4 bg-[#F9FAFB] dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 relative overflow-hidden">
            {idProofImage ? (
              <img
                src={getImageUrl(idProofImage)}
                alt="ID Proof"
                className="w-full h-full object-cover absolute top-0 left-0"
              />
            ) : (
              <>
                <UploadPlusSvg />
                <span className="text-sm text-black font-['Plus_Jakarta_Sans'] z-1">
                  Upload Here
                </span>
              </>
            )}

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={onIdProofUpload}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
                left: 0,
                top: 0,
                zIndex: 10,
              }}
            />

            {uploadError && (
              <span className="text-xs text-red-500 mt-2 z-20 bg-white px-1 rounded absolute bottom-2">
                {uploadError}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsStep;
