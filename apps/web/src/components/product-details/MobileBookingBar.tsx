import React from "react";
import { Button } from "@/components/ui/button";

interface MobileBookingBarProps {
  /** Display unit after price, e.g. "night" | "day" | "person". */
  priceLabel: string;
  regularPrice?: number;
  /** CTA button label, e.g. "Check availability" | "Book now". */
  ctaLabel: string;
  /** Optional subline shown under price (used by UniqueStay to show date range). */
  dateRangeText?: string;
  onCtaClick: () => void;
}

/**
 * Mobile-only sticky bar shown at the bottom of product-details pages with
 * price + CTA. Parent owns the navigation/auth logic and passes it via
 * `onCtaClick`.
 */
export function MobileBookingBar({
  priceLabel,
  regularPrice,
  ctaLabel,
  dateRangeText,
  onCtaClick,
}: MobileBookingBarProps) {
  const hasPrice = regularPrice != null && regularPrice > 0;

  return (
    <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            {hasPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₹{Math.round(Number(regularPrice) * 1.2).toLocaleString()}
              </span>
            )}
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              ₹{Number(regularPrice || 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">/ {priceLabel}</span>
          </div>
          {dateRangeText && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{dateRangeText}</div>
          )}
        </div>
        <Button
          className="bg-[#3BD9DA] text-white rounded-full px-6 h-11 text-sm font-semibold hover:bg-[#2BC7C8] shadow-[0_4px_16px_rgba(59, 217, 218, 0.6)] flex-shrink-0 transition-all"
          onClick={onCtaClick}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}

export default MobileBookingBar;
