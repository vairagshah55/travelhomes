import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import UserDropdown from "./UserDropdown";
import { Bell, Menu, MessageCircle, MapPin, Calendar, Users, Search, X, Star } from "lucide-react";
import { Sidebar } from "./Navigation";
import { ThemeToggle } from "./ThemeToggle";
import ProfileDropdown from "./ProfileDropdown";
import ChangePasswordModal from "./ChangePasswordModal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import LogoWebsite, { HomeLogoWebsite } from "./ui/LogoWebsite";
import { useSearchParams } from "react-router-dom";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { CgLoadbarDoc } from "react-icons/cg";
import { DateRange } from "react-date-range";
import { notificationsApi } from "@/lib/api";

interface HeaderProps {
  variant?: "transparent" | "white";
  className?: string;
  callbackFun : any;
  onNavigate : any;
}

type FilterType = "camper-van" | "unique-stays" | "activity";

export function DashboardHeader({ Headtitle }: { Headtitle: string }) {
  const navigate = useNavigate();
  const { updateUserType } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await notificationsApi.list(true, 1, 'vendor');
        if (res.success) {
          setUnreadCount(res.totalUnread);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = () => {
    navigate("/notifications");
  };

  const handleSwitchToUser = async () => {
    await updateUserType('user');
    navigate("/user-profile");
  };

  return (
    <header
      className="
        flex items-center justify-between
        px-4 py-3 sm:px-6 lg:px-8
        bg-dashboard-bg dark:bg-gray-900
        border-b border-gray-200 dark:border-gray-700
        transition-all
        sticky top-0 z-30
      "
    >
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden dark:bg-black dark:text-white"
            >
              <Menu size={22} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Header Title */}
        <h1
          className="
            text-lg sm:text-xl lg:text-2xl
            font-bold text-dashboard-heading dark:text-white
            tracking-tight font-geist
          "
        >
          {Headtitle}
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
        {/* Mobile Chat Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="
            lg:hidden p-2
            hover:bg-gray-100 dark:hover:bg-gray-800
            rounded-lg transition-colors
          "
        >
          <MessageCircle size={20} className="text-dashboard-primary" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNotificationClick}
          className={`
            relative bg-white dark:bg-gray-800
            rounded-full border border-gray-200 dark:border-gray-700
            shadow-sm h-9 w-9
            hover:bg-gray-50 dark:hover:bg-gray-700
            transition-all
            ${unreadCount > 0 ? 'notification-pulse' : ''}
          `}
        >
          <Bell
            size={20}
            className={`
              text-gray-600 dark:text-gray-300
              hover:text-dashboard-primary transition-colors
              ${unreadCount > 0 ? 'animate-bounce' : ''}
            `}
          />
          {unreadCount > 0 && (
            <span
              className="
                absolute -top-1 -right-1 h-4 w-4
                bg-red-500 text-white text-[8px] flex items-center justify-center
                rounded-full border-2 border-white dark:border-gray-800
              "
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Profile Dropdown */}
        <ProfileDropdown
          onViewAsUserClick={() => console.log("View As User clicked")}
          onSwitchToUserClick={handleSwitchToUser}
          onBusinessDetailsClick={() => navigate("/profile?tab=business")}
          onPersonalDetailsClick={() => navigate("/profile?tab=personal")}
          onChangePasswordClick={() => setIsChangePasswordOpen(true)}
          onLogoutClick={() => console.log("Logout clicked")}
        />
        
        <ChangePasswordModal 
          isOpen={isChangePasswordOpen} 
          onOpenChange={setIsChangePasswordOpen} 
        />
      </div>
    </header>
  );
}

export function HomeHeader({ variant = "white", className = "", callbackFun = () => {}, onNavigate }: HeaderProps) {
  const { user, updateUserType } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
 const [activeFilterHeader, setActiveFilterHeader] = useState<FilterType>(
    (searchParams.get("filter") as FilterType) || "unique-stays",
  );
  const isTransparent = variant === "transparent";

  const [showFilters, setShowFilters] = useState(false);
  const [showHeaderSearchBar, setShowHeaderSearchBar] = useState(false);
  
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedLocationTo, setSelectedLocationTo] = useState("");
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState({
    adults: 0,
    children: 0,
    infants: 0,
    pet: 0
  });
  const [activityName, setActivityName] = useState("Tracking");
  
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showLocationToDropdown, setShowLocationToDropdown] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);

  const locationRef = useRef<HTMLDivElement>(null);
  const locationToRef = useRef(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) setShowFilters(true);
      else setShowFilters(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

    if (showHeaderSearchBar) {
      document.addEventListener("click", handleClickOutside, { capture: true });
    }
    return () =>
      document.removeEventListener("click", handleClickOutside, {
        capture: true,
      });
  }, [showHeaderSearchBar]);

  const handleDateRangeSelect = (range: { start: Date; end: Date }) => {
    setCheckInDate(range.start);
    setCheckOutDate(range.end);
  };

  const handleHeaderSearch = () => {
    const params = new URLSearchParams({
      filter: activeFilterHeader,
      location: selectedLocation,
      checkin: checkInDate ? checkInDate.toISOString() : "",
      checkout: checkOutDate ? checkOutDate.toISOString() : "",
      guests: (guests.adults + guests.children + guests.infants).toString(),
      activity: activityName,
    });
    navigate(`/search?${params.toString()}`);
    setShowHeaderSearchBar(false);
  };

  const handleSwitchToVendor = async () => {
    await updateUserType('vendor');
    navigate("/dashboard");
  };
  
  // useEffect(() => {
  //   callbackFun(activeFilterHeader);
  // }, [callbackFun]);
 
  useEffect(() => {
  if (typeof callbackFun === 'function') {
    callbackFun(activeFilterHeader);
  }
}, [callbackFun, activeFilterHeader]);

  
  return (
  <>
      {/* Main Header */}
      <nav className={`flex flex-col items-center bg-transparent justify-between w-full md:px-20 py-4 z-50 transition-all duration-300 ${showHeaderSearchBar ? 'bg-white dark:bg-gray-900' : ''}`}
        // className={`flex items-center justify-between w-full md:px-20   py-4 z-50
        //   ${
        //     !user && isTransparent
        //       ? "bg-transparent"
        //       : "bg-white dark:bg-black dark:text-white"
        //   } ${className}`}
      >
        <div className="flex items-center bg-transparent justify-between w-full">
          {/* Logo */}
          <div className="w-40 flex-shrink-0">
            <HomeLogoWebsite />
          </div>

   {/* Sticky Filter Bar (only after scroll) */}
     <div className="w-full">   {showFilters && !showHeaderSearchBar && (
          <div className="max-md:hidden sticky top-0 z-30 w-full transition-all duration-300 animate-fade-in">
            <div className="flex flex-wrap items-center gap-4 justify-center">
              <FilterButton
                icon={CamperVanIcon}
                label="Camper Van"
                active={activeFilterHeader === "camper-van"}
                onClick={() => {setActiveFilterHeader("camper-van"), setShowHeaderSearchBar(true)}}
              />
              <FilterButton
                icon={HomeIcon}
                label="Unique Stays"
                active={activeFilterHeader === "unique-stays"}
                onClick={() => {setActiveFilterHeader("unique-stays"), setShowHeaderSearchBar(true)}}
              />
              <FilterButton
                icon={RocketIcon}
                label="Activity"
                active={activeFilterHeader === "activity"}
                onClick={() => {setActiveFilterHeader("activity"), setShowHeaderSearchBar(true)}}
              />
            </div>
          </div>
        )}</div>
          {/* Nav Items */}
          <div className="hidden lg:flex items-center gap-10 flex-1 justify-center" />

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className={`hidden md:flex ${
                isTransparent
                  ? "bg-white/90 dark:hover:bg-gray-500 backdrop-blur-sm border-gray-300 text-black hover:bg-white/100"
                  : "bg-white/90 backdrop-blur-sm dark:hover:bg-gray-500 border-gray-300 text-black hover:bg-gray-50"
              } rounded-full px-4 md:px-4 h-10`}
              onClick={() => navigate("/onboarding/service-selection")}
            >
              <div className="flex items-center gap-2">
              <CgLoadbarDoc size={20}/>
                <span className="text-sm font-medium">List your offering</span>
              </div>
            </Button>

            {user ? (
              <UserDropdown onSwitchToVendor={handleSwitchToVendor} />
            ) : (
              <Link to="/register">
                <Button
                  className={`${
                    isTransparent
                      ? "bg-white/90 backdrop-blur-sm text-black hover:bg-white/100"
                      : "bg-black text-white hover:bg-gray-800"
                  } rounded-full px-4 md:px-6 h-10`}
                >
                  Register
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Expanded Search Bar */}
        {showHeaderSearchBar && (
          <div className="w-full max-lg:hidden mt-4 mb-2 animate-in slide-in-from-top duration-300">
            <div className="bg-gray-100 rounded-2xl p-4 relative overflow-visible">
              {/* Activity Filter */}
              {activeFilterHeader === "activity" && (
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 md:gap-6 lg:gap-0">
                  <div className="flex flex-col lg:flex-row lg:flex-1 lg:items-center gap-3 md:gap-6 lg:gap-6">
                    {/* Location Field */}
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
                          value={selectedLocation === "Where are you going?" ? "" : selectedLocation}
                          onChange={(e) => {
                            setSelectedLocation(e.target.value);
                            setShowLocationDropdown(true);
                          }}
                          onFocus={() => setShowLocationDropdown(true)}
                          className="w-full px-3 bg-transparent text-black font-medium text-lg focus:outline-none placeholder:text-gray-400"
                        />
                        {showLocationDropdown && (
                          <HeaderLocationDropdown
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
                        className="font-semibold text-[16px] text-black hover:text-gray-700 transition-colors text-left"
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
                        <HeaderCalendarDropdown
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
                      <button
                        onClick={() => {
                          setShowActivityDropdown(!showActivityDropdown);
                          setShowLocationDropdown(false);
                          setShowCalendar(false);
                          setShowGuestDropdown(false);
                        }}
                        className="text-black font-medium text-lg md:text-lg text-left hover:text-gray-700 transition-colors"
                      >
                        {activityName}
                      </button>
                      {showActivityDropdown && (
                        <HeaderActivityDropdown
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
                        className="text-black font-medium text-lg md:text-lg text-left hover:text-gray-700 transition-colors"
                      >
                        {guests.adults + guests.children + guests.infants || "Add guests"}
                      </button>
                      {showGuestDropdown && (
                        <HeaderGuestDropdown
                          guests={guests}
                          onUpdate={setGuests}
                          onClose={() => setShowGuestDropdown(false)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center lg:flex-shrink-0 lg:ml-6 mt-4 lg:mt-0 gap-2">
                    <Button
                      onClick={() => setShowHeaderSearchBar(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-black rounded-full h-12 w-12 lg:h-14 lg:w-14"
                      size="icon"
                    >
                      <X className="w-5 h-5 lg:w-6 lg:h-6" />
                    </Button>
                    <Button
                      onClick={handleHeaderSearch}
                      className="bg-black hover:bg-gray-800 text-white rounded-full h-12 w-12 lg:h-14 lg:w-14"
                      size="icon"
                    >
                      <Search className="w-5 h-5 lg:w-6 lg:h-6" />
                    </Button>
                  </div>
                </div>
              )}

              {/* CamperVan and Unique Stays sections - similar structure */}
              {(activeFilterHeader === "camper-van" || activeFilterHeader === "unique-stays") && (
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between w-full">
                  <div className="flex flex-col gap-6 lg:flex-row lg:flex-1">
                    {/* Location From */}
                    <div
                      className="flex flex-col gap-1 md:gap-2 flex-1 min-w-0 relative p-2 md:p-0"
                      ref={locationRef}
                    >
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-xs md:text-sm">{activeFilterHeader === "camper-van" ? "Location From" : "Location"}</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search location"
                          value={selectedLocation === "Where are you going?" ? "" : selectedLocation}
                          onChange={(e) => {
                            setSelectedLocation(e.target.value);
                            setShowLocationDropdown(true);
                          }}
                          onFocus={() => setShowLocationDropdown(true)}
                          className="w-full bg-transparent px-3 placeholder:text-md text-black font-medium text-lg text-left hover:text-gray-700 transition-colors focus:outline-none placeholder:text-gray-400"
                        />
                        {showLocationDropdown && (
                          <HeaderLocationDropdown
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

                    {activeFilterHeader === "camper-van" && (
                      <>
                        <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

                        {/* Location To */}
                        <div
                          className="flex flex-col gap-1 md:gap-2 flex-1 min-w-0 relative p-2 md:p-0"
                          ref={locationToRef}
                        >
                          <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-xs md:text-sm">Location To</span>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search location"
                              value={selectedLocationTo === "Where are you going?" ? "" : selectedLocationTo}
                              onChange={(e) => {
                                setSelectedLocationTo(e.target.value);
                                setShowLocationToDropdown(true);
                              }}
                              onFocus={() => setShowLocationToDropdown(true)}
                              className="w-full bg-transparent px-3 text-black font-medium text-lg text-left hover:text-gray-700 transition-colors focus:outline-none placeholder:text-gray-400"
                            />
                            {showLocationToDropdown && (
                              <HeaderLocationDropdown
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
                      </>
                    )}

                    <div className="hidden lg:block w-px h-10 bg-gray-300"></div>

                    {/* Check-in/Checkout */}
                    <div
                      ref={calendarRef}
                      className="flex flex-col gap-2 flex-1 relative min-w-0"
                    >
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-5 h-5" />
                        <span className="text-sm">{activeFilterHeader === "camper-van" ? "Check in" : "Check in"}</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowCalendar(!showCalendar);
                          setShowLocationDropdown(false);
                          setShowGuestDropdown(false);
                        }}
                        className="font-semibold text-[16px] text-black hover:text-gray-700 transition-colors text-left"
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
                        <HeaderCalendarDropdown
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
                        className="font-semibold text-[16px] text-black hover:text-gray-700 transition-colors text-left"
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
                        className="text-black font-medium text-lg md:text-lg text-left hover:text-gray-700 transition-colors"
                      >
                        {(guests.adults + guests.children + guests.infants + guests.pet > 0 &&
                          `${guests.adults + guests.children + guests.infants + guests.pet} guests`) ||
                          "Add guests"}
                      </button>
                      {showGuestDropdown && (
                        <HeaderGuestDropdown
                          guests={guests}
                          onUpdate={setGuests}
                          onClose={() => setShowGuestDropdown(false)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center lg:ml-6 mt-4 lg:mt-0 gap-2">
                    <Button
                      onClick={() => setShowHeaderSearchBar(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-black rounded-full h-12 w-12 lg:h-14 lg:w-14"
                      size="icon"
                    >
                      <X className="w-5 h-5 lg:w-6 lg:h-6" />
                    </Button>
                    <Button
                      onClick={handleHeaderSearch}
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
        )}
      </nav>
     
    </>
  );
}

export function HeaderWithFilters({ variant = "white", className = "", callbackFun = () => {}, onNavigate }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
 const [activeFilterHeader, setActiveFilterHeader] = useState<FilterType>(
    (searchParams.get("filter") as FilterType) || "unique-stays",
  );
  const isTransparent = variant === "transparent";

  const [showFilters, setShowFilters] = useState(false);

 useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) setShowFilters(true);
      else setShowFilters(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSwitchToVendor = () => navigate("/dashboard");
  
  // useEffect(() => {
  //   callbackFun(activeFilterHeader);
  // }, [callbackFun]);
 
  useEffect(() => {
  if (typeof callbackFun === 'function') {
    callbackFun(activeFilterHeader);
  }
}, [callbackFun, activeFilterHeader]);

  
  return (
  <>
      {/* Main Header */}
      <nav
        className={`flex items-center bg-white justify-between w-full  md:px-20   py-1 z-30
          ${
            !user && isTransparent
              ? "bg-transparent"
              : "bg-white dark:bg-black dark:text-white"
          } ${className}`}
      >
        {/* Logo */}
        <div className="w-40 flex-shrink-0">
          <LogoWebsite />
        </div>

 {/* Sticky Filter Bar (only after scroll) */}
   <div className="w-full">   {showFilters && (
        <div className="max-md:hidden sticky top-0 z-30 w-full transition-all duration-300 animate-fade-in">
          <div className="flex flex-wrap items-center gap-4 justify-center">
            <FilterButton
              icon={CamperVanIcon}
              label="Camper Van"
              active={activeFilterHeader === "camper-van"}
              onClick={() => {setActiveFilterHeader("camper-van"),onNavigate("Searchbar")}}
            />
            <FilterButton
              icon={HomeIcon}
              label="Unique Stays"
              active={activeFilterHeader === "unique-stays"}
              onClick={() => {setActiveFilterHeader("unique-stays"),onNavigate("Searchbar")}}
            />
            <FilterButton
              icon={RocketIcon}
              label="Activity"
              active={activeFilterHeader === "activity"}
              onClick={() => {setActiveFilterHeader("activity"),onNavigate("Searchbar")}}
            />
          </div>
        </div>
      )}</div>
        {/* Nav Items */}
        <div className="hidden lg:flex items-center gap-10 flex-1 justify-center" />

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className={`hidden md:flex ${
              isTransparent
                ? "bg-white/90 dark:hover:bg-gray-500 backdrop-blur-sm border-gray-300 text-black hover:bg-white/100"
                : "bg-white/90 backdrop-blur-sm dark:hover:bg-gray-500 border-gray-300 text-black hover:bg-gray-50"
            } rounded-full px-4 md:px-4 h-10`}
            onClick={() => navigate("/onboarding/service-selection")}
          >
            <div className="flex items-center gap-2">
            <CgLoadbarDoc size={20}/>
              <span className="text-sm font-medium">List your offering</span>
            </div>
          </Button>

          {user ? (
            <UserDropdown onSwitchToVendor={handleSwitchToVendor} />
          ) : (
            <Link to="/register">
              <Button
                className={`${
                  isTransparent
                    ? "bg-white/90 backdrop-blur-sm text-black hover:bg-white/100"
                    : "bg-black text-white hover:bg-gray-800"
                } rounded-full px-4 md:px-6 h-10`}
              >
                Register
              </Button>
            </Link>
          )}
        </div>
      </nav>

     
    </>
  );
}
function Header({ variant = "white", className = "", callbackFun = () => {}, onNavigate }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
 const [activeFilterHeader, setActiveFilterHeader] = useState<FilterType>(
    (searchParams.get("filter") as FilterType) || "unique-stays",
  );
  const isTransparent = variant === "transparent";

  const [showFilters, setShowFilters] = useState(false);

 useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) setShowFilters(true);
      else setShowFilters(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSwitchToVendor = () => navigate("/dashboard");
  
  // useEffect(() => {
  //   callbackFun(activeFilterHeader);
  // }, [callbackFun]);
 
  useEffect(() => {
  if (typeof callbackFun === 'function') {
    callbackFun(activeFilterHeader);
  }
}, [callbackFun, activeFilterHeader]);

  
  return (
  <>
      {/* Main Header */}
      <nav
        className={`flex items-center bg-white justify-between  md:px-10   py-1 z-30
          ${
            !user && isTransparent
              ? "bg-transparent"
              : "bg-white dark:bg-black dark:text-white"
          } ${className}`}
      >
        {/* Logo */}
        <div className="w-40 flex-shrink-0">
          <LogoWebsite />
        </div>

 
        {/* Nav Items */}
        <div className="hidden lg:flex items-center gap-10 flex-1 justify-center" />

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className={`hidden md:flex ${
              isTransparent
                ? "bg-white/90 dark:hover:bg-gray-500 backdrop-blur-sm border-gray-300 text-black hover:bg-white/100"
                : "bg-white/90 backdrop-blur-sm dark:hover:bg-gray-500 border-gray-300 text-black hover:bg-gray-50"
            } rounded-full px-4 md:px-4 h-10`}
            onClick={() => navigate("/onboarding/service-selection")}
          >
            <div className="flex items-center gap-2">
            <CgLoadbarDoc size={20}/>
              <span className="text-sm font-medium">List your offering</span>
            </div>
          </Button>

          {user ? (
            <UserDropdown onSwitchToVendor={handleSwitchToVendor} />
          ) : (
            <Link to="/register">
              <Button
                className={`${
                  isTransparent
                    ? "bg-white/90 backdrop-blur-sm text-black hover:bg-white/100"
                    : "bg-black text-white hover:bg-gray-800"
                } rounded-full px-4 md:px-6 h-10`}
              >
                Register
              </Button>
            </Link>
          )}
        </div>
      </nav>

     
    </>
  );
}

function FilterButton({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 max-md:gap-1 px-4 py-2 rounded-full transition-colors ${
        active
          ? "bg-black dark:bg-white dark:text-black text-white border border-black"
          : "bg-white/10 text-gray-900 dark:bg-black dark:text-white hover:bg-gray-200 border border-gray-200"
      }`}
    >
      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
        <Icon className="w-4 h-4 text-black" />
      </div>
      <span className="text-sm font-medium capitalize">{label}</span>
    </button>
  );
}

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

function HeaderLocationDropdown({
  searchQuery,
  onSelect,
  onClose,
}: {
  searchQuery: string;
  onSelect: (location: string) => void;
  onClose: () => void;
}) {
  const locations = [
    "Goa",
    "Kerala",
    "Delhi",
    "Mumbai",
    "Bangalore",
    "Chennai",
    "Pune",
    "Hyderabad",
    "Jaipur",
    "Kolkata",
  ];

  const filteredLocations = locations.filter((location) =>
    location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="absolute max-h-80 overflow-y-scroll scrollbar-hide top-full left-0 mt-2 w-full bg-white rounded-3xl shadow-lg p-4 z-[9999] border border-gray-200">
      {filteredLocations.length > 0 ? (
        filteredLocations.map((location) => (
          <button
            key={location}
            onClick={() => {
              onSelect(location);
              onClose();
            }}
            className="block w-full text-left px-4 py-2 rounded-md text-gray-800 hover:bg-gray-100 text-sm"
          >
            {location}
          </button>
        ))
      ) : (
        <div className="px-4 py-2 text-gray-500 text-sm">No results found</div>
      )}
    </div>
  );
}

function HeaderGuestDropdown({
  guests,
  onUpdate,
  onClose,
}: {
  guests: { adults: number; children: number; infants: number; pet: number };
  onUpdate: (guests: {
    adults: number;
    children: number;
    infants: number;
    pet: number
  }) => void;
  onClose: () => void;
}) {
  const updateGuests = (
    type: "adults" | "children" | "infants" | "pet",
    increment: boolean
  ) => {
    const current = guests[type] || 0; 

    onUpdate({
      ...guests,
      [type]: increment ? current + 1 : Math.max(0, current - 1),
    });
  };

  return (
    <div className="absolute top-full left-0 mt-2 w-[300px] bg-white rounded-xl shadow-xl z-[9999] border border-gray-200  p-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <div className="font-medium text-[16px] text-left text-black">Adults</div>
            <div className="text-sm text-gray-500">Ages 13 or above</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateGuests("adults", false)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
              disabled={guests.adults <= 1}
            >
              -
            </button>
            <span className="w-8 text-center text-black">{guests.adults}</span>
            <button
              onClick={() => updateGuests("adults", true)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <div className="font-medium text-black">Children</div>
            <div className="text-sm text-gray-500">Ages 2-12</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateGuests("children", false)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
              disabled={guests.children <= 0}
            >
              -
            </button>
            <span className="w-8 text-center text-black">
              {guests.children}
            </span>
            <button
              onClick={() => updateGuests("children", true)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <div className="font-medium text-black">Infants</div>
            <div className="text-sm text-gray-500">Under 2</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateGuests("infants", false)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
              disabled={guests.infants <= 0}
            >
              -
            </button>
            <span className="w-8 text-center text-black">{guests.infants}</span>
            <button
              onClick={() => updateGuests("infants", true)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <div className="font-medium text-black">Pet</div>
            <div className="text-sm text-gray-500">Under 2</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateGuests("pet", false)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
              disabled={guests.pet <= 0}
            >
              -
            </button>
            <span className="w-8 text-center text-black">{guests.pet}</span>
            <button
              onClick={() => updateGuests("pet", true)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
            >
              +
            </button>
          </div>
        </div>
        
        <Button
          onClick={onClose}
          className="w-full bg-black text-white rounded-full py-3 hover:bg-gray-800 transition-colors"
        >
          Done
        </Button>
      </div>
    </div>
  );
}

function HeaderActivityDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (activity: string) => void;
  onClose: () => void;
}) {
  const activities = [
    "Tracking",
    "Hiking",
    "Camping",
    "Photography",
    "Bird Watching",
  ];

  return (
    <div className="absolute top-full left-0 mt-2 w-full max-w-sm bg-white rounded-3xl shadow-lg p-6 z-[9999] min-w-[300px]">
      <div className="flex items-center justify-between mb-6 bg-gray-100 rounded-full p-2">
        <div className="flex items-center gap-4 px-4 flex-1">
          <Search className="w-4 h-4 text-gray-600" />
          <input
            type="text"
            placeholder="Search activity"
            className="flex-1 bg-transparent text-gray-800 placeholder:text-gray-600 text-sm outline-none"
          />
        </div>
        <button className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
          <Search className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="space-y-5">
        {activities.map((activity) => (
          <div key={activity} className="flex items-center gap-3">
            <div className="flex-1 px-3">
              <button
                onClick={() => {
                  onSelect(activity);
                  onClose();
                }}
                className="text-left text-black text-base font-normal hover:text-gray-600 transition-colors w-full"
              >
                {activity}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeaderCalendarDropdown({
  onClose,
  onSelect,
  selectedRange,
}: {
  onClose: () => void;
  onSelect: (range: { start: Date; end: Date }) => void;
  selectedRange: {
    start: Date | null;
    end: Date | null;
  };
}) {
  const [localRange, setLocalRange] = React.useState({
    start: selectedRange.start || new Date(),
    end: selectedRange.end || new Date(),
  });

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-lg z-[9999] border border-gray-200 p-4">
      <DateRange
        ranges={[
          {
            startDate: localRange.start,
            endDate: localRange.end,
            key: "selection",
          },
        ]}
        onChange={(item: any) => {
          setLocalRange({
            start: item.selection.startDate,
            end: item.selection.endDate,
          });
        }}
        maxDate={new Date()}
        rangeColors={["#000"]}
      />
      <div className="flex gap-2 mt-4 justify-end">
        <Button
          onClick={onClose}
          className="bg-gray-200 hover:bg-gray-300 text-black rounded-full px-6 py-2"
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            onSelect(localRange);
            onClose();
          }}
          className="bg-black hover:bg-gray-800 text-white rounded-full px-6 py-2"
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}

export default Header;