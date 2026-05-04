import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar, Users, Star as StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import AirbnbHeader from "../AirbnbHeader";
import FilterButton from "../FilterButton";
import CamperVanIcon from "../icons/CamperVanIcon";
import HomeIcon from "../icons/HomeIcon";
import RocketIcon from "../icons/RocketIcon";
import { LocationDropdown } from "../LocationDropdown";
import { GuestDropdown } from "../GuestDropdown";
import { ActivityDropdown } from "../ActivityDropdown";
import { CalendarDropdown } from "../CalendarDropdown";

type FilterType = "camper-van" | "unique-stays" | "activity";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=2400&q=80&auto=format",
  "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=2400&q=80&auto=format",
  "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=2400&q=80&auto=format",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=80&auto=format",
];

function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCurrent((p) => (p + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {HERO_IMAGES.map((src, i) => (
        <motion.img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          initial={false}
          animate={{ opacity: i === current ? 1 : 0, scale: i === current ? 1 : 1.08 }}
          transition={{ opacity: { duration: 1.2, ease: "easeInOut" }, scale: { duration: 6, ease: "linear" } }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/75" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
    </div>
  );
}

/* ── Shared search field wrapper ─────────────────────────────────────── */
function SearchField({
  active, children, error,
}: { active: boolean; children: React.ReactNode; error?: string }) {
  return (
    <div className={`relative flex flex-col gap-1 flex-1 min-w-0 px-4 py-2.5 rounded-xl transition-colors duration-200 ${active ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}>
      {children}
      {error && (
        <span className="absolute -bottom-2.5 left-4 text-red-500 text-[10px] font-medium whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  );
}

function Divider() {
  return <div className="hidden lg:block w-px h-8 bg-gray-200/70 flex-shrink-0 self-center mt-2" />;
}

interface HeroSectionProps {
  sectionRef: React.RefObject<HTMLElement>;
  activeFilter: FilterType;
  setActiveFilter: (f: FilterType) => void;
  homepageSections: Record<string, boolean>;
  heroHeight: number;
  scrollHighlightFilter: FilterType | null;
}

export function HeroSection({
  sectionRef,
  activeFilter,
  setActiveFilter,
  homepageSections,
  heroHeight,
  scrollHighlightFilter,
}: HeroSectionProps) {
  const navigate = useNavigate();

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showLocationToDropdown, setShowLocationToDropdown] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [searchErrors, setSearchErrors] = useState<Record<string, string>>({});
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedLocationTo, setSelectedLocationTo] = useState("");
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0, pet: 0 });
  const [guestsConfirmed, setGuestsConfirmed] = useState(false);
  const [activityName, setActivityName] = useState("Tracking");
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);

  const locationRef = useRef<HTMLDivElement>(null);
  const locationToRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);

  /* ── Close dropdowns on outside click ─── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (calendarRef.current && !calendarRef.current.contains(t)) setShowCalendar(false);
      if (locationRef.current && !locationRef.current.contains(t)) setShowLocationDropdown(false);
      if (locationToRef.current && !locationToRef.current.contains(t)) setShowLocationToDropdown(false);
      if (guestRef.current && !guestRef.current.contains(t)) setShowGuestDropdown(false);
      if (activityRef.current && !activityRef.current.contains(t)) setShowActivityDropdown(false);
    };
    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, []);

  /* ── Close dropdowns on scroll ─── */
  useEffect(() => {
    const closeAll = () => {
      setShowLocationDropdown(false);
      setShowLocationToDropdown(false);
      setShowGuestDropdown(false);
      setShowCalendar(false);
      setShowActivityDropdown(false);
    };
    window.addEventListener("scroll", closeAll, { passive: true });
    return () => window.removeEventListener("scroll", closeAll);
  }, []);

  /* ── Clear errors as user fills fields ─── */
  useEffect(() => { if (selectedLocation) setSearchErrors((e) => { const { location, ...r } = e; return r; }); }, [selectedLocation]);
  useEffect(() => { if (selectedLocationTo) setSearchErrors((e) => { const { locationTo, ...r } = e; return r; }); }, [selectedLocationTo]);
  useEffect(() => { if (checkInDate) setSearchErrors((e) => { const { checkin, ...r } = e; return r; }); }, [checkInDate]);
  useEffect(() => { if (checkOutDate) setSearchErrors((e) => { const { checkout, ...r } = e; return r; }); }, [checkOutDate]);
  useEffect(() => { if (activityName && activityName !== "Tracking") setSearchErrors((e) => { const { activity, ...r } = e; return r; }); }, [activityName]);
  useEffect(() => { setSearchErrors({}); }, [activeFilter]);

  const handleDateRangeSelect = (range: { start: Date; end: Date }) => {
    setCheckInDate(range.start);
    setCheckOutDate(range.end);
  };

  const handleSearch = () => {
    const errors: Record<string, string> = {};
    if (!selectedLocation.trim()) errors.location = "Required";
    if (activeFilter === "camper-van" && !selectedLocationTo.trim()) errors.locationTo = "Required";
    if (!checkInDate) errors.checkin = "Required";
    if (activeFilter !== "activity" && !checkOutDate) errors.checkout = "Required";
    if (activeFilter === "activity" && (!activityName.trim() || activityName === "Tracking")) errors.activity = "Required";
    if (Object.keys(errors).length > 0) { setSearchErrors(errors); return; }
    setSearchErrors({});
    const params = new URLSearchParams({
      filter: activeFilter,
      location: selectedLocation,
      locationTo: selectedLocationTo,
      checkin: checkInDate ? checkInDate.toISOString() : "",
      checkout: checkOutDate ? checkOutDate.toISOString() : "",
      guests: String(guests.adults + guests.children + guests.infants),
      activity: activityName,
    });
    navigate(`/search?${params.toString()}`);
  };

  const dateLabel = (d: Date | null, placeholder: string) =>
    d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : placeholder;

  const SearchBtn = () => (
    <div className="flex justify-center lg:flex-shrink-0 lg:ml-3 mt-3 lg:mt-2">
      <Button
        onClick={handleSearch}
        className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full h-12 w-12 transition-all duration-200 shadow-md hover:shadow-lg"
        size="icon"
      >
        <Search className="w-5 h-5" />
      </Button>
    </div>
  );

  return (
    <section ref={sectionRef} className="relative flex flex-col z-20 overflow-visible">
      <HeroSlideshow />

      <div className="relative flex-1 flex flex-col overflow-visible">
        <AirbnbHeader
          variant="transparent"
          className="fixed w-full z-50"
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          heroHeight={heroHeight}
          scrollHighlightFilter={scrollHighlightFilter}
        />

        {/* Hero text + filters */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-24 pb-12 md:pt-28 md:pb-14 text-center overflow-visible">
          <motion.p
            className="text-white/70 text-xs sm:text-sm font-medium tracking-[0.2em] uppercase mb-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            Your journey starts here
          </motion.p>

          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-3 md:mb-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Explore The Unexplored
          </motion.h1>

          <motion.p
            className="text-white/60 text-sm sm:text-base max-w-md mb-7 md:mb-9"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
          >
            Campervans, unique stays &amp; adventures across India
          </motion.p>

          {/* Category filter pills */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-6 md:mb-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.55 } },
            }}
          >
            {homepageSections["camper-van"] && (
              <motion.div variants={{ hidden: { opacity: 0, y: 16, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } } }}>
                <FilterButton icon={CamperVanIcon} label="Camper Van" active={activeFilter === "camper-van"} onClick={() => setActiveFilter("camper-van")} variant="hero" />
              </motion.div>
            )}
            {homepageSections["unique-stays"] && (
              <motion.div variants={{ hidden: { opacity: 0, y: 16, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } } }}>
                <FilterButton icon={HomeIcon} label="Unique Stays" active={activeFilter === "unique-stays"} onClick={() => setActiveFilter("unique-stays")} variant="hero" />
              </motion.div>
            )}
            {homepageSections["best-activity"] && (
              <motion.div variants={{ hidden: { opacity: 0, y: 16, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } } }}>
                <FilterButton icon={RocketIcon} label="Activity" active={activeFilter === "activity"} onClick={() => setActiveFilter("activity")} variant="hero" />
              </motion.div>
            )}
          </motion.div>

          {/* Desktop search bar */}
          <motion.div
            className="hidden lg:block w-full max-w-5xl relative z-50"
            style={{ overflow: "visible" }}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.75, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.28)] ring-1 ring-white/20 p-3 md:p-4 relative overflow-visible z-50">

              {/* ── Activity ─── */}
              {activeFilter === "activity" && (
                <div className="flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-0">
                  <div className="flex flex-col lg:flex-row lg:flex-1 lg:items-start gap-3 lg:gap-0">
                    <SearchField active={showLocationDropdown} error={searchErrors.location}>
                      <div className="flex items-center gap-1.5 text-gray-400"><MapPin className="w-4 h-4" /><span className="text-xs font-medium">Location</span></div>
                      <div ref={locationRef}>
                        <input type="text" placeholder="Search location" value={selectedLocation === "Where are you going?" ? "" : selectedLocation} onChange={(e) => { setSelectedLocation(e.target.value); setShowLocationDropdown(true); }} onFocus={() => setShowLocationDropdown(true)} className="w-full px-0.5 bg-transparent text-gray-900 font-semibold text-sm focus:outline-none placeholder:text-gray-300 placeholder:font-normal" />
                        {showLocationDropdown && <LocationDropdown searchQuery={selectedLocation} onSelect={(l) => { setSelectedLocation(l); setShowLocationDropdown(false); }} onClose={() => setShowLocationDropdown(false)} />}
                      </div>
                    </SearchField>
                    <Divider />

                    <div ref={calendarRef} className={`flex flex-col gap-1 flex-1 min-w-0 relative px-4 py-2.5 rounded-xl transition-colors duration-200 ${showCalendar ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}>
                      <div className="flex items-center gap-1.5 text-gray-400"><Calendar className="w-4 h-4" /><span className="text-xs font-medium">Date</span></div>
                      <button onClick={() => { setShowCalendar(!showCalendar); setShowLocationDropdown(false); setShowGuestDropdown(false); }} className={`font-semibold text-sm ${checkInDate ? "text-gray-900" : "text-gray-300"} hover:text-gray-700 transition-colors text-left`}>
                        {checkInDate ? `${dateLabel(checkInDate, "")} - ${dateLabel(checkOutDate, "")}` : "Add date"}
                      </button>
                      {showCalendar && <CalendarDropdown onSelect={handleDateRangeSelect} onClose={() => setShowCalendar(false)} selectedRange={{ start: checkInDate, end: checkOutDate }} />}
                      {searchErrors.checkin && <span className="absolute -bottom-2.5 left-4 text-red-500 text-[10px] font-medium whitespace-nowrap">{searchErrors.checkin}</span>}
                    </div>
                    <Divider />

                    <div ref={activityRef} className={`flex flex-col gap-1 flex-1 min-w-0 relative px-4 py-2.5 rounded-xl transition-colors duration-200 ${showActivityDropdown ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}>
                      <div className="flex items-center gap-1.5 text-gray-400"><StarIcon className="w-4 h-4" /><span className="text-xs font-medium">Activity</span></div>
                      <input type="text" placeholder="Search activity" value={activityName === "Tracking" ? "" : activityName} onChange={(e) => { setActivityName(e.target.value); setShowActivityDropdown(true); }} onFocus={() => setShowActivityDropdown(true)} className="w-full px-0.5 bg-transparent text-gray-900 font-semibold text-sm focus:outline-none placeholder:text-gray-300 placeholder:font-normal" />
                      {showActivityDropdown && <ActivityDropdown onSelect={setActivityName} onClose={() => setShowActivityDropdown(false)} />}
                      {searchErrors.activity && <span className="absolute -bottom-2.5 left-4 text-red-500 text-[10px] font-medium whitespace-nowrap">{searchErrors.activity}</span>}
                    </div>
                    <Divider />

                    <div ref={guestRef} className={`flex flex-col gap-1 flex-1 min-w-0 relative px-4 py-2.5 rounded-xl transition-colors duration-200 ${showGuestDropdown ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}>
                      <div className="flex items-center gap-1.5 text-gray-400"><Users className="w-4 h-4" /><span className="text-xs font-medium">Guests</span></div>
                      <button onClick={() => { setShowGuestDropdown(!showGuestDropdown); setShowLocationDropdown(false); setShowCalendar(false); setShowActivityDropdown(false); }} className={`${guestsConfirmed ? "text-gray-900" : "text-gray-300"} font-semibold text-sm text-left hover:text-gray-700 transition-colors`}>
                        {guestsConfirmed ? `${guests.adults + guests.children + guests.infants} guests` : "Add guests"}
                      </button>
                      {showGuestDropdown && <GuestDropdown guests={guests} onUpdate={(g) => setGuests({ pet: 0, ...g })} onClose={() => { setShowGuestDropdown(false); setGuestsConfirmed(true); }} />}
                    </div>
                  </div>
                  <SearchBtn />
                </div>
              )}

              {/* ── Camper Van ─── */}
              {activeFilter === "camper-van" && (
                <div className="flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-0 w-full">
                  <div className="flex flex-col lg:flex-row lg:flex-1 lg:items-start gap-3 lg:gap-0">
                    <div ref={locationRef} className={`flex flex-col gap-1 flex-1 min-w-0 relative px-4 py-2.5 rounded-xl transition-colors duration-200 ${showLocationDropdown ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}>
                      <div className="flex items-center gap-1.5 text-gray-400"><MapPin className="w-4 h-4" /><span className="text-xs font-medium">From</span></div>
                      <input type="text" placeholder="Search location" value={selectedLocation === "Where are you going?" ? "" : selectedLocation} onChange={(e) => { setSelectedLocation(e.target.value); setShowLocationDropdown(true); }} onFocus={() => setShowLocationDropdown(true)} className="w-full px-0.5 bg-transparent text-gray-900 font-semibold text-sm focus:outline-none placeholder:text-gray-300 placeholder:font-normal" />
                      {showLocationDropdown && <LocationDropdown searchQuery={selectedLocation} onSelect={(l) => { setSelectedLocation(l); setShowLocationDropdown(false); }} onClose={() => setShowLocationDropdown(false)} />}
                      {searchErrors.location && <span className="absolute -bottom-2.5 left-4 text-red-500 text-[10px] font-medium whitespace-nowrap">{searchErrors.location}</span>}
                    </div>
                    <Divider />

                    <div ref={locationToRef} className={`flex flex-col gap-1 flex-1 min-w-0 relative px-4 py-2.5 rounded-xl transition-colors duration-200 ${showLocationToDropdown ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}>
                      <div className="flex items-center gap-1.5 text-gray-400"><MapPin className="w-4 h-4" /><span className="text-xs font-medium">To</span></div>
                      <input type="text" placeholder="Search location" value={selectedLocationTo === "Where are you going?" ? "" : selectedLocationTo} onChange={(e) => { setSelectedLocationTo(e.target.value); setShowLocationToDropdown(true); }} onFocus={() => setShowLocationToDropdown(true)} className="w-full px-0.5 bg-transparent text-gray-900 font-semibold text-sm focus:outline-none placeholder:text-gray-300 placeholder:font-normal" />
                      {showLocationToDropdown && <LocationDropdown searchQuery={selectedLocationTo} onSelect={(l) => { setSelectedLocationTo(l); setShowLocationToDropdown(false); }} onClose={() => setShowLocationToDropdown(false)} />}
                      {searchErrors.locationTo && <span className="absolute -bottom-2.5 left-4 text-red-500 text-[10px] font-medium whitespace-nowrap">{searchErrors.locationTo}</span>}
                    </div>
                    <Divider />

                    <div ref={calendarRef} className="relative flex flex-[2] items-start gap-0">
                      <div className={`flex flex-col gap-1 flex-1 min-w-0 px-4 py-2.5 rounded-xl transition-colors duration-200 ${showCalendar ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}>
                        <div className="flex items-center gap-1.5 text-gray-400"><Calendar className="w-4 h-4" /><span className="text-xs font-medium">Check in</span></div>
                        <button onClick={() => { setShowCalendar(!showCalendar); setShowLocationDropdown(false); setShowGuestDropdown(false); }} className={`font-semibold text-sm ${checkInDate ? "text-gray-900" : "text-gray-300"} hover:text-gray-700 transition-colors text-left`}>
                          {dateLabel(checkInDate, "Add date")}
                        </button>
                        {searchErrors.checkin && <span className="absolute -bottom-2.5 left-4 text-red-500 text-[10px] font-medium whitespace-nowrap">{searchErrors.checkin}</span>}
                      </div>
                      <Divider />
                      <div className={`flex flex-col gap-1 flex-1 min-w-0 relative px-4 py-2.5 rounded-xl transition-colors duration-200 ${showCalendar ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}>
                        <div className="flex items-center gap-1.5 text-gray-400"><Calendar className="w-4 h-4" /><span className="text-xs font-medium">Check out</span></div>
                        <button onClick={() => { setShowCalendar(!showCalendar); setShowLocationDropdown(false); setShowGuestDropdown(false); }} className={`font-semibold text-sm ${checkOutDate ? "text-gray-900" : "text-gray-300"} hover:text-gray-700 transition-colors text-left`}>
                          {dateLabel(checkOutDate, "Add date")}
                        </button>
                        {searchErrors.checkout && <span className="absolute -bottom-2.5 left-4 text-red-500 text-[10px] font-medium whitespace-nowrap">{searchErrors.checkout}</span>}
                      </div>
                      {showCalendar && <CalendarDropdown onSelect={handleDateRangeSelect} onClose={() => setShowCalendar(false)} selectedRange={{ start: checkInDate, end: checkOutDate }} />}
                    </div>
                    <Divider />

                    <div ref={guestRef} className={`flex flex-col gap-1 flex-1 min-w-0 relative px-4 py-2.5 rounded-xl transition-colors duration-200 ${showGuestDropdown ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}>
                      <div className="flex items-center gap-1.5 text-gray-400"><Users className="w-4 h-4" /><span className="text-xs font-medium">Guests</span></div>
                      <button onClick={() => { setShowGuestDropdown(!showGuestDropdown); setShowLocationDropdown(false); setShowCalendar(false); }} className={`${guestsConfirmed ? "text-gray-900" : "text-gray-300"} font-semibold text-sm text-left hover:text-gray-700 transition-colors`}>
                        {guestsConfirmed ? `${guests.adults + guests.children + guests.infants} guests` : "Add guests"}
                      </button>
                      {showGuestDropdown && <GuestDropdown guests={guests} onUpdate={(g) => setGuests({ pet: 0, ...g })} onClose={() => { setShowGuestDropdown(false); setGuestsConfirmed(true); }} />}
                    </div>
                  </div>
                  <SearchBtn />
                </div>
              )}

              {/* ── Unique Stays ─── */}
              {activeFilter === "unique-stays" && (
                <div className="flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-0">
                  <div className="flex flex-col lg:flex-row lg:flex-1 lg:items-start gap-3 lg:gap-0">
                    <div ref={locationRef} className={`flex flex-col gap-1 flex-1 min-w-0 relative px-4 py-2.5 rounded-xl transition-colors duration-200 ${showLocationDropdown ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}>
                      <div className="flex items-center gap-1.5 text-gray-400"><MapPin className="w-4 h-4" /><span className="text-xs font-medium">Location</span></div>
                      <input type="text" placeholder="Search location" value={selectedLocation === "Where are you going?" ? "" : selectedLocation} onChange={(e) => { setSelectedLocation(e.target.value); setShowLocationDropdown(true); }} onFocus={() => setShowLocationDropdown(true)} className="w-full px-0.5 bg-transparent text-gray-900 font-semibold text-sm focus:outline-none placeholder:text-gray-300 placeholder:font-normal" />
                      {showLocationDropdown && <LocationDropdown searchQuery={selectedLocation} onSelect={(l) => { setSelectedLocation(l); setShowLocationDropdown(false); }} onClose={() => setShowLocationDropdown(false)} />}
                      {searchErrors.location && <span className="absolute -bottom-2.5 left-4 text-red-500 text-[10px] font-medium whitespace-nowrap">{searchErrors.location}</span>}
                    </div>
                    <Divider />

                    <div ref={calendarRef} className="relative flex flex-[2] items-start gap-0">
                      <div className={`flex flex-col gap-1 flex-1 min-w-0 px-4 py-2.5 rounded-xl transition-colors duration-200 ${showCalendar ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}>
                        <div className="flex items-center gap-1.5 text-gray-400"><Calendar className="w-4 h-4" /><span className="text-xs font-medium">Check in</span></div>
                        <button onClick={() => { setShowCalendar(!showCalendar); setShowLocationDropdown(false); setShowGuestDropdown(false); }} className={`font-semibold text-sm ${checkInDate ? "text-gray-900" : "text-gray-300"} hover:text-gray-700 transition-colors text-left`}>
                          {dateLabel(checkInDate, "Add date")}
                        </button>
                        {searchErrors.checkin && <span className="absolute -bottom-2.5 left-4 text-red-500 text-[10px] font-medium whitespace-nowrap">{searchErrors.checkin}</span>}
                      </div>
                      <Divider />
                      <div className={`flex flex-col gap-1 flex-1 min-w-0 relative px-4 py-2.5 rounded-xl transition-colors duration-200 ${showCalendar ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}>
                        <div className="flex items-center gap-1.5 text-gray-400"><Calendar className="w-4 h-4" /><span className="text-xs font-medium">Check out</span></div>
                        <button onClick={() => { setShowCalendar(!showCalendar); setShowLocationDropdown(false); setShowGuestDropdown(false); }} className={`font-semibold text-sm ${checkOutDate ? "text-gray-900" : "text-gray-300"} hover:text-gray-700 transition-colors text-left`}>
                          {dateLabel(checkOutDate, "Add date")}
                        </button>
                        {searchErrors.checkout && <span className="absolute -bottom-2.5 left-4 text-red-500 text-[10px] font-medium whitespace-nowrap">{searchErrors.checkout}</span>}
                      </div>
                      {showCalendar && <CalendarDropdown onSelect={handleDateRangeSelect} onClose={() => setShowCalendar(false)} selectedRange={{ start: checkInDate, end: checkOutDate }} />}
                    </div>
                    <Divider />

                    <div ref={guestRef} className={`flex flex-col gap-1 flex-1 min-w-0 relative px-4 py-2.5 rounded-xl transition-colors duration-200 ${showGuestDropdown ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}>
                      <div className="flex items-center gap-1.5 text-gray-400"><Users className="w-4 h-4" /><span className="text-xs font-medium">Guests</span></div>
                      <button onClick={() => { setShowGuestDropdown(!showGuestDropdown); setShowLocationDropdown(false); setShowCalendar(false); }} className={`${guestsConfirmed ? "text-gray-900" : "text-gray-300"} font-semibold text-sm text-left hover:text-gray-700 transition-colors`}>
                        {guestsConfirmed ? `${guests.adults + guests.children + guests.infants} guests` : "Add guests"}
                      </button>
                      {showGuestDropdown && <GuestDropdown guests={guests} onUpdate={(g) => setGuests({ pet: 0, ...g })} onClose={() => { setShowGuestDropdown(false); setGuestsConfirmed(true); }} />}
                    </div>
                  </div>
                  <SearchBtn />
                </div>
              )}

            </div>
          </motion.div>

          {/* Mobile search pill */}
          <button
            onClick={() => navigate(`/search?filter=${activeFilter}`)}
            className="lg:hidden flex items-center gap-3 bg-white rounded-full shadow-xl px-5 py-3.5 w-full max-w-sm hover:shadow-2xl transition-all mt-4"
          >
            <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <div className="text-left flex-1">
              <div className="text-sm font-semibold text-gray-800">Where to go?</div>
              <div className="text-xs text-gray-400">Anywhere · Any time · Any guests</div>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
