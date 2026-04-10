import React from "react";
import { Search } from "lucide-react";

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
    <div className="absolute top-full left-0 mt-2 w-full max-w-sm bg-white rounded-3xl shadow-lg p-6 z-[9999] min-w-[300px]">
      {/* <div className="flex items-center justify-between mb-6 bg-gray-100 rounded-full p-2">
        <div className="flex items-center gap-4 px-4 flex-1">
          <Search className="w-4 h-4 text-gray-600" />
          <input
            type="text"
            placeholder="Search activity"
            className="flex-1 bg-transparent text-gray-800 placeholder:text-gray-600 text-sm outline-none"
          />
        </div>
        <button className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
          <Search className="w-4 h-4 text-white" />
        </button>
      </div> */}

      <div className="space-y-5">
        {activities.map((activity) => (
          <div key={activity} className="flex items-center gap-3">
            <div className="flex-1 px-3">
              <button
                onClick={() => {
                  onSelect(activity);
                  onClose();
                }}
                className="text-left text-black text-sm font-normal hover:text-gray-600 transition-colors w-full"
              >
                {activity}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
