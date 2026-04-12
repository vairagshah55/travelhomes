import React from "react";
import { Plus, X } from "lucide-react";

type PriceField = "perKmIncludes" | "perKmExcludes" | "perDayIncludes" | "perDayExcludes";

interface PricingStepProps {
  perKmCharge: string;
  perDayCharge: string;
  perKmIncludes: string[];
  perKmExcludes: string[];
  perDayIncludes: string[];
  perDayExcludes: string[];
  errors: Record<string, string>;
  onPerKmChargeChange: (value: string) => void;
  onPerDayChargeChange: (value: string) => void;
  onAddPriceItem: (field: PriceField) => void;
  onUpdatePriceItem: (field: PriceField, index: number, value: string) => void;
  onRemovePriceItem: (field: PriceField, index: number) => void;
  clearError: (field: string) => void;
}

const PricingStep: React.FC<PricingStepProps> = ({
  perKmCharge,
  perDayCharge,
  perKmIncludes,
  perKmExcludes,
  perDayIncludes,
  perDayExcludes,
  errors,
  onPerKmChargeChange,
  onPerDayChargeChange,
  onAddPriceItem,
  onUpdatePriceItem,
  onRemovePriceItem,
  clearError,
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-9">
      <h1 className="text-[32px] font-bold text-black dark:text-white font-sanse text-center">
        Pricing Details
      </h1>

      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        {/* Pricing section */}
        <div className="w-full flex flex-col gap-10 justify-center items-start">
          <div className="w-full flex flex-col gap-4">
            <div className="w-full flex items-center gap-2 pl-1">
              <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                Per Kilometer(KM) Charge
              </label>
            </div>
            <div className="w-full flex items-center gap-2 pl-3">
              {/* Name */}
              <div className="flex flex-col gap-2 w-full">
                <div className="relative w-full ">
                  <input
                    type="number"
                    value={perKmCharge}
                    onChange={(e) => {
                      onPerKmChargeChange(e.target.value);
                      if (errors.perKmCharge) {
                        clearError("perKmCharge");
                      }
                    }}
                    placeholder="Enter price per km"
                    className={`w-full h-[50px] px-3 py-4 border ${
                      errors.perKmCharge ? "border-red-500" : "border-[#EAECF0]"
                    } rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[var(--th-accent)] dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
                  />
                  {errors.perKmCharge && (
                    <span className="text-xs text-red-500 mt-1">
                      {errors.perKmCharge}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Above price includes */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pl-1 flex-1">
                <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                  Above price includes
                </label>
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
              {perKmIncludes.map((item, index) => (
                <div className="w-full flex items-center gap-2" key={index}>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      onUpdatePriceItem(
                        "perKmIncludes",
                        index,
                        e.target.value
                      )
                    }
                    placeholder="Text here.."
                    maxLength={250}
                    className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[var(--th-accent)] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={() => onRemovePriceItem("perKmIncludes", index)}
                    className="w-[50px] h-[50px] p-3 bg-gray-200 rounded-lg flex items-center justify-center"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => onAddPriceItem("perKmIncludes")}
                className="flex items-center gap-2 px-3 py-2 rounded-[60px]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm text-[var(--th-accent)] font-sanse font-normal tracking-[-0.28px] leading-[160%]">
                  Add More
                </span>
              </button>
              {errors.perKmIncludes && (
                <span className="text-xs text-red-500">
                  {errors.perKmIncludes}
                </span>
              )}
            </div>
          </div>

          {/* Above price excludes */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pl-1 flex-1">
                <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                  Above price excludes
                </label>
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
              {perKmExcludes.map((item, index) => (
                <div className="w-full flex items-center gap-2" key={index}>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      onUpdatePriceItem(
                        "perKmExcludes",
                        index,
                        e.target.value
                      )
                    }
                    placeholder="Text here.."
                    maxLength={250}
                    className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[var(--th-accent)] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={() => onRemovePriceItem("perKmExcludes", index)}
                    className="w-[50px] h-[50px] p-3 bg-gray-200 rounded-lg flex items-center justify-center"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => onAddPriceItem("perKmExcludes")}
                className="flex items-center gap-2 px-3 py-2 rounded-[60px]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm text-[var(--th-accent)] font-sanse font-normal tracking-[-0.28px] leading-[160%]">
                  Add More
                </span>
              </button>
              {errors.perKmExcludes && (
                <span className="text-xs text-red-500">
                  {errors.perKmExcludes}
                </span>
              )}
            </div>
          </div>
          <div className="w-full flex flex-col gap-4 ">
            <div className="w-full flex items-center gap-2 pl-1">
              <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                Per Day Kilometer(KM) Charge
              </label>
            </div>
            <div className="w-full flex items-center gap-2 pl-3">
              <div className="w-full flex flex-col gap-2">
                <div className="relative w-full ">
                  <input
                    type="number"
                    value={perDayCharge}
                    onChange={(e) => {
                      onPerDayChargeChange(e.target.value);
                      if (errors.perDayCharge) {
                        clearError("perDayCharge");
                      }
                    }}
                    placeholder="Enter price per day"
                    className={`w-full h-[50px] px-3 py-4 border ${
                      errors.perDayCharge
                        ? "border-red-500"
                        : "border-[#EAECF0]"
                    } rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[var(--th-accent)] dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
                  />
                  {errors.perDayCharge && (
                    <span className="text-xs text-red-500 mt-1">
                      {errors.perDayCharge}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Above price includes */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pl-1 flex-1">
                <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                  Above price includes
                </label>
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
              {perDayIncludes.map((item, index) => (
                <div className="w-full flex items-center gap-2" key={index}>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      onUpdatePriceItem(
                        "perDayIncludes",
                        index,
                        e.target.value
                      )
                    }
                    placeholder="Text here.."
                    maxLength={250}
                    className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[var(--th-accent)] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={() => onRemovePriceItem("perDayIncludes", index)}
                    className="w-[50px] h-[50px] p-3 bg-gray-200 rounded-lg flex items-center justify-center"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => onAddPriceItem("perDayIncludes")}
                className="flex items-center gap-2 px-3 py-2 rounded-[60px]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm text-[var(--th-accent)] font-sanse font-normal tracking-[-0.28px] leading-[160%]">
                  Add More
                </span>
              </button>
              {errors.perDayIncludes && (
                <span className="text-xs text-red-500">
                  {errors.perDayIncludes}
                </span>
              )}
            </div>
          </div>

          {/* Above price excludes */}
          <div className="w-full flex flex-col gap-4 max-md:mb-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pl-1 flex-1">
                <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                  Above price excludes
                </label>
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
              {perDayExcludes.map((item, index) => (
                <div className="w-full flex items-center gap-2" key={index}>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      onUpdatePriceItem(
                        "perDayExcludes",
                        index,
                        e.target.value
                      )
                    }
                    placeholder="Text here.."
                    maxLength={250}
                    className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[var(--th-accent)] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={() => onRemovePriceItem("perDayExcludes", index)}
                    className="w-[50px] h-[50px] p-3 bg-gray-200 rounded-lg flex items-center justify-center"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => onAddPriceItem("perDayExcludes")}
                className="flex items-center gap-2 px-3 py-2 rounded-[60px]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm text-[var(--th-accent)] font-sanse font-normal tracking-[-0.28px] leading-[160%]">
                  Add More
                </span>
              </button>
              {errors.perDayExcludes && (
                <span className="text-xs text-red-500">
                  {errors.perDayExcludes}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingStep;
