import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

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
  // Fluid instead of a flat 280px — the mobile filter dialog can be narrower
  // than that on small phones (e.g. 320px viewports), which pushed this past
  // the panel edge. Capping at 300px keeps the desktop/tablet look intact.
  wrapper: { width: "100%", maxWidth: "300px", background: "#fff", userSelect: "none" },
  track: {
    position: "relative",
    width: "100%",
    height: "6px",
    backgroundColor: "#e6efef",
    borderRadius: "3px",
    cursor: "pointer",
  },
  fill: {
    position: "absolute",
    height: "100%",
    background: "linear-gradient(90deg, #117479, #128086)",
    borderRadius: "3px",
  },
  thumb: {
    position: "absolute",
    top: "50%",
    width: "20px",
    height: "20px",
    backgroundColor: "#fff",
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    border: "2.5px solid #117479",
    boxShadow: "0 2px 6px rgba(17, 116, 121, 0.35)",
    cursor: "grab",
    zIndex: 2,
  },
  label: {
    marginTop: "18px",
    fontSize: "14px",
    fontWeight: 700,
    color: "#0a1c1c",
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
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
          <button
            onClick={onClose}
            aria-label="Back"
            className="lg:hidden -ml-2 p-2 text-gray-500 hover:text-[#117479] rounded-full hover:bg-[#117479]/5 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-[#0a1c1c] tracking-tight">Filters</h3>
        </div>

        <div className="mb-6 pb-6 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-[#0a1c1c] mb-4">Price</h4>
          <DualRangeSlider
            min={priceBounds.min}
            max={priceBounds.max}
            step={priceBounds.step}
            range={priceRange}
            setRange={setPriceRange}
          />
        </div>

        <div className="mb-6 pb-6 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-[#0a1c1c] mb-3">Rating</h4>
          <div className="flex gap-2 flex-wrap">
            {RATING_OPTIONS.map((rating) => (
              <button
                key={rating}
                onClick={() => setSelectedRating(rating)}
                className={`px-3.5 py-2 rounded-full border text-sm font-semibold transition-all duration-200 active:scale-95 ${
                  selectedRating <= rating
                    ? "bg-gradient-to-r from-[#117479] to-[#128086] text-white border-transparent shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#117479]/40 hover:text-[#117479]"
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        </div>

        {activeFilter === "camper-van" && (
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-[#0a1c1c] mb-4">Sleeps</h4>
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
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-[#0a1c1c] mb-4">Seating</h4>
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

        <div className="mb-6 pb-6 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-[#0a1c1c] mb-4">Type</h4>
          <div className="space-y-3.5">
            {filterOptions.types.map((item, index) => (
              <label
                key={index}
                className="flex items-center gap-3 cursor-pointer text-gray-600 hover:text-[#0a1c1c] transition-colors"
              >
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
                  className="w-[18px] h-[18px] rounded-md border-gray-300 accent-[#117479] cursor-pointer"
                />
                <span className="text-[14px]">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6 pb-6 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-[#0a1c1c] mb-4">Category</h4>
          <div className="space-y-3.5">
            {filterOptions.categories.map((item, index) => (
              <label
                key={index}
                className="flex items-center gap-3 cursor-pointer text-gray-600 hover:text-[#0a1c1c] transition-colors"
              >
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
                  className="w-[18px] h-[18px] rounded-md border-gray-300 accent-[#117479] cursor-pointer"
                />
                <span className="text-[14px]">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#0a1c1c] mb-4">Facilities</h4>
          <div className="space-y-3.5">
            {filterOptions.facilities.map((item, index) => (
              <label
                key={index}
                className="flex items-center gap-3 cursor-pointer text-gray-600 hover:text-[#0a1c1c] transition-colors"
              >
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
                  className="w-[18px] h-[18px] rounded-md border-gray-300 accent-[#117479] cursor-pointer"
                />
                <span className="text-[14px]">{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterSidebar;
