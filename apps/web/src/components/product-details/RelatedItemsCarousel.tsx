import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import type { RelatedCardItem } from "./RelatedItemsGrid";

interface RelatedItemsCarouselProps {
  items: RelatedCardItem[];
  title: string;
  subtitle: string;
  /** Optional "View all" link target (only renders the link when set + items > maxVisible). */
  viewAllUrl?: string;
  maxVisible?: number;
}

/**
 * Horizontal carousel of related/similar offer cards. Used in the "More stays
 * in {city}" / "You might also like" rails at the bottom of UniqueStayDetails.
 */
export function RelatedItemsCarousel({
  items,
  title,
  subtitle,
  viewAllUrl,
  maxVisible = items.length,
}: RelatedItemsCarouselProps) {
  const navigate = useNavigate();
  const visible = items.slice(0, maxVisible);
  const showViewAll = viewAllUrl && items.length > maxVisible;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        {showViewAll && (
          <button
            onClick={() => navigate(viewAllUrl!)}
            className="text-sm font-medium text-gray-900 dark:text-white underline underline-offset-2 hover:text-gray-600"
          >
            View all
          </button>
        )}
      </div>
      <div className="overflow-x-auto scrollbar-hidden -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 min-w-max md:min-w-0">
          {visible.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.4, ease: "easeOut" }}
            >
              <Link
                to={item.id}
                className="block w-64 md:w-auto flex-shrink-0 md:flex-shrink group card-shimmer-wrap rounded-2xl p-1.5 pb-3 cursor-pointer"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl img-shimmer-wrap">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="img-shimmer-sweep" />
                </div>
                <div className="pt-3 px-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-current text-gray-900 dark:text-white" />
                      <span className="text-[13px] font-medium text-gray-900 dark:text-white">
                        4.9
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[13px] text-gray-500 dark:text-gray-400 truncate">
                      {item.details}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    {item.Maxprice && (
                      <span className="text-[13px] text-gray-400 line-through">
                        ₹{item.Maxprice}
                      </span>
                    )}
                    <span className="text-[15px] font-bold text-gray-900 dark:text-white">
                      {item.price}
                    </span>
                    <span className="text-[13px] text-gray-500">{item.unit}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RelatedItemsCarousel;
