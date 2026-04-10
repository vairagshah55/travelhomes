import React , { useEffect, useState } from "react";
import { Heart, X, Star, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getWishlist, removeWishlistItem, WishlistItem, WISHLIST_UPDATED } from "@/lib/wishlist";
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "@/lib/utils";
import UniqueStaysSkeleton from "@/utils/UniqueStaysSkeleton";
import { CustomPagination } from "@/components/CustomPagination";
import { Loader } from "@/components/ui/Loader";

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadWishlist = () => {
      try {
        setLoadingOffers(true);
        const data = getWishlist(); // local storage
        setWishlistItems(data);
        setOfferError(null);
      } catch (error) {
        console.error(error);
        setOfferError("Failed to load wishlist");
      } finally {
        setLoadingOffers(false);
      }
    };

    loadWishlist();

    const handleWishlistUpdate = () => {
       setWishlistItems(getWishlist());
    };

    window.addEventListener(WISHLIST_UPDATED, handleWishlistUpdate);

    return () => {
      window.removeEventListener(WISHLIST_UPDATED, handleWishlistUpdate);
    };
  }, []);

 const navigate=useNavigate();


  const removeFromWishlist = (itemId: string) => {
    removeWishlistItem(itemId);
    setWishlistItems(getWishlist());
  };

  const filteredItems = wishlistItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );
  useEffect(() => {
    // Simulate dynamic data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  
  return (
<div className="flex flex-col min-h-screen gap-0 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
  <Header variant="transparent" className="fixed w-full z-50" />

   {loading && (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader size="xl" />
          <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
            Fetching WishList data...
          </p>
        </div>
      </div>
    )
  }
      {!loading && (  
      <main className="px-4  mt-20 py-4 flex-1">
        <div onClick={()=>navigate(-1)} className="mb-1 cursor-pointer flex items-center gap-1">
          <IoIosArrowBack size={20}/>
          <h1 className="text-2xl max-md:text-lg font-semibold text-dashboard-heading font-poppins leading-[46px]">
            Wishlist
          </h1>
        </div>
      <div className="max-w-7xl mx-auto ">
            {loadingOffers &&  (
            <UniqueStaysSkeleton/>
          )
          }
          {offerError && (
            <div className="text-red-500 text-center">
              Failed to load offers. Please try again later.
            </div>
          )}
          {!loadingOffers && !offerError && (
        filteredItems.length === 0 ? (
          <div className="text-center py-10">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dashboard-heading mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-dashboard-body mb-6">
              Start exploring and save your favorite places and activities
            </p>
            <Button onClick={() => (window.location.href = "/")}>
              Start Exploring
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 cursor-pointer"
                onClick={() => {
                  if (item.type === "campervan") {
                    navigate(`${item.id}`);
                  } else if (item.type === "stay") {
                    navigate(`${item.id}`);
                  } else if (item.type === "activity") {
                    navigate(`${item.id}`);
                  }
                }}
              >
                {/* Image Container */}
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Type Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white hover:bg-black/30 dark:bg-black dark:text-white hover:text-white text-dashboard-primary px-2 py-1 rounded font-geist font-bold text-sm">
                      {item.type === "campervan"
                        ? "Camper Van"
                        : item.type === "stay"
                          ? "Unique Stay"
                          : "Activity"}
                    </Badge>
                  </div>

                  {/* Remove Button */}
                  <div className="absolute top-4 right-4 z-10">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(item.id);
                      }}
                      className="h-10 w-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    >
                      <Heart className="h-full w-full text-red-600 fill-red-600" />
                    </Button>
                  </div>

                  {/* Carousel Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-${i === 0 ? "3" : "2"} h-1 rounded-full ${
                          i === 0 ? "bg-white" : "bg-gray-400"
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[15px] text-dashboard-primary font-plus-jakarta mb-1.5">
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-1.5 mb-2">
                      {item.type === "campervan" ? (
                        <p className="text-sm text-dashboard-neutral-07 font-poppins">
                          {item.location}
                        </p>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 text-dashboard-neutral-07" />
                          <p className="text-sm text-dashboard-neutral-07 font-poppins">
                            {item.location}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-sm text-dashboard-neutral-07 line-through font-plus-jakarta">
                        ₹2890
                      </span>
                      <span className="font-bold text-base text-dashboard-primary font-plus-jakarta">
                        {item.price}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-dashboard-primary text-dashboard-primary" />
                      <span className="text-sm font-plus-jakarta text-dashboard-primary">
                        {item.rating}
                      </span>
                    </div>

                    {item.type === "stay" && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-dashboard-neutral-07" />
                        <span className="text-sm text-dashboard-neutral-07 font-poppins">
                          2
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <CustomPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
        )
      )}
      </div>
      </main>
      )}
      <Footer />
    </div>
  );
};

export default Wishlist;
