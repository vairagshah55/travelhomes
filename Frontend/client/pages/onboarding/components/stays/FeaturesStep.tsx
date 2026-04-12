import React from "react";
import { Plus, X } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface FeatureItem {
  label: string;
  value: string;
  icon: string | React.ComponentType<any>;
}

interface FeaturesStepProps {
  selectedFeatures: string[];
  toggleFeatureSelection: (featureId: string) => void;
  adminFeatures: any[];
  customFeatures: string[];
  setCustomFeatures: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedFeatures: React.Dispatch<React.SetStateAction<string[]>>;
  showCustomFeaturesInput: boolean;
  setShowCustomFeaturesInput: (show: boolean) => void;
  customFeatureInput: string;
  setCustomFeatureInput: (val: string) => void;
  featuresData: FeatureItem[];
  errors: Record<string, string>;
}

const FeaturesStep: React.FC<FeaturesStepProps> = ({
  selectedFeatures,
  toggleFeatureSelection,
  adminFeatures,
  customFeatures,
  setCustomFeatures,
  setSelectedFeatures,
  showCustomFeaturesInput,
  setShowCustomFeaturesInput,
  customFeatureInput,
  setCustomFeatureInput,
  featuresData,
  errors,
}) => {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
      <div className="text-center space-y-2">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Features
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select the amenities and features your property offers
        </p>
      </div>

      <div className="w-full flex flex-col gap-6">
        <div className="flex flex-wrap gap-2.5">
          {/* Dynamic property-based features */}
          {featuresData
            .filter((f) => f.value !== "others")
            .map((feature, idx) => {
              const isSelected = selectedFeatures.includes(feature.value);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleFeatureSelection(feature.value)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border-2 transition-all duration-200 ${
                    isSelected
                      ? "onb-pill-selected"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {typeof feature.icon === "string" ? (
                      <span>{feature.icon}</span>
                    ) : (
                      <feature.icon
                        size={16}
                        className={
                          isSelected
                            ? "text-black dark:text-white"
                            : "text-gray-500 dark:text-gray-400"
                        }
                      />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors ${
                      isSelected
                        ? "text-black dark:text-white"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {feature.label}
                  </span>
                </button>
              );
            })}

          {/* Admin Features */}
          {adminFeatures.map((feature, idx) => {
            const isSelected = selectedFeatures.includes(feature.name);
            return (
              <button
                key={feature.id || idx}
                type="button"
                onClick={() => toggleFeatureSelection(feature.name)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border-2 transition-all duration-200 ${
                  isSelected
                    ? "onb-pill-selected"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <div className="w-5 h-5">
                  <img
                    src={getImageUrl(feature.icon)}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
                <span
                  className={`text-sm font-medium transition-colors ${
                    isSelected
                      ? "text-black dark:text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {feature.name}
                </span>
              </button>
            );
          })}

          {/* Custom Features */}
          {customFeatures.map((feature, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCustomFeatures((prev) => prev.filter((_, i) => i !== idx));
                setSelectedFeatures((prev) => prev.filter((f) => f !== feature));
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border-2 border-black dark:border-white bg-gray-50 dark:bg-gray-800"
            >
              <span className="text-sm font-medium text-black dark:text-white">
                {feature}
              </span>
              <X size={14} className="text-gray-500" />
            </button>
          ))}

          {/* Others Button */}
          <button
            type="button"
            onClick={() => setShowCustomFeaturesInput(!showCustomFeaturesInput)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all duration-200 ${
              showCustomFeaturesInput
                ? "border-black dark:border-white bg-gray-50 dark:bg-gray-800"
                : "border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
          >
            <Plus size={14} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Other
            </span>
          </button>
        </div>

        {errors.features && (
          <p className="text-xs text-red-500">{errors.features}</p>
        )}

        {/* Custom Feature Input */}
        {showCustomFeaturesInput && (
          <div className="flex gap-2">
            <input
              type="text"
              value={customFeatureInput}
              onChange={(e) => setCustomFeatureInput(e.target.value)}
              placeholder="Add custom feature"
              className="flex-1 h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
            />
            <button
              type="button"
              onClick={() => {
                if (
                  customFeatureInput.trim() &&
                  !selectedFeatures.includes(customFeatureInput)
                ) {
                  setCustomFeatures((prev) => [
                    ...prev,
                    customFeatureInput.trim(),
                  ]);
                  setSelectedFeatures((prev) => [
                    ...prev,
                    customFeatureInput.trim(),
                  ]);
                  setCustomFeatureInput("");
                }
              }}
              className="h-10 px-6 text-sm font-medium rounded-lg hover:brightness-110 transition-all duration-200"
              style={{
                backgroundColor: "var(--th-accent)",
                color: "var(--th-accent-fg)",
              }}
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturesStep;
