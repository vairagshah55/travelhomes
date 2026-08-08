import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import ResultCard from "../components/ResultCard";
import { CardSkeleton } from "../components/SearchResultsSkeleton";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Heart,
  Star,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
  CrossIcon,
  SidebarCloseIcon,
} from "lucide-react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import MobileUserNav from "@/components/MobileUserNav";
import { CiFilter } from "react-icons/ci";
import { addWishlistItem, removeWishlistItem, hasWishlistItem } from "@/lib/wishlist";
import { cmsPublicApi } from "@/lib/api";
import FilterButton from "@/components/FilterButton";
import CardImageCarousel from "@/components/CardImageCarousel";
import { GuestDropdown } from "@/components/GuestDropdown";
import { CalendarDropdown } from "@/components/CalendarDropdown";
import { LocationDropdown } from "@/components/LocationDropdown";
import { ActivityDropdown } from "@/components/ActivityDropdown";
import PriceSlider from "../components/PriceSlider";
import { getImageUrl } from "@/lib/utils";
import UniqueStaysSkeleton from "@/utils/UniqueStaysSkeleton";
import { CustomPagination } from "@/components/CustomPagination";
import { IoIosArrowBack } from "react-icons/io";
import { FilterSidebar } from "./SearchResults/FilterSidebar";
import {
  getNormCategory,
  filterSearchItems,
  sortSearchItems,
  mapOfferToCard,
  getFilterOptions,
} from "./SearchResults/searchHelpers";

type FilterType = "camper-van" | "unique-stays" | "activity";

export default function SearchResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    (searchParams.get("filter") as FilterType) || "camper-van",
  );
  const [activeFilterFromHeader, setActiveFilterFromHeader] = useState();
  // keep URL in sync when core params change
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get("location") ?? "");
  const [checkInDate, setCheckInDate] = useState<Date | null>(() => {
    const v = searchParams.get("checkin");
    return v ? new Date(v) : null;
  });
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(() => {
    const v = searchParams.get("checkout");
    return v ? new Date(v) : null;
  });
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  const [activityName, setActivityName] = useState(searchParams.get("activity") || "Tracking");

  const [selectedLocationTo, setSelectedLocationTo] = useState(
    searchParams.get("locationTo") || "India",
  );

  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
    "camper-van": true,
    "unique-stays": true,
    "best-activity": true,
  });

  const { data: homepageSections } = useHomepageSections();
  useEffect(() => {
    if (!homepageSections || homepageSections.length === 0) return;
    const nextState: Record<string, boolean> = {};
    (homepageSections as any[]).forEach((s: any) => {
      nextState[s.sectionKey] = s.isVisible;
    });
    setVisibleSections((prev) => ({ ...prev, ...nextState }));
  }, [homepageSections]);

  useEffect(() => {
    const filterMap: Record<string, string> = {
      "camper-van": "camper-van",
      "unique-stays": "unique-stays",
      activity: "best-activity",
    };

    if (visibleSections[filterMap[activeFilter]] === false) {
      const enabledFilter = Object.keys(filterMap).find(
        (f) => visibleSections[filterMap[f]] !== false,
      );
      if (enabledFilter) {
        setActiveFilter(enabledFilter as FilterType);
      }
    }
  }, [visibleSections, activeFilter]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("filter", activeFilter);
    params.set("location", selectedLocation);
    params.set("locationTo", selectedLocationTo);
    params.set("checkin", checkInDate ? checkInDate.toISOString() : "");
    params.set("checkout", checkOutDate ? checkOutDate.toISOString() : "");
    params.set("activity", activityName || "");
    setSearchParams(params);
  }, [activeFilter, selectedLocation, selectedLocationTo, checkInDate, checkOutDate, activityName]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showLocationToDropdown, setShowLocationToDropdown] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCheckoutCalendar, setShowCheckoutCalendar] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);

  const [guests, setGuests] = useState({
    adults: 2,
    children: 0,
    infants: 0,
    pet: 0,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  // const [priceRange, setPriceRange] = useState([50, 1200]);
  const [selectedRating, setSelectedRating] = useState<string>("1+");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  // Reset filters when active filter changes
  useEffect(() => {
    setSelectedTypes([]);
    setSelectedCategories([]);
    setSelectedFacilities([]);
    setSelectedRating("1+");
    setPriceRange({ minVal: min, maxVal: max });
    setSleepRange({ minVal: minSleep, maxVal: maxSleep });
    setSeatRange({ minVal: minSeat, maxVal: maxSeat });
  }, [activeFilter]);

  const locationRef = useRef<HTMLDivElement>(null);
  const locationToRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const checkoutCalendarRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const min = 999,
    max = 99999,
    step = 10;
  const [priceRange, setPriceRange] = useState({ minVal: min, maxVal: max });
  const minSleep = 2,
    maxSleep = 16,
    stepSleep = 5;
  const [sleepRange, setSleepRange] = useState({
    minVal: minSleep,
    maxVal: maxSleep,
  });
  const minSeat = 2,
    maxSeat = 16,
    stepSeat = 5;
  const [seatRange, setSeatRange] = useState({
    minVal: minSeat,
    maxVal: maxSeat,
  });
  const [mobileFilter, setMobileFilter] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // pagination for results
  const [page, setPage] = useState(1);
  // sorting
  const [sortBy, setSortBy] = useState<string>("recommended");

  useEffect(() => {
    const handleScroll = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setIsSticky(rect.top <= 10); // When button top is 10px or less from viewport top
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Callback to receive date range
  const handleDateRangeSelect = (range: { start: Date; end: Date }) => {
    setCheckInDate(range.start);
    setCheckOutDate(range.end);
  };

  // Handle search
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
    setSearchParams(params);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
      if (locationToRef.current && !locationToRef.current.contains(event.target as Node)) {
        setShowLocationToDropdown(false);
      }
      if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
        setShowGuestDropdown(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (
        checkoutCalendarRef.current &&
        !checkoutCalendarRef.current.contains(event.target as Node)
      ) {
        setShowCheckoutCalendar(false);
      }
      if (activityRef.current && !activityRef.current.contains(event.target as Node)) {
        setShowActivityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [isLoading, setIsLoading] = useState(false);

  // Get results title based on active filter

  // Fetch approved offers by city, then filter by category for current tab
  // Reset pagination on every filter change.
  useEffect(() => {
    setPage(1);
  }, [activeFilter, selectedLocation, selectedLocationTo, activityName]);

  // ─── Search results ─────────────────────────────────────────────────
  // useQuery keyed by (activeFilter, location). The category-normalization
  // logic is the same as the legacy fetch; just lifted into the queryFn.
  const searchQuery = useQuery<any[]>({
    queryKey: ["search", "offers", activeFilter, (selectedLocation || "").trim()],
    queryFn: async () => {
      const loc = (selectedLocation || "").trim();
      const params = new URLSearchParams();
      params.set("status", "approved");
      if (loc) {
        params.set("city", loc);
        params.set("state", loc);
      }
      params.set("page", "1");
      params.set("limit", "100");
      const r = await fetch(`/api/offers?${params.toString()}`);
      const json = await r.json();
      const list: any[] = Array.isArray(json?.data) ? json.data : [];
      const want = activeFilter === "camper-van" ? "caravan" : activeFilter;
      return list.filter((o) => getNormCategory(o.category, o.serviceType) === want);
    },
  });
  const serverItems = searchQuery.data ?? [];
  // Mirror useQuery's loading state into the existing setIsLoading state so
  // the rest of the page (which reads isLoading from useState) renders the
  // skeleton without changes.
  useEffect(() => {
    setIsLoading(searchQuery.isLoading || searchQuery.isFetching);
  }, [searchQuery.isLoading, searchQuery.isFetching]);

  // Use server data
  const dataToUse = Array.isArray(serverItems) ? serverItems : [];

  const filteredItems = filterSearchItems(dataToUse, {
    activeFilter,
    priceRange,
    selectedTypes,
    selectedCategories,
    selectedFacilities,
    sleepRange,
    seatRange,
  });
  const sortedItems = sortSearchItems(filteredItems, sortBy);
  const computedItems = sortedItems.map((doc: any) => mapOfferToCard(doc, activeFilter));

  const getResultsTitle = () => {
    const count = computedItems.length;
    return `Results (${count})`;
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(computedItems.length / itemsPerPage);
  const paginatedItems = computedItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const ratingOptions = ["1+", "2+", "3+", "4+", "5+"];

  const filterOptions = getFilterOptions(activeFilter);

  const filterSidebarProps = {
    onClose: () => {},
    activeFilter,
    filterOptions,
    priceBounds: { min, max, step },
    priceRange,
    setPriceRange,
    sleepBounds: { min: minSleep, max: maxSleep, step: stepSleep },
    sleepRange,
    setSleepRange,
    seatBounds: { min: minSeat, max: maxSeat, step: stepSeat },
    seatRange,
    setSeatRange,
    selectedRating,
    setSelectedRating,
    selectedTypes,
    setSelectedTypes,
    selectedCategories,
    setSelectedCategories,
    selectedFacilities,
    setSelectedFacilities,
  };

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
  useEffect(() => {
    if (activeFilterFromHeader) {
      setActiveFilter(activeFilterFromHeader);
    }
  }, [activeFilterFromHeader]);

  const activeCategoryMeta = {
    "camper-van": { label: "Camper Van", icon: CamperVanIcon },
    "unique-stays": { label: "Unique Stays", icon: HomeIcon },
    activity: { label: "Activity", icon: RocketIcon },
  }[activeFilter];

  return (
    <div className="min-h-screen  flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      {/* Site Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <SiteHeader
          activeFilter={activeFilter}
          onFilterChange={(filter) => setActiveFilter(filter as FilterType)}
        />
      </div>
      {/* Hero Section with Dynamic Filters — entirely hidden below md, so the
          section itself carries no padding there; otherwise it's dead space
          (the fixed-header offset lives on mt-20, which still applies). */}
      <section className="mt-20  dark:bg-black dark:text-white py-6 pt-8 max-md:py-3">
        {/* Category pills stay desktop-only (lg+) — on mobile only the back
            arrow shows, leading straight to the results below. */}
        <div className="sticky top-0 z-40 dark:dark-color py-4 max-md:py-0 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-3 mb-2 justify-start lg:justify-center min-w-max px-4">
            <button
              onClick={() => navigate("/")}
              aria-label="Back to home"
              className="lg:hidden flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#E4E8F0] text-[#0a1c1c] shadow-sm hover:border-[#3bd9da]/40 hover:text-[#117479] active:scale-90 transition-all"
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>
            <div className="hidden lg:flex items-center gap-3">
              {visibleSections["camper-van"] !== false && (
                <FilterButton
                  icon={CamperVanIcon}
                  label="Camper Van"
                  active={activeFilter === "camper-van"}
                  onClick={() => setActiveFilter("camper-van")}
                />
              )}
              {visibleSections["unique-stays"] !== false && (
                <FilterButton
                  icon={HomeIcon}
                  label="Unique Stays"
                  active={activeFilter === "unique-stays"}
                  onClick={() => setActiveFilter("unique-stays")}
                />
              )}
              {visibleSections["best-activity"] !== false && (
                <FilterButton
                  icon={RocketIcon}
                  label="Activity"
                  active={activeFilter === "activity"}
                  onClick={() => setActiveFilter("activity")}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mobile-only stand-in for the pills hidden above — fills what was
            dead space with the one thing they conveyed: which category
            you're looking at. */}
        <div className="lg:hidden flex items-center gap-2 px-4 pt-3">
          {(() => {
            const CategoryIcon = activeCategoryMeta.icon;
            return <CategoryIcon className="w-5 h-5 text-[#117479]" />;
          })()}
          <span className="text-base font-semibold text-[#0a1c1c]">{activeCategoryMeta.label}</span>
        </div>

        <div ref={SearchbarRef} className="w-full mx-auto max-md:hidden">
          {/* Dynamic Search Form Based on Filter */}
          <div className="rounded-2xl px-10 max-w-7xl mx-auto  bg-white relative">
            {/* Search Form */}
            <div className=" max-lg:hidden bg-[#F6F6F6] rounded-2xl  p-3 relative">
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
                            selectedLocation === "Where are you going?" ? "" : selectedLocation
                          }
                          onChange={(e) => {
                            setSelectedLocation(e.target.value);
                            setShowLocationDropdown(true); // show dropdown while typing
                          }}
                          onFocus={() => setShowLocationDropdown(true)}
                          className="w-full px-3 bg-transparent text-black font-medium text-lg  focus:outline-none  placeholder:text-gray-400"
                        />

                        {/* Search Icon */}
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

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
                    <div ref={calendarRef} className="flex flex-col gap-2 flex-2 relative min-w-0">
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
                        className={`font-semibold text-[16px] ${checkInDate ? "text-black" : "text-gray-400"} hover:text-gray-700 transition-colors text-left`}
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
                    <div className="flex flex-col gap-2 flex-1 min-w-0 relative" ref={activityRef}>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Star className="w-5 h-5" />
                        <span className="text-sm">Activity Name</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowActivityDropdown(!showActivityDropdown);
                          setShowLocationDropdown(false);
                          setShowCalendar(false);
                          setShowGuestDropdown(false);
                        }}
                        className={`font-medium text-lg md:text-lg text-left hover:text-gray-700 transition-colors ${
                          activityName === "Tracking" ? "text-gray-400" : "text-black"
                        }`}
                      >
                        {activityName}
                      </button>
                      {showActivityDropdown && (
                        <ActivityDropdown
                          onSelect={setActivityName}
                          onClose={() => setShowActivityDropdown(false)}
                        />
                      )}
                    </div>

                    <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

                    {/* Guests Field */}
                    <div className="flex flex-col gap-2 flex-1 min-w-0 relative" ref={guestRef}>
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
                        className={`font-medium text-lg md:text-lg text-left hover:text-gray-700 transition-colors ${
                          guests.adults + guests.children + guests.infants + guests.pet > 0
                            ? "text-black"
                            : "text-gray-400"
                        }`}
                      >
                        {guests.adults + guests.children + guests.infants || "Add guests"}
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
                      className="bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white rounded-full h-12 w-12 lg:h-14 lg:w-14"
                      size="icon"
                    >
                      <Search className="w-5 h-5 lg:w-6 lg:h-6" />
                    </Button>
                  </div>
                </div>
              )}

              {/* CamperVan Filter */}
              {activeFilter === "camper-van" && (
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between ">
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
                        <span className="text-xs md:text-sm">Location From</span>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search location"
                          value={
                            selectedLocation === "Where are you going?" ? "" : selectedLocation
                          }
                          onChange={(e) => {
                            setSelectedLocation(e.target.value);
                            setShowLocationDropdown(true); // show dropdown while typing
                          }}
                          onFocus={() => setShowLocationDropdown(true)}
                          className="w-full bg-transparent px-3 text-black font-medium text-lg text-left hover:text-gray-700 transition-colors focus:outline-none  placeholder:text-gray-400"
                        />

                        {/* Search Icon */}
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

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
                            selectedLocationTo === "Where are you going?" ? "" : selectedLocationTo
                          }
                          onChange={(e) => {
                            setSelectedLocationTo(e.target.value);
                            setShowLocationToDropdown(true); // show dropdown while typing
                          }}
                          onFocus={() => setShowLocationToDropdown(true)}
                          className="w-full bg-transparent px-3 text-black font-medium text-lg text-left hover:text-gray-700 transition-colors focus:outline-none  placeholder:text-gray-400"
                        />

                        {/* Search Icon */}
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

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
                    <div ref={calendarRef} className="flex flex-col gap-2 flex-1 relative min-w-0">
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
                        className={`font-semibold text-[16px] ${checkInDate ? "text-black" : "text-gray-400"} hover:text-gray-700 transition-colors text-left`}
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
                            // setShowCalendar(false);
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
                        className={`font-semibold text-[16px] ${checkOutDate ? "text-black" : "text-gray-400"} hover:text-gray-700 transition-colors text-left`}
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
                    <div className="flex flex-col gap-2 flex-1 relative min-w-0" ref={guestRef}>
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
                        className={`font-medium text-lg md:text-lg text-left hover:text-gray-700 transition-colors ${
                          guests.adults + guests.children + guests.infants + guests.pet > 0
                            ? "text-black"
                            : "text-gray-400"
                        }`}
                      >
                        {(guests.adults + guests.children + guests.infants + guests.pet > 0 &&
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
                      className="bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white rounded-full h-12 w-12 lg:h-14 lg:w-14"
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
                            selectedLocation === "Where are you going?" ? "" : selectedLocation
                          }
                          onChange={(e) => {
                            setSelectedLocation(e.target.value);
                            setShowLocationDropdown(true); // show dropdown while typing
                          }}
                          onFocus={() => setShowLocationDropdown(true)}
                          className="w-full px-3 bg-transparent text-black font-medium text-lg focus:outline-none  placeholder:text-gray-400"
                        />

                        {/* Search Icon */}
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

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
                    <div ref={calendarRef} className="flex flex-col gap-2 flex-1 relative min-w-0">
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
                        className={`font-semibold text-[16px] ${checkInDate ? "text-black" : "text-gray-400"} hover:text-gray-700 transition-colors text-left`}
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
                            // setShowCalendar(false);
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
                        className={`font-semibold text-[16px] ${checkOutDate ? "text-black" : "text-gray-400"} hover:text-gray-700 transition-colors text-left`}
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
                    <div className="flex flex-col gap-2 flex-1 min-w-0 relative" ref={guestRef}>
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
                        className={`font-medium text-lg md:text-lg text-left hover:text-gray-700 transition-colors ${
                          guests.adults + guests.children + guests.infants + guests.pet > 0
                            ? "text-black"
                            : "text-gray-400"
                        }`}
                      >
                        {guests.adults + guests.children + guests.infants || "Add guests"}
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
                      className="bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white rounded-full h-12 w-12 lg:h-14 lg:w-14"
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
      {/* Main Content */}
      <div className="px-4 bg-white py-8 overflow-hidden">
        <div className="flex md:px-10  gap-8 h-full max-w-7xl mx-auto">
          {/* Filters Sidebar Desktop - Fixed */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar {...filterSidebarProps} />
            </div>
          </div>

          {/* Filters Sidebar mobile*/}
          <Dialog
            open={mobileFilter}
            onClose={setMobileFilter}
            className="lg:hidden relative z-[100]"
          >
            <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-0 shadow-2xl transition-all animate-zoom-in">
                  <FilterSidebar {...filterSidebarProps} onClose={() => setMobileFilter(false)} />
                </DialogPanel>
              </div>
            </div>
          </Dialog>

          {/* Results Section */}
          <div className="flex-1 max-w-7xl mx-auto flex flex-col h-full">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">{getResultsTitle()}</h2>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setMobileFilter(true);
                  }}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-full bg-white shadow-sm hover:shadow-md hover:border-gray-300 active:scale-95 transition-all duration-200"
                >
                  <CiFilter className="w-5 h-5" />
                  <span className="text-sm font-semibold">Filters</span>
                </button>
              </div>
            </div>

            {/* Results Cards Div - Scrollable */}
            <div
              className="flex-1 overflow-y-auto pr-2 max-h-[70vh] md:max-h-[750px] scrollbar-hide"
              style={{ minHeight: "400px" }}
            >
              {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : paginatedItems.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeFilter}-${selectedLocation}-${page}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {/* paginatedItems is already the list for activeFilter — ResultCard
                        picks one of the three by that same filter, so passing it into
                        all three is safe (only the matching branch ever renders). */}
                    <ResultCard
                      activeFilter={activeFilter}
                      ResultcaravanShown={paginatedItems}
                      ResultstayShown={paginatedItems}
                      ResultactivityShown={paginatedItems}
                    />
                    <CustomPagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                    />
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-1">No results found</h3>
                  <p className="text-gray-500 text-center max-w-xs">
                    We couldn't find anything matching your search. Try adjusting your filters or
                    search area.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
      {/* Clearance for the fixed bottom nav, painted in the footer's own
          colour so the page doesn't end on a white band. Collapses to 0 at lg,
          where the nav is hidden. Matches Index.tsx's pattern. */}
      <div className="bg-[#0a1c1c] pb-mobile-nav" aria-hidden />
      <MobileUserNav />
    </div>
  );
}

// Icon Components (reused from Index.tsx)
function CamperVanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path
        d="M5.27776 13.333C4.2222 13.333 3.33331 14.2219 3.33331 15.2775C3.33331 16.333 4.2222 17.2219 5.27776 17.2219C6.33331 17.2219 7.2222 16.333 7.2222 15.2775C7.2222 14.2219 6.33331 13.333 5.27776 13.333ZM5.27776 16.1108C4.83331 16.1108 4.44442 15.7219 4.44442 15.2775C4.44442 14.833 4.83331 14.4441 5.27776 14.4441C5.7222 14.4441 6.11109 14.833 6.11109 15.2775C6.11109 15.7219 5.7222 16.1108 5.27776 16.1108Z"
        fill="currentColor"
      />
      <path
        d="M13.0555 13.333C12 13.333 11.1111 14.2219 11.1111 15.2775C11.1111 16.333 11.9444 17.2219 13.0555 17.2219C14.1111 17.2219 15 16.333 15 15.2775C15 14.2219 14.1111 13.333 13.0555 13.333ZM13.0555 16.1108C12.6111 16.1108 12.2222 15.7219 12.2222 15.2775C12.2222 14.833 12.6111 14.4441 13.0555 14.4441C13.5 14.4441 13.8889 14.833 13.8889 15.2775C13.8889 15.7219 13.5 16.1108 13.0555 16.1108Z"
        fill="currentColor"
      />
      <path
        d="M18.3333 11.1662V11.1107H18.2778L16.3333 8.05512C17.2222 7.55512 17.7778 6.66623 17.7778 5.72179V5.38845C17.7778 3.94401 16.6111 2.77734 15.1666 2.77734H10.4444C9.38886 2.77734 8.38886 3.44401 7.99997 4.44401H2.77775C1.83331 4.44401 1.11108 5.16623 1.11108 6.11068V15.5551H2.2222V6.11068C2.2222 5.77734 2.44442 5.55512 2.77775 5.55512H8.83331L8.88886 5.11068C9.05553 4.38845 9.66664 3.88845 10.3889 3.88845H15.1111C16 3.88845 16.6666 4.55512 16.6666 5.38845V5.66623C16.6666 6.49957 16 7.16623 15.1666 7.16623H13.3333V12.1662H17.6666L17.7778 12.3329V13.8885C17.7778 14.2218 17.5555 14.444 17.2222 14.444H16.1111V15.5551H17.2222C18.1666 15.5551 18.8889 14.8329 18.8889 13.8885V12.0551L18.3333 11.1662ZM14.4444 11.1107V8.3329H15.2778L17 11.1107H14.4444Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path
        d="M20 8.25L10 1.75L7.5 3.375V1.25H5V5L0 8.25L2.375 11.625L2.5 11.5V18.75H8.75V13.75H11.25V18.75H17.5V11.5L17.625 11.625L20 8.25ZM1.75 8.625L10 3.25L18.25 8.625L17.375 9.875L10 5L2.625 9.875L1.75 8.625ZM16.25 17.5H12.5V12.5H7.5V17.5H3.75V10.75L10 6.625L16.25 10.75V17.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path
        d="M18 2.25009C18 2.08342 17.8333 2.00009 17.6667 1.91676C14.5 1.08342 11.0833 2.16676 8.99999 4.66676L7.91666 5.91676L5.66666 5.33342C4.74999 5.00009 3.83332 5.41676 3.41666 6.25009L1.66666 9.33342C1.66666 9.33342 1.66666 9.41676 1.58332 9.41676C1.49999 9.66676 1.66666 9.83342 1.91666 9.91676L4.74999 10.5001C4.49999 11.2501 4.24999 12.0001 4.16666 12.7501C4.16666 12.9168 4.16666 13.0001 4.24999 13.0834L6.74999 15.5001C6.83332 15.5834 6.91666 15.5834 7.08332 15.5834C7.83332 15.5001 8.66666 15.3334 9.41666 15.0834L9.99999 17.8334C9.99999 18.0001 10.25 18.1668 10.4167 18.1668C10.5 18.1668 10.5833 18.1668 10.5833 18.0834L13.6667 16.3334C14.4167 15.9168 14.75 15.0001 14.5833 14.1668L14 11.7501L15.1667 10.6668C17.75 8.75009 18.8333 5.41676 18 2.25009Z"
        fill="currentColor"
      />
    </svg>
  );
}
