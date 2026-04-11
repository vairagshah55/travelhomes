import React, { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/button";
import Header, { HomeHeader } from "../../components/Header";
import Footer from "../../components/Footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import FAQSection, { uniqueStayFAQs } from "../../components/FAQSection";
import PhotoGallery, { uniqueStayImages } from "../../components/PhotoGallery";
import ReviewsSection, {
  uniqueStayReviews,
  uniqueStayCategories,
} from "../../components/ReviewsSection";
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
import ReserveBookingModal from "./reserveBooking";
import ShareModal from "./ShareModal";
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
import { GiCampingTent,   } from "react-icons/gi";
import { MdOutlineOutdoorGrill } from "react-icons/md";
import { GuestDropdown } from "@/components/GuestDropdown";
import { offersApi, OfferDTO, API_BASE_URL, cmsPublicApi, PublicFaq, vendorPublicApi } from "@/lib/api";
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
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [checkInDate, setCheckInDate] = useState<Date>(new Date());
  const [checkOutDate, setCheckOutDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
const [openAmenitiesModal, setOpenAmenitiesModal] = useState(false);
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
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginFieldErrors, setLoginFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  type CardItem = { id: string; title: string; details: string; price: string; Maxprice?: string | number; unit: string; image: string; images?: string[] };
 // Normalize various category labels from DB into 3 homepage buckets
  const getNormCategory = (cat?: string, serviceType?: string) => {
    const s = String(serviceType || "").toLowerCase();
    if (s === "camper-van") return "caravan" as const;
    if (s === "unique-stay" || s === "unique-stays") return "unique-stays" as const;
    if (s === "activity") return "activity" as const;

    const c = String(cat || '').toLowerCase();
    const cClean = c.replace(/[\s_-]+/g, "");

    if (
      ["caravan", "campervan", "campertrailer", "motorhome", "rv"].some((k) =>
        cClean.includes(k),
      )
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
    return c as 'caravan'|'unique-stays'|'activity';
  };

    const mapOfferToCard = (o: OfferDTO): CardItem => {
      const ncat = getNormCategory(o.category, o.serviceType);
      const route = ncat === 'caravan' ? `/campervan/${o._id}` : ncat === 'unique-stays' ? `/unique-stay/${o._id}` : `/activity/${o._id}`;
      const unit = ncat === 'activity' ? '/ person' : ncat === 'caravan' ? '/ day' : '/ night';
      const img = (o.photos?.coverUrl && o.photos.coverUrl.length > 0) ? o.photos.coverUrl : (o.photos?.galleryUrls?.[0] || '/placeholder.svg');
      return {
        id: route,
        title: o.name,
        details: (o.city && o.state) ? `${o.city}, ${o.state}` : (o.city || o.state || ''),
        price: `₹${o.regularPrice}`,
        Maxprice: Math.round(Number(o.regularPrice || 0) * 1.2) || undefined,
        unit,
        image: img,
        images: [
          ...(o.photos?.coverUrl ? [o.photos.coverUrl] : []),
          ...(Array.isArray(o.photos?.galleryUrls) ? o.photos.galleryUrls : []),
        ].filter(Boolean).slice(0, 5),
      };
    };
  
  // Loaded stay data from API + vendor details
  const [stay, setStay] = useState<OfferDTO | null>(null);
  const [loadingStay, setLoadingStay] = useState<boolean>(true);
  const [vendor, setVendor] = useState<any>(null);
  const [loadingVendor, setLoadingVendor] = useState<boolean>(false);
    const [pages, setPages] = useState<{ caravan: number; 'unique-stays': number; activity: number }>({ caravan: 1, 'unique-stays': 1, activity: 1 });
    const [offers, setOffers] = useState<OfferDTO[]>([]);

  // Fetch related offers
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await offersApi.list("approved");
        if (mounted) setOffers(res.data || []);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Build smart related sections — exclude current listing
  const relatedStays = offers
    .filter(o => o.status === "approved" && getNormCategory(o.category, o.serviceType) === "unique-stays" && o._id !== id)
    .map(mapOfferToCard);

  // Same city stays
  const sameCityStays = stay?.city
    ? offers
        .filter(o => o.status === "approved" && getNormCategory(o.category, o.serviceType) === "unique-stays" && o._id !== id && o.city?.toLowerCase() === stay.city?.toLowerCase())
        .map(mapOfferToCard)
    : [];

  // Similar price range (±40%)
  const currentPrice = Number(stay?.regularPrice || 0);
  const similarPriceStays = currentPrice > 0
    ? offers
        .filter(o => {
          if (o._id === id || o.status !== "approved" || getNormCategory(o.category, o.serviceType) !== "unique-stays") return false;
          const p = Number(o.regularPrice || 0);
          return p >= currentPrice * 0.6 && p <= currentPrice * 1.4;
        })
        .map(mapOfferToCard)
    : [];

  // "You might also like" = similar price stays that are NOT in the same city (to avoid duplicates)
  const alsoLikeStays = similarPriceStays.filter(s => !sameCityStays.find(c => c.id === s.id)).slice(0, 4);

  // Legacy compat
  const stayShown = relatedStays.slice(0, 4);
  const [openInclusions, setOpenInclusions]=useState(false)
  const [openExclusions, setOpenExclusions]=useState(false)
  const [openReviewsDialog, setOpenReviewsDialog]=useState(false)
  const [openPoliciesDialog, setOpenPoliciesDialog]=useState(false)


const description = stay?.description || "";

const inclusions = stay?.priceIncludes || [];

const inclusionsText = inclusions.map(i => `• ${i} </br>`).join("\n");
const exclusions = stay?.priceExcludes || [];
const exclusionsText = exclusions.map(e => `• ${e} </br>`).join("\n");
const policies = stay?.rules || [];

const visiblePolicies = policies.map(e => `• ${e} </br>`).join("\n");


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
        title: `${vendor.brandName || vendor.personName || 'Vendor'} - ${user.name || 'User'}`
      };
      console.log("Payload:", payload);

      const res = await fetch(`${API_BASE_URL}/api/vendorchats/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoadingStay(true);
    setVendor(null);
    (async () => {
      try {
        const res = await offersApi.get(id);
        if (!mounted) return;
        const doc = (res as any)?.data || null;
        setStay(doc);
        const vId = (doc as any)?.vendorId;
        if (vId) {
          setLoadingVendor(true);
          vendorPublicApi.get(vId)
            .then((v) => mounted && setVendor(v?.data || null))
            .catch(() => mounted && setVendor(null))
            .finally(() => mounted && setLoadingVendor(false));
        }
        console.log("Offer detail response:", res);
      } catch (err) {
        console.error("Offer fetch error:", err);
      } finally {
        mounted && setLoadingStay(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const getAmenityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("wifi")) return Wifi;
    if (n.includes("parking") || n.includes("car")) return Car;
    if (n.includes("kitchen") || n.includes("cooking") || n.includes("chef")) return ChefHat;
    if (n.includes("tv") || n.includes("television")) return Tv;
    if (n.includes("bath") || n.includes("shower")) return Bath;
    if (n.includes("bed")) return Bed;
    if (n.includes("toilet")) return FaToilet;
    if (n.includes("fridge") || n.includes("refrigerator")) return RiFridgeLine;
    if (n.includes("grill") || n.includes("bbq")) return MdOutlineOutdoorGrill;
    if (n.includes("music")) return FaMusic;
    if (n.includes("first aid")) return FaFirstAid;
    if (n.includes("tent")) return GiCampingTent;
    if (n.includes("ac") || n.includes("heater") || n.includes("temperature")) return Thermometer;
    if (n.includes("security") || n.includes("shield")) return Shield;
    if (n.includes("coffee")) return Coffee;
    return Star;
  };

  const amenities = (stay?.features || []).map(feature => ({ icon: getAmenityIcon(feature), name: feature }));

  const visibleAmenities = showAll ? amenities : amenities.slice(0, 12);

  const allReviews = [];

  const visibleReviews = showAllReviews ? allReviews : allReviews.slice(0, 4);

  const calendarRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendarDropdown(false);
      }
      if (
        guestRef.current &&
        !guestRef.current.contains(event.target as Node)
      ) {
        setShowGuestDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const tabs = allTabs.filter(tab => tab.hasContent);

  // Highlight active tab based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = tabs.map(t => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
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

  /*
    Legacy static samples for UniqueStay were here.
    Removed in favor of dynamic data fetch.
  */
  
  const galleryImages = stay?.photos?.galleryUrls && stay.photos.galleryUrls.length > 0
    ? [stay.photos.coverUrl, ...stay.photos.galleryUrls].filter(Boolean).map(url => getImageUrl(url))
    : uniqueStayImages;

  return (

    <>
      {(loadingStay || loadingVendor) && (
                <StayDetailsSkeleton/>
                )}
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
            {/* Category badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wide">
                Unique Stay
              </span>
            </div>

            {/* Title + Actions */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-gray-900 dark:text-white leading-snug tracking-tight">
                {stay?.name}
              </h1>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300"
                >
                  <RiShareCircleFill className="w-4 h-4 -rotate-45" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) { setShowLoginModal(true); return; }
                    setIsFavorite(!isFavorite);
                    toast.success(isFavorite ? "Removed from favorites" : "Added to favorites!");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 text-sm ${isFavorite ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                >
                  <Heart className={`w-4 h-4 transition-all duration-300 ${isFavorite ? "fill-red-500 text-red-500 scale-110" : ""}`} />
                  <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* Meta row: location, rating, price */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{[stay?.city, stay?.state].filter(Boolean).join(", ")}</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">4.91</span>
                <span className="text-sm text-gray-400">(2,304)</span>
              </div>
              {stay?.regularPrice && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">₹{Number(stay.regularPrice).toLocaleString()} <span className="font-normal text-gray-500">/ night</span></span>
                </>
              )}
            </div>

            {/* Quick info pills */}
            <div className="flex flex-wrap items-center gap-2">
              {stay?.guestCapacity && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold">
                  <Users className="w-3.5 h-3.5" /> {stay.guestCapacity} guests
                </span>
              )}
              {stay?.numberOfRooms && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <Building2 className="w-3.5 h-3.5" /> {stay.numberOfRooms} rooms
                </span>
              )}
              {stay?.numberOfBeds && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <Bed className="w-3.5 h-3.5" /> {stay.numberOfBeds} beds
                </span>
              )}
              {stay?.numberOfBathrooms && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <Bath className="w-3.5 h-3.5" /> {stay.numberOfBathrooms} baths
                </span>
              )}
              {(stay?.features || []).slice(0, 2).map((item, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">{item}</span>
              ))}
            </div>
          </motion.div>

          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="mb-4 w-full max-w-[1280px]"
          >
            {/* Mobile: Single hero image with tap to open gallery */}
            <div className="md:hidden relative rounded-2xl overflow-hidden aspect-[16/10]"
              onClick={() => { setPhotoIndex(0); setShowPhotoGallery(true); }}
            >
              <img
                src={getImageUrl(stay?.photos?.coverUrl) || getImageUrl(stay?.photos?.galleryUrls?.[0])}
                alt={stay?.name || "Stay"}
                className="w-full h-full object-cover"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {galleryImages.slice(0, 5).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-white/40"}`} />
                  ))}
                </div>
                <button className="bg-white/90 backdrop-blur-sm text-black text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
                  {galleryImages.length} photos
                </button>
              </div>
            </div>

            {/* Desktop: Grid gallery */}
            <div className="hidden md:grid grid-cols-4 gap-2 lg:gap-3 h-[340px] lg:h-[420px]">
              {/* Main Left Image */}
              <div className="col-span-2 row-span-2 relative overflow-hidden rounded-xl cursor-pointer group">
                <img
                  src={getImageUrl(stay?.photos?.coverUrl) || getImageUrl(stay?.photos?.galleryUrls?.[0])}
                  onClick={() => { setPhotoIndex(0); setShowPhotoGallery(true); }}
                  alt={stay?.name || "Stay Main"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>

              {/* Right images */}
              {[1, 2].map((i) => (
                <div key={i} className="relative overflow-hidden rounded-xl cursor-pointer group">
                  <img
                    src={getImageUrl(stay?.photos?.galleryUrls?.[i])}
                    onClick={() => { setPhotoIndex(i + (stay?.photos?.coverUrl ? 1 : 0)); setShowPhotoGallery(true); }}
                    alt={`${stay?.name || "Stay"} ${i}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
              ))}

              {/* Bottom right with "View all" */}
              <div className="col-span-2 relative overflow-hidden rounded-xl cursor-pointer group">
                <img
                  src={getImageUrl(stay?.photos?.galleryUrls?.[3])}
                  onClick={() => { setPhotoIndex(3 + (stay?.photos?.coverUrl ? 1 : 0)); setShowPhotoGallery(true); }}
                  alt={stay?.name || "Stay"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
                <button
                  onClick={() => { setPhotoIndex(0); setShowPhotoGallery(true); }}
                  className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-black text-sm font-medium px-4 py-2 rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all duration-200"
                >
                  View all {galleryImages.length} photos
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-1">
           {/* Main Content */}
                      <div className="lg:col-span-2 mt-3">
                        {/* Sticky Nav Bar */}
                        <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm mb-8">
                          <div className="flex overflow-x-auto scrollbar-hide gap-1 relative">
                            {tabs.map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => {
                                  setActiveTab(tab.id);
                                  const el = document.getElementById(tab.id);
                                  if (el) {
                                    const y = el.getBoundingClientRect().top + window.scrollY - 80;
                                    window.scrollTo({ top: y, behavior: "smooth" });
                                  }
                                }}
                                className={`relative px-4 sm:px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                                  activeTab === tab.id
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                              >
                                {tab.label}
                                {activeTab === tab.id && (
                                  <motion.div
                                    layoutId="tab-indicator"
                                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 dark:bg-white rounded-full"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                          <div className="h-px bg-gray-200 dark:bg-gray-700" />
                        </div>

                        {/* All sections stacked — scroll into view */}
                        <div className="space-y-12">

                          {/* Overview */}
                          <div id="overview" className="scroll-mt-24 space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">About this place</h3>
                            <div className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
                              <ReadMore children={description} maxCharacters={400} dialogTitle="Full Description"/>
                            </div>
                          </div>

                          {/* Amenities */}
                          {amenities.length > 0 && (
                            <div id="amenities" className="scroll-mt-24 space-y-5">
                              <div className="h-px bg-gray-100 dark:bg-gray-800" />
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Amenities</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {visibleAmenities.map((amenity, i) => (
                                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                      <amenity.icon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-200">{amenity.name}</span>
                                  </div>
                                ))}
                              </div>
                              {!showAll && amenities.length > 12 && (
                                <button onClick={() => setShowAll(true)} className="text-sm font-medium text-gray-900 dark:text-white underline underline-offset-2 hover:text-gray-600">
                                  Show all {amenities.length} amenities
                                </button>
                              )}
                            </div>
                          )}

                          {/* Inclusions */}
                          {inclusions.length > 0 && (
                            <div id="inclusions" className="scroll-mt-24">
                              <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8" />
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inclusions</h3>
                              <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10 p-5">
                                <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                                  {inclusions.join("\n")}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Exclusions */}
                          {exclusions.length > 0 && (
                            <div id="exclusions" className="scroll-mt-24">
                              <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8" />
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exclusions</h3>
                              <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-5">
                                <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                                  {exclusions.join("\n")}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Policies & Rules */}
                          {policies.length > 0 && (
                            <div id="policies" className="scroll-mt-24">
                              <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8" />
                              <div className="flex items-center gap-2 mb-5">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">House Rules</h3>
                              </div>
                              <div className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {policies.map((rule, i) => (
                                  <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i !== policies.length - 1 ? "border-b border-gray-50 dark:border-gray-700/50" : ""} hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors`}>
                                    <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                                      {i + 1}
                                    </span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{rule}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Reviews */}
                          <div id="reviews" className="scroll-mt-24 space-y-6">
                            <div className="h-px bg-gray-100 dark:bg-gray-800" />
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reviews</h3>
                              <Button
                                className="bg-gray-900 text-white rounded-full px-5 text-sm hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                                onClick={() => toast("Opening review form...")}
                              >
                                Add Review
                              </Button>
                            </div>

                            <div className="flex items-center gap-6 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                              <div className="text-center">
                                <div className="text-4xl font-bold text-gray-900 dark:text-white">4.5</div>
                                <div className="flex items-center gap-0.5 mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/40 text-yellow-400/40"}`} />
                                  ))}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">2,304 reviews</div>
                              </div>
                              <div className="flex-1 space-y-2.5">
                                {["Cleanliness", "Accuracy", "Communication", "Location", "Value"].map((cat) => (
                                  <div key={cat} className="flex items-center gap-3">
                                    <span className="w-24 text-xs text-gray-600 dark:text-gray-300">{cat}</span>
                                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                      <div className="h-full bg-gray-900 dark:bg-white rounded-full" style={{ width: "96%" }} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 w-6">4.8</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {visibleReviews.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {visibleReviews.map((review, index) => (
                                  <div key={index} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
                                    <div className="flex items-center gap-3">
                                      <img src={review.profile} className="w-9 h-9 rounded-full object-cover" />
                                      <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{review.name}</div>
                                        <div className="text-xs text-gray-500">{review.date}</div>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{review.review}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No reviews yet. Be the first to leave a review.</p>
                            )}
                          </div>

                          {/* Owner */}
                          <div id="owner" className="scroll-mt-24 space-y-5">
                            <div className="h-px bg-gray-100 dark:bg-gray-800" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hosted by</h3>
                            <div className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
                              <img
                                src={vendor?.photo || "/User.jpg"}
                                alt={vendor?.brandName || vendor?.personName || "Owner"}
                                className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {vendor?.firstName || vendor?.personal?.firstName} {vendor?.lastName || vendor?.personal?.lastName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {[vendor?.businessCity || vendor?.business?.city, vendor?.businessState || vendor?.business?.state].filter(Boolean).join(", ")}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  {vendor?.rating && (
                                    <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                                      <Star className="w-3 h-3 fill-current" /> {vendor.rating}
                                    </span>
                                  )}
                                  {vendor?.reviewCount && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{vendor.reviewCount} reviews</span>
                                  )}
                                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Verified</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="bg-gray-900 text-white rounded-full px-4 text-xs hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 flex-shrink-0"
                                onClick={handleContactOwner}
                              >
                                Contact
                              </Button>
                            </div>
                          </div>

                        </div>
                      </div>

            {/* Sidebar - Booking Card */}
            <div className="lg:col-span-1 lg:mt-24 mt-8">
              <div className="sticky top-8 bg-white dark:bg-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-3xl p-6 sm:p-8 shadow-lg">

                {/* Price + Savings */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {stay?.regularPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{Math.round(Number(stay.regularPrice) * 1.2).toLocaleString()}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{Number(stay?.regularPrice || 0).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/ night</span>
                    {stay?.regularPrice && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                        Save 17%
                      </span>
                    )}
                  </div>
                </div>

                {/* Rare find nudge */}
                <div className="flex items-start gap-3 p-3 mb-5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  <span className="text-lg flex-shrink-0">💎</span>
                  <div>
                    <div className="text-sm font-semibold text-rose-800 dark:text-rose-300">Rare find</div>
                    <div className="text-xs text-rose-600 dark:text-rose-400">This place is usually booked. Don't miss out.</div>
                  </div>
                </div>

                {/* Booking Form */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative z-50" ref={calendarRef}>
                      <div className="p-4 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-gray-300 transition-colors" onClick={() => { setShowCalendarDropdown(!showCalendarDropdown); setShowGuestDropdown(false); }}>
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2 text-gray-500"><Calendar className="w-4 h-4" /><span className="text-sm font-medium">Date</span></div>
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-black">{checkInDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                          <ArrowRight className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-black">{checkOutDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      </div>
                      {showCalendarDropdown && (<CalendarDropdown onClose={() => setShowCalendarDropdown(false)} onSelect={(range) => { setCheckInDate(range.start); setCheckOutDate(range.end); setShowCalendarDropdown(false); }} />)}
                    </div>

                    <div className="relative" ref={guestRef}>
                      <div className="p-4 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-gray-300 transition-colors" onClick={() => { setShowGuestDropdown(!showGuestDropdown); setShowCalendarDropdown(false); }}>
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2 text-gray-500"><Users className="w-4 h-4" /><span className="text-sm font-medium">Guests</span></div>
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-black">{guests.adults + guests.children + guests.infants} Guests</span>
                      </div>
                      {showGuestDropdown && (<GuestDropdown guests={guests} onUpdate={setGuests} onClose={() => setShowGuestDropdown(false)} />)}
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-gray-900 dark:bg-white dark:text-black text-white py-4 rounded-xl font-medium text-lg hover:bg-gray-800 transition-colors mb-6" onClick={() => { navigate("/payment", { state: { offerId: id, checkInDate, checkOutDate, guests, serviceType: 'unique-stay', service: stay, type: "unique-stays" } }); }}>
                  Reserve
                </Button>
              </div>
            </div>
          </div>

          {/* Related Stays */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mt-14 space-y-14"
          >
            {/* Same city stays */}
            {sameCityStays.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      More stays in {stay?.city}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Explore similar places nearby
                    </p>
                  </div>
                  {sameCityStays.length > 4 && (
                    <button
                      onClick={() => navigate(`/search?filter=unique-stays&location=${stay?.city}`)}
                      className="text-sm font-medium text-gray-900 dark:text-white underline underline-offset-2 hover:text-gray-600"
                    >
                      View all
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto scrollbar-hidden -mx-4 px-4 md:mx-0 md:px-0">
                  <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 min-w-max md:min-w-0">
                    {sameCityStays.slice(0, 4).map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.08, duration: 0.4, ease: "easeOut" }}
                      >
                        <Link
                          to={item.id}
                          className="block w-64 md:w-auto flex-shrink-0 md:flex-shrink group card-shimmer-wrap rounded-2xl p-1.5 pb-3 cursor-pointer"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden rounded-xl img-shimmer-wrap">
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="img-shimmer-sweep" />
                          </div>
                          <div className="pt-3 px-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white line-clamp-1">{item.title}</h3>
                              <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                                <Star className="w-3.5 h-3.5 fill-current text-gray-900 dark:text-white" />
                                <span className="text-[13px] font-medium text-gray-900 dark:text-white">4.9</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-[13px] text-gray-500 dark:text-gray-400 truncate">{item.details}</span>
                            </div>
                            <div className="flex items-baseline gap-1.5 pt-0.5">
                              {item.Maxprice && <span className="text-[13px] text-gray-400 line-through">₹{item.Maxprice}</span>}
                              <span className="text-[15px] font-bold text-gray-900 dark:text-white">{item.price}</span>
                              <span className="text-[13px] text-gray-500">{item.unit}</span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* You might also like */}
            {alsoLikeStays.length > 0 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    You might also like
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Similar stays at a similar price
                  </p>
                </div>
                <div className="overflow-x-auto scrollbar-hidden -mx-4 px-4 md:mx-0 md:px-0">
                  <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 min-w-max md:min-w-0">
                    {alsoLikeStays.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.08, duration: 0.4, ease: "easeOut" }}
                      >
                        <Link
                          to={item.id}
                          className="block w-64 md:w-auto flex-shrink-0 md:flex-shrink group card-shimmer-wrap rounded-2xl p-1.5 pb-3 cursor-pointer"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden rounded-xl img-shimmer-wrap">
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="img-shimmer-sweep" />
                          </div>
                          <div className="pt-3 px-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white line-clamp-1">{item.title}</h3>
                              <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                                <Star className="w-3.5 h-3.5 fill-current text-gray-900 dark:text-white" />
                                <span className="text-[13px] font-medium text-gray-900 dark:text-white">4.9</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-[13px] text-gray-500 dark:text-gray-400 truncate">{item.details}</span>
                            </div>
                            <div className="flex items-baseline gap-1.5 pt-0.5">
                              {item.Maxprice && <span className="text-[13px] text-gray-400 line-through">₹{item.Maxprice}</span>}
                              <span className="text-[15px] font-bold text-gray-900 dark:text-white">{item.price}</span>
                              <span className="text-[13px] text-gray-500">{item.unit}</span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Fallback: if no city/price matches, show any other stays */}
            {sameCityStays.length === 0 && alsoLikeStays.length === 0 && stayShown.length > 0 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    More unique stays
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Handpicked stays you'll love
                  </p>
                </div>
                <DefaultCard CardData={stayShown} />
              </div>
            )}
          </motion.div>
        </div>

        <div className="mt-10">
          <Footer />
        </div>

        {/* Photo Gallery Modal */}
        <PhotoGallery
          images={
            stay?.photos?.galleryUrls && stay.photos.galleryUrls.length > 0
            ? stay.photos.galleryUrls.map(url => getImageUrl(url))                 
              : uniqueStayImages
          }
          isOpen={showPhotoGallery}
          onClose={() => setShowPhotoGallery(false)}
        />

        {/* Hidden PDF View - Replicating Page Design but Expanded */}
        <div style={{ display: "none" }}>
          <div ref={pdfRef} className="w-[800px] bg-white text-black font-sans p-8 mx-auto">
            {/* Header */}
            <h1 className="text-3xl font-bold mb-2">{stay?.name}</h1>
            <div className="flex items-center gap-4 mb-6 text-gray-600">
               <div className="flex items-center gap-1">
                 <MapPin className="w-4 h-4" />
                 {stay?.city}, {stay?.state}
               </div>
               {stay?.category && (
                 <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium capitalize">
                   {getNormCategory(stay.category).replace('-', ' ')}
                 </div>
               )}
            </div>

            {/* Images Grid - Fixed Aspect Ratio */}
            <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[500px] mb-8 rounded-xl overflow-hidden">
               {/* Main Image */}
               <div className="col-span-2 row-span-2">
                 <img onContextMenu={(e) => e.preventDefault()} draggable={false} 
                   src={getImageUrl(stay?.photos?.coverUrl || stay?.photos?.galleryUrls?.[0] || "")} 
                   className="w-full h-full object-cover"
                   crossOrigin="anonymous"
                 />
               </div>
               {/* Other Images */}
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className="col-span-1 row-span-1">
                   <img onContextMenu={(e) => e.preventDefault()} draggable={false} 
                     src={getImageUrl(stay?.photos?.galleryUrls?.[i] || stay?.photos?.coverUrl || "")} 
                     className="w-full h-full object-cover"
                     crossOrigin="anonymous"
                   />
                 </div>
               ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-3 gap-8">
               <div className="col-span-2 space-y-10">
                  {/* Overview */}
                  <section>
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">Overview</h2>
                    <div className="text-gray-800 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: stay?.description || "" }} />
                  </section>

                  {/* Amenities - Full Grid */}
                  <section>
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">Amenities</h2>
                    <div className="grid grid-cols-2 gap-4">
                       {stay?.features?.map((f, i) => {
                          const Icon = getAmenityIcon(f);
                          return (
                          <div key={i} className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-gray-900" />
                            <span className="text-gray-800">{f}</span>
                          </div>
                       )})}
                    </div>
                  </section>

                  {/* Inclusions */}
                  {stay?.priceIncludes && stay.priceIncludes.length > 0 && (
                    <section>
                      <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-green-800">Price Includes</h2>
                      <div className="grid grid-cols-1 gap-2">
                         {stay.priceIncludes.map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <span className="font-bold text-green-600">✓</span>
                              <span>{item}</span>
                            </div>
                         ))}
                      </div>
                    </section>
                  )}

                  {/* Exclusions */}
                  {stay?.priceExcludes && stay.priceExcludes.length > 0 && (
                    <section>
                      <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-red-800">Price Excludes</h2>
                      <div className="grid grid-cols-1 gap-2">
                         {stay.priceExcludes.map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <span className="font-bold text-red-600">✗</span>
                              <span>{item}</span>
                            </div>
                         ))}
                      </div>
                    </section>
                  )}

                  {/* Policies */}
                  {stay?.rules && stay.rules.length > 0 && (
                    <section>
                      <h2 className="text-2xl font-bold mb-4 border-b pb-2">Policies</h2>
                      <ul className="space-y-2 list-disc pl-5 text-gray-800">
                         {stay.rules.map((rule, i) => (
                            <li key={i}>{rule}</li>
                         ))}
                      </ul>
                    </section>
                  )}
                  
                   {/* Reviews Preview - Fixed number */}
                  {allReviews.length > 0 && (
                    <section>
                      <h2 className="text-2xl font-bold mb-4 border-b pb-2">Reviews</h2>
                      <div className="grid grid-cols-1 gap-6">
                         {allReviews.slice(0, 3).map((r, i) => (
                            <div key={i} className="bg-gray-50 p-4 rounded-lg">
                               <p className="font-bold">{r.name}</p>
                               <p className="text-sm text-gray-500 mb-2">{r.date}</p>
                               <p className="text-gray-700">{r.review}</p>
                            </div>
                         ))}
                      </div>
                    </section>
                  )}
               </div>

               {/* Right Sidebar - Pricing & Vendor */}
               <div className="col-span-1">
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
                     <p className="text-gray-500 mb-1">Starting from</p>
                     <p className="text-3xl font-bold mb-4">₹{stay?.regularPrice} <span className="text-base font-normal text-gray-600">/ {getNormCategory(stay?.category) === 'activity' ? 'person' : getNormCategory(stay?.category) === 'caravan' ? 'day' : 'night'}</span></p>
                     <div className="w-full h-px bg-gray-200 my-4"></div>
                     <p className="text-sm text-gray-500">Prices may vary based on dates and guests.</p>
                  </div>

                  {vendor && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                       <h3 className="font-bold text-lg mb-4">Hosted by</h3>
                       <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold">
                            {(vendor.brandName || vendor.personName || "V")[0]}
                          </div>
                          <div>
                            <p className="font-bold">{vendor.brandName || vendor.personName}</p>
                            <p className="text-sm text-gray-500">Verified Host</p>
                          </div>
                       </div>
                       <div className="space-y-2 text-sm text-gray-600">
                          {vendor.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {vendor.email}</p>}
                          {vendor.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {vendor.phone}</p>}
                       </div>
                    </div>
                  )}
               </div>
            </div>
            
             <div className="mt-12 pt-8 border-t text-center text-gray-500">
                <p>Generated from Travelhomes</p>
                <p className="text-sm mt-1">{window.location.href}</p>
             </div>
          </div>
        </div>

        {/* Login Modal */}
        <AnimatePresence>
          {showLoginModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
              onClick={() => setShowLoginModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close */}
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <XIcon className="w-5 h-5 text-gray-500" />
                </button>

                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Log in to save</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Save your favourite stays and access them anytime.</p>
                </div>

                {/* Form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoginError("");
                    const errs: { email?: string; password?: string } = {};

                    // Email validation
                    if (!loginForm.email.trim()) {
                      errs.email = "Email is required";
                    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email.trim())) {
                      errs.email = "Enter a valid email address";
                    }

                    // Password validation
                    if (!loginForm.password) {
                      errs.password = "Password is required";
                    } else if (loginForm.password.length < 6) {
                      errs.password = "Password must be at least 6 characters";
                    }

                    setLoginFieldErrors(errs);
                    if (Object.keys(errs).length > 0) return;

                    setLoginLoading(true);
                    try {
                      const success = await login(loginForm.email.trim(), loginForm.password, true);
                      if (success) {
                        toast.success("Logged in!");
                        setShowLoginModal(false);
                        setIsFavorite(true);
                        toast.success("Added to favorites!");
                        setLoginForm({ email: "", password: "" });
                        setLoginFieldErrors({});
                      } else {
                        setLoginError("Invalid email or password");
                      }
                    } catch {
                      setLoginError("Login failed. Please try again.");
                    } finally {
                      setLoginLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLoginForm(p => ({ ...p, email: val }));
                        if (!val.trim()) {
                          setLoginFieldErrors(p => ({ ...p, email: "Email is required" }));
                        } else if (val.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
                          setLoginFieldErrors(p => ({ ...p, email: "Enter a valid email address" }));
                        } else {
                          setLoginFieldErrors(p => ({ ...p, email: undefined }));
                        }
                      }}
                      placeholder="you@example.com"
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none transition-colors placeholder:text-gray-400 ${
                        loginFieldErrors.email
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500"
                      }`}
                      autoFocus
                    />
                    {loginFieldErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{loginFieldErrors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) => {
                          setLoginForm(p => ({ ...p, password: e.target.value }));
                          if (loginFieldErrors.password) setLoginFieldErrors(p => ({ ...p, password: undefined }));
                        }}
                        placeholder="Enter password"
                        className={`w-full px-4 py-2.5 pr-11 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none transition-colors placeholder:text-gray-400 ${
                          loginFieldErrors.password
                            ? "border-red-400 focus:border-red-500"
                            : "border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginFieldErrors.password && (
                      <p className="text-xs text-red-500 mt-1">{loginFieldErrors.password}</p>
                    )}
                  </div>

                  {/* Server error */}
                  {loginError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30">
                      <span className="text-red-500 text-sm mt-0.5">&#9888;</span>
                      <p className="text-sm text-red-600 dark:text-red-400">{loginError}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={loginLoading || !loginForm.email.trim() || !loginForm.password || !!loginFieldErrors.email || !!loginFieldErrors.password}
                    className="w-full bg-gray-900 dark:bg-white dark:text-black text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loginLoading ? "Logging in..." : "Log in"}
                  </Button>

                  {/* Register link */}
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setShowLoginModal(false); navigate("/register"); }}
                      className="text-gray-900 dark:text-white font-medium underline underline-offset-2"
                    >
                      Sign up
                    </button>
                  </p>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={stay?.name || "Unique Stay"}
          url={window.location.href}
          contentRef={pdfRef}
          isDarkMode={isDarkMode}
        />
      </motion.div>

      {/* Sticky mobile booking bar */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              {stay?.regularPrice && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{Math.round(Number(stay.regularPrice) * 1.2).toLocaleString()}
                </span>
              )}
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                ₹{Number(stay?.regularPrice || 0).toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">/ night</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {checkInDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – {checkOutDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </div>
          </div>
          <Button
            className="bg-gray-900 dark:bg-white dark:text-black text-white rounded-full px-6 h-11 text-sm font-semibold hover:bg-gray-800 flex-shrink-0 shadow-md"
            onClick={() => {
              if (isAuthenticated) {
                navigate("/payment", {
                  state: {
                    offerId: id,
                    checkInDate,
                    checkOutDate,
                    guests,
                    serviceType: 'unique-stay',
                    service: stay,
                    type: "unique-stays"
                  }
                });
              } else {
                navigate("/register");
              }
            }}
          >
            Check availability
          </Button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 dark:bg-black dark:text-white bg-white border-t border-gray-200 dark:border-gray-800 shadow-md">
        <MobileUserNav />
      </div>
    </>
          )}
    </>
  );
}

// // Unique Stay Card Component
// function UniqueStayCard({
//   id = Math.floor(Math.random() * 10) + 1,
// }: { id?: number } = {}) {
//   return (
//     <Link to={`/unique-stay/${id}`} className="group">
//       <div className="space-y-3">
//         <div className="relative aspect-square rounded-xl overflow-hidden">
//           <img onContextMenu={(e) => e.preventDefault()} draggable={false}
//             src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
//             alt="Unique Stay"
//             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//           />
//           <button className="absolute top-3 right-3 p-2 dark:bg-black dark:text-white bg-white/80 rounded-full hover:bg-white transition-colors">
//             <Heart className="w-4 h-4 text-gray-600 dark:text-white" />
//           </button>
//         </div>
//         <div className="space-y-1">
//           <h3 className="font-medium text-black group-hover:text-gray-700 dark:bg-black dark:text-white">
//             Modern Loft in SOMA
//           </h3>
//           <p className="text-gray-500 text-sm dark:bg-black dark:text-white">
//             San Francisco, CA
//           </p>
//           <div className="flex items-center gap-1">
//             <Star className="w-3 h-3 fill-black dark:bg-black dark:text-white text-black" />
//             <span className="text-sm font-medium dark:bg-black dark:text-white">
//               4.85
//             </span>
//           </div>
//         </div>
//       </div>
//     </Link>
//   );
// }

// Result Card Component with dynamic content
function DefaultCard({ CardData }: { CardData: any[] }) {
  const [isFavorite, setisFavorite] = useState<{ [id: string]: boolean }>({});

  // const getCardContent = () => {
  //   switch (activeFilter) {
  //     case "camper-van":
  //       return CardData;
  //     case "unique-stays":
  //       return CardData;
  //     case "activity":
  //       return CardData;
  //     default:
  //       return CardData;
  //   }
  // };
  function handleFavorite(id: string) {
    setisFavorite((prev) => ({
      ...prev,
      [id]: !prev[id], // toggle
    }));
  }

  const content = CardData;

  const CardContent = (
    <>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {content.map((content) => (
          <div key={content.id} className="group">
            <div className="relative rounded-xl overflow-hidden mb-4">
              <img onContextMenu={(e) => e.preventDefault()} draggable={false}
                src={content.image}
                alt={content.title}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Heart Icon */}
              <button className="absolute top-3 right-3">
                <Heart
                  onClick={() => handleFavorite(content.id)}
                  className={`w-6 h-6 cursor-pointer z-50 ${isFavorite[content.id] ? "fill-red-500 text-red-500" : "text-white"}`}
                />
              </button>
              {/* Image Dots */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
                <div className="w-3 h-3 bg-white rounded-full" />
                <div className="w-3 h-3 bg-white/40 rounded-full" />
                <div className="w-3 h-3 bg-white/40 rounded-full" />
                <div className="w-3 h-3 bg-white/40 rounded-full" />
                <div className="w-2 h-2 bg-white/40 rounded-full" />
              </div>

              {/* Guest Favourite Badge */}
              {isFavorite[content.id] && (
                <div className="absolute top-3 left-3 dark:bg-black dark:text-white bg-white rounded px-2 py-1">
                  <span className="text-xs font-bold dark:bg-black dark:text-white text-black">
                    Guest Favourite
                  </span>
                </div>
              )}

              {/* Arrow Button */}
              <Link to={`${content.id}`}>
                <button className="absolute bottom-3 right-3 w-8 h-8 dark:bg-black dark:text-white bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-bold dark:bg-black dark:text-white text-gray-900 mb-1">
                  {content.title}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-sm dark:bg-black dark:text-white text-gray-600">
                    {content.details}
                  </span>
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

                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-500 dark:bg-black dark:text-white" />
                  <span className="text-sm text-gray-600 dark:bg-black dark:text-white">
                    2
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  //Wrap with appropriate Link based on card type
  // if (activeFilter === "camper-van") {
  //   return (
  //     <Link to="/campervan/1" className="block">
  //       {CardContent}
  //     </Link>
  //   );
  // }

  // if (activeFilter === "unique-stays") {
  //   return (
  //     <Link to="/unique-stay/1" className="block">
  //       {CardContent}
  //     </Link>
  //   );
  // }

  // if (activeFilter === "activity") {
  //   return (
  //     <Link to="/activity/1" className="block">
  //       {CardContent}
  //     </Link>
  //   );
  // }

  return CardContent;
}
// Calendar Dropdown Component
function CalendarDropdown({
  onClose,
  onApplyRange,
  selectedRange,
}: {
  onClose: () => void;
  onApplyRange: (start: Date, end: Date) => void;
  selectedRange?: { start: Date | null; end: Date | null };
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRangeState, setSelectedRangeState] = useState<{
    start: Date | null;
    end: Date | null;
  }>(selectedRange || { start: null, end: null });

  useEffect(() => {
    if (selectedRange) setSelectedRangeState(selectedRange);
  }, [selectedRange]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const formatDate = (d: Date) =>
    `${d.getDate()} ${monthShort[d.getMonth()]} ${d.getFullYear()}`;
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const isInRange = (date: Date) => {
    if (!selectedRangeState.start || !selectedRangeState.end) return false;
    return date >= selectedRangeState.start && date <= selectedRangeState.end;
  };

  const isRangeStart = (date: Date) =>
    selectedRangeState.start && date.getTime() === selectedRangeState.start.getTime();

  const isRangeEnd = (date: Date) =>
    selectedRangeState.end && date.getTime() === selectedRangeState.end.getTime();

  const handleDateClick = (date: Date) => {
    if (!selectedRangeState.start || (selectedRangeState.start && selectedRangeState.end)) {
      setSelectedRangeState({ start: date, end: null });
    } else if (selectedRangeState.start && !selectedRangeState.end) {
      const range =
        date >= selectedRangeState.start
          ? { start: selectedRangeState.start, end: date }
          : { start: date, end: selectedRangeState.start };
      setSelectedRangeState(range);
    }
  };

  const renderCalendar = (monthOffset: number) => {
    const displayMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + monthOffset,
    );
    const days = getDaysInMonth(displayMonth);

    const isToday = (date: Date) => {
      const now = new Date();
      return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    };

    return (
      <div className="w-full md:w-[206px] flex flex-col gap-4">
        <div className="flex justify-between items-center w-full max-w-[205px]">
          {monthOffset === 0 && (
            <button onClick={prevMonth} className="p-1 z-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <h3 className="text-base font-normal text-center flex-1">
            {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
          </h3>
          {monthOffset === 1 && (
            <button onClick={nextMonth} className="p-1 z-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Days grid */}
        <div className="flex flex-col gap-2">
          <div className="flex">
            {dayNames.map((day) => (
              <div
                key={day}
                className="w-5 h-5 md:w-7 md:h-7 flex gap-3 items-center justify-center"
              >
                <span className="text-gray-500 text-sm font-normal">{day}</span>
              </div>
            ))}
          </div>

          {Array.from({ length: 6 }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex">
              {days
                .slice(weekIndex * 7, (weekIndex + 1) * 7)
                .map((day, dayIndex) => {
                  const isCurrentMonth =
                    day.getMonth() === displayMonth.getMonth();
                  const inRange = isInRange(day);
                  const rangeStart = isRangeStart(day);
                  const rangeEnd = isRangeEnd(day);

                  return (
                    <div
                      key={dayIndex}
                      className="w-5 h-5 md:w-7 md:h-7 relative"
                    >
                      {inRange && !rangeStart && !rangeEnd && (
                        <div className="absolute inset-0 bg-gray-100" />
                      )}
                      {rangeStart && (
                        <div className="absolute right-0 top-0 w-5 h-10 md:w-6 md:h-12 bg-gray-100" />
                      )}
                      {rangeEnd && (
                        <div className="absolute left-0 top-0 w-5 h-10 md:w-6 md:h-12 bg-gray-100" />
                      )}

                      <button
                        onClick={() => isCurrentMonth && handleDateClick(day)}
                        disabled={!isCurrentMonth}
                        className={`w-5 h-5 md:w-7 md:h-7 flex items-center justify-center relative z-10 transition-colors
                          ${
                            !isCurrentMonth
                              ? "text-gray-300 cursor-not-allowed"
                              : rangeStart || rangeEnd
                                ? "bg-black text-white rounded-full"
                                : "text-gray-900 hover:bg-gray-50"
                          }
                          ${isToday(day) ? "border border-black" : ""}
                        `}
                      >
                        <span className="text-base font-normal">
                          {day.getDate()}
                        </span>
                      </button>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className=" top-full left-1/2 transform -translate-x-1/3 mt-5 bg-white rounded-2xl shadow-xl z-[9999] w-full max-w-[490px] min-w-[320px] p-3 md:p-7 md:w-[560px]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col md:flex-row items-center gap-5">
         <div className="hidden md:block"> {renderCalendar(0)}</div>
          <div className="hidden md:block">{renderCalendar(1)}</div>
        </div>
      </div>
      <div className="flex gap-4 mt-4">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1 border-black text-black hover:bg-black hover:text-white rounded-full py-3"
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (selectedRangeState.start && selectedRangeState.end) {
              onApplyRange(selectedRangeState.start, selectedRangeState.end);
              onClose();
            }
          }}
          className="flex-1 bg-black text-white rounded-full py-3 hover:bg-gray-800"
        >
          Done
        </Button>
      </div>
    </div>
  );
}


// Time Selector Component
function TimeSelector({
  onBack,
  onClose,
}: {
  onBack: () => void;
  onClose: () => void;
}) {
  const hours = [11, 12, 1, 2, 3];
  const minutes = [8, 9, 10, 11, 12];
  const periods = ["PM", "AM"];

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-3xl shadow-xl z-[9999] border border-gray-200 w-full max-w-[600px] min-w-[320px]">
      <div className="p-6 md:p-[37px_56px]">
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-black mb-2">
            Select Check-in Time
          </h3>
          <p className="text-gray-600">When would you like to check in?</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">Hour</div>
            <select className="w-16 h-12 border border-gray-200 rounded-lg text-center font-medium">
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
          </div>

          <div className="text-2xl font-bold text-gray-400">:</div>

          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">Minute</div>
            <select className="w-16 h-12 border border-gray-200 rounded-lg text-center font-medium">
              {minutes.map((minute) => (
                <option key={minute} value={minute}>
                  {minute.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">Period</div>
            <select className="w-16 h-12 border border-gray-200 rounded-lg text-center font-medium">
              {periods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1 border-black text-black hover:bg-black hover:text-white rounded-full py-3"
          >
            Back
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-black text-white rounded-full py-3 hover:bg-gray-800"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}


