import React from "react";
import { getImageUrl } from "@/lib/utils";

interface CategoryStepProps {
  category: string | null;
  dynamicCategories: any[];
  onSelect: (categoryName: string) => void;
}

const CategoryStep: React.FC<CategoryStepProps> = ({
  category,
  dynamicCategories,
  onSelect,
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-9">
      <h1 className="text-[32px] max-sm:text-xl font-bold text-black dark:text-white font-sanse text-center">
        Choose a Camper Van Category
      </h1>

      <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
        {dynamicCategories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelect(cat.name)}
            className={`flex items-start gap-6 p-5 rounded-xl border cursor-pointer transition-all duration-200 onb-card ${
              category === cat.name
                ? "onb-card-selected"
                : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[var(--th-accent)] dark:hover:border-white"
            }`}
          >
            <img
              src={getImageUrl(cat.icon)}
              alt={cat.name}
              className="w-12 h-12 object-contain"
            />
            <div className="flex-1 flex flex-col gap-2">
              <h3 className="text-base font-semibold text-black dark:text-white font-['Plus_Jakarta_Sans']">
                {cat.name}
              </h3>
              <p className="text-sm text-[#334054] dark:text-gray-400 font-['Plus_Jakarta_Sans'] leading-[150%]">
                {cat.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryStep;
