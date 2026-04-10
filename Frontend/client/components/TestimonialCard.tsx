import React from "react";
import { Star } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface TestimonialCardProps {
  userName?: string;
  rating?: number;
  content?: string;
  avatar?: string;
  subtext?: string;
}

function TestimonialCard({ userName, rating, content, avatar, subtext }: TestimonialCardProps) {
  return (
    <div className="w-full bg-white border dark:bg-black dark:text-white border-gray-100 rounded-xl p-5 shadow-sm space-y-10 h-full flex flex-col justify-between">
      <div>
        <p className="text-sm leading-relaxed text-gray-800 dark:text-white mb-4">
          {content || "Being good at capturing signals is key to our success! Knowing what the customers really say and mapping that to initiatives is really hard, especially across different teams with different tools."}
        </p>
        {rating !== undefined && (
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, idx) => (
              <Star
                key={idx}
                className={`w-4 h-4 ${
                  idx < Math.round(rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-1">
            {userName || ""}
          </h4>
          <p className="text-xs text-gray-600 dark:text-white">
            {subtext || "Verified Guest"}
          </p>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          <img
            src={getImageUrl(avatar) || "/user-avatar.svg"}
            alt={userName || "User"}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}

export default TestimonialCard;
