import React from "react";
import { Heart, MapPin, Star as StarIcon } from "lucide-react";
import { useObjectURL } from "../shared/primitives";

interface ActiveDiscount {
  originalPrice: number;
  finalPrice: number;
  label: string;
}

interface CaravanCardPreviewProps {
  name: string;
  description: string;
  coverImage: (string | File)[];
  photos: (string | File)[];
  city?: string;
  state?: string;
  perDayCharge?: string | number;
  perKmCharge?: string | number;
  activeDiscount?: ActiveDiscount | null;
}

const PLACEHOLDER_TITLE = "Your caravan name";

const CaravanCardPreview: React.FC<CaravanCardPreviewProps> = ({
  name,
  description,
  coverImage,
  photos,
  city,
  state,
  perDayCharge,
  perKmCharge,
  activeDiscount,
}) => {
  const cover = coverImage?.[0];
  const coverSrc = useObjectURL(cover ?? null);
  const galleryCount = photos.length;
  const totalImages = (cover ? 1 : 0) + galleryCount;

  const locationParts = [city, state].filter(Boolean);
  const locationText = locationParts.length > 0 ? locationParts.join(", ") : null;

  const dailyRate = perDayCharge && Number(perDayCharge) > 0 ? Number(perDayCharge) : null;
  const kmRate = perKmCharge && Number(perKmCharge) > 0 ? Number(perKmCharge) : null;
  const baseRate = dailyRate ?? kmRate;
  const baseUnit = dailyRate ? "/ day" : kmRate ? "/ km" : null;

  return (
    <div className="w-full max-w-[320px] mx-auto">
      {/* Preview label */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "#185FA5" }}
        />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            color: "#888780",
          }}
        >
          Live Preview
        </span>
      </div>

      {/* Card mirroring ResultCard */}
      <div className="rounded-2xl p-1.5 pb-3 bg-white shadow-[0_8px_30px_rgba(4,44,83,0.08)] border border-[#EBEBEB]">
        {/* Image */}
        <div className="relative">
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl bg-[#F7F8FA]">
            {coverSrc ? (
              <img
                src={coverSrc}
                alt={name || PLACEHOLDER_TITLE}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(24, 95, 165, 0.07)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                      stroke="#185FA5"
                      strokeWidth="1.8"
                    />
                    <circle cx="9" cy="11" r="1.5" fill="#185FA5" />
                    <path
                      d="M21 16l-5-5-9 8"
                      stroke="#185FA5"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-[11px] font-medium text-[#888780]">
                  Cover photo will appear here
                </p>
              </div>
            )}

            {/* Heart stub — non-interactive */}
            <div className="absolute top-2.5 right-2.5 z-30 w-8 h-8 rounded-full flex items-center justify-center bg-black/25 backdrop-blur-md pointer-events-none">
              <Heart className="w-[18px] h-[18px] text-white drop-shadow-sm" />
            </div>

            {/* Photo count badge */}
            {totalImages > 0 && (
              <div className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-sm pointer-events-none">
                <span className="text-[10px] font-semibold text-white tracking-wide">
                  {totalImages} {totalImages === 1 ? "photo" : "photos"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="pt-3 px-1 space-y-1.5">
          {/* Title + Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-semibold text-[15px] leading-snug line-clamp-1 ${
                name ? "text-gray-900" : "text-[#A8A6A0] italic"
              }`}
            >
              {name || PLACEHOLDER_TITLE}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
              <StarIcon className="w-3.5 h-3.5 fill-current text-gray-300" />
              <span className="text-[12px] font-medium text-[#888780]">New</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span
              className={`text-[13px] truncate ${
                locationText ? "text-gray-500" : "text-[#A8A6A0] italic"
              }`}
            >
              {locationText ?? "Location — added in next step"}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 pt-1 flex-wrap">
            {activeDiscount && activeDiscount.finalPrice > 0 ? (
              <>
                <span className="text-[13px] text-gray-400 line-through">
                  ₹{activeDiscount.originalPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-[15px] font-bold text-gray-900">
                  ₹{activeDiscount.finalPrice.toLocaleString("en-IN")}
                </span>
                {baseUnit && <span className="text-[13px] text-gray-500">{baseUnit}</span>}
              </>
            ) : baseRate ? (
              <>
                <span className="text-[15px] font-bold text-gray-900">
                  ₹{baseRate.toLocaleString("en-IN")}
                </span>
                <span className="text-[13px] text-gray-500">{baseUnit}</span>
              </>
            ) : (
              <span className="text-[13px] text-[#A8A6A0] italic">
                Pricing — added in step 4
              </span>
            )}
          </div>

          {/* Discount label */}
          {activeDiscount && activeDiscount.finalPrice > 0 && (
            <div className="pt-0.5">
              <span
                className="inline-block text-[10.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  color: "#185FA5",
                  backgroundColor: "rgba(24, 95, 165, 0.08)",
                  border: "1px solid rgba(24, 95, 165, 0.25)",
                  letterSpacing: "0.06em",
                }}
              >
                {activeDiscount.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description excerpt below the card — what guests see on detail page */}
      {description && (
        <div className="mt-4 px-1">
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: "#888780", letterSpacing: "0.08em" }}
          >
            On the listing page
          </p>
          <p
            className="text-[13px] leading-relaxed line-clamp-4"
            style={{ color: "#2C2C2A" }}
          >
            {description}
          </p>
        </div>
      )}

      {/* Helper hint */}
      <p
        className="mt-4 text-[11px] text-center"
        style={{ color: "#A8A6A0" }}
      >
        This is how guests will see your listing.
      </p>
    </div>
  );
};

export default CaravanCardPreview;
