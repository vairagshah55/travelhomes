import { useState } from "react";

export interface Amenity {
  icon: React.ReactNode;
  label: string;
}

export interface AmenitiesGridProps {
  amenities: Amenity[];
  maxVisible?: number;
  className?: string;
}

export default function AmenitiesGrid({
  amenities,
  maxVisible = 8,
  className = "",
}: AmenitiesGridProps) {
  const [showAll, setShowAll] = useState(false);

  const hasMore = amenities.length > maxVisible;
  const visible = showAll ? amenities : amenities.slice(0, maxVisible);

  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {visible.map((amenity, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-ds-ocean w-5 h-5 flex-shrink-0 flex items-center justify-center">
              {amenity.icon}
            </span>
            <span
              className="text-ds-charcoal font-sans"
              style={{ fontSize: "15px" }}
            >
              {amenity.label}
            </span>
          </div>
        ))}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 text-ds-deep underline text-sm font-sans hover:text-ds-navy transition-colors duration-200"
        >
          Show all {amenities.length} amenities &rarr;
        </button>
      )}
    </div>
  );
}
