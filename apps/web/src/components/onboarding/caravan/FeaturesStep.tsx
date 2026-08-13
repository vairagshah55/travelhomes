import React from "react";
import {
  Wifi,
  Sun,
  Thermometer,
  Lightbulb,
  Wind,
  Droplets,
  BedDouble,
  UtensilsCrossed,
  Zap,
  Tv2,
  Flame,
  Umbrella,
  Bike,
  PawPrint,
  Plus,
  X,
  MoreHorizontal,
} from "lucide-react";
import { StepHeader } from "../shared/primitives";
import { cn } from "@/lib/utils";

interface CustomFeature {
  name: string;
  icon: any;
}

interface FeaturesStepProps {
  features: string[];
  dynamicFeatures?: any[];
  customFeatures: CustomFeature[];
  showCustomFeaturesInput: boolean;
  customFeatureInput: string;
  onToggleFeature: (feature: string) => void;
  onRemoveCustomFeature: (index: number) => void;
  onToggleCustomInput: () => void;
  onCustomFeatureInputChange: (value: string) => void;
  onAddCustomFeature: () => void;
  // Hide the kicker/title/subtitle and centered wrapper when used inside an
  // existing scrollable form (e.g. edit page).
  embedded?: boolean;
}

const STATIC_FEATURES: { name: string; icon: React.ReactNode }[] = [
  { name: "Wi-Fi / Internet", icon: <Wifi size={17} /> },
  { name: "Solar Power", icon: <Sun size={17} /> },
  { name: "Insulation", icon: <Thermometer size={17} /> },
  { name: "Lighting", icon: <Lightbulb size={17} /> },
  { name: "Air Conditioning", icon: <Wind size={17} /> },
  { name: "Shower", icon: <Droplets size={17} /> },
  { name: "Sleeping Beds", icon: <BedDouble size={17} /> },
  { name: "Kitchen / Cooking Area", icon: <UtensilsCrossed size={17} /> },
  { name: "Generator", icon: <Zap size={17} /> },
  { name: "TV / Entertainment", icon: <Tv2 size={17} /> },
  { name: "Heating", icon: <Flame size={17} /> },
  { name: "Awning", icon: <Umbrella size={17} /> },
  { name: "Bike Rack", icon: <Bike size={17} /> },
  { name: "Pet Friendly", icon: <PawPrint size={17} /> },
];

const FeaturesStep: React.FC<FeaturesStepProps> = ({
  features,
  customFeatures,
  showCustomFeaturesInput,
  customFeatureInput,
  onToggleFeature,
  onRemoveCustomFeature,
  onToggleCustomInput,
  onCustomFeatureInputChange,
  onAddCustomFeature,
  embedded,
}) => {
  const selectedCount = features.length + customFeatures.length;

  const grid = (
    <div className="w-full bg-th-surface-0 border-[1.5px] border-th-warm-border rounded-[20px] px-[22px] pt-5 pb-[22px] shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Selected count badge */}
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
        {/* Static features */}
        {STATIC_FEATURES.map((feature) => {
          const selected = features.includes(feature.name);
          return (
            <button
              key={feature.name}
              type="button"
              onClick={() => onToggleFeature(feature.name)}
              className={cn(
                "flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] cursor-pointer transition-all duration-150",
                selected
                  ? "border-th-brand bg-th-brand-soft text-th-brand shadow-[0_0_0_3px_var(--th-ring)]"
                  : "border-th-warm-border bg-th-warm-surface text-th-warm-text-dark hover:border-th-brand hover:bg-th-brand-soft hover:text-th-brand",
              )}
            >
              <span
                className={cn(
                  "flex items-center",
                  selected ? "text-th-brand" : "text-th-warm-text-muted",
                )}
              >
                {feature.icon}
              </span>
              <span className="text-[13px] font-semibold tracking-[-0.01em]">{feature.name}</span>
            </button>
          );
        })}

        {/* Custom features (added by user) */}
        {customFeatures.map((cf, idx) => (
          <button
            key={`custom-${idx}`}
            type="button"
            onClick={() => onRemoveCustomFeature(idx)}
            className="flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_var(--th-ring)] cursor-pointer text-th-brand"
          >
            <MoreHorizontal size={15} />
            <span className="text-[13px] font-semibold tracking-[-0.01em]">{cf.name}</span>
            <X size={13} className="ml-0.5 opacity-70" />
          </button>
        ))}

        {/* Others button */}
        <button
          type="button"
          onClick={onToggleCustomInput}
          className={cn(
            "flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] cursor-pointer transition-all duration-150",
            showCustomFeaturesInput
              ? "border-th-brand bg-th-brand-soft text-th-brand shadow-[0_0_0_3px_var(--th-ring)]"
              : "border-th-warm-border bg-th-warm-surface text-th-warm-text-dark hover:border-th-brand hover:bg-th-brand-soft hover:text-th-brand",
          )}
        >
          <Plus
            size={15}
            className={showCustomFeaturesInput ? "text-th-brand" : "text-th-warm-text-muted"}
          />
          <span className="text-[13px] font-semibold tracking-[-0.01em]">Others</span>
        </button>
      </div>

      {/* Custom feature input */}
      {showCustomFeaturesInput && (
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={customFeatureInput}
            onChange={(e) => onCustomFeatureInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddCustomFeature()}
            placeholder="e.g. Roof Rack, Outdoor Shower…"
            maxLength={50}
            className={cn(
              "flex-1 h-[46px] px-[14px] text-[13.5px] text-th-text-primary",
              "bg-th-warm-surface border-[1.5px] border-th-warm-border rounded-[12px]",
              "outline-none transition-[border-color,box-shadow,background-color] duration-150",
              "focus:border-th-brand focus:shadow-[0_0_0_3px_var(--th-ring)] focus:bg-th-surface-0",
            )}
          />
          <button
            type="button"
            onClick={onAddCustomFeature}
            disabled={!customFeatureInput.trim() || customFeatures.length >= 20}
            className={cn(
              "h-[46px] px-5 rounded-[12px] border-none text-[13px] font-bold tracking-[0.01em] transition-all duration-150",
              !customFeatureInput.trim()
                ? "bg-th-warm-border text-th-warm-text-muted cursor-not-allowed"
                : "bg-th-brand text-th-text-inverse cursor-pointer",
            )}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );

  if (embedded) return grid;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Shared StepHeader — see the note in CategoryStep; this file carried a
          byte-identical copy of the same hand-rolled centred heading. */}
      <StepHeader
        kicker="Amenities"
        subtitle="Select all features and amenities available to guests."
      />
      {grid}
    </div>
  );
};

export default FeaturesStep;
