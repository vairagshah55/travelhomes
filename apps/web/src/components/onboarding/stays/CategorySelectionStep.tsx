import React from "react";
import { SectionCard, StepHeader } from "../shared/primitives";
import { cn, getImageUrl } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface PropertyType {
  id: string;
  name: string;
  icon: string;
}

interface CategorySelectionStepProps {
  selectedProperties: string[];
  selectedCategories: string[];
  propertyTypes: PropertyType[];
  getEffectiveCategories: (propertyId: string) => Category[];
  onCategoryToggle: (categoryKey: string) => void;
}

/* This file used to define its own `SectionCard` — a copy of the shared
   primitive frozen at the pre-revamp styling (1.5px warm border, rounded-20,
   a two-layer local shadow, a 36px icon chip with a raw rgba(59,217,218,.5)
   outline, 13px title). It now uses the shared one, so these cards match the
   caravan steps and pick up --onb-card-border / --onb-card-shadow. The old
   `badge` + `trailing` slots both map onto the shared `action` slot. */

const CategorySelectionStep: React.FC<CategorySelectionStepProps> = ({
  selectedProperties,
  selectedCategories,
  propertyTypes,
  getEffectiveCategories,
  onCategoryToggle,
}) => {
  const totalSelected = selectedCategories.length;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Shared StepHeader — see the note in PropertyTypeStep; this file carried
          a byte-identical copy of the same hand-rolled centred heading. The
          running count moves to `extra`, which is what that slot is for (the
          caravan PricingStep uses it the same way). */}
      <StepHeader
        kicker="Categories"
        subtitle="Select the categories that best describe your property."
        extra={
          totalSelected > 0 ? (
            <span className="mt-3.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-th-brand bg-th-brand-soft border border-th-brand-border-soft rounded-full px-3 py-[3px]">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path
                  d="M2 5l2.5 2.5L8 3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {totalSelected} selected
            </span>
          ) : undefined
        }
      />

      {/* ── Sections per property type ── */}
      <div className="w-full flex flex-col gap-4">
        {selectedProperties.map((propertyId) => {
          const property = propertyTypes.find((p) => p.id === propertyId);
          const categories = getEffectiveCategories(propertyId);

          if (!property) return null;

          const sectionKeys = categories.map((c) => `${propertyId}-${c.id}`);
          const selectedInSection = sectionKeys.filter((k) => selectedCategories.includes(k));
          const allSelected =
            sectionKeys.length > 0 && selectedInSection.length === sectionKeys.length;

          const handleSelectAll = () => {
            if (allSelected) {
              sectionKeys.forEach((k) => {
                if (selectedCategories.includes(k)) onCategoryToggle(k);
              });
            } else {
              sectionKeys.forEach((k) => {
                if (!selectedCategories.includes(k)) onCategoryToggle(k);
              });
            }
          };

          return (
            <SectionCard
              key={propertyId}
              icon={
                property.icon ? (
                  <img
                    src={getImageUrl(property.icon)}
                    alt={property.name}
                    className="w-[18px] h-[18px] object-contain"
                  />
                ) : (
                  <span className="text-base">🏠</span>
                )
              }
              title={property.name}
              bodyGap
              action={
                <div className="flex items-center gap-2.5 shrink-0">
                  {selectedInSection.length > 0 && (
                    <span className="text-[11px] font-bold text-th-brand bg-th-brand-soft border border-th-brand-border-soft rounded-full px-[9px] py-[1px] whitespace-nowrap">
                      {selectedInSection.length}/{categories.length}
                    </span>
                  )}
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[12px] font-bold text-th-brand bg-transparent border-none cursor-pointer py-1 shrink-0 whitespace-nowrap"
                    >
                      {allSelected ? "Deselect all" : "Select all"}
                    </button>
                  )}
                </div>
              }
            >
              {categories.length === 0 ? (
                <div className="flex items-center justify-center py-7 rounded-[13px] border-2 border-dashed border-th-warm-border">
                  <p className="text-[13px] text-th-warm-text-muted">
                    No categories available for this property type
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {categories.map((category) => {
                    const categoryKey = `${propertyId}-${category.id}`;
                    const selected = selectedCategories.includes(categoryKey);

                    return (
                      <button
                        key={categoryKey}
                        type="button"
                        onClick={() => onCategoryToggle(categoryKey)}
                        className={cn(
                          "flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] cursor-pointer transition-all duration-150",
                          selected
                            ? "border-th-brand-border-soft bg-th-brand-soft shadow-[0_0_0_3px_var(--th-ring)] text-th-brand"
                            : "border-th-warm-border bg-th-warm-surface text-th-warm-text-dark hover:border-th-brand hover:bg-th-brand-soft",
                        )}
                      >
                        {category.icon && (
                          <span
                            className={cn(
                              "w-4 h-4 flex items-center justify-center shrink-0 transition-opacity duration-150",
                              selected ? "opacity-100" : "opacity-70",
                            )}
                          >
                            <img
                              src={getImageUrl(category.icon)}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          </span>
                        )}
                        <span className="text-[13px] font-semibold tracking-[-0.01em]">
                          {category.name}
                        </span>
                        {selected && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 10 10"
                            fill="none"
                            className="shrink-0 ml-0.5 text-th-brand"
                          >
                            <path
                              d="M2 5l2.5 2.5L8 3"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySelectionStep;
