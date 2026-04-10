import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header, { HeaderWithFilters, HomeHeader } from "../components/Header";
import AirbnbHeader from "../components/AirbnbHeader";
import Footer from "../components/Footer";
import { DateRange } from "react-date-range";
import { LocationDropdown } from "../components/LocationDropdown";
import { GuestDropdown } from "../components/GuestDropdown";
import { ActivityDropdown } from "../components/ActivityDropdown";
import { CalendarDropdown } from "../components/CalendarDropdown";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Heart,
  Star as StarIcon,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Mail,
  X,
} from "lucide-react";
import MobileUserNav from "@/components/MobileUserNav";
import {
  offersApi,
  OfferDTO,
  API_BASE_URL,
  cmsPublicApi,
  PublicFaq,
} from "@/lib/api";
import { testimonialsApi, PublicTestimonial } from "@/lib/testimonials";
import { SlArrowLeft, SlArrowRight } from "react-icons/sl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  addWishlistItem,
  removeWishlistItem,
  hasWishlistItem,
} from "@/lib/wishlist";
import { useAuth } from "../contexts/AuthContext";
import { PiVanBold } from "react-icons/pi";
import { motion, useAnimation, useInView } from "framer-motion";
import { GiMushroomCloud, GiSmokeBomb } from "react-icons/gi";
import FilterButton from "../components/FilterButton";
import SearchField from "../components/SearchField";
import Section from "../components/Section";
import CardImageCarousel from "../components/CardImageCarousel";
import ResultCard from "../components/ResultCard";
import DefaultCard from "../components/DefaultCard";
import DestinationCard from "../components/DestinationCard";
import TestimonialCard from "../components/TestimonialCard";
import TopRatedStayCard from "../components/TopRatedStayCard";
import ArticleCard from "../components/ArticleCard";
import FAQItem from "../components/FAQItem";
import CamperVanIcon from "../components/icons/CamperVanIcon";
import HomeIcon from "../components/icons/HomeIcon";
import RocketIcon from "../components/icons/RocketIcon";
import { useAutoHorizontalScroll } from "@/components/useAutoHorizontalScroll";
import UniqueStaysSkeleton from "@/utils/UniqueStaysSkeleton";
import { getImageUrl } from "@/lib/utils";
import { Loader } from "@/components/ui/Loader";

const Star = StarIcon;

type FilterType = "camper-van" | "unique-stays" | "activity";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // console.log("Homepage render, user:", user);

  const [activeTab, setActiveTab] = useState("unique-stays");
  const [activeFilter, setActiveFilter] = useState<FilterType>("unique-stays");
  const [homepageSections, setHomepageSections] = useState<
    Record<string, boolean>
  >({
    "camper-van": true,
    "unique-stays": true,
    "best-activity": true,
    "trending-destinations": true,
    testimonials: true,
    "top-rated-stays": true,
    faq: true,
  });

  const visibleFAQTabs = [
    {
      id: "unique-stays",
      label: "Unique Stays",
      isVisible: homepageSections["unique-stays"],
    },
    {
      id: "activities",
      label: "Activities",
      isVisible: homepageSections["best-activity"],
    },
    {
      id: "caravan",
      label: "Caravan",
      isVisible: homepageSections["camper-van"],
    },
  ].filter((t) => t.isVisible);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sections = await cmsPublicApi.listHomepageSections();
        if (mounted && sections.length > 0) {
          const nextState: Record<string, boolean> = {};
          sections.forEach((s: any) => {
            nextState[s.sectionKey] = s.isVisible;
          });
          setHomepageSections((prev) => ({ ...prev, ...nextState }));
        }
      } catch (e) {
        console.error("Failed to load homepage sections", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Redirect if activeFilter or activeTab corresponds to a disabled section
  useEffect(() => {
    // Map filters to section keys
    const filterMap: Record<string, string> = {
      "camper-van": "camper-van",
      "unique-stays": "unique-stays",
      activity: "best-activity",
    };

    // Check if current filter is valid
    const currentSectionKey = filterMap[activeFilter];
    // Explicitly check === false to avoid issues during initial load (undefined)
    if (homepageSections[currentSectionKey] === false) {
      // Find first enabled filter
      const enabledFilter = Object.keys(filterMap).find(
        (f) => homepageSections[filterMap[f]],
      );
      if (enabledFilter) {
        setActiveFilter(enabledFilter as FilterType);
      }
    }

    // Map tabs to section keys
    const tabMap: Record<string, string> = {
      "unique-stays": "unique-stays",
      activities: "best-activity",
      caravan: "camper-van",
    };

    // Check if current tab is valid
    const currentTabSectionKey = tabMap[activeTab];
    if (homepageSections[currentTabSectionKey] === false) {
      // Find first enabled tab
      const enabledTab = Object.keys(tabMap).find(
        (t) => homepageSections[tabMap[t]],
      );
      if (enabledTab) {
        setActiveTab(enabledTab);
      }
    }
  }, [homepageSections, activeFilter, activeTab]);

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showLocationToDropdown, setShowLocationToDropdown] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  // const [showCalendar, setShowCalendar] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  // const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [selectedLocation, setSelectedLocation] = useState("");
  // const [checkInDate, setCheckInDate] = useState('01/02/2025');
  // const [checkOutDate, setCheckOutDate] = useState('04/02/2025');
  const [guests, setGuests] = useState({
    adults: 0,
    children: 0,
    infants: 0,
    pet: 0,
  });
  const [selectedLocationTo, setSelectedLocationTo] = useState("");
  const [activityName, setActivityName] = useState("Tracking");
  // In your main component
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const locationRef = useRef<HTMLDivElement>(null);
  const locationToRef = useRef(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);

  // Handle search navigation
  const handleSearch = () => {
    const params = new URLSearchParams({
      filter: activeFilter,
      location: selectedLocation,
      locationTo: selectedLocationTo,
      checkin: checkInDate ? checkInDate.toISOString() : "",
      checkout: checkOutDate ? checkOutDate.toISOString() : "",
      guests: (guests.adults + guests.children + guests.infants).toString(),
      activity: activityName,
    });
    navigate(`/search?${params.toString()}`);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
      if (
        locationRef.current &&
        !locationRef.current.contains(event.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
      if (
        locationToRef.current &&
        !locationToRef.current.contains(event.target as Node)
      ) {
        setShowLocationToDropdown(false);
      }
      if (
        guestRef.current &&
        !guestRef.current.contains(event.target as Node)
      ) {
        setShowGuestDropdown(false);
      }
      if (
        activityRef.current &&
        !activityRef.current.contains(event.target as Node)
      ) {
        setShowActivityDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside, { capture: true });
    return () =>
      document.removeEventListener("click", handleClickOutside, {
        capture: true,
      });
  }, []);

  // Callback to receive date range
  const handleDateRangeSelect = (range: { start: Date; end: Date }) => {
    setCheckInDate(range.start);
    setCheckOutDate(range.end);
  };

  // const handleNext = () => {
  //   if (selectedRange.start && selectedRange.end) {
  //     setShowTimeSelector(true); //  show time input screen
  //   }
  // };

  // artical
  // const blogSection=()=>{
  const articlesRef = useRef<HTMLDivElement>(null);
  // }
  const scrollToArticles = () => {
    articlesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // const user = {
  //   role: "vendor", // or "purchaser", "guest", etc.
  //   hasPurchased: true,
  //   name: "Guest",
  //   email: "guest@example.com",
  //   avatar: "/User.jpg",
  // } as any;

  const testimonialsData: PublicTestimonial[] = [
    {
      id: "t1",
      userName: "Aarav Mehta",
      rating: 5,
      content:
        "An amazing experience! The booking process was seamless, and the support team was super helpful throughout.",
      avatar: "/test5.png",
      email: "aarav.mehta@example.com",
      createdAt: "2025-10-12T09:24:00Z",
    },
    {
      id: "t2",
      userName: "Priya Sharma",
      rating: 4,
      content:
        "Really impressed with how easy it was to find what I needed. The platform feels modern and intuitive.",
      avatar: "/user-avatar.svg",
      email: "priya.sharma@example.com",
      createdAt: "2025-09-28T14:45:00Z",
    },
    {
      id: "t3",
      userName: "Rahul Verma",
      rating: 5,
      content:
        "Exceptional service and great user experience. I found exactly what I was looking for within minutes!",
      avatar: "/test2.png",
      email: "rahul.verma@example.com",
      createdAt: "2025-08-20T11:10:00Z",
    },
    {
      id: "t4",
      userName: "Neha Kapoor",
      rating: 5,
      content:
        "Loved the design and smooth navigation. It’s rare to see a platform this well thought out!",
      avatar: "/test3.png",
      email: "neha.kapoor@example.com",
      createdAt: "2025-07-05T18:20:00Z",
    },
    {
      id: "t5",
      userName: "Rohan Singh",
      rating: 4,
      content:
        "Great experience overall! Would definitely recommend this to anyone looking for reliable service and quick support.",
      avatar: "/test4.png",
      email: "rohan.singh@example.com",
      createdAt: "2025-06-15T07:40:00Z",
    },
    {
      id: "t6",
      userName: "Aarav Mehta",
      rating: 5,
      content:
        "An amazing experience! The booking process was seamless, and the support team was super helpful throughout.",
      avatar: "/test5.png",
      email: "aarav.mehta@example.com",
      createdAt: "2025-10-12T09:24:00Z",
    },
    {
      id: "t7",
      userName: "Priya Sharma",
      rating: 4,
      content:
        "Really impressed with how easy it was to find what I needed. The platform feels modern and intuitive.",
      avatar: "/user-avatar.svg",
      email: "priya.sharma@example.com",
      createdAt: "2025-09-28T14:45:00Z",
    },
    {
      id: "t8",
      userName: "Rahul Verma",
      rating: 5,
      content:
        "Exceptional service and great user experience. I found exactly what I was looking for within minutes!",
      avatar: "/test2.png",
      email: "rahul.verma@example.com",
      createdAt: "2025-08-20T11:10:00Z",
    },
    {
      id: "t9",
      userName: "Neha Kapoor",
      rating: 5,
      content:
        "Loved the design and smooth navigation. It’s rare to see a platform this well thought out!",
      avatar: "/test3.png",
      email: "neha.kapoor@example.com",
      createdAt: "2025-07-05T18:20:00Z",
    },
    {
      id: "t10",
      userName: "Rohan Singh",
      rating: 4,
      content:
        "Great experience overall! Would definitely recommend this to anyone looking for reliable service and quick support.",
      avatar: "/test4.png",
      email: "rohan.singh@example.com",
      createdAt: "2025-06-15T07:40:00Z",
    },
  ];
  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await testimonialsApi.list();
        if (!mounted) return;
        setTestimonials(list && list.length > 0 ? list : testimonialsData);
        // console.log("Loaded testimonials from API", list);
      } catch {
        if (mounted) setTestimonials(testimonialsData);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await testimonialsApi.create({
        userName: `${user?.firstName} ${user?.lastName}`,
        rating: reviewRating,
        content: reviewText,
        avatar: user?.photo,
        email: user?.email,
      });
      setTestimonials((prev) => [created, ...prev]);
      setShowReviewModal(false);
      setReviewText("");
      setReviewRating(5);
      navigate("/");
    } catch {}
  };

  // Latest Blogs for Index page
  type BlogDTO = {
    _id: string;
    title: string;
    slug: string;
    coverImage?: string;
    createdAt?: string;
  };
  const [latestBlogs, setLatestBlogs] = useState<BlogDTO[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(
          `${API_BASE_URL}/api/blogs?status=published&limit=4`,
        );
        if (r.ok) {
          const j = (await r.json()) as { success: boolean; data: BlogDTO[] };
          if (mounted) setLatestBlogs(j.data || []);
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load approved offers and paginate by category without UI/UX changes
  const [offers, setOffers] = useState<OfferDTO[]>([]);
  const [faqs, setFaqs] = useState<PublicFaq[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, "caravan" | "unique-stays" | "activity">>({});
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<{
    caravan: number;
    "unique-stays": number;
    activity: number;
  }>({ caravan: 1, "unique-stays": 1, activity: 1 });
  const pageSize = 12;

  useEffect(() => {
          console.log(user);
    const fetchCategories = async () => {
      try {
        const [van, stay, act] = await Promise.all([
           cmsPublicApi.getFeatures("Camper Van", "category"),
           cmsPublicApi.getFeatures("Unique Stays", "category"),
           cmsPublicApi.getFeatures("Activity", "category")
        ]);
        
        const map: Record<string, any> = {};
        
        const addToMap = (list: any[], type: string) => {
           if(Array.isArray(list)){
               list.forEach(item => {
                   if(item.name) map[item.name.toLowerCase()] = type;
               });
           }
        };

        addToMap(van, "caravan");
        addToMap(stay, "unique-stays");
        addToMap(act, "activity");
        
        setCategoryMap(map);
      } catch (e) { console.error("Failed to fetch dynamic categories", e); }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingOffers(true);
        const res = await offersApi.list("approved");
        if (!mounted) return;
        setOffers(res.data || []);
      } catch (e: any) {
        if (!mounted) return;
        setOfferError(e?.message || "Failed to load offers");
      } finally {
        if (mounted) setLoadingOffers(false);
      }
    })();

    // Fetch FAQs
    (async () => {
      try {
        const list = await cmsPublicApi.listFaqs();
        if (mounted) setFaqs(list || []);
      } catch (err) {
        console.error("Failed to load FAQs", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

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
    
    // Check dynamic map first
    if (categoryMap[c]) return categoryMap[c];

    if (
      ["caravan", "campervan", "campertrailer", "motorhome", "rv", "van"].some((k) =>
        cClean.includes(k),
      )
    )
      return "caravan" as const;
    if (
      cClean.includes("stay") ||
      cClean === "uniquestays" ||
      cClean === "unique" ||
      cClean === "stays" ||
      cClean === "glamping" ||
      cClean === "resort" ||
      cClean === "villa"
    )
      return "unique-stays" as const;
    if (cClean === "activity" || cClean === "activities" || cClean === "trekking" || cClean === "tour") return "activity" as const;
    
    // Default fallback if we can't decide
    return "unique-stays" as const;
  };

  const mapOfferToCard = (o: OfferDTO): CardItem => {
    const ncat = getNormCategory(o.category, o.serviceType);
    const route =
      ncat === "caravan"
        ? `/campervan/${o._id}`
        : ncat === "unique-stays"
          ? `/unique-stay/${o._id}`
          : `/activity/${o._id}`;
    const unit =
      ncat === "activity"
        ? "/ person"
        : ncat === "caravan"
          ? "/ day"
          : "/ night";
    const img =
      o.photos?.coverUrl && o.photos.coverUrl.length > 0
        ? o.photos.coverUrl
        : o.photos?.galleryUrls?.[0] || "/placeholder.svg";
    return {
      id: route,
      title: o.name,
      details:
        o.city && o.state ? `${o.city}, ${o.state}` : o.city || o.state || "",
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

  const caravanTotalPages = Math.max(
    1,
    Math.ceil(caravanCards.length / pageSize),
  );
  const stayTotalPages = Math.max(1, Math.ceil(stayCards.length / pageSize));
  const activityTotalPages = Math.max(
    1,
    Math.ceil(activityCards.length / pageSize),
  );

  const caravanShown = caravanCards.slice(0, pages.caravan * pageSize);
  const stayShown = stayCards.slice(0, pages["unique-stays"] * pageSize);
  const activityShown = activityCards.slice(0, pages.activity * pageSize);

  const incPage = (k: "caravan" | "unique-stays" | "activity") =>
    setPages((p) => ({
      ...p,
      [k]: Math.min(
        k === "caravan"
          ? caravanTotalPages
          : k === "unique-stays"
            ? stayTotalPages
            : activityTotalPages,
        p[k] + 1,
      ),
    }));
  const decPage = (k: "caravan" | "unique-stays" | "activity") =>
    setPages((p) => ({ ...p, [k]: Math.max(1, p[k] - 1) }));

  const SearchbarRef = useRef(null);
  // Handle scroll action when child requests it
  const handleScrollTo = (sectionId) => {
    const sectionMap = {
      Searchbar: SearchbarRef,
      // about: aboutRef,
      // contact: contactRef,
    };

    const section = sectionMap[sectionId];
    if (section?.current) {
      section.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const controls = useAnimation();
  const smokeControls = useAnimation();
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  useEffect(() => {
    if (inView) {
      const runAnimation = async () => {
        // reset
        await controls.start({ x: "-20%", opacity: 1 });
        smokeControls.start({
          opacity: [0, 1, 0],
          y: [-5, -15, -25],
          transition: { duration: 1.2, repeat: 3 },
        });

        // drive from left to right
        await controls.start({
          x: ["-20%", "80%"],
          rotate: [-10, 0],
          transition: { duration: 3, ease: "easeInOut" },
        });

        // stop with a little bounce
        await controls.start({
          x: "82%",
          transition: { duration: 0.4, ease: "easeOut" },
        });

        // small smoke puff when stopped
        smokeControls.start({
          opacity: [0, 1, 0],
          y: [-5, -25, -40],
          transition: { duration: 1 },
        });
      };

      runAnimation();
    }
  }, [inView]);

  const { scrollRef, scrollLeft, scrollRight } =
    useAutoHorizontalScroll({
      delay: 5000,
    });



      useEffect(() => {
    // Simulate dynamic data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-4">
            <Loader size="xl" />
            <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
              Fetching Travels data...
            </p>
          </div>
        </div>
      );
    }

  return (
    <>
      {/* Hero Section */}
      <section className="relative max-md:h-[250px] h-[300px] md:h-[350px] overflow-visible z-50">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="https://api.builder.io/api/v1/image/assets/TEMP/58bfed58f49dafc4198cf3dc2d050bc688e7aca8?width=2880"
            alt="Hero Background"
          />
          <div className="absolute inset-0" />
        </div>

        {/* Content */}
        <div className="relative h-full flex max-w-7xl mx-auto flex-col">
          {/* Navigation */}
          <AirbnbHeader
            variant="transparent"
            className="fixed w-full z-50"
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            
          />

          {/* Hero Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-4 text-center">
            <h1 className="text-xl flex flex-col gap-2 md:text-3xl lg:text-[40px] tracking-[2px] max-md:tracking-[0px] font-bold text-white mb-3   md:mb-5 max-w-4xl leading-tight">
              Explore The Unexplored in{" "}
              <span className=" mt-1 max-md:mt-0"> The Caravan!</span>
            </h1>

            {/* Category Filters */}
            <div className=" flex flex-wrap items-center justify-center gap-2 mb-3 md:mb-3">
              {homepageSections["camper-van"] && (
                <FilterButton
                  icon={CamperVanIcon}
                  label="camper van"
                  active={activeFilter === "camper-van"}
                  onClick={() => setActiveFilter("camper-van")}
                />
              )}
              {homepageSections["unique-stays"] && (
                <FilterButton
                  icon={HomeIcon}
                  label="Unique Stays"
                  active={activeFilter === "unique-stays"}
                  onClick={() => setActiveFilter("unique-stays")}
                />
              )}
              {homepageSections["best-activity"] && (
                <FilterButton
                  icon={RocketIcon}
                  label="Activity"
                  active={activeFilter === "activity"}
                  onClick={() => setActiveFilter("activity")}
                />
              )}
            </div>

            {/* Search Form */}
            <div
              className={`max-lg:hidden w-full max-w-7xl bg-gray-100 rounded-2xl p-3 md:p-4 relative overflow-visible mt-1}`}
            >
              {/* Activity Filter */}
              {activeFilter === "activity" && (
                <div className=" flex flex-col lg:flex-row lg:items-center gap-3 md:gap-6 lg:gap-0">
                  <div className="flex flex-col lg:flex-row lg:flex-1 lg:items-center gap-3 md:gap-6 lg:gap-6">
                    {/* Location Field */}
                    <div
                      className="flex flex-col gap-1 md:gap-2 flex-1 min-w-0 relative p-2 md:p-0"
                      ref={locationRef}
                    >
                      {/* Label */}
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-xs md:text-sm">Location</span>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search location"
                          value={
                            selectedLocation === "Where are you going?"
                              ? ""
                              : selectedLocation
                          }
                          onChange={(e) => {
                            setSelectedLocation(e.target.value);
                            setShowLocationDropdown(true); // show dropdown while typing
                          }}
                          onFocus={() => setShowLocationDropdown(true)}
                          className="w-full px-3 bg-transparent text-black font-medium text-md  focus:outline-none  placeholder:text-gray-400"
                        />

                        {/* Search Icon */}
                        {/* <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /> */}

                        {/* Dropdown */}
                        {showLocationDropdown && (
                          <LocationDropdown
                            searchQuery={selectedLocation}
                            onSelect={(location) => {
                              setSelectedLocation(location);
                              setShowLocationDropdown(false);
                            }}
                            onClose={() => setShowLocationDropdown(false)}
                          />
                        )}
                      </div>
                    </div>
                    <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

                    {/* Date Field */}
                    {/* Check-in */}
                    <div
                      ref={calendarRef}
                      className="flex flex-col gap-2 flex-2 relative min-w-0"
                    >
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-5 h-5" />
                        <span className="text-sm">Date</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowCalendar(!showCalendar);
                          setShowLocationDropdown(false);
                          setShowGuestDropdown(false);
                        }}
                        className={`font-medium text-md ${checkInDate ? "text-black" : "text-gray-400"} hover:text-gray-700 transition-colors text-left`}
                      >
                        {checkInDate
                          ? `${checkInDate.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })} - ${
                              checkOutDate
                                ? checkOutDate.toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : ""
                            }`
                          : new Date().toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                      </button>

                      {showCalendar && (
                        <CalendarDropdown
                          onSelect={handleDateRangeSelect}
                          onClose={() => setShowCalendar(false)}
                          selectedRange={{
                            start: checkInDate,
                            end: checkOutDate,
                          }}
                        />
                      )}
                    </div>

                    <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

                    {/* Activity Name Field */}
                    <div
                      className="flex flex-col gap-2 flex-1 min-w-0 relative"
                      ref={activityRef}
                    >
                      <div className="flex items-center gap-2 text-gray-500">
                        <Star className="w-5 h-5" />
                        <span className="text-sm">Activity Name</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Search Activity"
                        value={activityName === "Tracking" ? "" : activityName}
                        onChange={(e) => {
                          setActivityName(e.target.value);
                          setShowActivityDropdown(true); // show dropdown while typing
                        }}
                        onFocus={() => setShowActivityDropdown(true)}
                        className="w-full px-3 bg-transparent text-black font-medium text-md focus:outline-none  placeholder:text-gray-400"
                      />

                      {showActivityDropdown && (
                        <ActivityDropdown
                          onSelect={setActivityName}
                          onClose={() => setShowActivityDropdown(false)}
                        />
                      )}
                    </div>

                    <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

                    {/* Guests Field */}
                    <div
                      className="flex flex-col gap-2 flex-1 min-w-0 relative"
                      ref={guestRef}
                    >
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users className="w-5 h-5" />
                        <span className="text-sm">Guests</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowGuestDropdown(!showGuestDropdown);
                          setShowLocationDropdown(false);
                          setShowCalendar(false);
                          setShowActivityDropdown(false);
                        }}
                        className={`font-medium text-md text-left hover:text-gray-700 transition-colors ${
                          guests.adults +
                            guests.children +
                            guests.infants +
                            guests.pet >
                          0
                            ? "text-black"
                            : "text-gray-400"
                        }`}
                      >
                        {guests.adults + guests.children + guests.infants ||
                          "Add guests"}
                      </button>
                      {showGuestDropdown && (
                        <GuestDropdown
                          guests={guests}
                          onUpdate={setGuests}
                          onClose={() => setShowGuestDropdown(false)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center lg:flex-shrink-0 lg:ml-6 mt-4 lg:mt-0">
                    <Button
                      onClick={handleSearch}
                      className="bg-black hover:bg-gray-800 text-white rounded-full h-12 w-12 lg:h-14 lg:w-14"
                      size="icon"
                    >
                      <Search className="w-5 h-5 lg:w-6 lg:h-6" />
                    </Button>
                  </div>
                </div>
              )}

              {/* CamperVan Filter */}
              {activeFilter === "camper-van" && (
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between w-full">
                  {/* Inputs Section */}
                  <div className="flex flex-col gap-6 lg:flex-row lg:flex-1">
                    {/* Location From */}
                    <div
                      className="flex flex-col gap-1 md:gap-2 flex-1 min-w-0 relative p-2 md:p-0"
                      ref={locationRef}
                    >
                      {/* Label */}
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-xs md:text-sm">
                          Location From
                        </span>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search location"
                          value={
                            selectedLocation === "Where are you going?"
                              ? ""
                              : selectedLocation
                          }
                          onChange={(e) => {
                            setSelectedLocation(e.target.value);
                            setShowLocationDropdown(true); // show dropdown while typing
                          }}
                          onFocus={() => setShowLocationDropdown(true)}
                          className="w-full bg-transparent px-3 placeholder:text-md text-black font-medium text-md text-left hover:text-gray-700 transition-colors focus:outline-none  placeholder:text-gray-400"
                        />

                        {/* Search Icon */}
                        {/* <Search className=" absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /> */}

                        {/* Dropdown */}
                        {showLocationDropdown && (
                          <LocationDropdown
                            searchQuery={selectedLocation}
                            onSelect={(location) => {
                              setSelectedLocation(location);
                              setShowLocationDropdown(false);
                            }}
                            onClose={() => setShowLocationDropdown(false)}
                          />
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

                    {/* Location To */}
                    <div
                      className="flex flex-col gap-1 md:gap-2 flex-1 min-w-0 relative p-2 md:p-0"
                      ref={locationToRef}
                    >
                      {/* Label */}
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-xs md:text-sm">Location To</span>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search location"
                          value={
                            selectedLocationTo === "Where are you going?"
                              ? ""
                              : selectedLocationTo
                          }
                          onChange={(e) => {
                            setSelectedLocationTo(e.target.value);
                            setShowLocationToDropdown(true); // show dropdown while typing
                          }}
                          onFocus={() => setShowLocationToDropdown(true)}
                          className="w-full bg-transparent px-3 text-black font-medium text-md text-left hover:text-gray-700 transition-colors focus:outline-none  placeholder:text-gray-400"
                        />

                        {/* Search Icon */}
                        {/* <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /> */}

                        {/* Dropdown */}
                        {showLocationToDropdown && (
                          <LocationDropdown
                            searchQuery={selectedLocationTo}
                            onSelect={(location) => {
                              setSelectedLocationTo(location);
                              setShowLocationToDropdown(false);
                            }}
                            onClose={() => setShowLocationToDropdown(false)}
                          />
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

                    {/* Check-in */}
                    <div
                      ref={calendarRef}
                      className="flex flex-col gap-2 flex-1 relative min-w-0"
                    >
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-5 h-5" />
                        <span className="text-sm">Check in</span>
                      </div>

                      <button
                        onClick={() => {
                          setShowCalendar(!showCalendar);
                          setShowLocationDropdown(false);

                          setShowGuestDropdown(false);
                        }}
                        className={`font-medium text-md ${checkInDate ? "text-black" : "text-gray-400"} hover:text-gray-700 transition-colors text-left`}
                      >
                        {checkInDate
                          ? checkInDate.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : new Date().toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                      </button>

                      {showCalendar && (
                        <CalendarDropdown
                          onSelect={(range) => {
                            handleDateRangeSelect(range);
                          }}
                          onClose={() => setShowCalendar(false)}
                          selectedRange={{
                            start: checkInDate,
                            end: checkOutDate,
                          }}
                        />
                      )}
                    </div>

                    {/* Divider */}
                    <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

                    {/* Check-out */}
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-5 h-5" />
                        <span className="text-sm">Check out</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowCalendar(!showCalendar);
                          setShowLocationDropdown(false);

                          setShowGuestDropdown(false);
                        }}
                        className={`font-medium text-md ${checkOutDate ? "text-black" : "text-gray-400"} hover:text-gray-700 transition-colors text-left`}
                      >
                        {checkOutDate
                          ? checkOutDate.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : new Date().toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                      </button>

                   
                    </div>

                    {/* Divider */}
                    <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

                    {/* Guests */}
                    <div
                      className="flex flex-col gap-2 flex-1 relative min-w-0"
                      ref={guestRef}
                    >
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users className="w-5 h-5" />
                        <span className="text-sm">Guests</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowGuestDropdown(!showGuestDropdown);
                          setShowLocationDropdown(false);
                          setShowCalendar(false);
                        }}
                        className={`font-medium text-md text-left hover:text-gray-700 transition-colors ${
                          guests.adults +
                            guests.children +
                            guests.infants +
                            guests.pet >
                          0
                            ? "text-black"
                            : "text-gray-400"
                        }`}
                      >
                        {(guests.adults +
                          guests.children +
                          guests.infants +
                          guests.pet >
                          0 &&
                          `${guests.adults + guests.children + guests.infants + guests.pet} guests`) ||
                          "Add guests"}
                      </button>
                      {showGuestDropdown && (
                        <GuestDropdown
                          guests={guests}
                          onUpdate={setGuests}
                          onClose={() => setShowGuestDropdown(false)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Search Button */}
                  <div className="flex justify-center lg:ml-6 mt-4 lg:mt-0">
                    <Button
                      onClick={handleSearch}
                      className="bg-black hover:bg-gray-800 text-white rounded-full h-12 w-12 lg:h-14 lg:w-14"
                      size="icon"
                    >
                      <Search className="w-5 h-5 lg:w-6 lg:h-6" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Unique Stays Filter */}
              {activeFilter === "unique-stays" && (
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 md:gap-6 lg:gap-0">
                  <div className="flex flex-col lg:flex-row lg:flex-1 lg:items-center gap-4 md:gap-6 lg:gap-5">
                    {/* Location */}
                    <div
                      className="flex flex-col gap-1 md:gap-2 flex-1 min-w-0 relative p-2 md:p-0"
                      ref={locationRef}
                    >
                      {/* Label */}
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-xs md:text-sm">Location</span>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search location"
                          value={
                            selectedLocation === "Where are you going?"
                              ? ""
                              : selectedLocation
                          }
                          onChange={(e) => {
                            setSelectedLocation(e.target.value);
                            setShowLocationDropdown(true); // show dropdown while typing
                          }}
                          onFocus={() => setShowLocationDropdown(true)}
                          className="w-full px-3 bg-transparent text-black font-medium text-md focus:outline-none  placeholder:text-gray-400"
                        />

                        {/* Search Icon */}
                        {/* <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /> */}

                        {/* Dropdown */}
                        {showLocationDropdown && (
                          <LocationDropdown
                            searchQuery={selectedLocation}
                            onSelect={(location) => {
                              setSelectedLocation(location);
                              setShowLocationDropdown(false);
                            }}
                            onClose={() => setShowLocationDropdown(false)}
                          />
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

                    {/* Check-in */}
                    <div
                      ref={calendarRef}
                      className="flex flex-col gap-2 flex-1 relative min-w-0"
                    >
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-5 h-5" />
                        <span className="text-sm">Check in</span>
                      </div>

                      <button
                        onClick={() => {
                          setShowCalendar(!showCalendar);
                          setShowLocationDropdown(false);

                          setShowGuestDropdown(false);
                        }}
                        className={`font-medium text-md ${checkInDate ? "text-black" : "text-gray-400"} hover:text-gray-700 transition-colors text-left`}
                      >
                        {checkInDate
                          ? checkInDate.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : new Date().toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                      </button>

                      {showCalendar && (
                        <CalendarDropdown
                          onSelect={(range) => {
                            handleDateRangeSelect(range);
                          }}
                          onClose={() => setShowCalendar(false)}
                          selectedRange={{
                            start: checkInDate,
                            end: checkOutDate,
                          }}
                        />
                      )}
                    </div>

                    {/* Divider */}
                    <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

                    {/* Check-out */}
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-5 h-5" />
                        <span className="text-sm">Check out</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowCalendar(!showCalendar);
                          setShowLocationDropdown(false);

                          setShowGuestDropdown(false);
                        }}
                        className={`font-medium text-md ${checkOutDate ? "text-black" : "text-gray-400"} hover:text-gray-700 transition-colors text-left`}
                      >
                        {checkOutDate
                          ? checkOutDate.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : new Date().toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                      </button>

                
                    </div>

                    <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

                    {/* Guests */}
                    <div
                      className="flex flex-col gap-2 flex-1 min-w-0 relative"
                      ref={guestRef}
                    >
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users className="w-5 h-5" />
                        <span className="text-sm">Guests</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowGuestDropdown(!showGuestDropdown);
                          setShowLocationDropdown(false);
                          setShowCalendar(false);
                        }}
                        className={`font-medium text-md text-left hover:text-gray-700 transition-colors ${
                          guests.adults +
                            guests.children +
                            guests.infants +
                            guests.pet >
                          0
                            ? "text-black"
                            : "text-gray-400"
                        }`}
                      >
                        {guests.adults + guests.children + guests.infants ||
                          "Add guests"}
                      </button>
                      {showGuestDropdown && (
                        <GuestDropdown
                          guests={guests}
                          onUpdate={setGuests}
                          onClose={() => setShowGuestDropdown(false)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center lg:flex-shrink-0 lg:ml-6 mt-4 lg:mt-0">
                    <Button
                      onClick={handleSearch}
                      className="bg-black hover:bg-gray-800 text-white rounded-full h-12 w-12 lg:h-14 lg:w-14"
                      size="icon"
                    >
                      <Search className="w-5 h-5 lg:w-6 lg:h-6" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

   
<div className="max-w-7xl mx-auto">
      {/* Dynamic Sections Based on Active Filter  */}
      {/* first top content depend on filter */}
      {activeFilter === "camper-van" && homepageSections["camper-van"] && (
        <Section
          title="Stay at our top Camper Van"
          subtitle="From castles and villas to boats and igloos, we have it all"
          className="py-8  md:py-12"
        >
          {loadingOffers && <UniqueStaysSkeleton />}
          {offerError && (
            <div className="text-red-500 text-center">
              Failed to load offers. Please try again later.
            </div>
          )}
          {!loadingOffers && !offerError && (
            <ResultCard
              activeFilter={activeFilter}
              ResultactivityShown={activityShown}
              ResultstayShown={stayShown}
              ResultcaravanShown={caravanShown}
            />
          )}
        </Section>
      )}

      {activeFilter === "unique-stays" && homepageSections["unique-stays"] && (
        <Section
          title="Unique Stays"
          subtitle="From castles and villas to boats and igloos, we have it all"
          className="py-8 md:py-12"
        >
          {loadingOffers && <UniqueStaysSkeleton />}
          {offerError && (
            <div className="text-red-500 text-center">
              Failed to load offers. Please try again later.
            </div>
          )}
          {!loadingOffers && !offerError && (
            <ResultCard
              activeFilter={activeFilter}
              ResultactivityShown={activityShown}
              ResultstayShown={stayShown}
              ResultcaravanShown={caravanShown}
            />
          )}
        </Section>
      )}

      {activeFilter === "activity" && homepageSections["best-activity"] && (
        <Section
          title="Best Activity"
          subtitle="From castles and villas to boats and igloos, we have it all"
          className="py-8 md:py-12"
        >
          {" "}
          {loadingOffers && <UniqueStaysSkeleton />}
          {offerError && (
            <div className="text-red-500 text-center">
              Failed to load offers. Please try again later.
            </div>
          )}
          {!loadingOffers && !offerError && (
            <ResultCard
              activeFilter={activeFilter}
              ResultactivityShown={activityShown}
              ResultstayShown={stayShown}
              ResultcaravanShown={caravanShown}
            />
          )}
        </Section>
      )}

      {/* Below content for all */}
      {/* Show all sections for demonstration */}
      {activeFilter === "camper-van" && (
        <>
          {homepageSections["unique-stays"] && (
            <Section
              title="Unique Stays"
              subtitle="From castles and villas to boats and igloos, we have it all"
              className="py-8 md:py-12"
            >
              {" "}
              {loadingOffers && <UniqueStaysSkeleton />}
              {offerError && (
                <div className="text-red-500 text-center">
                  Failed to load offers. Please try again later.
                </div>
              )}
              {!loadingOffers && !offerError && (
                <DefaultCard activeFilter={activeFilter} CardData={stayShown} />
              )}
              {stayCards.length > stayShown.length && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => incPage("unique-stays")}
                    className="rounded-full"
                  >
                    View more
                  </Button>
                </div>
              )}
            </Section>
          )}

          {homepageSections["best-activity"] && (
            <Section
              title="Best Activity"
              subtitle="From castles and villas to boats and igloos, we have it all"
              className="py-8 md:py-12"
            >
              {" "}
              {loadingOffers && <UniqueStaysSkeleton />}
              {offerError && (
                <div className="text-red-500 text-center">
                  Failed to load offers. Please try again later.
                </div>
              )}
              {!loadingOffers && !offerError && (
                <DefaultCard
                  CardData={activityShown}
                  activeFilter={activeFilter}
                />
              )}
              {activityCards.length > activityShown.length && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => incPage("activity")}
                    className="rounded-full"
                  >
                    View more
                  </Button>
                </div>
              )}
            </Section>
          )}
        </>
      )}

      {activeFilter === "unique-stays" && (
        <>
          {homepageSections["camper-van"] && (
            <Section
              title="Stay at our top Camper Van"
              subtitle="From castles and villas to boats and igloos, we have it all"
              className="py-8 md:py-12 "
            >
              {" "}
              {loadingOffers && <UniqueStaysSkeleton />}
              {offerError && (
                <div className="text-red-500 text-center">
                  Failed to load offers. Please try again later.
                </div>
              )}
              {!loadingOffers && !offerError && (
                <DefaultCard
                  CardData={caravanShown}
                  activeFilter={activeFilter}
                />
              )}
              {caravanCards.length > caravanShown.length && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => incPage("caravan")}
                    className="rounded-full"
                  >
                    View more
                  </Button>
                </div>
              )}
            </Section>
          )}

          {homepageSections["best-activity"] && (
            <Section
              title="Best Activity"
              subtitle="From castles and villas to boats and igloos, we have it all"
              className="py-8 md:py-12"
            >
              {" "}
              {loadingOffers && <UniqueStaysSkeleton />}
              {offerError && (
                <div className="text-red-500 text-center">
                  Failed to load offers. Please try again later.
                </div>
              )}
              {!loadingOffers && !offerError && (
                <DefaultCard
                  CardData={activityShown}
                  activeFilter={activeFilter}
                />
              )}
              {activityCards.length > activityShown.length && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => incPage("activity")}
                    className="rounded-full"
                  >
                    View more
                  </Button>
                </div>
              )}
            </Section>
          )}
        </>
      )}

      {activeFilter === "activity" && (
        <>
          {homepageSections["camper-van"] && (
            <Section
              title="Stay at our top Camper Van"
              subtitle="From castles and villas to boats and igloos, we have it all"
              className="py-8 md:py-12"
            >
              {" "}
              {loadingOffers && <UniqueStaysSkeleton />}
              {offerError && (
                <div className="text-red-500 text-center">
                  Failed to load offers. Please try again later.
                </div>
              )}
              {!loadingOffers && !offerError && (
                <DefaultCard
                  CardData={caravanShown}
                  activeFilter={activeFilter}
                />
              )}
              {caravanCards.length > caravanShown.length && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => incPage("caravan")}
                    className="rounded-full"
                  >
                    View more
                  </Button>
                </div>
              )}
            </Section>
          )}

          {homepageSections["unique-stays"] && (
            <Section
              title="Unique Stays"
              subtitle="From castles and villas to boats and igloos, we have it all"
              className="py-8 md:py-12"
            >
              {" "}
              {loadingOffers && <UniqueStaysSkeleton />}
              {offerError && (
                <div className="text-red-500 text-center">
                  Failed to load offers. Please try again later.
                </div>
              )}
              {!loadingOffers && !offerError && (
                <DefaultCard CardData={stayShown} activeFilter={activeFilter} />
              )}
              {stayCards.length > stayShown.length && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => incPage("unique-stays")}
                    className="rounded-full"
                  >
                    View more
                  </Button>
                </div>
              )}
            </Section>
          )}
        </>
      )}

      {/* Trending Destinations Section */}
      {homepageSections["trending-destinations"] && (
        <section className="py-8 md:py-12 px-4  ">
          {loadingOffers && <UniqueStaysSkeleton />}
          {offerError && (
            <div className="text-red-500 text-center">
              Failed to load offers. Please try again later.
            </div>
          )}
          {!loadingOffers && !offerError && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Main heading + Delhi */}

              <div className="lg:col-span-1 flex flex-col">
                <div className="mb-6">
                  <h2 className="text-lg md:text-4xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                    Trending destinations
                  </h2>
                </div>
                <DestinationCard
                  image="https://api.builder.io/api/v1/image/assets/TEMP/4766a16ac97656234c2dd7e78a19fabc9e9361f1?width=641"
                  title="Delhi"
                  className="h-52"
                />
              </div>

              {/* Middle Columns - Kolkata and Bombay */}
              <div className="lg:col-span-1">
                <DestinationCard
                  image="https://api.builder.io/api/v1/image/assets/TEMP/3d98c6169a4accab38df839bcb2d9390e2e0f6ad?width=641"
                  title="Kolkata"
                  className="h-52 lg:h-80"
                />
              </div>

              <div className="lg:col-span-1">
                <DestinationCard
                  image="https://api.builder.io/api/v1/image/assets/TEMP/e768669efb8c29a3468b96ce5cb10cf4e7c7d719?width=641"
                  title="Bombay"
                  className="h-52 lg:h-80"
                />
              </div>

              {/* Right Column - Kerala + Description */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <DestinationCard
                  image="https://api.builder.io/api/v1/image/assets/TEMP/344595448bfa2603988d6406e077bc1b7911c209?width=488"
                  title="Kerala"
                  className="h-44"
                />
                <p className="text-[16px] text-gray-600 dark:text-gray-300 leading-relaxed">
                  When it comes to planning a dream destination, some
                  destinations stand out as top recommendations for travelers
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Service Listing Benefits CTA */}
      <section ref={ref} className="overflow-hidden rounded-[20px]">
        <div className="relative rounded-[20px] md:rounded-3xl p-4  text-white overflow-hidden">
          <div className="relative z-20 rounded-[20px]">
            <img
              src="/Group 1686552378 (1).png"
              alt="vector"
              className="max-w-screen w-full h-full border border-transparent rounded-[20px] object-cover max-md:h-[280px] md:h-[250px]"
            />

            {/* <motion.div
              animate={controls}
              className="absolute right-10 bottom-4 mt-8 md:top-16 text-gray-400"
              style={{ fontSize: "5rem" }}
            >
              <PiVanBold />
           
              <motion.span
                animate={smokeControls}
                className="absolute -left-10 top-10 text-gray-200 text-3xl"
              >
                <GiMushroomCloud className="-rotate-90" />
              </motion.span>
            </motion.div> */}

            <div className="absolute flex max-md:flex-col items-center gap-4 left-10 lg:left-16 top-5 lg:top-5 xl:top-16 rounded-[20px]">
              <div className="space-y-4 w-1/2">
                <h3 className=" max-md:text-sm text-lg md:text-3xl font-bold leading-tight">
                  Service Listing Benefits
                </h3>
                <p className="text-gray-300 max-md:text-[10px]  text-xs md:text-sm leading-relaxed">
                  Once your listing is created, you benefit from full
                  transparency with no hidden fees. The price you see is final,
                  with no additional charges added later.
                </p>
              </div>

              <div className="flex w-1/2 justify-center z-10">
                <Button 
                onClick={()=>navigate("/hostwithus")}
                className="bg-white max-md:text-[10px]  text-black hover:bg-gray-100 rounded-full px-6 h-12 font-medium">
                  Check here for more information
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {homepageSections["testimonials"] && (
        <Section
          title="Testimonials "
          subtitle="Most popular choices for travelers from India"
          className="py-8 md:py-10 px-4  bg-white text-black dark:bg-black dark:text-white"
          rightContent={
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollLeft}
                className="h-11 w-11 rounded-full border border-gray-300 bg-white hover:bg-gray-200 transition-all duration-300 shadow-md hover:scale-110"
              >
                <SlArrowLeft className="w-4 h-4 text-gray-700" />
              </Button>
              <Button
                size="icon"
                onClick={scrollRight}
                className="h-11 w-11 rounded-full bg-gradient-to-tr from-black to-gray-800 text-white hover:from-gray-900 hover:to-black transition-all duration-300 shadow-lg hover:scale-110"
              >
                <SlArrowRight className="w-4 h-4" />
              </Button>
            </div>
          }
        >
          {/* Testimonial Cards */}
          <div
      ref={scrollRef}
      className="flex overflow-x-auto scrollbar-hidden "
    >
      {[...testimonials].map((t, i) => (
        <div
          key={i}
 className="flex-shrink-0 snap-center w-full md:w-1/3 lg:w-1/4 px-2">
        
          <TestimonialCard
            userName={t.userName}
            rating={t.rating}
            content={t.content}
            avatar={t.avatar}
          />
        </div>
      ))}

      {testimonials.length === 0 && (
        <div style={{ width: "300px" }}>
          No testimonial found
        </div>
      )}
    </div>

          {/* Add Review Button
          {(user?.role === "vendor" || user?.hasPurchased) && ( */}
          <div
            className={`
              
                flex justify-center mt-10`}
          >
            <Button
              onClick={() => setShowReviewModal(true)}
              className="bg-black text-white dark:bg-white dark:text-black rounded-full px-8 h-12 hover:bg-gray-900 transition-all duration-300 shadow-xl hover:scale-105 flex items-center gap-2"
            >
              <span>Add Review</span>
              <SlArrowRight className="w-4 h-4" />
            </Button>
          </div>
          {/* // )} */}
        </Section>
      )}

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="bg-white text-black dark:bg-black dark:text-white">
          <DialogHeader>
            <DialogTitle>Add your review</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img
                  src={getImageUrl(user?.photo) || "/user-avatar.svg"}
                  alt={user?.email || "Guest"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-semibold">{user?.firstName || "Guest"}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Rating:</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setReviewRating(n)}
                    className={`w-8 h-8 rounded-full border ${reviewRating >= n ? "bg-black text-white" : "bg-white text-black"} flex items-center justify-center`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your review..."
                required
                className="min-h-[120px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReviewModal(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-full">
                Submit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Top Rated Stays Section */}
      {homepageSections["top-rated-stays"] && (
        <Section
          title="Top Rated Stays"
          subtitle="From castles and villas to boats and igloos, we have it all"
          className="py-8 md:py-12"
        >
          {" "}
          {loadingOffers && <UniqueStaysSkeleton />}
          {offerError && (
            <div className="text-red-500 text-center">
              Failed to load offers. Please try again later.
            </div>
          )}
          {!loadingOffers && !offerError && (
            <DefaultCard CardData={stayShown} activeFilter={activeFilter} />
          )}
          {stayCards.length > stayShown.length && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => incPage("unique-stays")}
                className="rounded-full"
              >
                View more
              </Button>
            </div>
          )}
        </Section>
      )}

      {/* Latest Articles Section */}
      <Section
        title="Latest Articles"
        subtitle="Most popular choices for travelers from India"
        className="py-8 px-4 md:py-12"
        rightContent={
          <Button
            variant="outline"
            onClick={() => navigate("/blogs")}
            className="rounded-full border-black text-black px-4 h-auto py-3"
          >
            <span className="mr-2">Read all blogs</span>
            <SlArrowRight className="w-4 h-" />
          </Button>
        }
      >
        <div
          ref={articlesRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {latestBlogs && latestBlogs.length > 0
            ? latestBlogs.map((b) => (
                <Link
                  to={`/blogsDetials?slug=${b.slug}`}
                  key={b._id}
                  className="block"
                >
                  <ArticleCard
                    image={b.coverImage || "/placeholder.svg"}
                    title={b.title}
                  />
                </Link>
              ))
            : [
                {
                  image:
                    "https://api.builder.io/api/v1/image/assets/TEMP/a933039ae4e0adbd39f8a1351e83163112e5f000?width=610",
                  title:
                    "Experience Goa Like Never Before: Unique Adventures Await!",
                },
                {
                  image:
                    "https://api.builder.io/api/v1/image/assets/TEMP/a933039ae4e0adbd39f8a1351e83163112e5f000?width=610",
                  title:
                    "Experience Goa Like Never Before: Unique Adventures Await!",
                },
                {
                  image:
                    "https://api.builder.io/api/v1/image/assets/TEMP/6f516751df2e054cd8cb29b5de7bd06d58094484?width=610",
                  title:
                    "Experience Goa Like Never Before: Unique Adventures Await!",
                },
                {
                  image:
                    "https://api.builder.io/api/v1/image/assets/TEMP/dd0f73b9c2f07283655340bce9ea8febcd86a500?width=610",
                  title:
                    "Experience Goa Like Never Before: Unique Adventures Await!",
                },
              ].map((article, i) => <ArticleCard key={i} {...article} />)}
        </div>
      </Section>

      {/* FAQ Section */}
      {homepageSections["faq"] && (
        <section className="py-8 md:py-12 px-4">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-12 mx-auto">
            {/* Header + Tabs */}
            <div className="text-center lg:text-left w-full lg:w-4/12">
              <h2 className="text-center text-2xl sm:text-xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 capitalize">
                Frequently asked questions
              </h2>
              <p className="text-gray-600 text-center dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 mb-8 text-sm sm:text-base">
                We’re here to make your experience as smooth as possible. This
                section provides clear explanations, useful tips, and detailed
                guidance to help you get the most out of our platform.{" "}
              </p>

              {/* Tab Navigation */}
            <div
  className="grid w-full bg-white border border-gray-200 rounded-full p-1 mb-8 shadow-sm"
  style={{
    gridTemplateColumns: `repeat(${visibleFAQTabs.length}, minmax(0, 1fr))`
  }}
>
  {visibleFAQTabs.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`w-full px-5 py-2 rounded-full text-sm font-bold capitalize transition-colors text-center ${
        activeTab === tab.id
          ? "bg-black text-white"
          : "text-black hover:bg-gray-100"
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>

            </div>
            {/* FAQ Items */}
            <div className="w-full lg:w-7/12 space-y-4">
              {faqs
                .filter((faq) => {
                  const cat = (faq.category || "").toLowerCase();
                  if (activeTab === "activities") return cat === "activity";
                  if (activeTab === "unique-stays")
                    return cat === "unique stay";
                  if (activeTab === "caravan") return cat === "camper van";
                  return false;
                })
                .map((faq) => (
                  <FAQItem
                    key={faq._id}
                    question={faq.question}
                    answer={faq.answer || ""}
                  />
                ))}
              {faqs.filter((faq) => {
                const cat = (faq.category || "").toLowerCase();
                if (activeTab === "activities") return cat === "activity";
                if (activeTab === "unique-stays") return cat === "unique stay";
                if (activeTab === "caravan") return cat === "camper van";
                return false;
              }).length === 0 && (
                <p className="text-gray-500 italic">
                  No FAQs available for this category.
                </p>
              )}
            </div>
          </div>
        </section>
      )}
  </div>
      {/* Footer */}
      <Footer />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-md">
        <MobileUserNav />
      </div>
    </>
  );
}
