import React from "react";
import { getImageUrl } from "@/lib/utils";

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

interface ActivityType {
  id: string;
  name: string;
  icon: string;
}

interface TypeStepProps {
  selectedActivities: string[];
  activityTypes: ActivityType[];
  onToggle: (id: string) => void;
}

const TypeStep: React.FC<TypeStepProps> = ({
  selectedActivities,
  activityTypes,
  onToggle,
}) => {
  const selectedCount = selectedActivities.length;

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
            Activity Types
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
          Types of Activity
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Select all activity types that apply to your listing.
        </p>
      </div>

      {/* ── Activity grid ── */}
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
            Activities
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
          {activityTypes.map((activity) => {
            const selected = selectedActivities.includes(activity.id);
            return (
              <button
                key={activity.id}
                type="button"
                onClick={() => onToggle(activity.id)}
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
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    opacity: selected ? 1 : 0.7,
                    transition: "opacity 0.15s",
                  }}
                >
                  <img
                    src={getImageUrl(activity.icon)}
                    alt={activity.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
                  {activity.name}
                </span>
              </button>
            );
          })}
        </div>

        {activityTypes.length === 0 && (
          <p style={{ fontSize: 13, color: GRAY_400, textAlign: "center", padding: "20px 0" }}>
            No activity types available.
          </p>
        )}
      </div>
    </div>
  );
};

export default TypeStep;
