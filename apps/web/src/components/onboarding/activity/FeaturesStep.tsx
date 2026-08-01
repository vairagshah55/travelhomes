import React, { useRef, useEffect } from "react";
import { MoreHorizontal, X, Plus } from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
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
  const selectedCount = selectedFeatures.length + customFeatures.length;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCustomFeaturesInput) {
      inputRef.current?.focus();
    }
  }, [showCustomFeaturesInput]);

  const handleAdd = () => {
    if (customFeatureInput.trim() && customFeatures.length < 20) {
      onAddCustomFeature(customFeatureInput.trim());
      onSetCustomFeatureInput("");
    }
  };

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
        <h1 className="font-serif text-[clamp(24px,3.6vw,32px)] font-normal text-[#0d4548] tracking-[-0.015em] leading-[1.15]">
          Activity Features
        </h1>
        <p className="text-[14px] text-th-warm-text-dark leading-[1.6]">
          {selectedActivities.length > 0
            ? `Select features for your ${selectedActivities.length === 1 ? "activity" : "activities"}.`
            : "Select features for your activity."}
        </p>
      </div>

      {/* ── Feature card ── */}
      <div className="w-full bg-th-surface-0 border-[1.5px] border-th-warm-border rounded-[20px] px-[22px] pt-5 pb-[22px] shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] font-bold text-th-warm-text-dark uppercase tracking-[0.03em]">
            Features
          </p>
          {selectedCount > 0 && (
            <span className="text-[11px] font-bold text-th-brand bg-th-brand-soft border border-th-brand-border-soft rounded-full px-[10px] py-[2px]">
              {selectedCount} selected
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          {/* Custom features */}
          {customFeatures.map((customFeature, idx) => (
            <button
              key={`custom-${idx}`}
              type="button"
              onClick={() => onRemoveCustomFeature(idx)}
              className="flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_rgba(17, 116, 121,0.20)] cursor-pointer text-th-brand"
            >
              <MoreHorizontal size={14} className="text-th-brand" />
              <span className="text-[13px] font-semibold tracking-[-0.01em]">{customFeature}</span>
              <X size={12} className="text-th-brand" />
            </button>
          ))}

          {/* Standard features */}
          {activityFeatures.map((feature, idx) => {
            const selected = selectedFeatures.includes(feature.value);
            const isRecommended =
              selectedActivities.length > 0 &&
              selectedActivities.some((actId) =>
                activityFeatureMap[actId]?.includes(feature.value),
              );
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onToggleFeature(feature.value)}
                className={cn(
                  "flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] cursor-pointer transition-all duration-150",
                  selected
                    ? "border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_rgba(17, 116, 121,0.20)] text-th-brand"
                    : isRecommended
                      ? "border-th-brand-border-soft bg-[rgba(17, 116, 121,0.04)] text-th-warm-text-dark hover:border-th-brand hover:bg-th-brand-soft"
                      : "border-th-warm-border bg-th-warm-surface text-th-warm-text-dark hover:border-th-brand hover:bg-th-brand-soft",
                )}
              >
                <span
                  className={cn(
                    "flex items-center",
                    selected ? "text-th-brand" : "text-th-warm-text-muted",
                  )}
                >
                  <feature.icon size={16} />
                </span>
                <span className="text-[13px] font-semibold tracking-[-0.01em]">
                  {feature.label}
                </span>
                {isRecommended && !selected && (
                  <span className="text-[10px] font-bold text-th-brand bg-th-brand-soft border border-th-brand-border-soft rounded-full px-[7px] py-[1px] tracking-[0.02em]">
                    Suggested
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin features */}
          {adminFeatures.map((feature, idx) => {
            const selected = selectedFeatures.includes(feature.name);
            return (
              <button
                key={feature.id || `admin-${idx}`}
                type="button"
                onClick={() => onToggleFeature(feature.name)}
                className={cn(
                  "flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] cursor-pointer transition-all duration-150",
                  selected
                    ? "border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_rgba(17, 116, 121,0.20)] text-th-brand"
                    : "border-th-warm-border bg-th-warm-surface text-th-warm-text-dark hover:border-th-brand hover:bg-th-brand-soft",
                )}
              >
                <span
                  className={cn(
                    "w-[18px] h-[18px] flex items-center justify-center flex-shrink-0 transition-opacity duration-150",
                    selected ? "opacity-100" : "opacity-65",
                  )}
                >
                  <img
                    src={getImageUrl(feature.icon)}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </span>
                <span className="text-[13px] font-semibold tracking-[-0.01em]">{feature.name}</span>
              </button>
            );
          })}

          {/* ── Inline custom input pill ── */}
          {customFeatures.length < 20 &&
            (showCustomFeaturesInput ? (
              <div className="flex items-center gap-1.5 pl-[14px] pr-[6px] py-1 rounded-full border-[1.5px] border-th-brand bg-th-surface-0 shadow-[0_0_0_3px_rgba(17, 116, 121,0.20)]">
                <input
                  ref={inputRef}
                  type="text"
                  value={customFeatureInput}
                  onChange={(e) => onSetCustomFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") {
                      onSetShowCustomFeaturesInput(false);
                      onSetCustomFeatureInput("");
                    }
                  }}
                  placeholder="Feature name…"
                  maxLength={50}
                  className="w-[130px] text-[13px] font-semibold text-th-text-primary bg-transparent border-none outline-none tracking-[-0.01em]"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!customFeatureInput.trim()}
                  className={cn(
                    "h-7 px-3 rounded-full border-none text-[12px] font-bold transition-all duration-150 flex-shrink-0",
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
                    onSetShowCustomFeaturesInput(false);
                    onSetCustomFeatureInput("");
                  }}
                  className="w-7 h-7 rounded-full border-none bg-transparent flex items-center justify-center cursor-pointer flex-shrink-0"
                >
                  <X size={13} className="text-th-warm-text-muted" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSetShowCustomFeaturesInput(true)}
                className="flex items-center gap-1.5 px-[14px] py-2 rounded-full border-[1.5px] border-dashed border-th-warm-border bg-transparent cursor-pointer transition-all duration-150 text-th-warm-text-muted hover:border-th-brand hover:text-th-brand"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span className="text-[13px] font-semibold tracking-[-0.01em]">Add custom</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesStep;
