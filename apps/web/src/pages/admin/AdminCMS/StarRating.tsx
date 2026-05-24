import React from "react";

const STAR_PATH =
  "M7.80273 3.375L11.6465 4.20117L9.02637 7.11426L9.42285 11L5.82324 9.4248L2.22461 11L2.62012 7.11426L0 4.20117L3.84375 3.375L5.82324 0L7.80273 3.375Z";

export const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <div key={i} className="w-3 h-3 text-yellow-500">
          <svg viewBox="0 0 12 11" fill="currentColor" className="w-full h-full">
            <path d={STAR_PATH} />
          </svg>
        </div>
      ))}
      {hasHalfStar && (
        <div className="relative w-3 h-3">
          <div className="absolute inset-0 text-gray-300">
            <svg viewBox="0 0 12 11" fill="currentColor" className="w-full h-full">
              <path d={STAR_PATH} />
            </svg>
          </div>
          <div className="absolute inset-0 overflow-hidden w-1/2 text-yellow-500">
            <svg viewBox="0 0 12 11" fill="currentColor" className="w-full h-full">
              <path d={STAR_PATH} />
            </svg>
          </div>
        </div>
      )}
      {rating < 5 &&
        [...Array(5 - Math.ceil(rating))].map((_, i) => (
          <div
            key={i + fullStars + (hasHalfStar ? 1 : 0)}
            className="w-3 h-3 text-gray-300"
          >
            <svg viewBox="0 0 12 11" fill="currentColor" className="w-full h-full">
              <path d={STAR_PATH} />
            </svg>
          </div>
        ))}
    </div>
  );
};

export default StarRating;
