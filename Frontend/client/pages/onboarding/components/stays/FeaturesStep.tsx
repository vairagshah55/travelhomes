import React, { useState, useMemo, useRef, useEffect } from "react";
import { Plus, X, Search, MoreHorizontal } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL      = "#07e4e4";
const TEAL_BG   = "rgba(7, 228, 228, 0.07)";
const TEAL_RING = "rgba(7, 228, 228, 0.2)";
const TEAL_FOCUS = "rgba(7, 228, 228, 0.15)";
const BLACK     = "#131313";
const GRAY_500  = "#6b6b6b";
const GRAY_600  = "#555555";
const GRAY_400  = "#9a9a9a";
const GRAY_200  = "#e4e4e4";
const WHITE     = "#ffffff";
const SURFACE   = "#F7F8FA";
const ERROR     = "#ef4444";
const ERROR_BG  = "rgba(239,68,68,0.04)";

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
  const [searchFocused, setSearchFocused] = useState(false);
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

  const totalSelected = allStandardFeatures.filter((f) => selectedFeatures.includes(f.value)).length + customFeatures.length;

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
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: GRAY_400 }}>
            Amenities
          </span>
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
        </div>
        <h1 style={{ fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: 800, color: BLACK, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
          Amenities &amp; Features
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Select everything your property offers — it helps guests decide.
        </p>
      </div>

      {/* ── Feature card ── */}
      <div
        style={{
          width: "100%",
          backgroundColor: WHITE,
          border: `1.5px solid ${hasError ? "#fca5a5" : "#EBEBEB"}`,
          borderRadius: 20,
          padding: "20px 22px 22px",
          boxShadow: hasError
            ? "0 0 0 3px rgba(239,68,68,0.1)"
            : "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
          transition: "all 0.2s",
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontSize: 12, fontWeight: 700, color: GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Features
          </p>
          {totalSelected > 0 && (
            <span
              style={{
                fontSize: 11, fontWeight: 700, color: TEAL,
                backgroundColor: TEAL_BG, border: `1px solid ${TEAL_RING}`,
                borderRadius: 99, padding: "2px 10px",
              }}
            >
              {totalSelected} selected
            </span>
          )}
        </div>

        {/* Search */}
        {allStandardFeatures.length > 8 && (
          <div style={{ position: "relative", marginBottom: 14 }}>
            <Search
              size={14}
              style={{
                position: "absolute", left: 14, top: "50%",
                transform: "translateY(-50%)", pointerEvents: "none",
                color: searchFocused ? TEAL : GRAY_400, transition: "color 0.15s",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search features\u2026"
              style={{
                width: "100%", height: 40, paddingLeft: 36, paddingRight: 34,
                fontSize: 13, color: BLACK, fontWeight: 450,
                backgroundColor: searchFocused ? WHITE : SURFACE,
                border: `1.5px solid ${searchFocused ? TEAL : "transparent"}`,
                borderRadius: 11, outline: "none",
                boxShadow: searchFocused ? `0 0 0 3px ${TEAL_FOCUS}` : "none",
                transition: "all 0.15s",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={13} color={GRAY_400} />
              </button>
            )}
          </div>
        )}

        {/* Pills */}
        {filteredFeatures.length === 0 && !searchQuery ? null : filteredFeatures.length === 0 ? (
          <div style={{ padding: "30px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <Search size={22} color={GRAY_200} />
            <p style={{ fontSize: 13, color: GRAY_400 }}>No features match "{searchQuery}"</p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{ fontSize: 12, fontWeight: 700, color: TEAL, backgroundColor: "transparent", border: "none", cursor: "pointer" }}
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
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 14px", borderRadius: 99,
                  border: `1.5px solid ${TEAL}`,
                  backgroundColor: TEAL_BG,
                  boxShadow: `0 0 0 3px ${TEAL_RING}`,
                  cursor: "pointer", color: TEAL,
                }}
              >
                <MoreHorizontal size={14} color={TEAL} />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>{feature}</span>
                <X size={12} color={TEAL} />
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
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", borderRadius: 99,
                    border: `1.5px solid ${isSelected ? TEAL : GRAY_200}`,
                    backgroundColor: isSelected ? TEAL_BG : SURFACE,
                    boxShadow: isSelected ? `0 0 0 3px ${TEAL_RING}` : "none",
                    cursor: "pointer", transition: "all 0.15s",
                    color: isSelected ? TEAL : GRAY_600,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL;
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL_BG;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200;
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = SURFACE;
                    }
                  }}
                >
                  <span
                    style={{
                      width: 18, height: 18,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, opacity: isSelected ? 1 : 0.65, transition: "opacity 0.15s",
                    }}
                  >
                    {isAdminFeature ? (
                      <img src={getImageUrl(feature.icon as string)} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    ) : typeof feature.icon === "string" ? (
                      <span style={{ fontSize: 14, lineHeight: 1 }}>{feature.icon}</span>
                    ) : (
                      <feature.icon size={15} />
                    )}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>{feature.label}</span>
                </button>
              );
            })}

            {/* ── Inline custom input pill ── */}
            {customFeatures.length < 20 && (
              showCustomFeaturesInput ? (
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "4px 6px 4px 14px", borderRadius: 99,
                    border: `1.5px solid ${TEAL}`, backgroundColor: WHITE,
                    boxShadow: `0 0 0 3px ${TEAL_RING}`,
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={customFeatureInput}
                    onChange={(e) => setCustomFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCustom();
                      if (e.key === "Escape") { setShowCustomFeaturesInput(false); setCustomFeatureInput(""); }
                    }}
                    placeholder="Feature name\u2026"
                    maxLength={50}
                    style={{
                      width: 130, fontSize: 13, fontWeight: 600, color: BLACK,
                      backgroundColor: "transparent", border: "none", outline: "none",
                      letterSpacing: "-0.01em",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    disabled={!customFeatureInput.trim()}
                    style={{
                      height: 28, padding: "0 12px", borderRadius: 99, border: "none",
                      backgroundColor: customFeatureInput.trim() ? TEAL : GRAY_200,
                      color: customFeatureInput.trim() ? BLACK : GRAY_400,
                      fontSize: 12, fontWeight: 700,
                      cursor: customFeatureInput.trim() ? "pointer" : "not-allowed",
                      transition: "all 0.15s", flexShrink: 0,
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCustomFeaturesInput(false); setCustomFeatureInput(""); }}
                    style={{
                      width: 28, height: 28, borderRadius: 99, border: "none",
                      backgroundColor: "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    <X size={13} color={GRAY_400} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomFeaturesInput(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 99,
                    border: `1.5px dashed ${GRAY_200}`,
                    backgroundColor: "transparent",
                    cursor: "pointer", transition: "all 0.15s", color: GRAY_400,
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
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>Add custom</span>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* ── Error message ── */}
      {hasError && (
        <div
          style={{
            width: "100%",
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 13,
            backgroundColor: ERROR_BG, border: "1.5px solid #fca5a5",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" />
            <path d="M6 3.5v3M6 8.25v.25" stroke={ERROR} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 12, fontWeight: 600, color: ERROR }}>{errors.features}</p>
        </div>
      )}
    </div>
  );
};

export default FeaturesStep;
