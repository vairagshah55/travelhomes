import React from "react";
import { getImageUrl } from "@/lib/utils";
import { Check } from "lucide-react";

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

const CategorySelectionStep: React.FC<CategorySelectionStepProps> = ({
  selectedProperties,
  selectedCategories,
  propertyTypes,
  getEffectiveCategories,
  onCategoryToggle,
}) => {
  const totalSelected = selectedCategories.length;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Category Selection
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select the categories that best describe your property
        </p>
        {totalSelected > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: 'var(--th-accent)', color: 'var(--th-accent-fg)' }}>
            <Check size={11} />
            {totalSelected} selected
          </span>
        )}
      </div>

      {/* Sections per property type */}
      <div className="w-full flex flex-col gap-8">
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
            <div key={propertyId} className="flex flex-col gap-4">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {property.icon && (
                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700">
                      <img
                        src={getImageUrl(property.icon)}
                        alt={property.name}
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-black dark:text-white">
                    {property.name}
                  </span>
                  {selectedInSection.length > 0 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({selectedInSection.length}/{categories.length})
                    </span>
                  )}
                </div>

                {categories.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-medium transition-colors"
                    style={{ color: 'var(--th-accent)' }}
                  >
                    {allSelected ? "Deselect all" : "Select all"}
                  </button>
                )}
              </div>

              {/* Category pills */}
              {categories.length === 0 ? (
                <div className="flex items-center justify-center py-8 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No categories available for this property type
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {categories.map((category) => {
                    const categoryKey = `${propertyId}-${category.id}`;
                    const isSelected = selectedCategories.includes(categoryKey);

                    return (
                      <button
                        key={categoryKey}
                        type="button"
                        onClick={() => onCategoryToggle(categoryKey)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all duration-150 active:scale-95 ${
                          isSelected
                            ? "onb-pill-selected"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                        }`}
                      >
                        {category.icon && (
                          <img
                            src={getImageUrl(category.icon)}
                            alt=""
                            className="w-4 h-4 object-contain"
                          />
                        )}
                        <span>{category.name}</span>
                        {isSelected && (
                          <Check size={13} className="ml-0.5 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Divider between sections */}
              {selectedProperties.indexOf(propertyId) < selectedProperties.length - 1 && (
                <div className="w-full h-px bg-gray-100 dark:bg-gray-800 mt-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySelectionStep;
