import React from "react";

export interface AmenityItem {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
}

interface AmenitiesSectionProps {
  amenities: AmenityItem[];
  visibleAmenities: AmenityItem[];
  showAll: boolean;
  onShowAll: () => void;
  /** Section heading — UniqueStay/CamperVan use "Amenities"; Activity uses "Features & Amenities". */
  heading?: string;
  /** Visual threshold for showing the "Show all" link (defaults to 12). */
  showAllThreshold?: number;
}

/**
 * Amenities grid section. Renders the visible subset and a "Show all" link when
 * there are more than `showAllThreshold` total.
 */
export function AmenitiesSection({
  amenities,
  visibleAmenities,
  showAll,
  onShowAll,
  heading = "Amenities",
  showAllThreshold = 12,
}: AmenitiesSectionProps) {
  if (amenities.length === 0) return null;
  return (
    <div id="amenities" className="scroll-mt-36 space-y-5">
      <div className="h-px bg-gray-100 dark:bg-gray-800" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{heading}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleAmenities.map((amenity, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <amenity.icon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-200">{amenity.name}</span>
          </div>
        ))}
      </div>
      {!showAll && amenities.length > showAllThreshold && (
        <button
          onClick={onShowAll}
          className="text-sm font-medium text-gray-900 dark:text-white underline underline-offset-2 hover:text-gray-600"
        >
          Show all {amenities.length} amenities
        </button>
      )}
    </div>
  );
}

export default AmenitiesSection;
