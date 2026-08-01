import React from "react";
import { cn } from "@/lib/utils";

interface CategoryStepProps {
  category: string | null;
  dynamicCategories?: any[];
  onSelect: (categoryName: string) => void;
  // Hide the kicker/title/subtitle and centered wrapper when used inside
  // an existing scrollable form (e.g. edit page).
  embedded?: boolean;
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

const CategoryStep: React.FC<CategoryStepProps> = ({ category, onSelect, embedded }) => {
  const list = (
    <div className="w-full flex flex-col gap-3">
      {CATEGORIES.map((cat) => {
        const selected = category === cat.name;
        return (
          <button
            key={cat.name}
            type="button"
            onClick={() => onSelect(cat.name)}
            className={cn(
              "w-full flex items-center gap-4 px-[18px] py-4 rounded-[16px] border-[1.5px] cursor-pointer text-left transition-all duration-150",
              selected
                ? "border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_var(--th-ring),0_2px_12px_rgba(0,0,0,0.04)]"
                : "border-th-warm-border bg-th-surface-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-th-brand hover:bg-th-brand-soft",
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "w-12 h-12 rounded-[14px] border-[1.5px] flex items-center justify-center text-[22px] shrink-0 transition-all duration-150",
                selected
                  ? "bg-[rgba(17, 116, 121,0.12)] border-th-brand-border-soft"
                  : "bg-th-warm-surface border-th-warm-border",
              )}
            >
              {cat.emoji}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-[14px] font-bold tracking-[-0.01em] mb-[3px] transition-colors duration-150",
                  selected ? "text-th-brand" : "text-th-text-primary",
                )}
              >
                {cat.name}
              </p>
              <p className="text-[12.5px] text-th-warm-text-dark leading-[1.55] font-normal">
                {cat.description}
              </p>
            </div>

            {/* Selection indicator */}
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150",
                selected ? "border-th-brand bg-th-brand" : "border-th-warm-border bg-transparent",
              )}
            >
              {selected && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5l2.5 2.5L8 3"
                    stroke="currentColor"
                    className="text-th-text-inverse"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  if (embedded) return list;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      {/* ── Header ── */}
      <div className="text-center space-y-2 pb-1">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-6 h-[3px] rounded-[99px] bg-th-brand" />
          <span className="text-[10.5px] font-bold tracking-[0.13em] uppercase text-th-warm-text-muted">
            Vehicle Type
          </span>
          <div className="w-6 h-[3px] rounded-[99px] bg-th-brand" />
        </div>
        <h1
          className="font-serif font-normal text-[#0d4548] tracking-[-0.015em] leading-[1.15]"
          style={{ fontSize: "clamp(24px, 3.6vw, 32px)" }}
        >
          Choose a caravan category
        </h1>
        <p className="text-[14px] text-th-warm-text-dark leading-[1.6]">
          Select the type that best describes your vehicle.
        </p>
      </div>

      {list}
    </div>
  );
};

export default CategoryStep;
