import React from "react";
import indianCities from "../data/indian_cities.json";

export function LocationDropdown({
  searchQuery,
  onSelect,
  onClose,
}: {
  searchQuery: string;
  onSelect: (location: string) => void;
  onClose: () => void;
}) {
  const locations = indianCities;

  const filteredLocations = locations.filter((location) =>
    location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="absolute max-h-80 overflow-y-scroll scrollbar-hide top-full left-0 mt-2 w-full bg-white rounded-3xl shadow-lg p-4 z-[9999] border border-gray-200">
      {filteredLocations.length > 0 ? (
        filteredLocations.map((location) => (
          <button
            key={location}
            onClick={() => {
              onSelect(location);
              onClose();
            }}
            className="block w-full font-medium text-left px-4 py-2 rounded-md text-gray-800 hover:bg-gray-100 text-sm"
          >
            {location}
          </button>
        ))
      ) : (
        <div className="px-4 py-2 text-gray-500 text-sm">No results found</div>
      )}
    </div>
  );
}
