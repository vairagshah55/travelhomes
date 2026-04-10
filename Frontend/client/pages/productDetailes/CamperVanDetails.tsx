import React, { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  const { isAuthenticated, user } = useAuth();
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
    { id: "inclusions", label: "Inclusions", hasContent: true },
    { id: "exclusions", label: "Exclusions", hasContent: true },
    { id: "policies", label: "Policies & Rules", hasContent: true },
    { id: "reviews", label: "Reviews", hasContent: allReviews.length > 0 },
    { id: "owner", label: "Owner Details", hasContent: true },
  ];

  const tabs = allTabs.filter(tab => tab.hasContent);

  useEffect(() => {
    const handleScroll = () => {
      const sections = tabs.map(tab => document.getElementById(tab.id)).filter(Boolean) as HTMLElement[];
      let current = '';

      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 200 && rect.bottom >= 200) { // 200px from top
          current = section.id;
        }
      });

      if (current && current !== activeTab) {
        setActiveTab(current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tabs]); // Removed activeTab from dependencies to prevent re-renders
  
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
      <div className="min-h-screen font-sans flex-col flex gap-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      
          

        <div ref={contentRef} className=" px-4 sm:px-6 py-5 z-30">
          {/* Back Navigation */}

          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 flex gap-1 items-center dark:bg-black dark:text-white hover:text-black transition-colors"
          >
            <IoIosArrowBack size={20} /> Back
          </button>


          {/* Header Section */}
          <div className="max-w-7xl mx-auto mb-3">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-black dark:bg-black dark:text-white mt-4">
                  {stay?.name }
                </h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center dark:bg-black dark:text-white gap-1 text-gray-600">
                    <MapPin className="w-4 h-4 dark:bg-black dark:text-white" />
                    <span>
                      {[stay?.city, stay?.state]
                        .filter(Boolean)
                        .join(", ") }
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 px-4 py-2 border-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-slate-500"
                  onClick={() => setShowShareModal(true)}
                >
                  <RiShareCircleFill className="w-6 h-4 -rotate-45" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 px-4 py-2 border-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-slate-500"
                  onClick={() => {
                    setIsFavorite(!isFavorite);
                    toast.success(isFavorite ? "Removed from favorites" : "Added to favorites!");
                  }}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  Save
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-50 dark:hover:bg-slate-500"
                  onClick={() => {
                    if (isAuthenticated) {
                      navigate("/payment", { 
                        state: { 
                          service: stay, 
                          type: "van",
                          checkInDate,
                          checkOutDate,
                          guests
                        } 
                      });
                    } else {
                      navigate("/register");
                    }
                  }}
                >
                  Reserve
                </Button>
              </div>
            </div>
          </div>
          
            
          {/* Image Gallery */}
          <div className="mb-3 max-w-7xl mx-auto">
            <div
              className="
      grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2 lg:gap-3
      w-full h-[200px] sm:h-[300px] lg:h-[400px] aspect-[16/9]
    "
            >
              {/* Main Left Image */}
              <div className="col-span-2 row-span-2 relative overflow-hidden rounded-xl">
                <img onContextMenu={(e) => e.preventDefault()} draggable={false}
                  src={
                    getImageUrl(stay?.photos?.coverUrl) ||
                    getImageUrl(stay?.photos?.galleryUrls?.[0])      }
                  onClick={() => { setPhotoIndex(0); setShowPhotoGallery(true); }}
                  alt={stay?.name || stay?.title || "Stay Main"}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Top Right Images */}
              <div className="col-span-2 grid grid-cols-2 gap-2 sm:gap-2 lg:gap-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-xl aspect-[16/9]"
                  >
                    <img onContextMenu={(e) => e.preventDefault()} draggable={false}
                      src={
                        getImageUrl(stay?.photos?.galleryUrls?.[i])  }
                      onClick={() => { setPhotoIndex(i + (stay?.photos?.coverUrl ? 1 : 0)); setShowPhotoGallery(true); }}
                      alt={stay?.name || stay?.title || `Stay ${i}`}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ))}
              </div>

              {/* Bottom Right Image */}
              <div className="col-span-2 relative overflow-hidden rounded-xl">
                <img onContextMenu={(e) => e.preventDefault()} draggable={false}
                  src={
                    getImageUrl(stay?.photos?.galleryUrls?.[3])         }
                  onClick={() => { setPhotoIndex(3 + (stay?.photos?.coverUrl ? 1 : 0)); setShowPhotoGallery(true); }}
                  alt={stay?.name || stay?.title || "Stay Bottom"}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />

                {/* Overlay button */}
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={() => { setPhotoIndex(0); setShowPhotoGallery(true); }}
                    className="
            bg-white/90 text-black text-sm lg:text-base font-medium
            px-4 py-2 rounded-lg shadow-sm hover:bg-white
            transition-all duration-300 hover:shadow-md
          "
                  >
                    View all +{stay?.photos?.galleryUrls?.length || 0} photos
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-3 mt-1">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12 mt-3 ">
              {/* Tabs */}
              <div className="sticky top-0 z-40 bg-white  border-gray-200 mb-8 dark:bg-black dark:text-white border-b">
                <div className="flex overflow-x-auto scrollbar-hide">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        const element = document.getElementById(tab.id);
                        const yOffset = -120; // Adjust for sticky header height
                        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
                        window.scrollTo({ top: y, behavior: "smooth" });

                      }}
                      className={`px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                          ? "border-black dark:border-white dark:text-white text-black"
                          : "border-transparent dark:text-white text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div id="overview" className="scroll-mt-[120px] space-y-10">
                <div className="space-y-1 w-full">
                  <h3 className="text-xl font-semibold text-black dark:text-white">Overview</h3>
                  <ReadMore children={description} maxCharacters={220} dialogTitle="Full Description" />
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
              </div>



              <div id="amenities" className="scroll-mt-[120px] space-y-8">
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  Amenities
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 md:gap-x-16 lg:gap-x-32 gap-y-6">
                  {visibleAmenities.slice(0, 6).map((amenity, index) => (
                    <div key={index} className="flex text-base font-medium items-center gap-4">
                      <span className="text-xl text-gray-700 dark:text-gray-300">
                        <amenity.icon className="w-6 h-6" />
                      </span>

                      <span className="text-sm font-normal text-gray-800 dark:text-gray-200">
                        {amenity.name}
                      </span>
                    </div>
                  ))}
                </div>

                {!showAll && amenities.length > 6 && (
                  <Button
                    variant="outline"
                    className="border-black dark:border-gray-700 px-6 py-3 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 text-black dark:text-white"
                    onClick={() => setOpenAmenitiesModal(true)}
                  >
                    See All {amenities.length} Amenities
                  </Button>
                )}
              </div>
              <Dialog open={openAmenitiesModal} onOpenChange={setOpenAmenitiesModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-black dark:text-white">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                      All Amenities
                    </DialogTitle>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 mt-4">
                    {amenities.map((amenity, index) => (
                      <div key={index} className="flex text-base font-medium items-center gap-4">
                        <amenity.icon className="w-6 h-6 text-black dark:text-white" />
                        <span className="text-sm font-normal dark:text-gray-200">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <div id="inclusions" className="scroll-mt-[200px] space-y-8">
                <h3 className="text-xl font-semibold text-black dark:text-white">Inclusions</h3>
                <ReadMore children={inclusionsText} maxCharacters={220} dialogTitle="Full Inclusions" />
              </div>

              <div id="exclusions" className="scroll-mt-[120px] space-y-3">
                <h3 className="text-xl font-semibold text-black dark:text-white">Exclusions</h3>
                <ReadMore children={exclusionsText} maxCharacters={220} dialogTitle="Full Exclusions" />
              </div>


              <div id="policies" className="scroll-mt-[120px] space-y-6">
                <h3 className="text-xl font-semibold text-black dark:text-white">Policies & Rules</h3>
                <ReadMore children={visiblePolicies} maxCharacters={220} dialogTitle="Full Policies" />
              </div>

              <div id="reviews" className="scroll-mt-[120px] space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-black dark:text-white">
                    Reviews
                  </h2>
                </div>

                {allReviews.length > 0 ? (
                  <>
                    {/* Summary Section would go here if we had aggregated data */}

                    {/* Reviews List */}
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {visibleReviews.map((review, index) => (
                          <div key={index} className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-300 rounded-full">
                                <img onContextMenu={(e) => e.preventDefault()} draggable={false}
                                  src={review.profile}
                                  className="rounded-full w-10 h-10 object-cover"
                                />
                              </div>
                              <div>
                                <div className="text-base font-medium text-black dark:text-white">
                                  {review.name}
                                </div>
                                <div className="text-sn font-normal text-gray-500 dark:text-gray-400">
                                  {review.date}
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-800 dark:text-gray-200 text-sm font-normal">
                              {review.review}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* See All Reviews Button */}
                    {allReviews.length > 2 && (
                      <Button
                        variant="outline"
                        className="border-black dark:border-gray-700 px-8 py-3 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 text-black dark:text-white"
                        onClick={() => setOpenReviewsDialog(true)}
                      >
                        See All {allReviews.length} Reviews
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No reviews yet.</p>
                )}

                <Dialog open={openReviewsDialog} onOpenChange={setOpenReviewsDialog}>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-black dark:text-white">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">
                        All Reviews
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-8 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {allReviews.map((review, index) => (
                          <div key={index} className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full">
                                <img onContextMenu={(e) => e.preventDefault()} draggable={false}
                                  src={review.profile}
                                  className="rounded-full w-10 h-10 object-cover"
                                />
                              </div>
                              <div>
                                <div className="text-base font-medium text-black dark:text-white">
                                  {review.name}
                                </div>
                                <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                  {review.date}
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-800 dark:text-gray-200 text-sm font-normal">
                              {review.review}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div id="owner" className="scroll-mt-[120px] space-y-8">
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  Owner Details
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Owner Card */}
                  <div className="p-6 sm:p-10 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-full">
                          <img onContextMenu={(e) => e.preventDefault()} draggable={false}
                            src={vendor?.photo || "/User.jpg"}
                            alt={
                              vendor?.brandName ||
                              vendor?.personName ||
                              "Owner"
                            }
                            className="rounded-full w-20 h-20 object-cover"
                          />
                        </div>
                       
                    <div>
                      {/* <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                        Owner Details
                      </h3> */}
                      <div className="text-[13px] font-normal text-gray-700 dark:text-gray-300 space-y-1">
                        {vendor?.brandName && <p className="font-bold text-base">{vendor.brandName}</p>}
                        {vendor?.location && <p className="text-gray-500 mb-2">{vendor.location}</p>}
                  {vendor?.responseRate && <p>Response Rate : {vendor.responseRate}%</p>}
                        {vendor?.responseTime && <p>Response within {vendor.responseTime}</p>}
                        {!vendor?.responseRate && !vendor?.responseTime && !vendor?.brandName && <p>Contact owner for more details.</p>}
                      </div>
                    </div>
                      </div>
                    </div>
                    
                    {/* Additional Business Details */}
                 
                  </div>

                  {/* Additional Business Details */}
                  {/* Owner Info */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                        Verified by Travelhomes
                      </h3>
                      <p className="text-[13px] font-normal text-gray-700 dark:text-gray-300">
                        Listing verified by Travelhomes.
                      </p>
                    </div>

                    
                    {/* Personal Details if available and different from business */}
                    {(vendor?.firstName || vendor?.lastName || vendor?.personal?.firstName || vendor?.personal?.lastName) && (
                        <div>
                             <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                                Host
                            </h3>
                            <p className="text-[13px] font-normal text-gray-700 dark:text-gray-300">
                                {vendor?.firstName || vendor?.personal?.firstName} {vendor?.lastName || vendor?.personal?.lastName}
                            </p>
                        </div>
                    )}

                    <Button
                      className="bg-black text-white rounded-full px-6 py-2 text-sm font-bold hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                     onClick={handleContactOwner}
                    >
                      Contact Owner
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Booking Card */}
            <div className="lg:col-span-1 mt-3">
              <div className="sticky top-24 bg-white dark:bg-black dark:text-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-lg">


                {/* Booking Form */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Date Selection */}
                    <div className="relative z-50" ref={calendarRef}>
                      <div
                        className="p-4 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-gray-300 transition-colors"
                        onClick={() => {
                          setShowCalendarDropdown(!showCalendarDropdown);
                          setShowGuestDropdown(false);
                        }}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="w-4 h-4  " />
                            <span className="text-sm font-medium">Date</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-black">
                            {checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-black">
                            {checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {showCalendarDropdown && (
                        <CalendarDropdown
                          onClose={() => setShowCalendarDropdown(false)}
                          onSelect={(range) => {
                            setCheckInDate(range.start);
                            setCheckOutDate(range.end);
                            setShowCalendarDropdown(false);
                          }}
                        />
                      )}
                    </div>

                    {/* Guest Selection */}
                    <div className="relative" ref={guestRef}>
                      <div
                        className="p-4 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-gray-300 transition-colors"
                        onClick={() => {
                          setShowGuestDropdown(!showGuestDropdown);
                          setShowCalendarDropdown(false);
                        }}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">Guest</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-black">
                          {guests.adults + guests.children + guests.infants}{" "}
                          Guests
                        </span>
                      </div>
                      {showGuestDropdown && (
                        <GuestDropdown
                          guests={guests}
                          onUpdate={setGuests}
                          onClose={() => setShowGuestDropdown(false)}
                        />
                      )}
                    </div>

                    {/*Rate Selection*/}
                    <div className="relative">
                      <div
                        className="p-4 flex justify-between border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-gray-300 transition-colors"
                        onClick={() => {
                          // setShowGuestDropdown(!showGuestDropdown);
                          setShowCalendarDropdown(false);
                        }}
                      >
                        <span className="text-sm font-medium text-black">
                          {/* {guests.adults + guests.children + guests.infants}{" "} */}
                          Total
                        </span>
                        <div className="text-xl font-bold text-black dark:text-white">
                          {selectedPricing === "per-night"
                            ? `₹${stay?.regularPrice ?? "—"}`
                            : `₹${typeof stay?.regularPrice === "number" ? (Number(stay?.regularPrice) * 7).toLocaleString() : "—"}`}
                          <span className="text-lg text-gray-700 dark:text-white font-normal">
                            /{selectedPricing === "per-night" ? "night" : "week"}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Reserve Button */}
                <Button
                  className="w-full bg-black dark:bg-white dark:text-black text-white py-4 rounded-xl font-medium text-lg hover:bg-gray-800 transition-colors mb-6"
                  onClick={() => {
                    navigate("/payment", {
                      state: {
                        offerId: id,
                        checkInDate: checkInDate,
                        checkOutDate: checkOutDate,
                        guests,
                        serviceType: 'camper-van',
                        service: stay,
                        type: "van"
                      }
                    });
                  }}
                >
                  Reserve
                </Button>


              </div>
            </div>
          </div>
          {/* More Stays Section */}
         
        </div>

          

        {/* <Footer /> */}

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
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 z-50 dark:bg-black dark:text-white bg-white border-t border-gray-200 dark:border-gray-800 shadow-md">
        <MobileUserNav />
      </div>
      <Footer/>
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



