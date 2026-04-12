import React from "react";
import { getImageUrl } from "@/lib/utils";

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
  errors,
}) => {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
      <div className="text-center space-y-2">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Types of Property
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select the property types you'd like to list
        </p>
      </div>

      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {propertyTypes.map((property, index) => {
          const isSelected = selectedProperties.includes(property.id);
          return (
            <button
              key={property.id}
              type="button"
              onClick={() => onToggle(property.id)}
              style={{ animationDelay: `${index * 60}ms` }}
              className={`relative flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl border-2 text-center onb-card onb-fade-up
                ${
                  isSelected
                    ? "onb-card-selected"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
            >
              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--th-accent)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="var(--th-accent-fg)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
              <div className="w-10 h-10 flex items-center justify-center">
                <img
                  src={getImageUrl(property.icon)}
                  alt={property.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <span
                className={`text-sm font-medium transition-colors ${
                  isSelected
                    ? "text-black dark:text-white"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {property.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PropertyTypeStep;
