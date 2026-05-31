import React from "react";
import { cn, getImageUrl } from "@/lib/utils";

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
          <div className="w-6 h-[3px] rounded-full bg-th-brand" />
          <span className="text-[10.5px] font-bold tracking-[0.13em] uppercase text-th-warm-text-muted">
            Property Types
          </span>
          <div className="w-6 h-[3px] rounded-full bg-th-brand" />
        </div>
        <h1
          className="font-serif text-[#0A4670] tracking-[-0.015em] leading-[1.15]"
          style={{ fontSize: "clamp(24px, 3.6vw, 32px)", fontWeight: 400 }}
        >
          Types of Property
        </h1>
        <p className="text-[14px] text-th-warm-text-dark leading-[1.6]">
          Select the property types you'd like to list.
        </p>
      </div>

      {/* ── Property grid ── */}
      <div className="w-full bg-th-surface-0 border-[1.5px] border-th-warm-border rounded-[20px] p-[20px_22px_22px] shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Selected count badge */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] font-bold text-th-warm-text-dark uppercase tracking-[0.03em]">
            Properties
          </p>
          {selectedCount > 0 && (
            <span className="text-[11px] font-bold text-th-brand bg-th-brand-soft border border-[rgba(15,92,138,0.20)] rounded-full px-2.5 py-[2px]">
              {selectedCount} selected
            </span>
          )}
        </div>

        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
          {propertyTypes.map((property) => {
            const selected = selectedProperties.includes(property.id);
            return (
              <button
                key={property.id}
                type="button"
                onClick={() => onToggle(property.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-2.5 px-2.5 py-[18px] rounded-[16px] border-[1.5px] cursor-pointer transition-all duration-150",
                  selected
                    ? "border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_rgba(15,92,138,0.20)]"
                    : "border-th-warm-border bg-th-warm-surface hover:border-th-brand hover:bg-th-brand-soft",
                )}
              >
                {/* Selection check */}
                {selected && (
                  <div className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-th-brand flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "w-9 h-9 flex items-center justify-center transition-opacity duration-150",
                    selected ? "opacity-100" : "opacity-70",
                  )}
                >
                  <img
                    src={getImageUrl(property.icon)}
                    alt={property.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                {/* Name */}
                <span
                  className={cn(
                    "text-[12.5px] font-semibold tracking-[-0.01em] transition-colors duration-150 text-center leading-[1.3]",
                    selected ? "text-th-brand" : "text-th-warm-text-dark",
                  )}
                >
                  {property.name}
                </span>
              </button>
            );
          })}
        </div>

        {propertyTypes.length === 0 && (
          <p className="text-[13px] text-th-warm-text-muted text-center py-5">
            No property types available.
          </p>
        )}
      </div>
    </div>
  );
};

export default PropertyTypeStep;
