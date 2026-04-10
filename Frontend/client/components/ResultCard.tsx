import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import { Star as StarIcon } from "lucide-react";
import CardImageCarousel from "./CardImageCarousel";
import {
  addWishlistItem,
  removeWishlistItem,
  getWishlist,
  WISHLIST_UPDATED,
} from "@/lib/wishlist";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

type FilterType = "camper-van" | "unique-stays" | "activity";

function ResultCard({
  activeFilter,
  ResultcaravanShown,
  ResultstayShown,
  ResultactivityShown,
}: {
  activeFilter: FilterType;
  ResultactivityShown: any[];
  ResultstayShown: any[];
  ResultcaravanShown: any[];
}) {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const updateWishlist = () => {
      const list = getWishlist();
      setWishlistIds(new Set(list.map((i) => i.id)));
    };
    updateWishlist();
    window.addEventListener(WISHLIST_UPDATED, updateWishlist);
    return () => window.removeEventListener(WISHLIST_UPDATED, updateWishlist);
  }, []);

  const getCardContent = () => {
    switch (activeFilter) {
      case "camper-van": return ResultcaravanShown;
      case "unique-stays": return ResultstayShown;
      case "activity": return ResultactivityShown;
      default: return ResultcaravanShown;
    }
  };

  function handleFavorite(item: any) {
    if (!isAuthenticated) {
      toast.error("Please login to add to wishlist");
      navigate("/login");
      return;
    }
    const id = item.id;
    const isLiked = wishlistIds.has(id);
    try {
      if (!isLiked) {
        const type =
          activeFilter === "camper-van" ? "campervan"
            : activeFilter === "unique-stays" ? "stay"
            : "activity";
        addWishlistItem({
          id, title: item.title, type: type as any,
          location: item.details,
          price: `${item.price}${item.unit || ""}`,
          rating: 4.91, image: item.image,
          dateAdded: new Date().toISOString(),
        });
      } else {
        removeWishlistItem(id);
      }
    } catch {}
  }

  const content = getCardContent();

  return (
    <div className="grid sm:grid-cols-1 max-md:px-3 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
      {content.map((item) => {
        const isLiked = wishlistIds.has(item.id);
        return (
          <Link
            key={item.id}
            to={item.id}
            className="group block card-shimmer-wrap rounded-2xl p-1.5 pb-3"
          >
            {/* Image */}
            <div className="relative">
              <CardImageCarousel
                images={item.images || [item.image]}
                alt={item.title}
              />

              {/* Heart */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFavorite(item); }}
                className={`absolute top-2.5 right-2.5 z-30 w-8 h-8 rounded-full
                  flex items-center justify-center backdrop-blur-md
                  transition-all duration-300 ease-out
                  hover:scale-110 active:scale-90
                  ${isLiked
                    ? "opacity-100 bg-red-500/20"
                    : "opacity-0 group-hover:opacity-100 bg-black/25"
                  }`}
              >
                <Heart className={`w-[18px] h-[18px] transition-all duration-300 ${
                  isLiked ? "fill-red-500 text-red-500" : "text-white drop-shadow-sm"
                }`} />
              </button>

              {isLiked && (
                <div className="absolute top-2.5 left-2.5 z-20 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-full px-2.5 py-0.5 shadow-sm">
                  <span className="text-[10px] font-semibold text-gray-900 dark:text-white tracking-wide uppercase">Saved</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="pt-3 px-1 space-y-1.5">
              {/* Title + Rating */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-[15px] leading-snug text-gray-900 dark:text-white line-clamp-1">
                  {item.title}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                  <StarIcon className="w-3.5 h-3.5 fill-current text-gray-900 dark:text-white" />
                  <span className="text-[13px] font-medium text-gray-900 dark:text-white">4.91</span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-[13px] text-gray-500 dark:text-gray-400 truncate">
                  {item.details}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1.5 pt-1">
                {item.Maxprice && (
                  <span className="text-[13px] text-gray-400 line-through">
                    ₹{item.Maxprice}
                  </span>
                )}
                <span className="text-[15px] font-bold text-gray-900 dark:text-white">
                  {item.price}
                </span>
                <span className="text-[13px] text-gray-500 dark:text-gray-400">
                  {item.unit}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default ResultCard;
