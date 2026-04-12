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
  <div
    style={{
      backgroundColor: WHITE,
      border: "1.5px solid #EBEBEB",
      borderRadius: 20,
      padding: "20px 22px 22px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
    }}
  >
    <div className="flex items-center gap-3 mb-5">
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: TEAL_BG,
          border: "1.5px solid rgba(7,228,228,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2">
          <p style={{ fontSize: 13, fontWeight: 700, color: BLACK, letterSpacing: "-0.01em" }}>
            {title}
          </p>
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
            Categories
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
          Category Selection
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Select the categories that best describe your property.
        </p>

        {totalSelected > 0 && (
          <div className="flex justify-center mt-1">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                color: TEAL,
                backgroundColor: TEAL_BG,
                border: `1px solid ${TEAL_RING}`,
                borderRadius: 99,
                padding: "3px 12px",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke={TEAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
          const allSelected = sectionKeys.length > 0 && selectedInSection.length === sectionKeys.length;

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
                    style={{ width: 18, height: 18, objectFit: "contain" }}
                  />
                ) : (
                  <span style={{ fontSize: 16 }}>🏠</span>
                )
              }
              title={property.name}
              badge={
                selectedInSection.length > 0 ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: TEAL,
                      backgroundColor: TEAL_BG,
                      border: `1px solid ${TEAL_RING}`,
                      borderRadius: 99,
                      padding: "1px 9px",
                    }}
                  >
                    {selectedInSection.length}/{categories.length}
                  </span>
                ) : undefined
              }
              trailing={
                categories.length > 1 ? (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: TEAL,
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 0",
                      flexShrink: 0,
                    }}
                  >
                    {allSelected ? "Deselect all" : "Select all"}
                  </button>
                ) : undefined
              }
            >
              {categories.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "28px 0",
                    borderRadius: 13,
                    border: `2px dashed ${GRAY_200}`,
                  }}
                >
                  <p style={{ fontSize: 13, color: GRAY_400 }}>
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
                        {category.icon && (
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              opacity: selected ? 1 : 0.7,
                              transition: "opacity 0.15s",
                            }}
                          >
                            <img
                              src={getImageUrl(category.icon)}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            />
                          </span>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
                          {category.name}
                        </span>
                        {selected && (
                          <svg width="12" height="12" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, marginLeft: 2 }}>
                            <path d="M2 5l2.5 2.5L8 3" stroke={TEAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
