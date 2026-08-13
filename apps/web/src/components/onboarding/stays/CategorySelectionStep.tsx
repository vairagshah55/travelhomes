import React from "react";
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

/* ─── Section card ────────────────────────────────────────────────────────── */
const SectionCard = ({
  icon,
  title,
  badge,
  trailing,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-th-surface-0 border-[1.5px] border-th-warm-border rounded-[20px] p-[20px_22px_22px] shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-[11px] bg-th-brand-soft border-[1.5px] border-[rgba(59,217,218,0.5)] flex items-center justify-center shrink-0 overflow-hidden">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold text-th-text-primary tracking-[-0.01em]">{title}</p>
          {badge}
        </div>
      </div>
      {trailing}
    </div>
    <div className="flex flex-col gap-4">{children}</div>
  </div>
);

const CategorySelectionStep: React.FC<CategorySelectionStepProps> = ({
  selectedProperties,
  selectedCategories,
  propertyTypes,
  getEffectiveCategories,
  onCategoryToggle,
}) => {
  const totalSelected = selectedCategories.length;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      {/* ── Header ── */}
      <div className="text-center space-y-2 pb-1">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-6 h-[3px] rounded-full bg-th-brand" />
          <span className="text-[10.5px] font-bold tracking-[0.13em] uppercase text-th-warm-text-muted">
            Categories
          </span>
          <div className="w-6 h-[3px] rounded-full bg-th-brand" />
        </div>
        <h1
          className="font-serif text-[#0d4548] tracking-[-0.015em] leading-[1.15]"
          style={{ fontSize: "clamp(24px, 3.6vw, 32px)", fontWeight: 400 }}
        >
          Category Selection
        </h1>
        <p className="text-[14px] text-th-warm-text-dark leading-[1.6]">
          Select the categories that best describe your property.
        </p>

        {totalSelected > 0 && (
          <div className="flex justify-center mt-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-th-brand bg-th-brand-soft border border-[rgba(59,217,218,0.4)] rounded-full px-3 py-[3px]">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
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
          </div>
        )}
      </div>

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
              badge={
                selectedInSection.length > 0 ? (
                  <span className="text-[11px] font-bold text-th-brand bg-th-brand-soft border border-[rgba(59,217,218,0.4)] rounded-full px-[9px] py-[1px]">
                    {selectedInSection.length}/{categories.length}
                  </span>
                ) : undefined
              }
              trailing={
                categories.length > 1 ? (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[12px] font-bold text-th-brand bg-transparent border-none cursor-pointer py-1 shrink-0"
                  >
                    {allSelected ? "Deselect all" : "Select all"}
                  </button>
                ) : undefined
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
                            ? "border-th-brand-border-soft bg-th-brand-soft shadow-[0_0_0_3px_rgba(59,217,218,0.4)] text-th-brand"
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
