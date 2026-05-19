import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
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
            className="group block w-[280px] flex-shrink-0 md:w-auto md:flex-shrink"
          >
            {/* Image */}
            <div className="relative">
              <CardImageCarousel
                images={item.images || [item.image]}
                alt={item.title}
              />

              {/* Heart — always visible, Airbnb pattern */}
              <button
                onClick={(e) => handleFavorite(e, item)}
                className="absolute top-3 right-3 z-30 transition-all duration-200 ease-out hover:scale-110 active:scale-95"
                aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  className={`w-[26px] h-[26px] transition-all duration-200 ${
                    isLiked
                      ? "fill-[#FF385C] text-[#FF385C] drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
                      : "fill-black/40 text-white stroke-[2px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                  }`}
                />
              </button>
            </div>

            {/* Details */}
            <div className="pt-3 space-y-0.5">
              {/* Title + Rating */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-[15px] leading-tight text-[#222222] line-clamp-1">
                  {item.title}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <StarIcon className="w-[14px] h-[14px] fill-current text-[#222222]" />
                  <span className="text-[14px] text-[#222222]">4.91</span>
                </div>
              </div>

              {/* Location */}
              <p className="text-[14px] text-[#717171] truncate">
                {item.details}
              </p>

              {/* Price */}
              <p className="text-[14px] text-[#222222] pt-1.5">
                {item.Maxprice && (
                  <span className="text-[#717171] line-through mr-1.5">
                    ₹{item.Maxprice}
                  </span>
                )}
                <span className="font-semibold underline underline-offset-2 decoration-[1.5px]">
                  {item.price}
                </span>
                <span className="text-[#717171]"> {item.unit}</span>
              </p>
            </div>
          </Link>
        );
      })}
      </div>
    </div>
  );
}

export default DefaultCard;
