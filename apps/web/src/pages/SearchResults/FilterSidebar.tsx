import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type RangeVal = { minVal: number; maxVal: number };
type SetRange = React.Dispatch<React.SetStateAction<RangeVal>>;

type FilterOptions = {
  types: string[];
  categories: string[];
  facilities: string[];
};

interface FilterSidebarProps {
  onClose: () => void;
  activeFilter: "camper-van" | "unique-stays" | "activity";
  filterOptions: FilterOptions;
  priceBounds: { min: number; max: number; step: number };
  priceRange: RangeVal;
  setPriceRange: SetRange;
  sleepBounds: { min: number; max: number; step: number };
  sleepRange: RangeVal;
  setSleepRange: SetRange;
  seatBounds: { min: number; max: number; step: number };
  seatRange: RangeVal;
  setSeatRange: SetRange;
  selectedRating: string;
  setSelectedRating: (r: string) => void;
  selectedTypes: string[];
  setSelectedTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  selectedFacilities: string[];
  setSelectedFacilities: React.Dispatch<React.SetStateAction<string[]>>;
}

const RATING_OPTIONS = ["1+", "2+", "3+", "4+", "5+"];

const styles: Record<string, React.CSSProperties> = {
  wrapper: { width: "280px", background: "#fff", userSelect: "none" },
  track: {
    position: "relative",
    width: "100%",
    height: "6px",
    backgroundColor: "#e0e0e0",
    borderRadius: "3px",
    cursor: "pointer",
  },
  fill: {
    position: "absolute",
    height: "100%",
    backgroundColor: "#000",
    borderRadius: "3px",
  },
  thumb: {
    position: "absolute",
    top: "50%",
    width: "20px",
    height: "20px",
    backgroundColor: "#000",
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    border: "2px solid #fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    cursor: "grab",
    zIndex: 2,
  },
  label: {
    marginTop: "25px",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    display: "flex",
    justifyContent: "between",
    alignItems: "center",
  },
};

interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  range: RangeVal;
  setRange: SetRange;
  unit?: string;
}

function DualRangeSlider({ min, max, step, range, setRange, unit = "₹" }: DualRangeSliderProps) {
  const [activeThumb, setActiveThumb] = useState<"min" | "max" | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const getPercent = (value: number) => Math.round(((value - min) / (max - min)) * 100);

  const calculatePercent = (clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const offset = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(100, offset * 100));
  };

  const updateValue = (percent: number, thumb: "min" | "max") => {
    const rawValue = (percent / 100) * (max - min) + min;
    const value = Math.round(rawValue);
    setRange((prev) => {
      if (thumb === "min") {
        const val = Math.min(value, prev.maxVal - (step || 1));
        return { ...prev, minVal: Math.max(min, val) };
      }
      const val = Math.max(value, prev.minVal + (step || 1));
      return { ...prev, maxVal: Math.min(max, val) };
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const clickPercent = calculatePercent(e.clientX);
    const minPercent = getPercent(range.minVal);
    const maxPercent = getPercent(range.maxVal);
    const distanceToMin = Math.abs(clickPercent - minPercent);
    const distanceToMax = Math.abs(clickPercent - maxPercent);
    const thumb: "min" | "max" = distanceToMin < distanceToMax ? "min" : "max";
    setActiveThumb(thumb);
    updateValue(clickPercent, thumb);
  };

  useEffect(() => {
    if (!activeThumb) return;
    const handleMouseMove = (e: MouseEvent) => {
      updateValue(calculatePercent(e.clientX), activeThumb);
    };
    const handleMouseUp = () => setActiveThumb(null);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeThumb]);

  const minPercent = getPercent(range.minVal);
  const maxPercent = getPercent(range.maxVal);

  return (
    <div style={styles.wrapper} className="px-5">
      <div style={styles.track} ref={trackRef} onMouseDown={handleMouseDown}>
        <div
          style={{
            ...styles.fill,
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />
        <div style={{ ...styles.thumb, left: `${minPercent}%` }} />
        <div style={{ ...styles.thumb, left: `${maxPercent}%` }} />
      </div>
      <div style={styles.label} className="flex justify-between items-center">
        <span>
          <strong>
            {unit}
            {range.minVal}
          </strong>
        </span>
        <span>
          <strong>
            {unit}
            {range.maxVal}
          </strong>
        </span>
      </div>
    </div>
  );
}

/**
 * Sidebar with all SearchResults filters: price/sleeps/seating range sliders,
 * rating buttons, and Type/Category/Facilities checkbox groups. Pure
 * presentation — all state lives in the parent and is wired via props.
 */
export function FilterSidebar({
  onClose,
  activeFilter,
  filterOptions,
  priceBounds,
  priceRange,
  setPriceRange,
  sleepBounds,
  sleepRange,
  setSleepRange,
  seatBounds,
  seatRange,
  setSeatRange,
  selectedRating,
  setSelectedRating,
  selectedTypes,
  setSelectedTypes,
  selectedCategories,
  setSelectedCategories,
  selectedFacilities,
  setSelectedFacilities,
}: FilterSidebarProps) {
  return (
    <div className="w-full lg:w-80 xl:w-80">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-semibold text-gray-900">Filters</h3>
          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Price</h4>
          <DualRangeSlider
            min={priceBounds.min}
            max={priceBounds.max}
            step={priceBounds.step}
            range={priceRange}
            setRange={setPriceRange}
          />
        </div>

        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Rating</h4>
          <div className="flex gap-2 flex-wrap">
            {RATING_OPTIONS.map((rating) => (
              <button
                key={rating}
                onClick={() => setSelectedRating(rating)}
                className={`px-3 py-1.5 rounded-md border text-sm font-medium ${
                  selectedRating <= rating
                    ? "bg-[#0F5C8A] text-white border-black"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        </div>

        {activeFilter === "camper-van" && (
          <div className="mb-2">
            <h4 className="text-base font-medium text-gray-900 mb-4">Sleeps</h4>
            <DualRangeSlider
              min={sleepBounds.min}
              max={sleepBounds.max}
              step={sleepBounds.step}
              range={sleepRange}
              setRange={setSleepRange}
              unit=""
            />
          </div>
        )}

        {activeFilter === "camper-van" && (
          <div className="mb-2">
            <h4 className="text-base font-medium text-gray-900 mb-2">Seating</h4>
            <DualRangeSlider
              min={seatBounds.min}
              max={seatBounds.max}
              step={seatBounds.step}
              range={seatRange}
              setRange={setSeatRange}
              unit=""
            />
          </div>
        )}

        <div className="mb-2">
          <h4 className="text-base font-medium text-gray-900 mb-4">Type</h4>
          <div className="space-y-3">
            {filterOptions.types.map((item, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(item)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTypes([...selectedTypes, item]);
                    } else {
                      setSelectedTypes(selectedTypes.filter((t) => t !== item));
                    }
                  }}
                  className="w-5 h-5 rounded border-gray-400"
                />
                {item}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-2">
          <h4 className="text-base font-medium text-gray-900 mb-4">Category</h4>
          <div className="space-y-3">
            {filterOptions.categories.map((item, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(item)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, item]);
                    } else {
                      setSelectedCategories(selectedCategories.filter((c) => c !== item));
                    }
                  }}
                  className="w-5 h-5 rounded border-gray-400"
                />
                {item}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-base font-medium text-gray-900 mb-2">Facilities</h4>
          <div className="space-y-3">
            {filterOptions.facilities.map((item, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedFacilities.includes(item)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFacilities([...selectedFacilities, item]);
                    } else {
                      setSelectedFacilities(selectedFacilities.filter((f) => f !== item));
                    }
                  }}
                  className="w-5 h-5 rounded border-gray-400"
                />
                {item}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterSidebar;
