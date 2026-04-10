import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, Users } from "lucide-react";
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

const Star = StarIcon;
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
      case "camper-van":
        return ResultcaravanShown;
      case "unique-stays":
        return ResultstayShown;
      case "activity":
        return ResultactivityShown;
      default:
        return ResultcaravanShown;
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
          activeFilter === "camper-van"
            ? "campervan"
            : activeFilter === "unique-stays"
              ? "stay"
              : "activity";
        addWishlistItem({
          id,
          title: item.title,
          type: type as any,
          location: item.details,
          price: `${item.price}${item.unit || ""}`,
          rating: 4.91,
          image: item.image,
          dateAdded: new Date().toISOString(),
        });
      } else {
        removeWishlistItem(id);
      }
    } catch {}
  }

  const content = getCardContent();

  const CardContent = (
    <>
      <div className="grid sm:grid-cols-1 max-md:px-3 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {content.map((content) => {
          const destination =
            activeFilter === "camper-van"
              ? `${content.id}`
              : activeFilter === "unique-stays"
                ? `${content.id}`
                : activeFilter === "activity"
                  ? `${content.id}`
                  : "/";
          
          const isLiked = wishlistIds.has(content.id);

          return (
            <Link
              key={content.id}
              to={destination}
              className="group block rounded-xl overflow-hidden transition-all duration-200"
            >
              <div className="relative mb-4">
                <CardImageCarousel
                  images={content.images || [content.image]}
                  alt={content.title}
                />

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleFavorite(content);
                  }}
                  className="absolute top-3 right-3 z-30"
                >
                  <Heart
                    className={`w-6 h-6 cursor-pointer z-30 ${
                      isLiked
                        ? "fill-red-500 text-red-500"
                        : "text-white"
                    }`}
                  />
                </button>



                {isLiked && (
                  <div className="absolute top-3 left-3 bg-white dark:bg-black rounded px-2 py-1">
                    <span className="text-xs font-bold text-black dark:text-white">
                      Saved
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-start px-3 pb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    {content.title}
                  </h3>

                  <div className="flex items-center gap-1 mb-2">
                    {activeFilter === "camper-van" ? (
                      <span className="text-sm text-gray-600 dark:text-white">
                        {content.details}
                      </span>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 text-gray-500 dark:text-white" />
                        <span className="text-sm text-gray-600 dark:text-white">
                          {content.details}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-white line-through">
                      ₹{content.Maxprice}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {content.price}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-white">
                      {content.unit}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-black text-black dark:text-white" />
                    <span className="text-sm font-medium">4.91</span>
                  </div>
                  {activeFilter !== "camper-van" && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500 dark:text-white" />
                      <span className="text-sm text-gray-600 dark:text-white">
                        2
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );

  return CardContent;
}

export default ResultCard;
