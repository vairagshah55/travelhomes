import React from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HostedByCardProps {
  vendor: any;
  onContactClick: () => void;
}

/**
 * "Hosted by" vendor card shown in the Owner section of product detail pages.
 * Displays avatar, name, location, rating, optional review count, Verified
 * badge, and a Contact button.
 */
export function HostedByCard({ vendor, onContactClick }: HostedByCardProps) {
  const altText = vendor?.brandName || vendor?.personName || "Owner";
  const firstName = vendor?.firstName || vendor?.personal?.firstName;
  const lastName = vendor?.lastName || vendor?.personal?.lastName;
  const city = vendor?.businessCity || vendor?.business?.city;
  const state = vendor?.businessState || vendor?.business?.state;
  const location = [city, state].filter(Boolean).join(", ");

  return (
    <div id="owner" className="scroll-mt-36 space-y-5">
      <div className="h-px bg-gray-100 dark:bg-gray-800" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hosted by</h3>
      <div className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
        <img
          src={vendor?.photo || "/User.jpg"}
          alt={altText}
          className="w-14 h-14 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-white">
            {firstName} {lastName}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{location}</div>
          <div className="flex items-center gap-3 mt-1">
            {vendor?.rating && (
              <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                <Star className="w-3 h-3 fill-current" /> {vendor.rating}
              </span>
            )}
            {vendor?.reviewCount && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {vendor.reviewCount} reviews
              </span>
            )}
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Verified</span>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-[#3BD9DA] text-white rounded-full px-4 text-xs hover:bg-[#2BC7C8] dark:bg-white dark:text-black dark:hover:bg-gray-200 flex-shrink-0"
          onClick={onContactClick}
        >
          Contact
        </Button>
      </div>
    </div>
  );
}

export default HostedByCard;
