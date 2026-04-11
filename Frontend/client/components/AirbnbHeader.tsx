import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  MapPin,
  Calendar,
  Users,
  Star as StarIcon,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoWebsite, { HomeLogoWebsite } from "./ui/LogoWebsite";
import { useAuth } from "../contexts/AuthContext";
import UserDropdown from "./UserDropdown";
import { LocationDropdown } from "./LocationDropdown";
import { GuestDropdown } from "./GuestDropdown";
import { ActivityDropdown } from "./ActivityDropdown";
import { CalendarDropdown } from "./CalendarDropdown";
import { CgLoadbarDoc } from "react-icons/cg";
import { cmsPublicApi } from "@/lib/api";

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

interface AirbnbHeaderProps {
  variant?: "transparent" | "white";
  className?: string;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  heroHeight?: number;
  scrollHighlightFilter?: string | null;
}

export default function AirbnbHeader({
  variant = "white",
  className = "",
  activeFilter = "unique-stays",
  onFilterChange,
  heroHeight,
  scrollHighlightFilter,
}: AirbnbHeaderProps) {
  const navigate = useNavigate();
  const { user, updateUserType } = useAuth();

  const [showFilterButtons, setShowFilterButtons] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showLocationToDropdown, setShowLocationToDropdown] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedLocationTo, setSelectedLocationTo] = useState("");
  const [activityName, setActivityName] = useState("Tracking");
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState<{
    adults: number;
    children: number;
    infants: number;
    pet?: number;
  }>({
    adults: 1,
    children: 0,
    infants: 0,
    pet: 0,
  });

  const locationRef = useRef<HTMLDivElement>(null);
  const locationToRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarToRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const [showSearchSection, setShowSearchSection] = useState(false);
  const lastInteractionTime = useRef(0);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
    'camper-van': true,
    'unique-stays': true,
    'best-activity': true,
  });

  useEffect(() => {
    let mounted = true;
    const fetchSections = async () => {
      try {
        const sections = await cmsPublicApi.listHomepageSections();
        if (mounted && sections && sections.length > 0) {
          const nextState: Record<string, boolean> = {};
          sections.forEach((s: any) => {
             nextState[s.sectionKey] = s.isVisible;
          });
          setVisibleSections(prev => ({...prev, ...nextState}));
        }
      } catch (error) {
        console.error("Failed to load header sections visibility", error);
      }
    };
    fetchSections();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // Reset dropdowns when filter changes
    setShowLocationDropdown(false);
    setShowLocationToDropdown(false);
    setShowGuestDropdown(false);
    setShowActivityDropdown(false);
    setShowCalendar(false);
  }, [activeFilter]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const scrollY = window.scrollY;
        const scrollDelta = Math.abs(scrollY - lastScrollY);

        setShowFilterButtons(prev => {
          const threshold = Math.min(heroHeight ?? 200, 300);
          const next = prev ? scrollY > (threshold - 60) : scrollY > threshold;
          return prev !== next ? next : prev;
        });

        // Only close search section if there is actual scrolling movement
        // and it wasn't just opened by a click (prevents momentum scroll from closing it)
        if (scrollDelta > 10 && Date.now() - lastInteractionTime.current > 500) {
          setShowSearchSection(false);
          // Also close dropdowns on scroll
          setShowLocationDropdown(false);
          setShowLocationToDropdown(false);
          setShowGuestDropdown(false);
          setShowActivityDropdown(false);
          setShowCalendar(false);
        }

        lastScrollY = scrollY;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [heroHeight]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
      if (
        calendarToRef.current &&
        !calendarToRef.current.contains(event.target as Node)
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

  const handleDateRangeSelect = (range: { start: Date; end: Date }) => {
    setCheckInDate(range.start);
    setCheckOutDate(range.end);
  };

  const handleTabClick = (tabId: string) => {
    lastInteractionTime.current = Date.now();
    onFilterChange?.(tabId);
    setShowSearchSection(true);
    setIsMobileMenuOpen(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams({
      filter: activeFilter,
      location: selectedLocation,
      checkin: checkInDate ? checkInDate.toISOString() : "",
      checkout: checkOutDate ? checkOutDate.toISOString() : "",
      guests: (guests.adults + guests.children + guests.infants).toString(),
      activity: activityName,
    });
    navigate(`/search?${params.toString()}`);
  };

  const navTabs = [
    { id: "camper-van", label: "Camper Van", icon: CamperVanIcon, sectionKey: "camper-van" },
    { id: "unique-stays", label: "Unique Stays", icon: HomeIcon, sectionKey: "unique-stays" },
    { id: "activity", label: "Activity", icon: RocketIcon, sectionKey: "best-activity" },
  ].filter(tab => visibleSections[tab.sectionKey] !== false);

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          backgroundColor: showFilterButtons || user || showSearchSection ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)",
          boxShadow: showFilterButtons || showSearchSection
            ? "0 1px 6px rgba(0, 0, 0, 0.06)"
            : "0 0 0 rgba(0, 0, 0, 0)",
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo crossfade — both rendered, opacity toggles */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
              className="cursor-pointer flex-shrink-0 relative"
            >
              {/* Dark logo (scrolled / logged-in) */}
              <div
                className="transition-opacity duration-300 ease-out"
                style={{ opacity: (showFilterButtons || user || location.pathname.includes("search")) ? 1 : 0 }}
              >
                <LogoWebsite />
              </div>
              {/* White logo (hero) — absolute overlaid, fades out on scroll */}
              <div
                className="absolute inset-0 transition-opacity duration-300 ease-out"
                style={{ opacity: (showFilterButtons || user || location.pathname.includes("search")) ? 0 : 1 }}
              >
                <HomeLogoWebsite variant="dark" />
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {showFilterButtons && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex flex-wrap max-md:hidden items-center sm:ml-52 justify-center gap-3 py-3"
                >
                  {navTabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const highlightId = scrollHighlightFilter || activeFilter;
                    const isActive = highlightId === tab.id;
                    return (
                      <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTabClick(tab.id)}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
                          isActive
                            ? "bg-gray-900 text-white shadow-sm"
                            : "bg-transparent text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <IconComponent className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-600"}`} />
                        <span>{tab.label}</span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showSearchSection && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-20 shadow-2xl left-0 right-0 bg-white rounded-2xl p-4 px-5 md:p-6 overflow-visible border border-gray-100"
                >
                  {activeFilter === "activity" && (
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3 md:gap-6 lg:gap-0 w-full">
                      <div className="flex flex-col lg:flex-row lg:flex-1 lg:items-center gap-3 md:gap-6 lg:gap-6">
                        <div
                          className="flex flex-col gap-1 md:gap-2 flex-1 min-w-0 relative p-2 md:p-0"
                          ref={locationRef}
                        >
                          <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-xs md:text-sm">Location</span>
                          </div>
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
                                setShowLocationDropdown(true);
                              }}
                              onFocus={() => setShowLocationDropdown(true)}
                              className="w-full px-3 bg-transparent text-black font-medium text-lg focus:outline-none placeholder:text-gray-400"
                            />
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

                        <div
                          ref={calendarRef}
                          className="flex flex-col gap-2 flex-1 relative min-w-0"
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

                        <div
                          className="flex flex-col gap-2 flex-1 min-w-0 relative"
                          ref={activityRef}
                        >
                          <div className="flex items-center gap-2 text-gray-500">
                            <StarIcon className="w-5 h-5" />
                            <span className="text-sm">Activity Name</span>
                          </div>
                          <button
                            onClick={() => {
                              setShowActivityDropdown(!showActivityDropdown);
                              setShowLocationDropdown(false);
                              setShowCalendar(false);
                              setShowGuestDropdown(false);
                            }}
                            className={`${activityName !== "Tracking" ? "text-black" : "text-gray-400"} font-medium text-lg md:text-lg text-left hover:text-gray-700 transition-colors placeholder:text-gray-400`}
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
                            className={`${
                              guests.adults === 1 &&
                              guests.children === 0 &&
                              guests.infants === 0
                                ? "text-gray-400"
                                : "text-black"
                            } font-medium text-lg md:text-lg text-left hover:text-gray-700 transition-colors`}
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

                  {activeFilter === "camper-van" && (
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3 md:gap-6 lg:gap-0 w-full">
                      <div className="flex flex-col lg:flex-row lg:flex-1 lg:items-center gap-3 md:gap-6 lg:gap-6">
                        <div
                          className="flex flex-col gap-1 md:gap-2 flex-1 min-w-0 relative p-2 md:p-0"
                          ref={locationRef}
                        >
                          <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-xs md:text-sm">
                              Location From
                            </span>
                          </div>
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
                                setShowLocationDropdown(true);
                              }}
                              onFocus={() => setShowLocationDropdown(true)}
                              className="w-full px-3 bg-transparent text-black font-medium text-lg focus:outline-none placeholder:text-gray-400"
                            />
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

                        <div
                          className="flex flex-col gap-1 md:gap-2 flex-1 min-w-0 relative p-2 md:p-0"
                          ref={locationToRef}
                        >
                          <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-xs md:text-sm">
                              Location To
                            </span>
                          </div>
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
                                setShowLocationToDropdown(true);
                              }}
                              onFocus={() => setShowLocationToDropdown(true)}
                              className="w-full px-3 bg-transparent text-black font-medium text-lg focus:outline-none placeholder:text-gray-400"
                            />
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

                        <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

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
                            className={`font-medium text-md ${
                              checkInDate ? "text-black" : "text-gray-400"
                            } hover:text-gray-700 transition-colors text-left`}
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

                        <div
                          ref={calendarToRef}
                          className="flex flex-col gap-2 flex-1 relative min-w-0"
                        >
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
                            className={`font-medium text-md ${
                              checkOutDate ? "text-black" : "text-gray-400"
                            } hover:text-gray-700 transition-colors text-left`}
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
                            className={`${
                              guests.adults === 1 &&
                              guests.children === 0 &&
                              guests.infants === 0
                                ? "text-gray-400"
                                : "text-black"
                            } font-medium text-lg md:text-lg text-left hover:text-gray-700 transition-colors`}
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

                  {activeFilter === "unique-stays" && (
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3 md:gap-6 lg:gap-0 w-full">
                      <div className="flex flex-col lg:flex-row lg:flex-1 lg:items-center gap-3 md:gap-6 lg:gap-6">
                        <div
                          className="flex flex-col gap-1 md:gap-2 flex-1 min-w-0 relative p-2 md:p-0"
                          ref={locationRef}
                        >
                          <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-xs md:text-sm">Location</span>
                          </div>
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
                                setShowLocationDropdown(true);
                              }}
                              onFocus={() => setShowLocationDropdown(true)}
                              className="w-full px-3 bg-transparent text-black font-medium text-lg focus:outline-none placeholder:text-gray-400"
                            />
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

                        <div
                          ref={calendarToRef}
                          className="flex flex-col gap-2 flex-1 relative min-w-0"
                        >
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
                            className={`${
                              guests.adults === 1 &&
                              guests.children === 0 &&
                              guests.infants === 0
                                ? "text-gray-400"
                                : "text-black"
                            } font-medium text-lg md:text-lg text-left hover:text-gray-700 transition-colors`}
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

               
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center">
              {user ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <button
                    className={`max-md:hidden md:flex items-center gap-2 rounded-full px-5 h-10 text-sm font-semibold transition-all duration-300 ${
                      showFilterButtons || showSearchSection
                        ? "bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md"
                        : "bg-white/15 text-white backdrop-blur-md border border-white/30 hover:bg-white/25 hover:border-white/50 shadow-sm"
                    }`}
                    onClick={() => navigate("/onboarding/service-selection")}
                  >
                    <CgLoadbarDoc size={16} className="shrink-0" />
                    List your space
                  </button>
                  <UserDropdown
                    onSwitchToVendor={() => {
                      updateUserType('vendor');
                      navigate("/dashboard");
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <button
                    className={`hidden md:flex items-center gap-2 rounded-full px-5 h-10 text-sm font-semibold transition-all duration-300 ${
                      showFilterButtons || showSearchSection
                        ? "bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md"
                        : "bg-white/15 text-white backdrop-blur-md border border-white/30 hover:bg-white/25 hover:border-white/50 shadow-sm"
                    }`}
                    onClick={() => navigate("/onboarding/service-selection")}
                  >
                    <CgLoadbarDoc size={16} className="shrink-0" />
                    List your space
                  </button>
                  <button
                    onClick={() => navigate("/register")}
                    className={`rounded-full px-5 h-9 text-sm font-semibold transition-all duration-200 ${
                      showFilterButtons || showSearchSection
                        ? "bg-gray-900 hover:bg-gray-700 text-white"
                        : "bg-white/95 text-gray-900 hover:bg-white shadow-md"
                    }`}
                  >
                    Sign up
                  </button>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2 rounded-full transition-colors ${
                  showFilterButtons || showSearchSection
                    ? "text-gray-800 hover:bg-gray-100"
                    : "text-white hover:bg-white/15"
                }`}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden border-t border-gray-100 bg-white shadow-lg"
            >
              <div className="px-4 py-4 space-y-2 ">
                {navTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ backgroundColor: "#f3f4f6" }}
                      onClick={() => handleTabClick(tab.id)}
                      className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-colors flex items-center gap-3 ${
                        activeFilter === tab.id
                          ? "bg-gray-900 text-white"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      {tab.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="h-0" />
    </>
  );
}
