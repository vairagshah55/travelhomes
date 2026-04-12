import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import { Star as StarIcon } from "lucide-react";
import CardImageCarousel from "./CardImageCarousel";
import {
  addWishlistItem,
  removeWishlistItem,
  hasWishlistItem,
} from "@/lib/wishlist";
import { offersApi } from "@/lib/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

type FilterType = "camper-van" | "unique-stays" | "activity";

function DefaultCard({
  CardData,
  activeFilter,
}: {
  CardData: any[];
  activeFilter: FilterType;
}) {
  const [isFavorite, setisFavorite] = useState<{ [id: string]: boolean }>({});
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const inferType = (id: string): FilterType =>
    id.startsWith("/campervan")
      ? "camper-van"
      : id.startsWith("/unique-stay")
        ? "unique-stays"
        : id.startsWith("/activity")
          ? "activity"
          : activeFilter;

  function handleFavorite(e: React.MouseEvent, item: any) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please login to add to wishlist");
      navigate("/login");
      return;
    }
    const id = item.id;
    const nowLiked = !(isFavorite[id] ?? hasWishlistItem(id));
    setisFavorite((prev) => ({ ...prev, [id]: nowLiked }));
    try {
      if (nowLiked) {
        const type =
          inferType(id) === "camper-van" ? "campervan"
            : inferType(id) === "unique-stays" ? "stay"
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

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
      <div className={`flex md:grid md:grid-cols-2 ${location.pathname.includes("/search") ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-5`}>
      {CardData.map((item) => {
        const isLiked = isFavorite[item.id] ?? hasWishlistItem(item.id);

        return (
          <Link
            key={item.id}
            to={item.id}
            onClick={() => offersApi.trackClick(item.id)}
            className="group block w-[280px] flex-shrink-0 md:w-auto md:flex-shrink card-shimmer-wrap rounded-2xl p-1.5 pb-3"
          >
            {/* Image */}
            <div className="relative">
              <CardImageCarousel
                images={item.images || [item.image]}
                alt={item.title}
              />

              {/* Heart */}
              <button
                onClick={(e) => handleFavorite(e, item)}
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
    </div>
  );
}

export default DefaultCard;
