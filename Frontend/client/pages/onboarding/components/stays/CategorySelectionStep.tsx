import React from "react";
import { getImageUrl } from "@/lib/utils";

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
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
      <div className="w-full flex flex-col items-start gap-2.5">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white font-geist leading-normal text-center w-full">
          Category Selection
        </h1>
        <p className="text-lg text-[#5D5D5D] dark:text-gray-400 font-geist leading-normal text-center w-full">
          Select categories for your selected property types
        </p>
      </div>

      {/* Categories based on selected property types */}
      <div className="max-w-6xl mx-auto w-full">
        {selectedProperties.map((propertyId) => {
          const property = propertyTypes.find((p) => p.id === propertyId);
          const categories = getEffectiveCategories(propertyId);

          return (
            <div key={propertyId} className="mb-8">
              <div
                className="
                  grid
                  grid-cols-2
                  sm:grid-cols-3
                  md:grid-cols-4
                  lg:grid-cols-5
                  gap-4
                "
              >
                {categories.map((category) => {
                  const categoryKey = `${propertyId}-${category.id}`;
                  const isSelected = selectedCategories.includes(categoryKey);

                  return (
                    <div
                      key={categoryKey}
                      onClick={() => onCategoryToggle(categoryKey)}
                      className={`
                        flex flex-col items-center justify-center
                        p-4 rounded-xl border cursor-pointer text-center onb-card
                        ${
                          isSelected
                            ? "onb-card-selected"
                            : "border-[#EAECF0] bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                        }
                      `}
                    >
                      <img
                        src={getImageUrl(category.icon)}
                        className="w-6 h-6 sm:w-7 sm:h-7 mb-2 object-contain"
                        alt={category.name}
                      />

                      <p className="text-xs sm:text-sm md:text-base font-medium text-[#4B4B4B] dark:text-gray-300 text-center">
                        {category.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySelectionStep;
