import { useState } from "react";
import PriceTag from "./PriceTag";
import RatingBadge from "./RatingBadge";

export interface BookingWidgetProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  onBook?: (params: { checkIn: string; checkOut: string; guests: number }) => void;
  className?: string;
}

function computeNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(diff / 86_400_000));
}

const labelClass = "block text-[11px] font-sans font-semibold uppercase tracking-wide text-ds-slate mb-1";
const inputClass =
  "w-full font-sans text-[14px] text-ds-charcoal bg-transparent outline-none placeholder:text-ds-slate";

export default function BookingWidget({
  price,
  originalPrice,
  currency = "₹",
  rating,
  reviewCount,
  onBook,
  className = "",
}: BookingWidgetProps) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const nights = computeNights(checkIn, checkOut);
  const showBreakdown = nights > 0;
  const serviceFee = Math.round(price * nights * 0.12);
  const total = price * nights + serviceFee;
  const fmt = (n: number) => n.toLocaleString("en-IN");

  function handleBook() {
    onBook?.({ checkIn, checkOut, guests });
  }

  const fieldBox =
    "border px-3 py-3 rounded-[8px]" as const;

  return (
    <div
      className={`sticky top-8 bg-ds-white font-sans flex flex-col gap-4 ${className}`}
      style={{
        border: "1.5px solid var(--ds-pebble)",
        borderRadius: 12,
        padding: 24,
        boxShadow: "var(--ds-shadow-card)",
      }}
    >
      {/* Price row */}
      <PriceTag price={price} originalPrice={originalPrice} currency={currency} />

      {/* Rating */}
      {rating !== undefined && (
        <RatingBadge rating={rating} reviewCount={reviewCount} size="sm" />
      )}

      {/* Date inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div className={fieldBox} style={{ borderColor: "var(--ds-pebble)" }}>
          <label className={labelClass}>Check-in</label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className={inputClass}
            aria-label="Check-in date"
          />
        </div>
        <div className={fieldBox} style={{ borderColor: "var(--ds-pebble)" }}>
          <label className={labelClass}>Check-out</label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={inputClass}
            aria-label="Check-out date"
          />
        </div>
      </div>

      {/* Guests */}
      <div className={fieldBox} style={{ borderColor: "var(--ds-pebble)" }}>
        <label className={labelClass}>Guests</label>
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
          className={inputClass}
          aria-label="Number of guests"
        />
      </div>

      {/* Book button */}
      <button
        type="button"
        onClick={handleBook}
        className="
          w-full h-[52px] rounded-[8px]
          bg-ds-deep hover:bg-ds-navy
          text-white font-sans font-semibold text-base
          transition-all duration-200
          active:scale-[0.98] active:brightness-90
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ocean focus-visible:ring-offset-2
        "
      >
        Book now
      </button>

      <p className="text-ds-slate text-xs text-center -mt-2">
        You won&apos;t be charged yet
      </p>

      {/* Price breakdown */}
      {showBreakdown && (
        <div className="flex flex-col gap-2 border-t pt-4 mt-1 text-[14px]" style={{ borderColor: "var(--ds-pebble)" }}>
          <div className="flex justify-between text-ds-charcoal">
            <span>
              {currency}&nbsp;{fmt(price)} &times; {nights} night{nights !== 1 ? "s" : ""}
            </span>
            <span>{currency}&nbsp;{fmt(price * nights)}</span>
          </div>
          <div className="flex justify-between text-ds-charcoal">
            <span>Service fee</span>
            <span>{currency}&nbsp;{fmt(serviceFee)}</span>
          </div>
          <div className="flex justify-between font-semibold text-ds-navy border-t pt-2" style={{ borderColor: "var(--ds-pebble)" }}>
            <span>Total</span>
            <span>{currency}&nbsp;{fmt(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
