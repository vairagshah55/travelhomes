import React from "react";
import { Home } from "lucide-react";
import { SectionCard, StepHeader } from "../shared/primitives";
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
    <div className="w-full flex flex-col gap-6">
      {/* Shared StepHeader — this step carried a copy of the same hand-rolled
          centred, dash-flanked heading with its own inline clamp() size that
          the caravan steps dropped when the shared header landed. The compact
          variant (kicker, no title) is used for the same reason as caravan:
          the progress rail already names the phase, so "Types of Property"
          under "PROPERTY TYPES" was the third restatement in a row. */}
      <StepHeader
        kicker="Property Types"
        subtitle="Select the property types you'd like to list."
      />

      {/* ── Property grid ── */}
      <SectionCard
        icon={<Home size={16} className="text-th-brand" strokeWidth={2.5} />}
        title="Properties"
        subtitle="Pick every type this listing covers"
        action={
          selectedCount > 0 ? (
            <span className="text-[11px] font-bold text-th-brand bg-th-brand-soft border border-th-brand-border-soft rounded-full px-2.5 py-[2px] whitespace-nowrap">
              {selectedCount} selected
            </span>
          ) : undefined
        }
      >
        <div
          className="grid gap-2.5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}
        >
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
                    ? "border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_var(--th-ring),0_2px_12px_rgba(0,0,0,0.04)]"
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
      </SectionCard>
    </div>
  );
};

export default PropertyTypeStep;
