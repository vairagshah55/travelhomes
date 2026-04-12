import React, { useState, useMemo } from "react";
import { Plus, X, Check, Search, Sparkles } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

  // Merge standard + admin features into one flat list for display
  const allStandardFeatures = useMemo(() => {
    const standard = featuresData.filter((f) => f.value !== "others");
    const admin = adminFeatures.map((f) => ({
      label: f.name,
      value: f.name,
      icon: f.icon as string,
      isAdmin: true,
    }));
    return [...standard, ...admin];
  }, [featuresData, adminFeatures]);

  const filteredFeatures = useMemo(() => {
    if (!searchQuery.trim()) return allStandardFeatures;
    const q = searchQuery.toLowerCase();
    return allStandardFeatures.filter((f) => f.label.toLowerCase().includes(q));
  }, [allStandardFeatures, searchQuery]);

  // Build the selected summary list — standard + custom together
  const selectedStandard = useMemo(
    () => allStandardFeatures.filter((f) => selectedFeatures.includes(f.value)),
    [allStandardFeatures, selectedFeatures]
  );

  const totalSelected = selectedStandard.length + customFeatures.length;

  const handleAddCustom = () => {
    const trimmed = customFeatureInput.trim();
    if (!trimmed || selectedFeatures.includes(trimmed)) return;
    setCustomFeatures((prev) => [...prev, trimmed]);
    setSelectedFeatures((prev) => [...prev, trimmed]);
    setCustomFeatureInput("");
  };

  const handleRemoveCustom = (index: number) => {
    const feature = customFeatures[index];
    setCustomFeatures((prev) => prev.filter((_, i) => i !== index));
    setSelectedFeatures((prev) => prev.filter((f) => f !== feature));
  };

  const hasError = !!errors.features;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
      {/* Header */}
      <div className="text-center space-y-2.5">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Amenities &amp; Features
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select everything your property offers — be thorough, it helps guests decide
        </p>
        {totalSelected > 0 && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "var(--th-accent)", color: "var(--th-accent-fg)" }}
          >
            <Check size={11} strokeWidth={2.5} />
            {totalSelected} selected
          </span>
        )}
      </div>

      <div className="w-full flex flex-col gap-5">
        {/* Selected summary panel */}
        {totalSelected > 0 && (
          <div className="w-full rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check size={13} className="text-green-500" strokeWidth={2.5} />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                  Selected ({totalSelected})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  // Deselect all standard features
                  selectedStandard.forEach((f) => {
                    if (selectedFeatures.includes(f.value)) toggleFeatureSelection(f.value);
                  });
                  // Remove all custom features
                  setCustomFeatures([]);
                  setSelectedFeatures((prev) =>
                    prev.filter((v) => !customFeatures.includes(v))
                  );
                }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
              >
                Clear all
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Standard selected chips */}
              {selectedStandard.map((feature, idx) => {
                const isAdminFeature = "isAdmin" in feature && feature.isAdmin;
                return (
                  <button
                    key={feature.value + idx}
                    type="button"
                    onClick={() => toggleFeatureSelection(feature.value)}
                    className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-full text-xs font-medium border-2 transition-all duration-150 active:scale-95 onb-pill-selected"
                  >
                    <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                      {isAdminFeature ? (
                        <img
                          src={getImageUrl(feature.icon as string)}
                          alt=""
                          className="w-3.5 h-3.5 object-contain"
                        />
                      ) : typeof feature.icon === "string" ? (
                        <span className="text-sm leading-none">{feature.icon}</span>
                      ) : (
                        <feature.icon size={12} />
                      )}
                    </span>
                    <span>{feature.label}</span>
                    <X size={10} className="ml-0.5 flex-shrink-0 opacity-70" />
                  </button>
                );
              })}

              {/* Custom selected chips */}
              {customFeatures.map((feature, idx) => (
                <button
                  key={`custom-${idx}`}
                  type="button"
                  onClick={() => handleRemoveCustom(idx)}
                  className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-full text-xs font-medium border-2 transition-all duration-150 active:scale-95 onb-pill-selected"
                >
                  <Sparkles size={10} className="flex-shrink-0 opacity-70" />
                  <span>{feature}</span>
                  <X size={10} className="ml-0.5 flex-shrink-0 opacity-70" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search bar */}
        {allStandardFeatures.length > 8 && (
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features…"
              className="w-full h-10 pl-9 pr-3.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[var(--th-accent)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* Feature pills */}
        <div
          className={`w-full rounded-2xl transition-all duration-200 ${
            hasError ? "ring-2 ring-red-400 ring-offset-2" : ""
          }`}
        >
          {filteredFeatures.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
              <Search size={22} className="text-gray-300" />
              <p className="text-sm">No features match "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs font-medium transition-colors"
                style={{ color: "var(--th-accent)" }}
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {filteredFeatures.map((feature, idx) => {
                const isSelected = selectedFeatures.includes(feature.value);
                const isAdminFeature = "isAdmin" in feature && feature.isAdmin;

                return (
                  <button
                    key={feature.value + idx}
                    type="button"
                    onClick={() => toggleFeatureSelection(feature.value)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all duration-150 active:scale-95 ${
                      isSelected
                        ? "onb-pill-selected"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    {/* Icon */}
                    <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {isAdminFeature ? (
                        <img
                          src={getImageUrl(feature.icon as string)}
                          alt=""
                          className="w-4 h-4 object-contain"
                        />
                      ) : typeof feature.icon === "string" ? (
                        <span className="text-base leading-none">{feature.icon}</span>
                      ) : (
                        <feature.icon
                          size={15}
                          className={isSelected ? "" : "text-gray-400 dark:text-gray-500"}
                        />
                      )}
                    </span>

                    <span>{feature.label}</span>

                    {isSelected && (
                      <Check size={12} className="ml-0.5 flex-shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <X size={9} className="text-white" strokeWidth={3} />
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{errors.features}</p>
          </div>
        )}

        {/* Custom features section */}
        <div className="flex flex-col gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Custom Features
              </span>
              {customFeatures.length > 0 && (
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                  {customFeatures.length}
                </span>
              )}
            </div>
            {!showCustomFeaturesInput && (
              <button
                type="button"
                onClick={() => setShowCustomFeaturesInput(true)}
                className="flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: "var(--th-accent)" }}
              >
                <Plus size={12} />
                Add custom
              </button>
            )}
          </div>

          {/* Existing custom feature chips */}
          {customFeatures.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customFeatures.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border-2 text-sm font-medium"
                  style={{
                    borderColor: "var(--th-accent)",
                    backgroundColor: "var(--th-accent-subtle, #f0f9ff)",
                    color: "var(--th-accent)",
                  }}
                >
                  <span>{feature}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustom(idx)}
                    className="w-4 h-4 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors ml-0.5"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Custom feature input */}
          {showCustomFeaturesInput && (
            <div className="flex gap-2">
              <input
                type="text"
                value={customFeatureInput}
                onChange={(e) => setCustomFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustom();
                  }
                  if (e.key === "Escape") {
                    setShowCustomFeaturesInput(false);
                    setCustomFeatureInput("");
                  }
                }}
                placeholder="e.g. Rooftop terrace, Private chef…"
                autoFocus
                className="flex-1 h-10 px-3.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[var(--th-accent)] transition-colors"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!customFeatureInput.trim()}
                className="h-10 px-4 text-sm font-medium rounded-xl hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "var(--th-accent)",
                  color: "var(--th-accent-fg)",
                }}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomFeaturesInput(false);
                  setCustomFeatureInput("");
                }}
                className="h-10 px-3 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {customFeatures.length === 0 && !showCustomFeaturesInput && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Don't see a feature listed? Add it yourself.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturesStep;
