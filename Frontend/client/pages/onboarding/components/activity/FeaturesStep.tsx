import React, { useRef, useEffect } from "react";
import { MoreHorizontal, X, Plus } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { IconType } from "react-icons";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL      = "#07e4e4";
const TEAL_BG   = "rgba(7, 228, 228, 0.07)";
const TEAL_RING = "rgba(7, 228, 228, 0.2)";
const BLACK     = "#131313";
const GRAY_500  = "#6b6b6b";
const GRAY_600  = "#555555";
const GRAY_400  = "#9a9a9a";
const GRAY_200  = "#e4e4e4";
const WHITE     = "#ffffff";
const SURFACE   = "#F7F8FA";

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
          Activity Features
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          {selectedActivities.length > 0
            ? `Select features for your ${selectedActivities.length === 1 ? "activity" : "activities"}.`
            : "Select features for your activity."}
        </p>
      </div>

      {/* ── Feature card ── */}
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
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: GRAY_500,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
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
          {/* Custom features */}
          {customFeatures.map((customFeature, idx) => (
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
              <MoreHorizontal size={14} color={TEAL} />
              <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
                {customFeature}
              </span>
              <X size={12} color={TEAL} />
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 99,
                  border: `1.5px solid ${selected ? TEAL : isRecommended ? "rgba(7,228,228,0.3)" : GRAY_200}`,
                  backgroundColor: selected ? TEAL_BG : isRecommended ? "rgba(7,228,228,0.04)" : SURFACE,
                  boxShadow: selected ? `0 0 0 3px ${TEAL_RING}` : "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  color: selected ? TEAL : GRAY_600,
                }}
                onMouseEnter={(e) => {
                  if (!selected) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL;
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL_BG;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = isRecommended ? "rgba(7,228,228,0.3)" : GRAY_200;
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = isRecommended ? "rgba(7,228,228,0.04)" : SURFACE;
                  }
                }}
              >
                <span style={{ color: selected ? TEAL : GRAY_400, display: "flex", alignItems: "center" }}>
                  <feature.icon size={16} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
                  {feature.label}
                </span>
                {isRecommended && !selected && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: TEAL,
                      backgroundColor: TEAL_BG,
                      border: `1px solid ${TEAL_RING}`,
                      borderRadius: 99,
                      padding: "1px 7px",
                      letterSpacing: "0.02em",
                    }}
                  >
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
                onMouseEnter={(e) => {
                  if (!selected) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL;
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL_BG;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200;
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = SURFACE;
                  }
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    opacity: selected ? 1 : 0.65,
                    transition: "opacity 0.15s",
                  }}
                >
                  <img
                    src={getImageUrl(feature.icon)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
                  {feature.name}
                </span>
              </button>
            );
          })}

          {/* ── Inline custom input pill ── */}
          {customFeatures.length < 20 && (
            showCustomFeaturesInput ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 6px 4px 14px",
                  borderRadius: 99,
                  border: `1.5px solid ${TEAL}`,
                  backgroundColor: WHITE,
                  boxShadow: `0 0 0 3px ${TEAL_RING}`,
                }}
              >
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
                  style={{
                    width: 130,
                    fontSize: 13,
                    fontWeight: 600,
                    color: BLACK,
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    letterSpacing: "-0.01em",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!customFeatureInput.trim()}
                  style={{
                    height: 28,
                    padding: "0 12px",
                    borderRadius: 99,
                    border: "none",
                    backgroundColor: customFeatureInput.trim() ? TEAL : GRAY_200,
                    color: customFeatureInput.trim() ? BLACK : GRAY_400,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: customFeatureInput.trim() ? "pointer" : "not-allowed",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { onSetShowCustomFeaturesInput(false); onSetCustomFeatureInput(""); }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 99,
                    border: "none",
                    backgroundColor: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <X size={13} color={GRAY_400} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSetShowCustomFeaturesInput(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 99,
                  border: `1.5px dashed ${GRAY_200}`,
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  color: GRAY_400,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL;
                  (e.currentTarget as HTMLButtonElement).style.color = TEAL;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200;
                  (e.currentTarget as HTMLButtonElement).style.color = GRAY_400;
                }}
              >
                <Plus size={13} strokeWidth={2.5} />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
                  Add custom
                </span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturesStep;
