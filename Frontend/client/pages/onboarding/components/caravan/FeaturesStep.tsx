import React from "react";
import {
  Wifi, Sun, Thermometer, Lightbulb, Wind, Droplets,
  BedDouble, UtensilsCrossed, Zap, Tv2, Flame, Umbrella,
  Bike, PawPrint, Plus, X, MoreHorizontal,
} from "lucide-react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL      = "#07e4e4";
const TEAL_BG   = "rgba(7, 228, 228, 0.07)";
const TEAL_RING = "rgba(7, 228, 228, 0.2)";
const BLACK     = "#131313";
const GRAY_600  = "#555555";
const GRAY_500  = "#6b6b6b";
const GRAY_400  = "#9a9a9a";
const GRAY_200  = "#e4e4e4";
const WHITE     = "#ffffff";
const SURFACE   = "#F7F8FA";

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
}

const STATIC_FEATURES: { name: string; icon: React.ReactNode }[] = [
  { name: "Wi-Fi / Internet",      icon: <Wifi size={17} /> },
  { name: "Solar Power",           icon: <Sun size={17} /> },
  { name: "Insulation",            icon: <Thermometer size={17} /> },
  { name: "Lighting",              icon: <Lightbulb size={17} /> },
  { name: "Air Conditioning",      icon: <Wind size={17} /> },
  { name: "Shower",                icon: <Droplets size={17} /> },
  { name: "Sleeping Beds",         icon: <BedDouble size={17} /> },
  { name: "Kitchen / Cooking Area",icon: <UtensilsCrossed size={17} /> },
  { name: "Generator",             icon: <Zap size={17} /> },
  { name: "TV / Entertainment",    icon: <Tv2 size={17} /> },
  { name: "Heating",               icon: <Flame size={17} /> },
  { name: "Awning",                icon: <Umbrella size={17} /> },
  { name: "Bike Rack",             icon: <Bike size={17} /> },
  { name: "Pet Friendly",          icon: <PawPrint size={17} /> },
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
}) => {
  const selectedCount = features.length + customFeatures.length;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">

      {/* ── Header ── */}
      <div className="text-center space-y-2 pb-1">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: GRAY_400,
            }}
          >
            Amenities
          </span>
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
        </div>
        <h1
          style={{
            fontSize: "clamp(22px, 3.5vw, 30px)",
            fontWeight: 800,
            color: BLACK,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}
        >
          What does your caravan offer?
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Select all features and amenities available to guests.
        </p>
      </div>

      {/* ── Feature grid ── */}
      <div
        style={{
          width: "100%",
          backgroundColor: WHITE,
          border: "1.5px solid #EBEBEB",
          borderRadius: 20,
          padding: "20px 22px 22px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        {/* Selected count badge */}
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontSize: 12, fontWeight: 700, color: GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Features
          </p>
          {selectedCount > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: TEAL,
                backgroundColor: TEAL_BG,
                border: `1px solid ${TEAL_RING}`,
                borderRadius: 99,
                padding: "2px 10px",
              }}
            >
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 99,
                  border: `1.5px solid ${selected ? TEAL : GRAY_200}`,
                  backgroundColor: selected ? TEAL_BG : SURFACE,
                  boxShadow: selected ? `0 0 0 3px ${TEAL_RING}` : "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  color: selected ? TEAL : GRAY_600,
                }}
                onMouseEnter={e => {
                  if (!selected) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL;
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL_BG;
                  }
                }}
                onMouseLeave={e => {
                  if (!selected) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200;
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = SURFACE;
                  }
                }}
              >
                <span style={{ color: selected ? TEAL : GRAY_400, display: "flex", alignItems: "center" }}>
                  {feature.icon}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
                  {feature.name}
                </span>
              </button>
            );
          })}

          {/* Custom features (added by user) */}
          {customFeatures.map((cf, idx) => (
            <button
              key={`custom-${idx}`}
              type="button"
              onClick={() => onRemoveCustomFeature(idx)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 99,
                border: `1.5px solid ${TEAL}`,
                backgroundColor: TEAL_BG,
                boxShadow: `0 0 0 3px ${TEAL_RING}`,
                cursor: "pointer",
                color: TEAL,
              }}
            >
              <MoreHorizontal size={15} />
              <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
                {cf.name}
              </span>
              <X size={13} style={{ marginLeft: 2, opacity: 0.7 }} />
            </button>
          ))}

          {/* Others button */}
          <button
            type="button"
            onClick={onToggleCustomInput}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 99,
              border: `1.5px solid ${showCustomFeaturesInput ? TEAL : GRAY_200}`,
              backgroundColor: showCustomFeaturesInput ? TEAL_BG : SURFACE,
              boxShadow: showCustomFeaturesInput ? `0 0 0 3px ${TEAL_RING}` : "none",
              cursor: "pointer",
              transition: "all 0.15s",
              color: showCustomFeaturesInput ? TEAL : GRAY_600,
            }}
            onMouseEnter={e => {
              if (!showCustomFeaturesInput) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL;
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL_BG;
              }
            }}
            onMouseLeave={e => {
              if (!showCustomFeaturesInput) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200;
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = SURFACE;
              }
            }}
          >
            <Plus size={15} style={{ color: showCustomFeaturesInput ? TEAL : GRAY_400 }} />
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
              Others
            </span>
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
              style={{
                flex: 1,
                height: 46,
                padding: "0 14px",
                fontSize: 13.5,
                color: BLACK,
                backgroundColor: SURFACE,
                border: `1.5px solid ${GRAY_200}`,
                borderRadius: 12,
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={e => {
                e.target.style.borderColor = TEAL;
                e.target.style.boxShadow = `0 0 0 3px ${TEAL_RING}`;
                e.target.style.backgroundColor = WHITE;
              }}
              onBlur={e => {
                e.target.style.borderColor = GRAY_200;
                e.target.style.boxShadow = "none";
                e.target.style.backgroundColor = SURFACE;
              }}
            />
            <button
              type="button"
              onClick={onAddCustomFeature}
              disabled={!customFeatureInput.trim() || customFeatures.length >= 20}
              style={{
                height: 46,
                padding: "0 20px",
                borderRadius: 12,
                border: "none",
                backgroundColor: !customFeatureInput.trim() ? GRAY_200 : TEAL,
                color: !customFeatureInput.trim() ? GRAY_400 : BLACK,
                fontSize: 13,
                fontWeight: 700,
                cursor: !customFeatureInput.trim() ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                letterSpacing: "0.01em",
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
