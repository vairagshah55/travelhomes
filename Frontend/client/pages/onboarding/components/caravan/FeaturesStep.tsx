import React from "react";
import { MoreHorizontal, X } from "lucide-react";
import { IoAdd } from "react-icons/io5";
import { getImageUrl } from "@/lib/utils";
import { toast } from "sonner";

interface CustomFeature {
  name: string;
  icon: any;
}

interface FeaturesStepProps {
  features: string[];
  dynamicFeatures: any[];
  customFeatures: CustomFeature[];
  showCustomFeaturesInput: boolean;
  customFeatureInput: string;
  onToggleFeature: (feature: string) => void;
  onRemoveCustomFeature: (index: number) => void;
  onToggleCustomInput: () => void;
  onCustomFeatureInputChange: (value: string) => void;
  onAddCustomFeature: () => void;
}

const FeaturesStep: React.FC<FeaturesStepProps> = ({
  features,
  dynamicFeatures,
  customFeatures,
  showCustomFeaturesInput,
  customFeatureInput,
  onToggleFeature,
  onRemoveCustomFeature,
  onToggleCustomInput,
  onCustomFeatureInputChange,
  onAddCustomFeature,
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-9">
      <h1 className="text-[32px] font-semibold text-black dark:text-white font-sanse text-center">
        Caravan Features
      </h1>

      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Feature tags in rows */}
        <div className="flex flex-wrap gap-5">
          {/* Dynamic Features */}
          {dynamicFeatures.map((feature, idx) => (
            <button
              key={feature.id || feature._id || idx}
              onClick={() => onToggleFeature(feature.name)}
              className={`flex items-center gap-3 px-4 py-2 rounded-[48px] border transition-all duration-200 onb-card ${
                features.includes(feature.name)
                  ? "onb-pill-selected"
                  : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[var(--th-accent)] dark:hover:border-white"
              }`}
            >
              <div className="w-[22px] h-[22px]">
                 <img src={getImageUrl(feature.icon)} alt="" className="w-full h-full object-contain" />
              </div>
              <span className="text-base max-sm:text-xs text-[#4B4B4B] dark:text-gray-300 font-medium font-['Plus_Jakarta_Sans']">
                {feature.name}
              </span>
            </button>
          ))}

          {/* Custom features */}
          {customFeatures.map((customFeature, idx) => (
            <button
              key={`custom-${idx}`}
              onClick={() => onRemoveCustomFeature(idx)}
              className="flex items-center gap-3 px-4 py-2 rounded-[48px] border onb-pill-selected"
            >
              <div className="w-[22px] h-[22px]">
                <MoreHorizontal size={18} className="text-gray-600" />
              </div>
              <span className="text-base max-sm:text-xs text-[#4B4B4B] dark:text-gray-300 font-medium font-['Plus_Jakarta_Sans']">
                {customFeature.name}
              </span>
              <X size={16} className="text-gray-600 ml-1" />
            </button>
          ))}

          {/* Others/Custom Button */}
          <button
            key="others"
            onClick={onToggleCustomInput}
            className={`flex items-center gap-3 px-4 py-2 rounded-[48px] border transition-all duration-200 ${
              showCustomFeaturesInput
                ? "onb-pill-selected"
                : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[var(--th-accent)] dark:hover:border-white"
            }`}
          >
            <div className="w-[22px] h-[22px]">
            <IoAdd size={18} className="text-gray-600" />
            </div>
            <span className="text-base max-sm:text-xs text-[#4B4B4B] dark:text-gray-300 font-medium font-['Plus_Jakarta_Sans']">
              Others
            </span>
          </button>
        </div>

        {/* Custom features input */}
        {showCustomFeaturesInput && (
          <div className="flex gap-2">
            <input
              type="text"
              value={customFeatureInput}
              onChange={(e) => onCustomFeatureInputChange(e.target.value)}
              placeholder="Feature name (e.g. Solar Power)"
              maxLength={50}
              className="flex-1 h-[50px] px-3 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[var(--th-accent)] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
            <button
              onClick={onAddCustomFeature}
              disabled={!customFeatureInput.trim() || customFeatures.length >= 20}
              className="px-6 h-[50px] flex items-center justify-center rounded-lg onb-btn-primary"
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
