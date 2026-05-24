import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, Users, ArrowRight } from "lucide-react";

export interface RelatedCardItem {
  id: string;
  title: string;
  details: string;
  price: string;
  Maxprice?: string | number;
  unit: string;
  image: string;
}

interface RelatedItemsGridProps {
  items: RelatedCardItem[];
}

/**
 * Grid of related/similar offer cards shown at the bottom of product detail
 * pages. Each card links to the offer's detail page via its `id` (which is
 * already a full route like `/unique-stay/123`).
 */
export function RelatedItemsGrid({ items }: RelatedItemsGridProps) {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <div key={item.id} className="group">
          <div className="relative rounded-xl overflow-hidden mb-4">
            <img
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
              src={item.image}
              alt={item.title}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <button className="absolute top-3 right-3">
              <Heart
                onClick={() => toggleFavorite(item.id)}
                className={`w-6 h-6 cursor-pointer z-50 ${
                  favorites[item.id] ? "fill-red-500 text-red-500" : "text-white"
                }`}
              />
            </button>
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
              <div className="w-3 h-3 bg-white rounded-full" />
              <div className="w-3 h-3 bg-white/40 rounded-full" />
              <div className="w-3 h-3 bg-white/40 rounded-full" />
              <div className="w-3 h-3 bg-white/40 rounded-full" />
              <div className="w-2 h-2 bg-white/40 rounded-full" />
            </div>

            {favorites[item.id] && (
              <div className="absolute top-3 left-3 dark:bg-black dark:text-white bg-white rounded px-2 py-1">
                <span className="text-xs font-bold dark:bg-black dark:text-white text-black">
                  Guest Favourite
                </span>
              </div>
            )}

            <Link to={`${item.id}`}>
              <button className="absolute bottom-3 right-3 w-8 h-8 dark:bg-black dark:text-white bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold dark:bg-black dark:text-white text-gray-900 mb-1">
                {item.title}
              </h3>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-sm dark:bg-black dark:text-white text-gray-600">
                  {item.details}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:bg-black dark:text-white line-through">
                  ₹{item.Maxprice}
                </span>
                <span className="font-bold text-gray-900 dark:bg-black dark:text-white">
                  {item.price}
                </span>
                <span className="text-sm text-gray-600 dark:bg-black dark:text-white">
                  {item.unit}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-black dark:bg-black dark:text-white text-black" />
                <span className="text-sm font-medium">4.91</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-500 dark:bg-black dark:text-white" />
                <span className="text-sm text-gray-600 dark:bg-black dark:text-white">2</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RelatedItemsGrid;
