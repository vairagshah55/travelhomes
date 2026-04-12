import React from "react";
import { getImageUrl } from "@/lib/utils";

interface ActivityType {
  id: string;
  name: string;
  icon: string;
}

interface TypeStepProps {
  selectedActivities: string[];
  activityTypes: ActivityType[];
  onToggle: (id: string) => void;
}

const TypeStep: React.FC<TypeStepProps> = ({
  selectedActivities,
  activityTypes,
  onToggle,
}) => {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
      <h1 className="text-3xl  font-bold text-black dark:text-white text-center">
        Types of Activity
      </h1>

      <div className="max-w-2xl mx-auto flex flex-wrap items-center gap-3 w-full">
        {activityTypes.map((activity) => {
          const isSelected = selectedActivities.includes(activity.id);
          return (
            <button
              key={activity.id}
              onClick={() => onToggle(activity.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all onb-card ${
                isSelected
                  ? "onb-pill-selected text-[var(--th-accent)]"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
              type="button"
            >
              <span className="text-lg w-[20px] h-[20px]">
                <img
                  src={getImageUrl(activity.icon)}
                  alt={activity.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </span>
              <span className="text-sm font-medium">{activity.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TypeStep;
