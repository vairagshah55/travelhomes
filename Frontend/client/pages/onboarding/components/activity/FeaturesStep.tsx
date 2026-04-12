import React from "react";
import { MoreHorizontal, X } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { IconType } from "react-icons";

interface FeatureItem {
  label: string;
  value: string;
  icon: IconType;
}

interface FeaturesStepProps {
  selectedActivities: string[];
  selectedFeatures: string[];
  activityFeatures: FeatureItem[];
  activityFeatureMap: { [key: string]: string[] };
  adminFeatures: any[];
  customFeatures: string[];
  showCustomFeaturesInput: boolean;
  customFeatureInput: string;
  onToggleFeature: (featureId: string) => void;
  onRemoveCustomFeature: (index: number) => void;
  onSetShowCustomFeaturesInput: (show: boolean) => void;
  onSetCustomFeatureInput: (value: string) => void;
  onAddCustomFeature: (feature: string) => void;
}

const FeaturesStep: React.FC<FeaturesStepProps> = ({
  selectedActivities,
  selectedFeatures,
  activityFeatures,
  activityFeatureMap,
  adminFeatures,
  customFeatures,
  showCustomFeaturesInput,
  customFeatureInput,
  onToggleFeature,
  onRemoveCustomFeature,
  onSetShowCustomFeaturesInput,
  onSetCustomFeatureInput,
  onAddCustomFeature,
}) => {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
      <div className="text-center ">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Activity Features
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
          {selectedActivities.length > 0
            ? `Select features for your ${selectedActivities.length === 1 ? "activity" : "activities"}`
            : "Select features for your activity"}
        </p>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col gap-6 w-full">
        {/* All features section with custom features displayed first */}
        <div className="space-y-4 ">
          <div className="flex gap-3  max-md:flex-col items-center justify-between">
            {selectedActivities.length > 0 ? (
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                  Select Features
                </h3>
                <span className="text-xs bg-gray-100 dark:bg-gray-400 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                  Based on your selection
                </span>
              </div>
            ) : (
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                All Features
              </h3>
            )}
            {!showCustomFeaturesInput && customFeatures.length < 20 && (
              <button
                onClick={() => onSetShowCustomFeaturesInput(true)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700"
              >
                + Add Custom Feature
              </button>
            )}
          </div>

          {/* Features display: custom features first, then standard features */}
          <div className="flex flex-wrap gap-3">
            {/* Custom features */}
            {customFeatures.map((customFeature, idx) => (
              <button
                key={`custom-${idx}`}
                onClick={() => onRemoveCustomFeature(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-[48px] border transition-all duration-200 onb-card ${
                  selectedFeatures.includes(customFeature)
                    ? "onb-pill-selected"
                    : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[var(--th-accent)]"
                }`}
              >
                <div className="w-[22px] h-[22px]">
                  <MoreHorizontal size={16} className="text-gray-600" />
                </div>
                <span className="text-base max-sm:text-xs text-[#4B4B4B] dark:text-gray-300 font-medium">
                  {customFeature}
                </span>
                <X
                  size={14}
                  className="text-gray-600 hover:text-red-500"
                />
              </button>
            ))}

            {/* Standard features */}
            {activityFeatures.map((feature, idx) => {
              const isRecommended =
                selectedActivities.length > 0 &&
                selectedActivities.some((actId) =>
                  activityFeatureMap[actId]?.includes(feature.value),
                );
              return (
                <button
                  key={idx}
                  onClick={() => onToggleFeature(feature.value)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-[48px] border transition-all duration-200 onb-card ${
                    selectedFeatures.includes(feature.value)
                      ? "onb-pill-selected"
                      : isRecommended
                        ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20 hover:border-gray-500"
                        : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[var(--th-accent)]"
                  }`}
                >
                  <div className="w-[22px] h-[22px]">
                    <feature.icon
                      size={18}
                      className={`${isRecommended ? "text-gray-600" : "text-gray-600"}`}
                    />
                  </div>
                  <span className="text-base max-sm:text-xs text-[#4B4B4B] dark:text-gray-300 font-medium">
                    {feature.label}
                  </span>
                  {isRecommended && (
                    <span className="text-xs bg-gray-600 text-white px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                </button>
              );
            })}

            {/* Admin Features */}
            {adminFeatures.map((feature, idx) => (
              <button
                key={feature.id || `admin-${idx}`}
                onClick={() => onToggleFeature(feature.name)}
                className={`flex items-center gap-3 px-4 py-2 rounded-[48px] border transition-all duration-200 onb-card ${
                  selectedFeatures.includes(feature.name)
                    ? "onb-pill-selected"
                    : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[var(--th-accent)]"
                }`}
              >
                <div className="w-[22px] h-[22px]">
                  <img src={getImageUrl(feature.icon)} alt="" className="w-full h-full object-contain" />
                </div>
                <span className="text-base max-sm:text-xs text-[#4B4B4B] dark:text-gray-300 font-medium">
                  {feature.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom features input */}
        {showCustomFeaturesInput && (
          <div className="flex flex-col gap-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={customFeatureInput}
                onChange={(e) => onSetCustomFeatureInput(e.target.value)}
                onKeyPress={(e) => {
                  if (
                    e.key === "Enter" &&
                    customFeatureInput.trim() &&
                    customFeatures.length < 20
                  ) {
                    onAddCustomFeature(customFeatureInput.trim());
                    onSetCustomFeatureInput("");
                  }
                }}
                placeholder="Add custom feature..."
                maxLength={50}
                className="flex-1 h-[38px] px-3 py-3 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-plus-jakarta focus:outline-none focus:border-[var(--th-accent)] dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                autoFocus
              />
              <button
                onClick={() => {
                  if (
                    customFeatureInput.trim() &&
                    customFeatures.length < 20
                  ) {
                    onAddCustomFeature(customFeatureInput.trim());
                    onSetCustomFeatureInput("");
                  }
                }}
                disabled={
                  !customFeatureInput.trim() ||
                  customFeatures.length >= 20
                }
                className="px-4 py-2 rounded-lg onb-btn-primary"
              >
                Add
              </button>
              <button
                onClick={() => {
                  onSetShowCustomFeaturesInput(false);
                  onSetCustomFeatureInput("");
                }}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturesStep;
