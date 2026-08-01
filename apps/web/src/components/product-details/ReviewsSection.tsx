import React from "react";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface Review {
  profile?: string;
  name: string;
  date: string;
  review: string;
}

interface ReviewsSectionProps {
  visibleReviews: Review[];
  /** When false, only the heading + empty message render (CamperVan style). */
  showStatsPanel?: boolean;
}

const RATING_CATEGORIES = ["Cleanliness", "Accuracy", "Communication", "Location", "Value"];

/**
 * Reviews section shown on product detail pages. Includes a heading, optional
 * stats panel (UniqueStay only), and a 2-column grid of review cards.
 */
export function ReviewsSection({ visibleReviews, showStatsPanel = true }: ReviewsSectionProps) {
  if (!showStatsPanel) {
    return (
      <div id="reviews" className="scroll-mt-36 space-y-6">
        <div className="h-px bg-gray-100 dark:bg-gray-800" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reviews</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No reviews yet. Be the first to leave a review.
        </p>
      </div>
    );
  }

  return (
    <div id="reviews" className="scroll-mt-36 space-y-6">
      <div className="h-px bg-gray-100 dark:bg-gray-800" />
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reviews</h3>
        <Button
          className="bg-[#117479] text-white rounded-full px-5 text-sm hover:bg-[#128086] dark:bg-white dark:text-black dark:hover:bg-gray-200"
          onClick={() => toast("Opening review form...")}
        >
          Add Review
        </Button>
      </div>

      <div className="flex items-center gap-6 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 dark:text-white">4.5</div>
          <div className="flex items-center gap-0.5 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < 4
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-yellow-400/40 text-yellow-400/40"
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">2,304 reviews</div>
        </div>
        <div className="flex-1 space-y-2.5">
          {RATING_CATEGORIES.map((cat) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="w-24 text-xs text-gray-600 dark:text-gray-300">{cat}</span>
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 dark:bg-white rounded-full"
                  style={{ width: "96%" }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200 w-6">4.8</span>
            </div>
          ))}
        </div>
      </div>

      {visibleReviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleReviews.map((review, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3"
            >
              <div className="flex items-center gap-3">
                <img src={review.profile} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {review.name}
                  </div>
                  <div className="text-xs text-gray-500">{review.date}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {review.review}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No reviews yet. Be the first to leave a review.
        </p>
      )}
    </div>
  );
}

export default ReviewsSection;
