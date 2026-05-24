import React from "react";
import { Heart, MapPin, Star as StarIcon, Users, Home } from "lucide-react";

interface ActiveDiscount {
  originalPrice: number;
  finalPrice: number;
  label: string;
}

interface UniqueStayCardPreviewProps {
  /** First selected property type label (e.g. "Villa", "Cabin") */
  propertyType?: string;
  /** Cover image — base64 data URL, blob URL, or server path */
  coverImage?: string | null;
  galleryCount?: number;
  city?: string;
  state?: string;
  regularPrice?: string | number;
  guestCapacity?: number;
  stayType?: "entire" | "individual";
  activeDiscount?: ActiveDiscount | null;
}

const PLACEHOLDER_TITLE = "Your property name";

const UniqueStayCardPreview: React.FC<UniqueStayCardPreviewProps> = ({
  propertyType,
  coverImage,
  galleryCount = 0,
  city,
  state,
  regularPrice,
  guestCapacity,
  stayType,
  activeDiscount,
}) => {
  const locationParts = [city, state].filter(Boolean);
  const locationText = locationParts.length > 0 ? locationParts.join(", ") : null;

  const price = regularPrice && Number(regularPrice) > 0 ? Number(regularPrice) : null;
  const totalImages = (coverImage ? 1 : 0) + (galleryCount ?? 0);

  const title = propertyType
    ? stayType === "entire"
      ? `Entire ${propertyType}`
      : propertyType
    : null;

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

      {/* Card mirroring the real listing card */}
      <div className="rounded-2xl p-1.5 pb-3 bg-white shadow-[0_8px_30px_rgba(4,44,83,0.08)] border border-[#EBEBEB]">
        {/* Image */}
        <div className="relative">
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl bg-[#F7F8FA]">
            {coverImage ? (
              <img
                src={coverImage}
                alt={title || PLACEHOLDER_TITLE}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(24, 95, 165, 0.07)" }}
                >
                  {/* House icon placeholder */}
                  <Home className="w-5 h-5" style={{ color: "#185FA5" }} />
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
                title ? "text-gray-900" : "text-[#A8A6A0] italic"
              }`}
            >
              {title || PLACEHOLDER_TITLE}
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
              {locationText ?? "Location — added in step 2"}
            </span>
          </div>

          {/* Guest capacity pill */}
          {guestCapacity && guestCapacity > 0 ? (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-[13px] text-gray-500">Up to {guestCapacity} guests</span>
            </div>
          ) : null}

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
                <span className="text-[13px] text-gray-500">/ night</span>
              </>
            ) : price ? (
              <>
                <span className="text-[15px] font-bold text-gray-900">
                  ₹{price.toLocaleString("en-IN")}
                </span>
                <span className="text-[13px] text-gray-500">/ night</span>
              </>
            ) : (
              <span className="text-[13px] text-[#A8A6A0] italic">
                Pricing — added in step 2
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

      {/* Helper hint */}
      <p className="mt-4 text-[11px] text-center" style={{ color: "#A8A6A0" }}>
        This is how guests will see your listing.
      </p>
    </div>
  );
};

export default UniqueStayCardPreview;
