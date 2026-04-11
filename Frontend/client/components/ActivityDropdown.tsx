import React from "react";
import { Star } from "lucide-react";

export function ActivityDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (activity: string) => void;
  onClose: () => void;
}) {
  const activities = [
    "Tracking",
    "Hiking",
    "Camping",
    "Photography",
    "Bird Watching",
  ];

  return (
    <div className="absolute top-[calc(100%+24px)] left-0 w-[300px] bg-white rounded-2xl shadow-xl p-2 z-[9999] border border-gray-100">
      {activities.map((activity) => (
        <button
          key={activity}
          onClick={() => {
            onSelect(activity);
            onClose();
          }}
          className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-gray-800 hover:bg-gray-50 transition-colors duration-150 group"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors flex-shrink-0">
            <Star className="w-4 h-4 text-gray-500" />
          </span>
          <span className="font-medium text-sm">{activity}</span>
        </button>
      ))}
    </div>
  );
}
