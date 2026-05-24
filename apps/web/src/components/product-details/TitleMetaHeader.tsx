import React from "react";
import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";

interface TitleMetaHeaderProps {
  /** Category badge text shown above the title, e.g. "Unique Stay" / "Camper Van" / "Activity". */
  categoryBadge: string;
  /** Tailwind palette for the badge background+text. Defaults to emerald (UniqueStay). */
  badgeColor?: "emerald" | "amber" | "violet";
  name?: string;
  city?: string;
  state?: string;
  rating?: number | string;
  reviewCount?: number | string;
  regularPrice?: number;
  /** Unit after price, e.g. "night" | "day" | "person". */
  priceLabel: string;
  /** Right side of the title row — pass <ShareSaveButtons /> here. */
  actions: React.ReactNode;
}

const BADGE_COLORS: Record<NonNullable<TitleMetaHeaderProps["badgeColor"]>, string> = {
  emerald:
    "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
  violet:
    "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300",
};

/**
 * Page header for product detail pages: animated category badge → title +
 * action buttons → meta row (location · rating · price). Quick-info pills are
 * page-specific and live in the parent below this component.
 */
export function TitleMetaHeader({
  categoryBadge,
  badgeColor = "emerald",
  name,
  city,
  state,
  rating = "4.91",
  reviewCount,
  regularPrice,
  priceLabel,
  actions,
}: TitleMetaHeaderProps) {
  const location = [city, state].filter(Boolean).join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      className="mb-5"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`px-2.5 py-0.5 rounded-full ${BADGE_COLORS[badgeColor]} text-xs font-semibold uppercase tracking-wide`}
        >
          {categoryBadge}
        </span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-3">
        <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-gray-900 dark:text-white leading-snug tracking-tight">
          {name}
        </h1>
        {actions}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{location}</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{rating}</span>
          {reviewCount != null && (
            <span className="text-sm text-gray-400">({reviewCount})</span>
          )}
        </div>
        {regularPrice != null && regularPrice > 0 && (
          <>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ₹{Number(regularPrice).toLocaleString()}{" "}
              <span className="font-normal text-gray-500">/ {priceLabel}</span>
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default TitleMetaHeader;
