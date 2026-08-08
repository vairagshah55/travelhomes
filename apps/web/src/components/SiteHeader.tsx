import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MapPin, Calendar, Users, Star as StarIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoWebsite, { HomeLogoWebsite } from "./ui/LogoWebsite";
import { BrandLogo } from "./BrandLogo";
import { useAuth } from "../contexts/AuthContext";
import UserDropdown from "./UserDropdown";
import { LocationDropdown } from "./LocationDropdown";
import { GuestDropdown } from "./GuestDropdown";
import { ActivityDropdown } from "./ActivityDropdown";
import { CalendarDropdown } from "./CalendarDropdown";
import { CgLoadbarDoc } from "react-icons/cg";
import { cmsPublicApi } from "@/lib/api";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { CamperVanIcon, HomeIcon, RocketIcon } from "./site-header/icons";

interface SiteHeaderProps {
  variant?: "transparent" | "white";
  className?: string;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  heroHeight?: number;
  scrollHighlightFilter?: string | null;
  /** Opens the phone-sized search sheet. Supplied by the landing page; when
   *  absent the mobile search affordances fall back to the /search route. */
  onMobileSearchOpen?: () => void;
}

export default function SiteHeader({
  variant = "white",
  className = "",
  activeFilter = "unique-stays",
  onFilterChange,
  heroHeight,
  scrollHighlightFilter,
  onMobileSearchOpen,
}: SiteHeaderProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isSearchPage = pathname === "/search";
  const { user, updateUserType } = useAuth();

  const [showFilterButtons, setShowFilterButtons] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showLocationToDropdown, setShowLocationToDropdown] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [guestsConfirmed, setGuestsConfirmed] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [searchErrors, setSearchErrors] = useState<Record<string, string>>({});
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
    pet: number;
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

  const isScrolled = showFilterButtons || showSearchSection;
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

        setShowFilterButtons((prev) => {
          // Trigger when hero search bar has scrolled away, not when full hero is gone
          const threshold = (heroHeight ?? 200) - 150;
          const next = prev ? scrollY > threshold - 100 : scrollY > threshold;
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
      const target = event.target as Node;
      // Calendar popup is rendered inside calendarRef in every filter variant.
      // calendarToRef only wraps the checkout trigger and must NOT be used to
      // close the calendar — the popup is its sibling, not its descendant.
      const insideCalendar =
        (calendarRef.current && calendarRef.current.contains(target)) ||
        (calendarToRef.current && calendarToRef.current.contains(target));
      if (!insideCalendar) {
        setShowCalendar(false);
      }
      if (locationRef.current && !locationRef.current.contains(target)) {
        setShowLocationDropdown(false);
      }
      if (locationToRef.current && !locationToRef.current.contains(target)) {
        setShowLocationToDropdown(false);
      }
      if (guestRef.current && !guestRef.current.contains(target)) {
        setShowGuestDropdown(false);
      }
      if (activityRef.current && !activityRef.current.contains(target)) {
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

  /* Phone: picking a category should lead straight into the search sheet —
     the header panel is desktop-only. */
  const handleMobileTabClick = (tabId: string) => {
    onFilterChange?.(tabId);
    setIsMobileMenuOpen(false);
    if (onMobileSearchOpen) onMobileSearchOpen();
    else navigate(`/search?filter=${tabId}`);
  };

  const openMobileSearch = () => {
    if (onMobileSearchOpen) onMobileSearchOpen();
    else navigate(`/search?filter=${activeFilter}`);
  };

  /* Lock the page behind the mobile menu so a scroll gesture over the sheet
     doesn't drift the content underneath. */
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (selectedLocation)
      setSearchErrors((e) => {
        const { location, ...rest } = e;
        return rest;
      });
  }, [selectedLocation]);
  useEffect(() => {
    if (selectedLocationTo)
      setSearchErrors((e) => {
        const { locationTo, ...rest } = e;
        return rest;
      });
  }, [selectedLocationTo]);
  useEffect(() => {
    if (checkInDate)
      setSearchErrors((e) => {
        const { checkin, ...rest } = e;
        return rest;
      });
  }, [checkInDate]);
  useEffect(() => {
    if (checkOutDate)
      setSearchErrors((e) => {
        const { checkout, ...rest } = e;
        return rest;
      });
  }, [checkOutDate]);
  useEffect(() => {
    if (activityName && activityName !== "Tracking")
      setSearchErrors((e) => {
        const { activity, ...rest } = e;
        return rest;
      });
  }, [activityName]);
  useEffect(() => {
    setSearchErrors({});
  }, [activeFilter]);

  const handleSearch = () => {
    const errors: Record<string, string> = {};
    if (!selectedLocation.trim()) errors.location = "Required";
    if (activeFilter === "camper-van" && !selectedLocationTo.trim()) errors.locationTo = "Required";
    if (!checkInDate) errors.checkin = "Required";
    if (activeFilter !== "activity" && !checkOutDate) errors.checkout = "Required";
    if (activeFilter === "activity" && (!activityName.trim() || activityName === "Tracking"))
      errors.activity = "Required";

    if (Object.keys(errors).length > 0) {
      setSearchErrors(errors);
      return;
    }
    setSearchErrors({});

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

  /* The header is transparent over the hero photo, so the logo has to be the
     white lockup there and the ink one everywhere else. */
  const onDarkHeader = !showFilterButtons && !pathname.includes("search");
  const showMobileSearchPill = showFilterButtons && !isSearchPage;

  const navTabs = [
    { id: "camper-van", label: "Camper Van", icon: CamperVanIcon, sectionKey: "camper-van" },
    { id: "unique-stays", label: "Unique Stays", icon: HomeIcon, sectionKey: "unique-stays" },
    { id: "activity", label: "Activity", icon: RocketIcon, sectionKey: "best-activity" },
  ].filter((tab) => visibleSections[tab.sectionKey] !== false);

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          backgroundColor: isScrolled ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)",
          boxShadow: isScrolled ? "0 1px 8px rgba(0, 0, 0, 0.08)" : "0 0 0 rgba(0, 0, 0, 0)",
        }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-[backdrop-filter] duration-500 ease-in-out ${
          isScrolled ? "backdrop-blur-md" : "backdrop-blur-none"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          {/* Shorter bar on phones — 80px of chrome is a lot of a 640px viewport. */}
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Phone logo. The horizontal lockup is 4.63:1 — at the desktop
                size that's 185px, roughly half a 390px bar, which left the
                search pill squeezed into a circle. So: a smaller lockup on the
                hero, and the caravan mark alone once the pill appears. */}
            <div
              onClick={() => navigate("/")}
              className="lg:hidden cursor-pointer flex-shrink-0 flex items-center"
            >
              <BrandLogo
                variant={onDarkHeader ? "full" : showMobileSearchPill ? "mark" : "full"}
                size={showMobileSearchPill && !onDarkHeader ? 34 : 30}
                tone={onDarkHeader ? "light" : "dark"}
              />
            </div>

            {/* Desktop logo crossfade — both rendered, opacity toggles */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
              className="hidden lg:block cursor-pointer flex-shrink-0 relative"
            >
              {/* Dark logo (scrolled) */}
              <div
                className="transition-opacity duration-500 ease-in-out"
                style={{ opacity: onDarkHeader ? 0 : 1 }}
              >
                <LogoWebsite />
              </div>
              {/* White logo (hero) — absolute overlaid, fades out on scroll */}
              <div
                className="absolute inset-0 transition-opacity duration-500 ease-in-out"
                style={{ opacity: onDarkHeader ? 1 : 0 }}
              >
                {/* "light" = paint the lockup WHITE for a dark surface — this one
                    sits on the hero photo. "dark" would render black artwork. */}
                <HomeLogoWebsite variant="light" />
              </div>
            </motion.div>

            {/* Phone: once the hero search has scrolled away, the header
                itself becomes the search entry point. */}
            <AnimatePresence>
              {showMobileSearchPill && (
                <motion.button
                  key="mobile-search-pill"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  onClick={openMobileSearch}
                  aria-label="Open search"
                  className="lg:hidden flex flex-1 items-center gap-2 mx-2 h-10 min-w-0 px-3 rounded-full border border-gray-200 bg-white shadow-sm active:scale-[0.98] transition-transform"
                >
                  <Search className="w-4 h-4 text-[#117479] flex-shrink-0" />
                  <span className="text-[13px] font-semibold text-gray-700 truncate">
                    Where to go?
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {showFilterButtons && !isSearchPage && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className="flex flex-wrap max-md:hidden items-center sm:ml-52 justify-center gap-3 py-3"
                >
                  {navTabs.map((tab) => {
                    const IconComponent = tab.icon;
                    // Only the user's explicit click drives the visual state.
                    // (The transient scroll-spy "section-in-view" highlight was
                    // removed — it flashed a dot/tint on the tab for a few
                    // seconds while scrolling, which read as a glitch.)
                    const isActive = activeFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={`group relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
                          isActive ? "text-white" : "text-[#0a1c1c] hover:text-[#117479]"
                        }`}
                      >
                        {/* Active pill — shared layoutId slides between tabs.
                            Arbitrary values must not contain spaces: Tailwind
                            drops the whole class, which is why the glow on
                            `rgba(59, 217, 218, 0.65)` never rendered. */}
                        {isActive && (
                          <motion.span
                            layoutId="site-header-active-pill"
                            className="absolute inset-0 rounded-full bg-[#3BD9DA] shadow-[0_2px_10px_rgba(59,217,218,0.55)]"
                            transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.6 }}
                          />
                        )}

                        {/* Idle background — subtle outlined chip when NOT active */}
                        {!isActive && (
                          <span className="absolute inset-0 rounded-full bg-white/70 border border-gray-200/80 group-hover:bg-[#e6fafa] group-hover:border-[#117479]/30 transition-colors duration-150" />
                        )}

                        <IconComponent
                          className={`relative z-10 w-4 h-4 transition-colors duration-150 ${
                            isActive ? "text-white" : "text-[#5F6A82] group-hover:text-[#117479]"
                          }`}
                        />
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showSearchSection && !isSearchPage && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  // Desktop only. On phones the same job is done by
                  // MobileSearchSheet, which doesn't have to fight a
                  // 60px-tall header for room.
                  className="hidden lg:block absolute top-20 shadow-2xl left-0 right-0 bg-white rounded-2xl p-3 md:p-4 overflow-visible z-50 border border-gray-100"
                >
                  {/* ── Activity Filter ──────────────────── */}
                  {activeFilter === "activity" && (
                    <div className="flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-0 w-full">
                      <div className="flex flex-col lg:flex-row lg:flex-1 lg:items-start gap-3 lg:gap-0">
                        <div
                          className={`flex flex-col gap-1 flex-1 min-w-0 relative px-3 py-2 rounded-xl transition-colors duration-200 ${showLocationDropdown ? "bg-[#F7F7F7]" : "hover:bg-[#F7F7F7]"}`}
                          ref={locationRef}
                        >
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Location</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Search location"
                            value={
                              selectedLocation === "Where are you going?" ? "" : selectedLocation
                            }
                            onChange={(e) => {
                              setSelectedLocation(e.target.value);
                              setShowLocationDropdown(true);
                            }}
                            onFocus={() => setShowLocationDropdown(true)}
                            className="w-full px-0.5 bg-transparent text-gray-900 font-semibold text-sm focus:outline-none placeholder:text-gray-300 placeholder:font-normal"
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
                          {searchErrors.location && (
                            <span className="absolute -bottom-2.5 left-3 text-red-500 text-[10px] font-medium text-left whitespace-nowrap">
                              {searchErrors.location}
                            </span>
                          )}
                        </div>
                        <div className="hidden lg:block w-px h-8 bg-gray-200/60 flex-shrink-0 self-center mt-1" />
                        <div
                          ref={calendarRef}
                          className={`flex flex-col gap-1 flex-1 min-w-0 relative px-3 py-2 rounded-xl transition-colors duration-200 ${showCalendar ? "bg-[#F7F7F7]" : "hover:bg-[#F7F7F7]"}`}
                        >
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Date</span>
                          </div>
                          <button
                            onClick={() => {
                              setShowCalendar(!showCalendar);
                              setShowLocationDropdown(false);
                              setShowGuestDropdown(false);
                            }}
                            className={`font-semibold text-sm ${checkInDate ? "text-gray-900" : "text-gray-300"} hover:text-gray-700 transition-colors text-left`}
                          >
                            {checkInDate
                              ? `${checkInDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} - ${checkOutDate ? checkOutDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : ""}`
                              : "Add date"}
                          </button>
                          {showCalendar && (
                            <CalendarDropdown
                              onSelect={handleDateRangeSelect}
                              onClose={() => setShowCalendar(false)}
                              selectedRange={{ start: checkInDate, end: checkOutDate }}
                            />
                          )}
                          {searchErrors.checkin && (
                            <span className="absolute -bottom-2.5 left-3 text-red-500 text-[10px] font-medium text-left whitespace-nowrap">
                              {searchErrors.checkin}
                            </span>
                          )}
                        </div>
                        <div className="hidden lg:block w-px h-8 bg-gray-200/60 flex-shrink-0 self-center mt-1" />
                        <div
                          className={`flex flex-col gap-1 flex-1 min-w-0 relative px-3 py-2 rounded-xl transition-colors duration-200 ${showActivityDropdown ? "bg-[#F7F7F7]" : "hover:bg-[#F7F7F7]"}`}
                          ref={activityRef}
                        >
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <StarIcon className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Activity</span>
                          </div>
                          <button
                            onClick={() => {
                              setShowActivityDropdown(!showActivityDropdown);
                              setShowLocationDropdown(false);
                              setShowCalendar(false);
                              setShowGuestDropdown(false);
                            }}
                            className={`${activityName !== "Tracking" ? "text-gray-900" : "text-gray-300"} font-semibold text-sm text-left hover:text-gray-700 transition-colors`}
                          >
                            {activityName !== "Tracking" ? activityName : "Select"}
                          </button>
                          {showActivityDropdown && (
                            <ActivityDropdown
                              onSelect={setActivityName}
                              onClose={() => setShowActivityDropdown(false)}
                            />
                          )}
                          {searchErrors.activity && (
                            <span className="absolute -bottom-2.5 left-3 text-red-500 text-[10px] font-medium text-left whitespace-nowrap">
                              {searchErrors.activity}
                            </span>
                          )}
                        </div>
                        <div className="hidden lg:block w-px h-8 bg-gray-200/60 flex-shrink-0 self-center mt-1" />
                        <div
                          className={`flex flex-col gap-1 flex-1 min-w-0 relative px-3 py-2 rounded-xl transition-colors duration-200 ${showGuestDropdown ? "bg-[#F7F7F7]" : "hover:bg-[#F7F7F7]"}`}
                          ref={guestRef}
                        >
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Users className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Guests</span>
                          </div>
                          <button
                            onClick={() => {
                              setShowGuestDropdown(!showGuestDropdown);
                              setShowLocationDropdown(false);
                              setShowCalendar(false);
                              setShowActivityDropdown(false);
                            }}
                            className={`${guestsConfirmed ? "text-gray-900" : "text-gray-300"} font-semibold text-sm text-left hover:text-gray-700 transition-colors`}
                          >
                            {guestsConfirmed
                              ? `${guests.adults + guests.children + guests.infants} guests`
                              : "Add"}
                          </button>
                          {showGuestDropdown && (
                            <GuestDropdown
                              guests={guests}
                              onUpdate={setGuests}
                              onClose={() => {
                                setShowGuestDropdown(false);
                                setGuestsConfirmed(true);
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex justify-center lg:flex-shrink-0 lg:ml-3 mt-3 lg:mt-1">
                        <Button
                          onClick={handleSearch}
                          className="bg-[#3BD9DA] hover:bg-[#2BC7C8] active:scale-95 text-white rounded-full h-11 w-11 transition-all duration-200 shadow-md hover:shadow-lg"
                          size="icon"
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ── CamperVan Filter ─────────────────── */}
                  {activeFilter === "camper-van" && (
                    <div className="flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-0 w-full">
                      <div className="flex flex-col lg:flex-row lg:flex-1 lg:items-start gap-3 lg:gap-0">
                        <div
                          className={`flex flex-col gap-1 flex-1 min-w-0 relative px-3 py-2 rounded-xl transition-colors duration-200 ${showLocationDropdown ? "bg-[#F7F7F7]" : "hover:bg-[#F7F7F7]"}`}
                          ref={locationRef}
                        >
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">From</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Search"
                            value={
                              selectedLocation === "Where are you going?" ? "" : selectedLocation
                            }
                            onChange={(e) => {
                              setSelectedLocation(e.target.value);
                              setShowLocationDropdown(true);
                            }}
                            onFocus={() => setShowLocationDropdown(true)}
                            className="w-full px-0.5 bg-transparent text-gray-900 font-semibold text-sm focus:outline-none placeholder:text-gray-300 placeholder:font-normal"
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
                          {searchErrors.location && (
                            <span className="absolute -bottom-2.5 left-3 text-red-500 text-[10px] font-medium text-left whitespace-nowrap">
                              {searchErrors.location}
                            </span>
                          )}
                        </div>
                        <div className="hidden lg:block w-px h-8 bg-gray-200/60 flex-shrink-0 self-center mt-1" />
                        <div
                          className={`flex flex-col gap-1 flex-1 min-w-0 relative px-3 py-2 rounded-xl transition-colors duration-200 ${showLocationToDropdown ? "bg-[#F7F7F7]" : "hover:bg-[#F7F7F7]"}`}
                          ref={locationToRef}
                        >
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">To</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Search"
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
                            className="w-full px-0.5 bg-transparent text-gray-900 font-semibold text-sm focus:outline-none placeholder:text-gray-300 placeholder:font-normal"
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
                          {searchErrors.locationTo && (
                            <span className="absolute -bottom-2.5 left-3 text-red-500 text-[10px] font-medium text-left whitespace-nowrap">
                              {searchErrors.locationTo}
                            </span>
                          )}
                        </div>
                        <div className="hidden lg:block w-px h-8 bg-gray-200/60 flex-shrink-0 self-center mt-1" />
                        <div className="relative flex flex-[2] items-start gap-0" ref={calendarRef}>
                          <div
                            className={`flex flex-col gap-1 flex-1 min-w-0 relative px-3 py-2 rounded-xl transition-colors duration-200 ${showCalendar ? "bg-[#F7F7F7]" : "hover:bg-[#F7F7F7]"}`}
                          >
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">Check in</span>
                            </div>
                            <button
                              onClick={() => {
                                setShowCalendar(!showCalendar);
                                setShowLocationDropdown(false);
                                setShowGuestDropdown(false);
                              }}
                              className={`font-semibold text-sm ${checkInDate ? "text-gray-900" : "text-gray-300"} hover:text-gray-700 transition-colors text-left`}
                            >
                              {checkInDate
                                ? checkInDate.toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                  })
                                : "Add date"}
                            </button>
                            {searchErrors.checkin && (
                              <span className="absolute -bottom-2.5 left-3 text-red-500 text-[10px] font-medium text-left whitespace-nowrap">
                                {searchErrors.checkin}
                              </span>
                            )}
                          </div>
                          <div className="hidden lg:block w-px h-8 bg-gray-200/60 flex-shrink-0 self-center mt-1" />
                          <div
                            ref={calendarToRef}
                            className={`flex flex-col gap-1 flex-1 min-w-0 relative px-3 py-2 rounded-xl transition-colors duration-200 ${showCalendar ? "bg-[#F7F7F7]" : "hover:bg-[#F7F7F7]"}`}
                          >
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">Check out</span>
                            </div>
                            <button
                              onClick={() => {
                                setShowCalendar(!showCalendar);
                                setShowLocationDropdown(false);
                                setShowGuestDropdown(false);
                              }}
                              className={`font-semibold text-sm ${checkOutDate ? "text-gray-900" : "text-gray-300"} hover:text-gray-700 transition-colors text-left`}
                            >
                              {checkOutDate
                                ? checkOutDate.toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                  })
                                : "Add date"}
                            </button>
                            {searchErrors.checkout && (
                              <span className="absolute -bottom-2.5 left-3 text-red-500 text-[10px] font-medium text-left whitespace-nowrap">
                                {searchErrors.checkout}
                              </span>
                            )}
                          </div>
                          {showCalendar && (
                            <CalendarDropdown
                              onSelect={handleDateRangeSelect}
                              onClose={() => setShowCalendar(false)}
                              selectedRange={{ start: checkInDate, end: checkOutDate }}
                            />
                          )}
                        </div>
                        <div className="hidden lg:block w-px h-8 bg-gray-200/60 flex-shrink-0 self-center mt-1" />
                        <div
                          className={`flex flex-col gap-1 flex-1 min-w-0 relative px-3 py-2 rounded-xl transition-colors duration-200 ${showGuestDropdown ? "bg-[#F7F7F7]" : "hover:bg-[#F7F7F7]"}`}
                          ref={guestRef}
                        >
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Users className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Guests</span>
                          </div>
                          <button
                            onClick={() => {
                              setShowGuestDropdown(!showGuestDropdown);
                              setShowLocationDropdown(false);
                              setShowCalendar(false);
                            }}
                            className={`${guestsConfirmed ? "text-gray-900" : "text-gray-300"} font-semibold text-sm text-left hover:text-gray-700 transition-colors`}
                          >
                            {guestsConfirmed
                              ? `${guests.adults + guests.children + guests.infants} guests`
                              : "Add"}
                          </button>
                          {showGuestDropdown && (
                            <GuestDropdown
                              guests={guests}
                              onUpdate={setGuests}
                              onClose={() => {
                                setShowGuestDropdown(false);
                                setGuestsConfirmed(true);
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex justify-center lg:flex-shrink-0 lg:ml-3 mt-3 lg:mt-1">
                        <Button
                          onClick={handleSearch}
                          className="bg-[#3BD9DA] hover:bg-[#2BC7C8] active:scale-95 text-white rounded-full h-11 w-11 transition-all duration-200 shadow-md hover:shadow-lg"
                          size="icon"
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ── Unique Stays Filter ──────────────── */}
                  {activeFilter === "unique-stays" && (
                    <div className="flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-0 w-full">
                      <div className="flex flex-col lg:flex-row lg:flex-1 lg:items-start gap-3 lg:gap-0">
                        <div
                          className={`flex flex-col gap-1 flex-1 min-w-0 relative px-3 py-2 rounded-xl transition-colors duration-200 ${showLocationDropdown ? "bg-[#F7F7F7]" : "hover:bg-[#F7F7F7]"}`}
                          ref={locationRef}
                        >
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Location</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Search location"
                            value={
                              selectedLocation === "Where are you going?" ? "" : selectedLocation
                            }
                            onChange={(e) => {
                              setSelectedLocation(e.target.value);
                              setShowLocationDropdown(true);
                            }}
                            onFocus={() => setShowLocationDropdown(true)}
                            className="w-full px-0.5 bg-transparent text-gray-900 font-semibold text-sm focus:outline-none placeholder:text-gray-300 placeholder:font-normal"
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
                          {searchErrors.location && (
                            <span className="absolute -bottom-2.5 left-3 text-red-500 text-[10px] font-medium text-left whitespace-nowrap">
                              {searchErrors.location}
                            </span>
                          )}
                        </div>
                        <div className="hidden lg:block w-px h-8 bg-gray-200/60 flex-shrink-0 self-center mt-1" />
                        <div className="relative flex flex-[2] items-start gap-0" ref={calendarRef}>
                          <div
                            className={`flex flex-col gap-1 flex-1 min-w-0 relative px-3 py-2 rounded-xl transition-colors duration-200 ${showCalendar ? "bg-[#F7F7F7]" : "hover:bg-[#F7F7F7]"}`}
                          >
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">Check in</span>
                            </div>
                            <button
                              onClick={() => {
                                setShowCalendar(!showCalendar);
                                setShowLocationDropdown(false);
                                setShowGuestDropdown(false);
                              }}
                              className={`font-semibold text-sm ${checkInDate ? "text-gray-900" : "text-gray-300"} hover:text-gray-700 transition-colors text-left`}
                            >
                              {checkInDate
                                ? checkInDate.toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                  })
                                : "Add date"}
                            </button>
                            {searchErrors.checkin && (
                              <span className="absolute -bottom-2.5 left-3 text-red-500 text-[10px] font-medium text-left whitespace-nowrap">
                                {searchErrors.checkin}
                              </span>
                            )}
                          </div>
                          <div className="hidden lg:block w-px h-8 bg-gray-200/60 flex-shrink-0 self-center mt-1" />
                          <div
                            ref={calendarToRef}
                            className={`flex flex-col gap-1 flex-1 min-w-0 relative px-3 py-2 rounded-xl transition-colors duration-200 ${showCalendar ? "bg-[#F7F7F7]" : "hover:bg-[#F7F7F7]"}`}
                          >
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">Check out</span>
                            </div>
                            <button
                              onClick={() => {
                                setShowCalendar(!showCalendar);
                                setShowLocationDropdown(false);
                                setShowGuestDropdown(false);
                              }}
                              className={`font-semibold text-sm ${checkOutDate ? "text-gray-900" : "text-gray-300"} hover:text-gray-700 transition-colors text-left`}
                            >
                              {checkOutDate
                                ? checkOutDate.toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                  })
                                : "Add date"}
                            </button>
                            {searchErrors.checkout && (
                              <span className="absolute -bottom-2.5 left-3 text-red-500 text-[10px] font-medium text-left whitespace-nowrap">
                                {searchErrors.checkout}
                              </span>
                            )}
                          </div>
                          {showCalendar && (
                            <CalendarDropdown
                              onSelect={handleDateRangeSelect}
                              onClose={() => setShowCalendar(false)}
                              selectedRange={{ start: checkInDate, end: checkOutDate }}
                            />
                          )}
                        </div>
                        <div className="hidden lg:block w-px h-8 bg-gray-200/60 flex-shrink-0 self-center mt-1" />
                        <div
                          className={`flex flex-col gap-1 flex-1 min-w-0 relative px-3 py-2 rounded-xl transition-colors duration-200 ${showGuestDropdown ? "bg-[#F7F7F7]" : "hover:bg-[#F7F7F7]"}`}
                          ref={guestRef}
                        >
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Users className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Guests</span>
                          </div>
                          <button
                            onClick={() => {
                              setShowGuestDropdown(!showGuestDropdown);
                              setShowLocationDropdown(false);
                              setShowCalendar(false);
                            }}
                            className={`${guestsConfirmed ? "text-gray-900" : "text-gray-300"} font-semibold text-sm text-left hover:text-gray-700 transition-colors`}
                          >
                            {guestsConfirmed
                              ? `${guests.adults + guests.children + guests.infants} guests`
                              : "Add"}
                          </button>
                          {showGuestDropdown && (
                            <GuestDropdown
                              guests={guests}
                              onUpdate={setGuests}
                              onClose={() => {
                                setShowGuestDropdown(false);
                                setGuestsConfirmed(true);
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex justify-center lg:flex-shrink-0 lg:ml-3 mt-3 lg:mt-1">
                        <Button
                          onClick={handleSearch}
                          className="bg-[#3BD9DA] hover:bg-[#2BC7C8] active:scale-95 text-white rounded-full h-11 w-11 transition-all duration-200 shadow-md hover:shadow-lg"
                          size="icon"
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center flex-shrink-0">
              {user ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <button
                    className={`max-md:hidden md:flex items-center gap-2 rounded-full px-5 h-10 text-sm font-semibold transition-all duration-300 ease-in-out ${"bg-[#3BD9DA] text-white hover:bg-[#2BC7C8] shadow-md hover:shadow-lg hover:-translate-y-0.5"}`}
                    onClick={() => navigate("/onboarding/service-selection")}
                  >
                    <CgLoadbarDoc size={16} className="shrink-0" />
                    List your offering
                  </button>
                  <UserDropdown
                    onSwitchToVendor={() => {
                      updateUserType("vendor");
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
                    className={`hidden md:flex items-center gap-2 rounded-full px-5 h-10 text-sm font-semibold transition-all duration-300 ease-in-out ${"bg-[#3BD9DA] text-white hover:bg-[#2BC7C8] shadow-md hover:shadow-lg hover:-translate-y-0.5"}`}
                    onClick={() => navigate("/onboarding/service-selection")}
                  >
                    <CgLoadbarDoc size={16} className="shrink-0" />
                    List your offering
                  </button>
                  {/* Yields to the search pill on a phone — Sign up is one tap
                      away in the menu, and the pill is the money action. */}
                  <button
                    onClick={() => navigate("/register")}
                    className={`rounded-full px-4 md:px-5 h-9 text-[13px] md:text-sm font-semibold whitespace-nowrap bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white shadow-sm hover:shadow-md transition-all duration-200 ${
                      showMobileSearchPill ? "hidden lg:block" : ""
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
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                className={`lg:hidden ml-3 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-500 ease-in-out ${
                  // isScrolled alone left this white-on-white on /search — there's
                  // no dark hero photo there to justify a white icon, ever.
                  // onDarkHeader already excludes /search for the logo; reuse it.
                  onDarkHeader ? "text-white hover:bg-white/15" : "text-gray-800 hover:bg-gray-100"
                }`}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Tap-anywhere-to-close scrim */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 top-16 bg-black/30"
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                // `relative` so it paints above the fixed scrim that precedes it.
                className="lg:hidden relative border-t border-gray-100 bg-white shadow-lg max-h-[calc(100svh-4rem)] overflow-y-auto overscroll-contain"
              >
                <div className="px-4 py-4 space-y-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                  <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Browse
                  </p>
                  {navTabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleMobileTabClick(tab.id)}
                        className={`w-full text-left px-4 py-3 min-h-[48px] text-sm font-medium rounded-xl transition-colors flex items-center gap-3 ${
                          activeFilter === tab.id
                            ? "bg-[#0a1c1c] text-white"
                            : "text-[#0a1c1c] active:bg-[#F7F7F7]"
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        {tab.label}
                      </button>
                    );
                  })}

                  <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate("/onboarding/service-selection");
                      }}
                      className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-[#3BD9DA] text-white text-sm font-semibold active:scale-[0.98] transition-transform"
                    >
                      <CgLoadbarDoc size={16} className="shrink-0" />
                      List your offering
                    </button>
                    {!user && (
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate("/login");
                        }}
                        className="w-full h-12 rounded-full border border-gray-200 text-[#0a1c1c] text-sm font-semibold active:bg-gray-50"
                      >
                        Log in
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="h-0" />
    </>
  );
}
