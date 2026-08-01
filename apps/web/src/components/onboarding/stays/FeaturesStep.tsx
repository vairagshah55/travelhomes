import React, { useState, useMemo, useRef, useEffect } from "react";
import { Plus, X, Search, MoreHorizontal } from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCustomFeaturesInput) inputRef.current?.focus();
  }, [showCustomFeaturesInput]);

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

  const totalSelected =
    allStandardFeatures.filter((f) => selectedFeatures.includes(f.value)).length +
    customFeatures.length;

  const handleAddCustom = () => {
    const trimmed = customFeatureInput.trim();
    if (!trimmed || selectedFeatures.includes(trimmed) || customFeatures.length >= 20) return;
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
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      {/* ── Header ── */}
      <div className="text-center space-y-2 pb-1">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-6 h-[3px] rounded-full bg-th-brand" />
          <span className="text-[10.5px] font-bold tracking-[0.13em] uppercase text-th-warm-text-muted">
            Amenities
          </span>
          <div className="w-6 h-[3px] rounded-full bg-th-brand" />
        </div>
        <h1
          className="font-serif text-[#0d4548] tracking-[-0.015em] leading-[1.15]"
          style={{ fontSize: "clamp(24px, 3.6vw, 32px)", fontWeight: 400 }}
        >
          Amenities &amp; Features
        </h1>
        <p className="text-[14px] text-th-warm-text-dark leading-[1.6]">
          Select everything your property offers — it helps guests decide.
        </p>
      </div>

      {/* ── Feature card ── */}
      <div
        className={cn(
          "w-full bg-th-surface-0 rounded-[20px] p-[20px_22px_22px] transition-all duration-200",
          hasError
            ? "border-[1.5px] border-th-error-bright-soft shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
            : "border-[1.5px] border-th-warm-border shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]",
        )}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] font-bold text-th-warm-text-dark uppercase tracking-[0.03em]">
            Features
          </p>
          {totalSelected > 0 && (
            <span className="text-[11px] font-bold text-th-brand bg-th-brand-soft border border-[rgba(17, 116, 121,0.20)] rounded-full px-2.5 py-[2px]">
              {totalSelected} selected
            </span>
          )}
        </div>

        {/* Search */}
        {allStandardFeatures.length > 8 && (
          <div className="relative mb-[14px]">
            <Search
              size={14}
              className="absolute left-[14px] top-1/2 -translate-y-1/2 pointer-events-none text-th-warm-text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features…"
              className={cn(
                "w-full h-10 pl-9 pr-[34px] text-[13px] text-th-text-primary font-[450] rounded-[11px] outline-none transition-all duration-150",
                "focus:bg-th-surface-0 focus:border-th-brand focus:shadow-[0_0_0_3px_var(--th-ring)]",
                "bg-th-warm-surface border-[1.5px] border-transparent",
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer flex items-center justify-center"
              >
                <X size={13} className="text-th-warm-text-muted" />
              </button>
            )}
          </div>
        )}

        {/* Pills */}
        {filteredFeatures.length === 0 && !searchQuery ? null : filteredFeatures.length === 0 ? (
          <div className="py-[30px] flex flex-col items-center gap-2">
            <Search size={22} className="text-th-warm-border" />
            <p className="text-[13px] text-th-warm-text-muted">No features match "{searchQuery}"</p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[12px] font-bold text-th-brand bg-transparent border-none cursor-pointer"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {/* Custom feature chips */}
            {customFeatures.map((feature, idx) => (
              <button
                key={`custom-${idx}`}
                type="button"
                onClick={() => handleRemoveCustom(idx)}
                className="flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_rgba(17, 116, 121,0.20)] cursor-pointer text-th-brand"
              >
                <MoreHorizontal size={14} />
                <span className="text-[13px] font-semibold tracking-[-0.01em]">{feature}</span>
                <X size={12} />
              </button>
            ))}

            {/* Standard + admin features */}
            {filteredFeatures.map((feature, idx) => {
              const isSelected = selectedFeatures.includes(feature.value);
              const isAdminFeature = "isAdmin" in feature && feature.isAdmin;

              return (
                <button
                  key={feature.value + idx}
                  type="button"
                  onClick={() => toggleFeatureSelection(feature.value)}
                  className={cn(
                    "flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] cursor-pointer transition-all duration-150",
                    isSelected
                      ? "border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_rgba(17, 116, 121,0.20)] text-th-brand"
                      : "border-th-warm-border bg-th-warm-surface text-th-warm-text-dark hover:border-th-brand hover:bg-th-brand-soft",
                  )}
                >
                  <span
                    className={cn(
                      "w-[18px] h-[18px] flex items-center justify-center shrink-0 transition-opacity duration-150",
                      isSelected ? "opacity-100" : "opacity-65",
                    )}
                  >
                    {isAdminFeature ? (
                      <img
                        src={getImageUrl(feature.icon as string)}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    ) : typeof feature.icon === "string" ? (
                      <span className="text-[14px] leading-none">{feature.icon}</span>
                    ) : (
                      <feature.icon size={15} />
                    )}
                  </span>
                  <span className="text-[13px] font-semibold tracking-[-0.01em]">
                    {feature.label}
                  </span>
                </button>
              );
            })}

            {/* ── Inline custom input pill ── */}
            {customFeatures.length < 20 &&
              (showCustomFeaturesInput ? (
                <div className="flex items-center gap-1.5 py-1 pl-[14px] pr-1.5 rounded-full border-[1.5px] border-th-brand bg-th-surface-0 shadow-[0_0_0_3px_rgba(17, 116, 121,0.20)]">
                  <input
                    ref={inputRef}
                    type="text"
                    value={customFeatureInput}
                    onChange={(e) => setCustomFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCustom();
                      if (e.key === "Escape") {
                        setShowCustomFeaturesInput(false);
                        setCustomFeatureInput("");
                      }
                    }}
                    placeholder="Feature name…"
                    maxLength={50}
                    className="w-[130px] text-[13px] font-semibold text-th-text-primary bg-transparent border-none outline-none tracking-[-0.01em]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    disabled={!customFeatureInput.trim()}
                    className={cn(
                      "h-7 px-3 rounded-full border-none text-[12px] font-bold transition-all duration-150 shrink-0",
                      customFeatureInput.trim()
                        ? "bg-th-brand text-th-text-inverse cursor-pointer"
                        : "bg-th-warm-border text-th-warm-text-muted cursor-not-allowed",
                    )}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomFeaturesInput(false);
                      setCustomFeatureInput("");
                    }}
                    className="w-7 h-7 rounded-full border-none bg-transparent flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <X size={13} className="text-th-warm-text-muted" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomFeaturesInput(true)}
                  className="flex items-center gap-1.5 px-[14px] py-2 rounded-full border-[1.5px] border-dashed border-th-warm-border bg-transparent cursor-pointer transition-all duration-150 text-th-warm-text-muted hover:border-th-brand hover:text-th-brand"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span className="text-[13px] font-semibold tracking-[-0.01em]">Add custom</span>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* ── Error message ── */}
      {hasError && (
        <div className="w-full flex items-center gap-2 px-[14px] py-2.5 rounded-[13px] bg-th-error-bright-bg border-[1.5px] border-th-error-bright-soft">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="shrink-0 text-th-error-bright"
          >
            <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M6 3.5v3M6 8.25v.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-[12px] font-semibold text-th-error-bright">{errors.features}</p>
        </div>
      )}
    </div>
  );
};

export default FeaturesStep;
