import React from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Users } from "lucide-react";
import { Star as StarIcon, ArrowRight } from "lucide-react";

const Star = StarIcon;

function TopRatedStayCard({ isFavorite }: { isFavorite: boolean }) {
  return (
    <Link to="/campervan/1" className="group cursor-pointer block">
      <div className="relative rounded-xl overflow-hidden mb-4">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/bf6807f6e4c7f4eef257f2f5bd8333deaf766a70?width=610"
          alt="Top Rated Stay"
          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <button className="absolute top-3 right-3 z-30">
          <Heart
            className={`w-6 h-6 z-30 ${isFavorite ? "fill-red-500 text-red-500" : "text-white/60 stroke-white"}`}
          />
        </button>

        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
          <div className="w-3 h-3 bg-white rounded-full" />
          <div className="w-3 h-3 bg-white/40 rounded-full" />
          <div className="w-3 h-3 bg-white/40 rounded-full" />
          <div className="w-3 h-3 bg-white/40 rounded-full" />
          <div className="w-2 h-2 bg-white/40 rounded-full" />
        </div>

        {isFavorite && (
          <div className="absolute top-3 left-3 bg-white rounded px-2 py-1">
            <span className="text-xs font-bold text-black">
              Guest Favourite
            </span>
          </div>
        )}

        <button className="absolute bottom-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">
            New Camper Van, Jaipur
          </h3>
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Puri, Odisha</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 line-through">₹2890</span>
            <span className="font-bold text-gray-900 dark:text-white">
              ₹2890
            </span>
            <span className="text-sm text-gray-600">/ person</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-black text-black" />
            <span className="text-sm font-medium">4.91</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">2</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default TopRatedStayCard;
