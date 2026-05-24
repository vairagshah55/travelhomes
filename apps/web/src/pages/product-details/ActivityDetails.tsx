import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/button";
import Header, { HomeHeader } from "../../components/Header";
import Footer from "../../components/Footer";
import PhotoGallery, { uniqueStayImages } from "../../components/PhotoGallery";
import {
  Calendar,
  Users,
  ChevronDown,
  ArrowRight,
  Share2,
  Heart,
  Star,
  MapPin,
  Wifi,
  Car,
  Coffee,
  Shield,
  Thermometer,
  Bath,
  Building2,
  Bed,
  Tv,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Eye,
  EyeOff,
  X as XIcon,
  CircleCheck,
  CircleX,
} from "lucide-react";
import MobileUserNav from "@/components/MobileUserNav";
import { Card } from "@/components/ui/card";
import ShareModal from "./ShareModal";
import { LoginModal } from "@/components/product-details/LoginModal";
import { BookingWidget } from "@/components/product-details/BookingWidget";
import { MobileBookingBar } from "@/components/product-details/MobileBookingBar";
import { ShareSaveButtons } from "@/components/product-details/ShareSaveButtons";
import { HostedByCard } from "@/components/product-details/HostedByCard";
import { StickyNavBar } from "@/components/product-details/StickyNavBar";
import { ImageGalleryHero } from "@/components/product-details/ImageGalleryHero";
import {
  InclusionsSection,
  ExclusionsSection,
  HouseRulesSection,
} from "@/components/product-details/ListSections";
import { AmenitiesSection } from "@/components/product-details/AmenitiesSection";
import { HiddenPdfView } from "@/components/product-details/HiddenPdfView";
import { ReviewsSection as DetailsReviewsSection } from "@/components/product-details/ReviewsSection";
// Use the shared CalendarDropdown — its `onSelect` prop matches the call
// site below. The previously inline copy was silently broken (declared
// `onApplyRange` but the call site passed `onSelect`).
import { CalendarDropdown } from "@/components/CalendarDropdown";
import { IoIosArrowBack } from "react-icons/io";
import { RiFridgeLine, RiShareCircleFill } from "react-icons/ri";
import {
  FaBed,
  FaCarSide,
  FaShower,
  FaTv,
  FaWifi,
  FaToilet,
  FaFirstAid,
  FaMusic,
  FaUtensils,
} from "react-icons/fa";
import { GiCampingTent } from "react-icons/gi";
import { MdOutlineOutdoorGrill } from "react-icons/md";
import { GuestDropdown } from "@/components/GuestDropdown";
import {
  offersApi,
  OfferDTO,
  API_BASE_URL,
  cmsPublicApi,
  PublicFaq,
  vendorPublicApi,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ReadMore from "@/components/ReadMore";
import { getImageUrl } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { StayDetailsSkeleton } from "@/utils/UniqueStaysSkeleton";

export default function UniqueStayDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPricing, setSelectedPricing] = useState("per-night");
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [checkInDate, setCheckInDate] = useState<Date>(new Date());
  const [checkOutDate, setCheckOutDate] = useState<Date>(
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  );

  const [guests, setGuests] = useState({
    adults: 1,
    children: 0,
    infants: 0,
    pet: 0,
  });

  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  type CardItem = {
    id: string;
    title: string;
    details: string;
    price: string;
    Maxprice?: string | number;
    unit: string;
    image: string;
    images?: string[];
  };
  // Normalize various category labels from DB into 3 homepage buckets
  const getNormCategory = (cat?: string, serviceType?: string) => {
    const s = String(serviceType || "").toLowerCase();
    if (s === "camper-van") return "caravan" as const;
    if (s === "unique-stay" || s === "unique-stays") return "unique-stays" as const;
    if (s === "activity") return "activity" as const;

    const c = String(cat || "").toLowerCase();
    const cClean = c.replace(/[\s_-]+/g, "");

    if (
      ["caravan", "campervan", "campertrailer", "motorhome", "rv"].some((k) => cClean.includes(k))
    )
      return "caravan" as const;
    if (
      cClean.includes("stay") ||
      cClean === "uniquestays" ||
      cClean === "unique" ||
      cClean === "stays"
    )
      return "unique-stays" as const;
    if (cClean === "activity" || cClean === "activities") return "activity" as const;
    return c as "caravan" | "unique-stays" | "activity";
  };

  const mapOfferToCard = (o: OfferDTO): CardItem => {
    const ncat = getNormCategory(o.category, o.serviceType);
    const route =
      ncat === "caravan"
        ? `/campervan/${o._id}`
        : ncat === "unique-stays"
          ? `/unique-stay/${o._id}`
          : `/activity/${o._id}`;
    const unit = ncat === "activity" ? "/ person" : ncat === "caravan" ? "/ day" : "/ night";
    const img =
      o.photos?.coverUrl && o.photos.coverUrl.length > 0
        ? o.photos.coverUrl
        : o.photos?.galleryUrls?.[0] || "/placeholder.svg";
    return {
      id: route,
      title: o.name,
      details: o.city && o.state ? `${o.city}, ${o.state}` : o.city || o.state || "",
      price: `₹${o.regularPrice}`,
      Maxprice: Math.round(Number(o.regularPrice || 0) * 1.2) || undefined,
      unit,
      image: img,
      images: [
        ...(o.photos?.coverUrl ? [o.photos.coverUrl] : []),
        ...(Array.isArray(o.photos?.galleryUrls) ? o.photos.galleryUrls : []),
      ]
        .filter(Boolean)
        .slice(0, 5),
    };
  };

  // Loaded stay data from API + vendor details
  const [pages, setPages] = useState<{ caravan: number; "unique-stays": number; activity: number }>(
    { caravan: 1, "unique-stays": 1, activity: 1 },
  );
  const pageSize = 12;

  // ─── Activity detail (by id) ─────────────────────────────────────────
  const stayQuery = useQuery<OfferDTO | null>({
    queryKey: ["offer", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await offersApi.get(id!);
      return ((res as any)?.data ?? null) as OfferDTO | null;
    },
  });
  const stay = stayQuery.data ?? null;
  const loadingStay = stayQuery.isLoading;
  const vendorId = (stay as any)?.vendorId;

  // ─── Vendor — depends on the offer's vendorId ────────────────────────
  const vendorQuery = useQuery<any | null>({
    queryKey: ["vendor", "public", vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      try {
        const v = await vendorPublicApi.get(vendorId);
        return v?.data ?? null;
      } catch {
        return null;
      }
    },
  });
  const vendor = vendorQuery.data ?? null;
  const loadingVendor = vendorQuery.isLoading;

  // ─── Related offers ─────────────────────────────────────────────────
  const { data: offers = [] } = useQuery<OfferDTO[]>({
    queryKey: ["offers", "list", "approved"],
    queryFn: async () => {
      try {
        const res = await offersApi.list("approved");
        return res.data || [];
      } catch {
        return [];
      }
    },
  });

  const approved = offers.filter((o) => o.status === "approved");
  const caravanCards: CardItem[] = approved
    .filter((o) => getNormCategory(o.category, o.serviceType) === "caravan")
    .map(mapOfferToCard);
  const stayCards: CardItem[] = approved
    .filter((o) => getNormCategory(o.category, o.serviceType) === "unique-stays")
    .map(mapOfferToCard);
  const activityCards: CardItem[] = approved
    .filter((o) => getNormCategory(o.category, o.serviceType) === "activity")
    .map(mapOfferToCard);

  const caravanTotalPages = Math.max(1, Math.ceil(caravanCards.length / pageSize));
  const stayTotalPages = Math.max(1, Math.ceil(stayCards.length / pageSize));
  const activityTotalPages = Math.max(1, Math.ceil(activityCards.length / pageSize));

  const caravanShown = caravanCards.slice(0, pages.caravan * pageSize);
  const stayShown = stayCards.slice(0, pages["unique-stays"] * pageSize);
  const activityShown = activityCards.slice(0, pages.activity * pageSize);
  const [openPoliciesDialog, setOpenPoliciesDialog] = useState(false);
  const [openInclusions, setOpenInclusions] = useState(false);
  const [openExclusions, setOpenExclusions] = useState(false);
  const [openReviewsDialog, setOpenReviewsDialog] = useState(false);
  const [openDesc, setOpenDesc] = useState(false);

  const description = stay?.description || "";

  const inclusions = stay?.priceIncludes || [];
  const inclusionsText = inclusions.map((i) => `• ${i} </br>`).join("\n");

  const exclusions = stay?.priceExcludes || [];
  const exclusionsText = exclusions.map((e) => `• ${e} </br>`).join("\n");

  const policies = stay?.rules || [];
  const visiblePolicies = policies.map((e) => `• ${e} </br>`).join("\n");

  const handleContactOwner = async () => {
    console.log("Contact Owner clicked");
    console.log("User:", user);
    console.log("Vendor:", vendor);

    if (!isAuthenticated || !user) {
      console.log("User not authenticated, redirecting to register");
      navigate("/register");
      return;
    }

    if (!vendor?._id) {
      console.error("Vendor ID missing from vendor object:", vendor);
      toast.error("Cannot contact owner: Vendor details missing");
      return;
    }

    try {
      console.log("Creating conversation...");
      const payload = {
        vendorId: vendor._id,
        userId: user.id,
        title: `${vendor.brandName || vendor.personName || "Vendor"} - ${user.name || "User"}`,
      };
      console.log("Payload:", payload);

      const res = await fetch(`${API_BASE_URL}/api/vendorchats/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      console.log("Conversation response:", json);

      if (json.success) {
        navigate("/chat", { state: { conversationId: json.data._id } });
      } else {
        console.error("Failed to create conversation", json);
        toast.error("Failed to start chat: " + (json.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error creating conversation", err);
      toast.error("Error starting chat. Please try again.");
    }
  };

  // Stay + vendor are fetched by the useQuery hooks above.

  const amenities = (stay?.features || []).map((feature) => ({ icon: Star, name: feature }));

  const visibleAmenities = showAll ? amenities : amenities.slice(0, 12);

  const allReviews: { name: string; date: string; review: string }[] = [];

  const visibleReviews = showAllReviews ? allReviews : allReviews.slice(0, 4);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const allTabs = [
    { id: "overview", label: "Overview", hasContent: true },
    { id: "amenities", label: "Amenities", hasContent: amenities.length > 0 },
    { id: "inclusions", label: "Inclusions", hasContent: inclusions.length > 0 },
    { id: "exclusions", label: "Exclusions", hasContent: exclusions.length > 0 },
    { id: "policies", label: "Policies & Rules", hasContent: policies.length > 0 },
    { id: "reviews", label: "Reviews", hasContent: true },
    { id: "owner", label: "Owner Details", hasContent: true },
  ];

  const tabs = allTabs.filter((tab) => tab.hasContent);

  useEffect(() => {
    const handleScroll = () => {
      const sections = tabs
        .map((t) => document.getElementById(t.id))
        .filter(Boolean) as HTMLElement[];
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].getBoundingClientRect().top <= 120) {
          if (activeTab !== tabs[i].id) setActiveTab(tabs[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tabs]);

  const galleryImages =
    stay?.photos?.galleryUrls && stay.photos.galleryUrls.length > 0
      ? [stay.photos.coverUrl, ...stay.photos.galleryUrls]
          .filter(Boolean)
          .map((url) => getImageUrl(url))
      : uniqueStayImages;

  return (
    <>
      {(loadingStay || loadingVendor) && <StayDetailsSkeleton />}
      {!(loadingStay || loadingVendor) && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="min-h-screen font-sans flex-col flex gap-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors"
          >
            <Header callbackFun={() => {}} onNavigate={() => {}} />

            <div ref={contentRef} className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 z-10">
              {/* Back Navigation */}
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
              >
                <IoIosArrowBack size={16} /> Back
              </button>

              {/* Header Section */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                className="mb-5"
              >
                {/* Category + Difficulty badge row */}
                <div className="flex items-center gap-2 mb-2">
                  {stay?.category && (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wide">
                      {stay.category.replace("-", " ")}
                    </span>
                  )}
                  {(stay as any)?.difficulty && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        (stay as any).difficulty === "easy"
                          ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300"
                          : (stay as any).difficulty === "moderate"
                            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
                            : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {(stay as any).difficulty}
                    </span>
                  )}
                </div>

                {/* Title + Actions */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-gray-900 dark:text-white leading-snug tracking-tight">
                    {stay?.name}
                  </h1>
                  <ShareSaveButtons
                    isAuthenticated={isAuthenticated}
                    isFavorite={isFavorite}
                    setIsFavorite={setIsFavorite}
                    onShareClick={() => setShowShareModal(true)}
                    onLoginRequired={() => setShowLoginModal(true)}
                  />
                </div>

                {/* Meta row: location, rating, price */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">
                      {[stay?.city, stay?.state].filter(Boolean).join(", ")}
                    </span>
                  </div>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {(stay as any)?.ratings?.average || "4.91"}
                    </span>
                    {(stay as any)?.ratings?.count && (
                      <span className="text-sm text-gray-400">({(stay as any).ratings.count})</span>
                    )}
                  </div>
                  {stay?.regularPrice && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        ₹{Number(stay.regularPrice).toLocaleString()}{" "}
                        <span className="font-normal text-gray-500">/ person</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Quick info pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {stay?.timeDuration && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {stay.timeDuration}
                    </span>
                  )}
                  {stay?.personCapacity && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <Users className="w-3.5 h-3.5" /> Up to {stay.personCapacity} persons
                    </span>
                  )}
                  {(stay as any)?.minAge && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                      Age {(stay as any).minAge}+
                    </span>
                  )}
                  {(stay?.features || []).slice(0, 2).map((item, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>

              <ImageGalleryHero
                coverUrl={stay?.photos?.coverUrl}
                galleryUrls={stay?.photos?.galleryUrls}
                name={stay?.name}
                altFallback="Activity"
                totalPhotoCount={galleryImages.length}
                onPhotoClick={(i) => {
                  setPhotoIndex(i);
                  setShowPhotoGallery(true);
                }}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-1">
                {/* Main Content */}
                <div className="lg:col-span-2 mt-3">
                  <StickyNavBar tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} layoutIdPrefix="activity-tab" />

                  {/* All sections stacked — scroll into view */}
                  <div className="space-y-12">
                    <div id="overview" className="scroll-mt-36 space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        About this activity
                      </h3>
                      <div className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
                        <ReadMore
                          children={description}
                          maxCharacters={400}
                          dialogTitle="Full Description"
                        />
                      </div>
                    </div>

                    <AmenitiesSection
                      amenities={amenities}
                      visibleAmenities={visibleAmenities}
                      showAll={showAll}
                      onShowAll={() => setShowAll(true)}
                      heading="Features & Amenities"
                    />

                    <InclusionsSection items={inclusions} />
                    <ExclusionsSection items={exclusions} />
                    <HouseRulesSection rules={policies} headerGap="normal" />

                    <DetailsReviewsSection visibleReviews={[]} showStatsPanel={false} />

                    <HostedByCard vendor={vendor} onContactClick={handleContactOwner} />
                  </div>
                </div>

                <BookingWidget
                  priceLabel="person"
                  rareItemNoun="activity"
                  regularPrice={Number(stay?.regularPrice || 0)}
                  checkInDate={checkInDate}
                  checkOutDate={checkOutDate}
                  onDateChange={(range) => {
                    setCheckInDate(range.start);
                    setCheckOutDate(range.end);
                  }}
                  guests={guests}
                  setGuests={setGuests}
                  formatDate={(d) =>
                    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  }
                  onReserve={() => {
                    navigate("/payment", {
                      state: {
                        offerId: id,
                        checkInDate,
                        checkOutDate,
                        guests,
                        serviceType: "activity",
                        service: stay,
                        type: "activity",
                      },
                    });
                  }}
                />
              </div>
            </div>

            <div className="mt-10">
              <Footer />
            </div>

            {/* Photo Gallery Modal */}
            <PhotoGallery
              images={galleryImages}
              initialIndex={photoIndex}
              isOpen={showPhotoGallery}
              onClose={() => setShowPhotoGallery(false)}
            />
            <HiddenPdfView
              pdfRef={pdfRef}
              stay={stay}
              vendor={vendor}
              allReviews={allReviews}
              getAmenityIcon={() => Star}
              categoryLabel={stay?.category ? getNormCategory(stay.category).replace("-", " ") : ""}
              priceLabel="person"
            />

            <LoginModal
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              onSuccess={() => {
                setIsFavorite(true);
                toast.success("Added to favorites!");
              }}
            />

            {/* Share Modal */}
            <ShareModal
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
              title={stay?.name || "Activity"}
              url={window.location.href}
              contentRef={pdfRef}
              isDarkMode={isDarkMode}
            />
          </motion.div>

          <MobileBookingBar
            priceLabel="person"
            regularPrice={Number(stay?.regularPrice || 0)}
            ctaLabel="Book now"
            onCtaClick={() => {
              navigate("/payment", {
                state: {
                  offerId: id,
                  checkInDate,
                  checkOutDate,
                  guests,
                  serviceType: "activity",
                  service: stay,
                  type: "activity",
                },
              });
            }}
          />

          <div className="fixed bottom-0 left-0 right-0 z-50 dark:bg-black dark:text-white bg-white border-t border-gray-200 dark:border-gray-800 shadow-md">
            <MobileUserNav />
          </div>
        </>
      )}
    </>
  );
}
