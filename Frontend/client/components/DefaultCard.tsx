import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, Users } from "lucide-react";
import { Star as StarIcon } from "lucide-react";
import CardImageCarousel from "./CardImageCarousel";
import {
  addWishlistItem,
  removeWishlistItem,
  hasWishlistItem,
} from "@/lib/wishlist";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const Star = StarIcon;
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

  function handleFavorite(item: any) {
    if (!isAuthenticated) {
      toast.error("Please login to add to wishlist");
      navigate("/login");
      return;
    }
    const id = item.id;
    const nowLiked = !(isFavorite[id] ?? hasWishlistItem(id));
    setisFavorite((prev) => ({
      ...prev,
      [id]: nowLiked,
    }));
    try {
      if (nowLiked) {
        const type =
          inferType(id) === "camper-van"
            ? "campervan"
            : inferType(id) === "unique-stays"
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

  const content = CardData;

  const CardContent = (
    <>
      <div className={`grid sm:grid-cols-2 max-md:px-3 ${location.pathname.includes("/search") ? "lg:grid-cols-3": "lg:grid-cols-4"} gap-6`}>
        {content.map((content) => (
          <div key={content.id} className="group">
            <div className="relative rounded-xl overflow-hidden mb-4">
              <Link
                to={
                  activeFilter === "camper-van"
                    ? `${content.id}`
                    : activeFilter === "unique-stays"
                      ? `${content.id}`
                      : activeFilter === "activity"
                        ? `${content.id}`
                        : "/"
                }
              >
                <CardImageCarousel
                  images={content.images || [content.image]}
                  alt={content.title}
                />
              </Link>

              <button className="absolute top-3 right-3 z-30">
                <Heart
                  onClick={() => handleFavorite(content)}
                  className={`w-6 h-6 cursor-pointer z-30 ${isFavorite[content.id] ? "fill-red-500 text-red-500" : "text-white"}`}
                />
              </button>



              {isFavorite[content.id === 3] && (
                <div className="absolute top-3 left-3 dark:bg-black dark:text-white bg-white rounded px-2 py-1">
                  <span className="text-xs font-bold dark:bg-black dark:text-white text-black">
                    Guest Favourite
                  </span>
                </div>
              )}
            </div>

            <div className=" max-md:px-3 flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-bold dark:bg-black dark:text-white text-gray-900 mb-1">
                  {content.title}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  {activeFilter === "camper-van" ? (
                    <span className="text-sm dark:bg-black dark:text-white text-gray-600">
                      {content.details}
                    </span>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 text-gray-500 dark:bg-black dark:text-white" />
                      <span className="text-sm text-gray-600 dark:bg-black dark:text-white">
                        {content.details}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:bg-black dark:text-white line-through">
                    ₹{content.Maxprice}
                  </span>
                  <span className="font-bold text-gray-900 dark:bg-black dark:text-white">
                    {content.price}
                  </span>
                  <span className="text-sm text-gray-600 dark:bg-black dark:text-white">
                    {content.unit}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-black dark:bg-black dark:text-white text-black" />
                  <span className="text-sm font-medium">4.91</span>
                </div>
                {activeFilter !== "camper-van" && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-500 dark:bg-black dark:text-white" />
                    <span className="text-sm text-gray-600 dark:bg-black dark:text-white">
                      2
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return CardContent;
}

export default DefaultCard;
