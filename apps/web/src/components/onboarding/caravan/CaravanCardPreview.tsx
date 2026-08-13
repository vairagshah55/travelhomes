import React from "react";
import { Heart, MapPin, Star as StarIcon, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

/** Unset fields read as quiet placeholders, never as errors or empty boxes. */
const pending = "text-th-warm-text-muted font-normal";

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
  const totalImages = (cover ? 1 : 0) + photos.length;

  const locationParts = [city, state].filter(Boolean);
  const locationText = locationParts.length > 0 ? locationParts.join(", ") : null;

  const dailyRate = perDayCharge && Number(perDayCharge) > 0 ? Number(perDayCharge) : null;
  const kmRate = perKmCharge && Number(perKmCharge) > 0 ? Number(perKmCharge) : null;
  const baseRate = dailyRate ?? kmRate;
  const baseUnit = dailyRate ? "per day" : kmRate ? "per km" : null;
  const discounted = activeDiscount && activeDiscount.finalPrice > 0;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-th-brand shrink-0" />
        <span className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-th-warm-text-muted">
          Live Preview
        </span>
      </div>

      <div
        className={cn(
          "rounded-[18px] bg-th-surface-0 border border-[color:var(--onb-card-border)] overflow-hidden",
          "shadow-[var(--onb-card-shadow)]",
        )}
      >
        {/* Image */}
        <div className="relative w-full aspect-[4/3] bg-th-warm-surface overflow-hidden">
          {coverSrc ? (
            <>
              <img
                src={coverSrc}
                alt={name || PLACEHOLDER_TITLE}
                className="w-full h-full object-cover animate-th-fade-in"
              />
              {/* Keeps the white heart legible over pale skies. */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/25 to-transparent"
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-th-brand-soft border border-th-brand-border-soft">
                <ImageIcon size={19} className="text-th-brand" strokeWidth={1.9} />
              </div>
              <p className="text-[11.5px] font-medium text-th-warm-text-muted">
                Your cover photo appears here
              </p>
            </div>
          )}

          {/* Guest-facing affordances, shown for realism — not interactive. */}
          <div
            aria-hidden="true"
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/25 backdrop-blur-md ring-1 ring-white/40 pointer-events-none"
          >
            <Heart className="w-[17px] h-[17px] text-white drop-shadow-sm" />
          </div>

          {totalImages > 0 && (
            <div
              aria-hidden="true"
              className="absolute bottom-3 left-3 px-2 py-[3px] rounded-full bg-black/50 backdrop-blur-sm pointer-events-none"
            >
              <span className="text-[10px] font-semibold text-white tracking-wide">
                {totalImages} {totalImages === 1 ? "photo" : "photos"}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="px-4 pt-3.5 pb-4">
          <div className="flex items-start justify-between gap-2.5">
            <h3
              className={cn(
                "text-[15.5px] leading-snug tracking-[-0.015em] line-clamp-2",
                name ? "font-bold text-th-text-primary" : pending,
              )}
            >
              {name || PLACEHOLDER_TITLE}
            </h3>
            <div className="flex items-center gap-1 shrink-0 mt-[3px]">
              <StarIcon className="w-3.5 h-3.5 text-th-warm-border-strong fill-current" />
              <span className="text-[12px] font-semibold text-th-warm-text-muted">New</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5">
            <MapPin
              className="w-3.5 h-3.5 shrink-0 text-th-warm-text-muted"
              strokeWidth={1.9}
              aria-hidden="true"
            />
            <span
              className={cn(
                "text-[13px] truncate",
                locationText ? "text-[color:var(--onb-text-secondary,#657477)]" : pending,
              )}
            >
              {locationText ?? "Location — added in a later step"}
            </span>
          </div>

          <div className="h-px bg-th-warm-border my-3.5" />

          {baseRate ? (
            <div className="flex items-baseline gap-2 flex-wrap">
              {discounted && (
                <span className="text-[13px] text-th-warm-text-muted line-through">
                  ₹{activeDiscount!.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
              <span className="text-[19px] font-bold text-th-text-primary tracking-[-0.02em]">
                ₹{(discounted ? activeDiscount!.finalPrice : baseRate).toLocaleString("en-IN")}
              </span>
              {baseUnit && (
                <span className="text-[12.5px] text-[color:var(--onb-text-secondary,#657477)]">
                  {baseUnit}
                </span>
              )}
            </div>
          ) : (
            <p className={cn("text-[13px]", pending)}>Pricing — added in a later step</p>
          )}

          {discounted && (
            <span className="inline-block mt-2.5 text-[10px] font-bold uppercase tracking-[0.07em] px-2 py-[3px] rounded-md text-th-brand bg-th-brand-soft">
              {activeDiscount!.label}
            </span>
          )}
        </div>
      </div>

      {/* Description excerpt — what guests read on the detail page */}
      {description && (
        <div className="mt-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1.5 text-th-warm-text-muted">
            On the listing page
          </p>
          <p className="text-[13px] leading-[1.65] line-clamp-4 text-[color:var(--onb-text-secondary,#657477)]">
            {description}
          </p>
        </div>
      )}

      <p className="mt-5 text-[11.5px] leading-relaxed text-th-warm-text-muted">
        Updates as you type — this is what travellers will see.
      </p>
    </div>
  );
};

export default CaravanCardPreview;
