import React, { useEffect, useState } from "react";
import { Heart, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import MobileUserNav from "@/components/MobileUserNav";
import { getWishlist, removeWishlistItem, WishlistItem, WISHLIST_UPDATED } from "@/lib/wishlist";
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import CardImageCarousel from "@/components/CardImageCarousel";
import { CustomPagination } from "@/components/CustomPagination";

/** Mirrors the real card grid below (same columns, aspect ratio, badge/heart
 * slots) so the loading flash reads as "this page" rather than a generic spinner. */
const WishlistSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex flex-col gap-4">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden motion-skeleton" />
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded motion-skeleton" />
            <div className="h-3 w-1/2 rounded motion-skeleton" />
            <div className="h-4 w-16 rounded motion-skeleton mt-1" />
          </div>
          <div className="h-4 w-8 rounded motion-skeleton shrink-0" />
        </div>
      </div>
    ))}
  </div>
);

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
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

  const navigate = useNavigate();

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
  const paginatedItems = filteredItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="flex flex-col min-h-screen gap-0 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      <SiteHeader />

      <main className="px-4  mt-20 py-4 flex-1">
        <div
          onClick={() => navigate(-1)}
          className="mb-6 cursor-pointer inline-flex items-center gap-2 text-[#0a1c1c] hover:text-[#117479] transition-colors"
        >
          <IoIosArrowBack size={20} />
          <h1 className="text-2xl max-md:text-lg font-semibold font-poppins">Wishlist</h1>
        </div>
        <div className="max-w-7xl mx-auto ">
          {loadingOffers && <WishlistSkeleton />}
          {offerError && (
            <div className="text-red-500 text-center py-10">
              Failed to load offers. Please try again later.
            </div>
          )}
          {!loadingOffers &&
            !offerError &&
            (filteredItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-[#e6fafa] flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-7 w-7 text-[#117479]" />
                </div>
                <h3 className="text-xl font-semibold text-[#0a1c1c] mb-2">
                  Your wishlist is empty
                </h3>
                <p className="text-gray-500 mb-6">
                  Start exploring and save your favorite places and activities
                </p>
                <Button
                  onClick={() => navigate("/")}
                  className="bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white rounded-full px-6"
                >
                  Start Exploring
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                  {paginatedItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col gap-3 cursor-pointer card-shimmer-wrap rounded-2xl p-1.5 pb-2"
                      onClick={() => navigate(item.id)}
                    >
                      {/* Image */}
                      <div className="relative">
                        <CardImageCarousel images={[item.image]} alt={item.title} />

                        {/* Type Badge */}
                        <div className="absolute top-3 left-3 z-20">
                          <Badge className="bg-white/90 backdrop-blur-sm text-[#0a1c1c] px-2.5 py-1 rounded-full font-bold text-[11px] shadow-sm">
                            {item.type === "campervan"
                              ? "Camper Van"
                              : item.type === "stay"
                                ? "Unique Stay"
                                : "Activity"}
                          </Badge>
                        </div>

                        {/* Remove from wishlist */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWishlist(item.id);
                          }}
                          aria-label={`Remove ${item.title} from wishlist`}
                          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md bg-black/25 hover:scale-110 active:scale-90 transition-all duration-200"
                        >
                          <Heart className="w-[18px] h-[18px] fill-red-500 text-red-500 drop-shadow-sm" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex justify-between items-start gap-2 px-1">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <h3 className="font-semibold text-[15px] leading-snug text-[#0a1c1c] line-clamp-1">
                            {item.title}
                          </h3>

                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <p className="text-[13px] text-gray-500 truncate">{item.location}</p>
                          </div>

                          <p className="font-bold text-[15px] text-[#0a1c1c] pt-0.5">
                            {item.price}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                          <Star className="h-3.5 w-3.5 fill-current text-[#0a1c1c]" />
                          <span className="text-[13px] font-medium text-[#0a1c1c]">
                            {item.rating}
                          </span>
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
            ))}
        </div>
      </main>
      <Footer />
      {/* Clearance for the fixed bottom nav, painted in the footer's own
          colour so the page doesn't end on a white band. Collapses to 0 at lg,
          where the nav is hidden. Matches Index.tsx's pattern. */}
      <div className="bg-[#0a1c1c] pb-mobile-nav" aria-hidden />
      <MobileUserNav />
    </div>
  );
};

export default Wishlist;
