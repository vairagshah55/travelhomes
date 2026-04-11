import React, { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/button";
import Header, { HomeHeader } from "../../components/Header";
import Footer from "../../components/Footer";
import FAQSection, { uniqueStayFAQs } from "../../components/FAQSection";
import PhotoGallery, { uniqueStayImages } from "../../components/PhotoGallery";
import axios from "axios";
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
import { GiCampingTent, } from "react-icons/gi";
import { MdOutlineOutdoorGrill } from "react-icons/md";
import { GuestDropdown } from "@/components/GuestDropdown";
import { offersApi, OfferDTO, API_BASE_URL, cmsPublicApi, PublicFaq, vendorPublicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ReadMore from "@/components/ReadMore";
import { StayDetailsSkeleton } from "@/utils/UniqueStaysSkeleton";

export default function UniqueStayDetails() {
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7002';
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
    return c as 'caravan' | 'unique-stays' | 'activity';
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
  const pageSize = 12;
  const [offers, setOffers] = useState<OfferDTO[]>([]);


  const approved = offers.filter(o => o.status === 'approved');
  const caravanCards: CardItem[] = approved.filter(o => getNormCategory(o.category, o.serviceType) === 'caravan').map(mapOfferToCard);
  const stayCards: CardItem[] = approved.filter(o => getNormCategory(o.category, o.serviceType) === 'unique-stays').map(mapOfferToCard);
  const activityCards: CardItem[] = approved.filter(o => getNormCategory(o.category, o.serviceType) === 'activity').map(mapOfferToCard);

  const caravanTotalPages = Math.max(1, Math.ceil(caravanCards.length / pageSize));
  const stayTotalPages = Math.max(1, Math.ceil(stayCards.length / pageSize));
  const activityTotalPages = Math.max(1, Math.ceil(activityCards.length / pageSize));

  const caravanShown = caravanCards.slice(0, pages.caravan * pageSize);
  const stayShown = stayCards.slice(0, pages['unique-stays'] * pageSize);
  const activityShown = activityCards.slice(0, pages.activity * pageSize);


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
  const [openInclusions, setOpenInclusions] = useState(false)
  const [openExclusions, setOpenExclusions] = useState(false)
  const [openReviewsDialog, setOpenReviewsDialog] = useState(false)
  const [openPoliciesDialog, setOpenPoliciesDialog] = useState(false)
  const [openDesc, setOpenDesc] = useState(false)


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


  const getAmenityIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("wifi") || lowerName.includes("internet")) return FaWifi;
    if (lowerName.includes("bed") || lowerName.includes("sleep")) return FaBed;
    if (lowerName.includes("tv")) return FaTv;
    if (lowerName.includes("shower") || lowerName.includes("bath") || lowerName.includes("bathroom")) return FaShower;
    if (lowerName.includes("toilet")) return FaToilet;
    if (lowerName.includes("kitchen") || lowerName.includes("utensils") || lowerName.includes("cook")) return FaUtensils;
    if (lowerName.includes("fridge") || lowerName.includes("refrigerator")) return RiFridgeLine;
    if (lowerName.includes("ac") || lowerName.includes("air condition") || lowerName.includes("heater") || lowerName.includes("temperature")) return Thermometer;
    if (lowerName.includes("music") || lowerName.includes("speaker") || lowerName.includes("audio")) return FaMusic;
    if (lowerName.includes("first aid") || lowerName.includes("safety") || lowerName.includes("kit")) return FaFirstAid;
    if (lowerName.includes("grill") || lowerName.includes("bbq") || lowerName.includes("outdoor cook")) return MdOutlineOutdoorGrill;
    if (lowerName.includes("tent") || lowerName.includes("camp")) return GiCampingTent;
    if (lowerName.includes("car") || lowerName.includes("parking") || lowerName.includes("garage")) return FaCarSide;
    if (lowerName.includes("coffee") || lowerName.includes("tea")) return Coffee;
    if (lowerName.includes("shield") || lowerName.includes("secure")) return Shield;
    if (lowerName.includes("user") || lowerName.includes("guest")) return Users;
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
      {/* <Header variant="transparent" className="fixed w-full z-50" /> */}
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
              <span className="px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 text-xs font-semibold uppercase tracking-wide">
                Camper Van
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
              </div>
              {stay?.regularPrice && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">₹{Number(stay.regularPrice).toLocaleString()} <span className="font-normal text-gray-500">/ day</span></span>
                </>
              )}
            </div>

            {/* Quick info pills */}
            <div className="flex flex-wrap items-center gap-2">
              {stay?.seatingCapacity && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold">
                  <Users className="w-3.5 h-3.5" /> {stay.seatingCapacity} seats
                </span>
              )}
              {stay?.sleepingCapacity && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <Bed className="w-3.5 h-3.5" /> {stay.sleepingCapacity} sleeps
                </span>
              )}
              {(stay?.features || []).slice(0, 3).map((item, i) => (
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
            {/* Mobile: Single hero image */}
            <div className="md:hidden relative rounded-2xl overflow-hidden aspect-[16/10]"
              onClick={() => { setPhotoIndex(0); setShowPhotoGallery(true); }}
            >
              <img src={getImageUrl(stay?.photos?.coverUrl) || getImageUrl(stay?.photos?.galleryUrls?.[0])} alt={stay?.name || "Van"} className="w-full h-full object-cover" draggable={false} onContextMenu={(e) => e.preventDefault()} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              <div className="absolute bottom-3 right-3">
                <button className="bg-white/90 backdrop-blur-sm text-black text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">{galleryImages.length} photos</button>
              </div>
            </div>

            {/* Desktop: Grid gallery */}
            <div className="hidden md:grid grid-cols-4 gap-2 lg:gap-3 h-[340px] lg:h-[420px]">
              <div className="col-span-2 row-span-2 relative overflow-hidden rounded-xl cursor-pointer group">
                <img src={getImageUrl(stay?.photos?.coverUrl) || getImageUrl(stay?.photos?.galleryUrls?.[0])} onClick={() => { setPhotoIndex(0); setShowPhotoGallery(true); }} alt={stay?.name || "Van"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" draggable={false} onContextMenu={(e) => e.preventDefault()} />
              </div>
              {[1, 2].map((i) => (
                <div key={i} className="relative overflow-hidden rounded-xl cursor-pointer group">
                  <img src={getImageUrl(stay?.photos?.galleryUrls?.[i])} onClick={() => { setPhotoIndex(i + (stay?.photos?.coverUrl ? 1 : 0)); setShowPhotoGallery(true); }} alt={`${stay?.name || "Van"} ${i}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                </div>
              ))}
              <div className="col-span-2 relative overflow-hidden rounded-xl cursor-pointer group">
                <img src={getImageUrl(stay?.photos?.galleryUrls?.[3])} onClick={() => { setPhotoIndex(3 + (stay?.photos?.coverUrl ? 1 : 0)); setShowPhotoGallery(true); }} alt={stay?.name || "Van"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                <button onClick={() => { setPhotoIndex(0); setShowPhotoGallery(true); }} className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-black text-sm font-medium px-4 py-2 rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all duration-200">View all {galleryImages.length} photos</button>
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
                        if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top: y, behavior: "smooth" }); }
                      }}
                      className={`relative px-4 sm:px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                        activeTab === tab.id ? "text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div layoutId="campervan-tab-indicator" className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 dark:bg-white rounded-full" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                      )}
                    </button>
                  ))}
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700" />
              </div>

              {/* All sections stacked — scroll into view */}
              <div className="space-y-12">

              <div id="overview" className="scroll-mt-24 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">About this van</h3>
                <div className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
                  <ReadMore children={description} maxCharacters={400} dialogTitle="Full Description" />
                </div>
              </div>

              {amenities.length > 0 && (
              <div id="amenities" className="scroll-mt-24 space-y-5">
                <div className="h-px bg-gray-100 dark:bg-gray-800" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Features & Amenities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleAmenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <amenity.icon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                      </div>

                      <span className="text-sm font-normal text-gray-800 dark:text-gray-200">
                        {amenity.name}
                      </span>
                    </div>
                  ))}
                </div>

              {!showAll && amenities.length > 12 && (
                <button onClick={() => setShowAll(true)} className="text-sm font-medium text-gray-900 dark:text-white underline underline-offset-2 hover:text-gray-600">Show all {amenities.length} amenities</button>
              )}
              </div>
              )}

              {/* Inclusions */}
              {inclusions.length > 0 && (
              <div id="inclusions" className="scroll-mt-24">
                <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inclusions</h3>
                <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10 p-5">
                  <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">{inclusions.join("\n")}</div>
                </div>
              </div>
              )}

              {/* Exclusions */}
              {exclusions.length > 0 && (
              <div id="exclusions" className="scroll-mt-24">
                <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exclusions</h3>
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-5">
                  <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">{exclusions.join("\n")}</div>
                </div>
              </div>
              )}

              {/* Policies & Rules */}
              {policies.length > 0 && (
              <div id="policies" className="scroll-mt-24">
                <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8" />
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">House Rules</h3>
                </div>
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  {policies.map((rule, i) => (
                    <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i !== policies.length - 1 ? "border-b border-gray-50 dark:border-gray-700/50" : ""} hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors`}>
                      <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">{i + 1}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Reviews */}
              <div id="reviews" className="scroll-mt-24 space-y-6">
                <div className="h-px bg-gray-100 dark:bg-gray-800" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reviews</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No reviews yet. Be the first to leave a review.</p>
              </div>

              {/* Owner */}
              <div id="owner" className="scroll-mt-24 space-y-5">
                <div className="h-px bg-gray-100 dark:bg-gray-800" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hosted by</h3>
                <div className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <img src={vendor?.photo || "/User.jpg"} alt={vendor?.brandName || "Owner"} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {vendor?.firstName || vendor?.personal?.firstName} {vendor?.lastName || vendor?.personal?.lastName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {[vendor?.businessCity || vendor?.business?.city, vendor?.businessState || vendor?.business?.state].filter(Boolean).join(", ")}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {vendor?.rating && (<span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300"><Star className="w-3 h-3 fill-current" /> {vendor.rating}</span>)}
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Verified</span>
                    </div>
                  </div>
                  <Button size="sm" className="bg-gray-900 text-white rounded-full px-4 text-xs hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 flex-shrink-0" onClick={handleContactOwner}>Contact</Button>
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
                    {stay?.regularPrice && <span className="text-sm text-gray-400 line-through">₹{Math.round(Number(stay.regularPrice) * 1.2).toLocaleString()}</span>}
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{Number(stay?.regularPrice || 0).toLocaleString()}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/ day</span>
                    {stay?.regularPrice && <span className="ml-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">Save 17%</span>}
                  </div>
                </div>

                {/* Rare find */}
                <div className="flex items-start gap-3 p-3 mb-5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  <span className="text-lg flex-shrink-0">💎</span>
                  <div>
                    <div className="text-sm font-semibold text-rose-800 dark:text-rose-300">Rare find</div>
                    <div className="text-xs text-rose-600 dark:text-rose-400">This van is usually booked. Don't miss out.</div>
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

                <Button className="w-full bg-gray-900 dark:bg-white dark:text-black text-white py-4 rounded-xl font-medium text-lg hover:bg-gray-800 transition-colors mb-6" onClick={() => { navigate("/payment", { state: { offerId: id, checkInDate, checkOutDate, guests, serviceType: 'camper-van', service: stay, type: "van" } }); }}>
                  Reserve
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10"><Footer /></div>

        {/* Photo Gallery Modal */}
        <PhotoGallery
          images={galleryImages}
          initialIndex={photoIndex}
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
                       {stay?.features?.map((f, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <Star className="w-5 h-5 text-gray-900" />
                            <span className="text-gray-800">{f}</span>
                          </div>
                       ))}
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

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={stay?.name || "Stay Details"}
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
              {stay?.regularPrice && <span className="text-xs text-gray-400 line-through">₹{Math.round(Number(stay.regularPrice) * 1.2).toLocaleString()}</span>}
              <span className="text-lg font-bold text-gray-900 dark:text-white">₹{Number(stay?.regularPrice || 0).toLocaleString()}</span>
              <span className="text-xs text-gray-500">/ day</span>
            </div>
          </div>
          <Button className="bg-gray-900 dark:bg-white dark:text-black text-white rounded-full px-6 h-11 text-sm font-semibold hover:bg-gray-800 flex-shrink-0 shadow-md" onClick={() => { navigate("/payment", { state: { offerId: id, checkInDate, checkOutDate, guests, serviceType: 'camper-van', service: stay, type: "van" } }); }}>
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
                          ${!isCurrentMonth
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



