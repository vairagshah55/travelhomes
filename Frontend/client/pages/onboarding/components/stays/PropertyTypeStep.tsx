import React from "react";
import { getImageUrl } from "@/lib/utils";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL      = "#07e4e4";
const TEAL_BG   = "rgba(7, 228, 228, 0.07)";
const TEAL_RING = "rgba(7, 228, 228, 0.2)";
const BLACK     = "#131313";
const GRAY_500  = "#6b6b6b";
const GRAY_400  = "#9a9a9a";
const GRAY_200  = "#e4e4e4";
const WHITE     = "#ffffff";
const SURFACE   = "#F7F8FA";

interface PropertyType {
  id: string;
  name: string;
  icon: string;
}

interface PropertyTypeStepProps {
  selectedProperties: string[];
  propertyTypes: PropertyType[];
  onToggle: (propertyId: string) => void;
  errors: Record<string, string>;
}

const PropertyTypeStep: React.FC<PropertyTypeStepProps> = ({
  selectedProperties,
  propertyTypes,
  onToggle,
}) => {
  const selectedCount = selectedProperties.length;

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
            Property Types
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
          Types of Property
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Select the property types you'd like to list.
        </p>
      </div>

      {/* ── Property grid ── */}
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
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: GRAY_500,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Properties
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: 10,
          }}
        >
          {propertyTypes.map((property) => {
            const selected = selectedProperties.includes(property.id);
            return (
              <button
                key={property.id}
                type="button"
                onClick={() => onToggle(property.id)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "18px 10px",
                  borderRadius: 16,
                  border: `1.5px solid ${selected ? TEAL : GRAY_200}`,
                  backgroundColor: selected ? TEAL_BG : SURFACE,
                  boxShadow: selected ? `0 0 0 3px ${TEAL_RING}` : "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
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
                {/* Selection check */}
                {selected && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: TEAL,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke={BLACK}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}

                {/* Icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: selected ? 1 : 0.7,
                    transition: "opacity 0.15s",
                  }}
                >
                  <img
                    src={getImageUrl(property.icon)}
                    alt={property.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                </div>

                {/* Name */}
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: selected ? TEAL : GRAY_500,
                    letterSpacing: "-0.01em",
                    transition: "color 0.15s",
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  {property.name}
                </span>
              </button>
            );
          })}
        </div>

        {propertyTypes.length === 0 && (
          <p style={{ fontSize: 13, color: GRAY_400, textAlign: "center", padding: "20px 0" }}>
            No property types available.
          </p>
        )}
      </div>
    </div>
  );
};

export default PropertyTypeStep;
