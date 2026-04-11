import React, { useMemo } from "react";
import { MapPin } from "lucide-react";
import indianCities from "../data/indian_cities.json";

const MAX_RESULTS = 20;

export function LocationDropdown({
  searchQuery,
  onSelect,
  onClose,
}: {
  searchQuery: string;
  onSelect: (location: string) => void;
  onClose: () => void;
}) {
  const q = searchQuery.trim().toLowerCase();

  const filteredLocations = useMemo(() => {
    if (!q) return indianCities.slice(0, MAX_RESULTS);
    const results: string[] = [];
    for (const city of indianCities) {
      if (city.toLowerCase().includes(q)) {
        results.push(city);
        if (results.length >= MAX_RESULTS) break;
      }
    }
    return results;
  }, [q]);

  return (
    <div className="absolute max-h-80 overflow-y-auto scrollbar-hide top-[calc(100%+24px)] left-0 w-[300px] bg-white rounded-2xl shadow-xl p-2 z-[9999] border border-gray-100">
      {filteredLocations.length > 0 ? (
        filteredLocations.map((location) => (
          <button
            key={location}
            onClick={() => {
              onSelect(location);
              onClose();
            }}
            className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-gray-800 hover:bg-gray-50 transition-colors duration-150 group"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors flex-shrink-0">
              <MapPin className="w-4 h-4 text-gray-500" />
            </span>
            <span className="font-medium text-sm truncate">{location}</span>
          </button>
        ))
      ) : (
        <div className="flex items-center gap-3 px-3 py-4 text-gray-400 text-sm">
          <MapPin className="w-4 h-4" />
          No results found
        </div>
      )}
    </div>
  );
}
