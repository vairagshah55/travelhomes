import React from "react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL       = "#07e4e4";
const TEAL_BG    = "rgba(7, 228, 228, 0.07)";
const TEAL_RING  = "rgba(7, 228, 228, 0.2)";
const BLACK      = "#131313";
const GRAY_500   = "#6b6b6b";
const GRAY_400   = "#9a9a9a";
const GRAY_200   = "#e4e4e4";
const WHITE      = "#ffffff";
const SURFACE    = "#F7F8FA";

interface CategoryStepProps {
  category: string | null;
  dynamicCategories?: any[];
  onSelect: (categoryName: string) => void;
}

const CATEGORIES = [
  {
    name: "Panel Van",
    emoji: "🚐",
    description:
      "A panel van is a light commercial vehicle with an enclosed cargo area and minimal rear seating. Nimble and fuel-efficient — popular for trade work and adventure conversions.",
  },
  {
    name: "Cargo Van",
    emoji: "🚚",
    description:
      "A cargo van is a commercial vehicle designed for transporting goods and equipment. Large enclosed storage area with minimal seating — ideal for deliveries, logistics, and small business operations.",
  },
  {
    name: "RV",
    emoji: "🚌",
    description:
      "An RV (recreational vehicle) is a motorized or towable vehicle designed for travel and living. Includes sleeping areas, kitchen facilities, and storage — offering comfort and freedom on the road.",
  },
  {
    name: "Motorhome",
    emoji: "🏠",
    description:
      "A motorhome is a large, self-contained vehicle that combines driving and living space in one unit. Beds, kitchen, bathroom, and storage — ideal for long road trips and comfortable extended travel.",
  },
  {
    name: "Camper Trailer",
    emoji: "⛺",
    description:
      "A camper trailer is a towable recreational vehicle providing sleeping space and basic camping amenities. Attaches to a car or SUV — perfect for outdoor trips with comfort and easy transport.",
  },
  {
    name: "Campervan",
    emoji: "🚐",
    description:
      "A campervan is a compact vehicle converted into a small mobile home with sleeping space, storage, and basic cooking facilities. Ideal for road trips, camping adventures, and flexible travel.",
  },
  {
    name: "Caravan",
    emoji: "🚋",
    description:
      "A caravan is a towed vehicle offering comfortable living space, sleeping quarters, and basic amenities. Perfect for extended road trips and outdoor adventures with a home-away-from-home feel.",
  },
];

const CategoryStep: React.FC<CategoryStepProps> = ({ category, onSelect }) => {
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
            Vehicle Type
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
          Choose a caravan category
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Select the type that best describes your vehicle.
        </p>
      </div>

      {/* ── Category list ── */}
      <div className="w-full flex flex-col gap-3">
        {CATEGORIES.map((cat) => {
          const selected = category === cat.name;
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelect(cat.name)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 18px",
                borderRadius: 16,
                border: `1.5px solid ${selected ? TEAL : GRAY_200}`,
                backgroundColor: selected ? TEAL_BG : WHITE,
                boxShadow: selected
                  ? `0 0 0 3px ${TEAL_RING}, 0 2px 12px rgba(0,0,0,0.04)`
                  : "0 1px 3px rgba(0,0,0,0.04)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
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
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = WHITE;
                }
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: selected ? "rgba(7,228,228,0.12)" : SURFACE,
                  border: `1.5px solid ${selected ? "rgba(7,228,228,0.3)" : GRAY_200}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                {cat.emoji}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: selected ? TEAL : BLACK,
                    letterSpacing: "-0.01em",
                    marginBottom: 3,
                    transition: "color 0.15s",
                  }}
                >
                  {cat.name}
                </p>
                <p
                  style={{
                    fontSize: 12.5,
                    color: GRAY_500,
                    lineHeight: 1.55,
                    fontWeight: 400,
                  }}
                >
                  {cat.description}
                </p>
              </div>

              {/* Selection indicator */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: `2px solid ${selected ? TEAL : GRAY_200}`,
                  backgroundColor: selected ? TEAL : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                {selected && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke={BLACK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryStep;
