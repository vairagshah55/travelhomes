import { useState } from "react";
import { MapPin, Calendar, Users, Search } from "lucide-react";

export interface SearchBarProps {
  onSearch?: (params: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => void;
  className?: string;
}

export default function SearchBar({ onSearch, className = "" }: SearchBarProps) {
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  function handleSearch() {
    onSearch?.({ location, checkIn, checkOut, guests });
  }

  const inputBase =
    "w-full bg-transparent outline-none text-[14px] text-ds-charcoal placeholder:text-ds-slate font-sans";

  const labelBase = "text-[11px] font-semibold text-ds-navy uppercase tracking-wide leading-none mb-1";

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop: pill row */}
      <div
        className="hidden md:flex items-center rounded-full bg-ds-white border border-ds-pebble"
        style={{ boxShadow: "0 2px 16px rgba(24,95,165,0.10)" }}
      >
        {/* Location */}
        <div className="flex items-center gap-2 px-5 py-3 flex-1 min-w-0">
          <MapPin className="w-4 h-4 text-ds-ocean flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={labelBase}>Where</p>
            <input
              className={inputBase}
              placeholder="Where to?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="self-stretch w-px bg-ds-pebble my-3" aria-hidden="true" />

        {/* Check-in */}
        <div className="flex items-center gap-2 px-5 py-3 flex-1 min-w-0">
          <Calendar className="w-4 h-4 text-ds-ocean flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={labelBase}>Check in</p>
            <input
              className={inputBase}
              placeholder="Add dates"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
        </div>

        <div className="self-stretch w-px bg-ds-pebble my-3" aria-hidden="true" />

        {/* Check-out */}
        <div className="flex items-center gap-2 px-5 py-3 flex-1 min-w-0">
          <Calendar className="w-4 h-4 text-ds-ocean flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={labelBase}>Check out</p>
            <input
              className={inputBase}
              placeholder="Add dates"
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>

        <div className="self-stretch w-px bg-ds-pebble my-3" aria-hidden="true" />

        {/* Guests */}
        <div className="flex items-center gap-2 px-5 py-3 flex-1 min-w-0">
          <Users className="w-4 h-4 text-ds-ocean flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={labelBase}>Guests</p>
            <input
              className={inputBase}
              placeholder="Add guests"
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
            />
          </div>
        </div>

        {/* Search button */}
        <div className="pr-2 pl-1 flex-shrink-0">
          <button
            onClick={handleSearch}
            aria-label="Search"
            className="w-10 h-10 rounded-full bg-ds-deep flex items-center justify-center text-ds-white transition-colors duration-200 hover:bg-ds-navy"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile: stacked column */}
      <div
        className="flex md:hidden flex-col rounded-xl bg-ds-white border border-ds-pebble overflow-hidden"
        style={{ boxShadow: "0 2px 16px rgba(24,95,165,0.10)" }}
      >
        {/* Location */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-ds-pebble">
          <MapPin className="w-4 h-4 text-ds-ocean flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={labelBase}>Where</p>
            <input
              className={inputBase}
              placeholder="Where to?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        {/* Check-in */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-ds-pebble">
          <Calendar className="w-4 h-4 text-ds-ocean flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={labelBase}>Check in</p>
            <input
              className={inputBase}
              placeholder="Add dates"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
        </div>

        {/* Check-out */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-ds-pebble">
          <Calendar className="w-4 h-4 text-ds-ocean flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={labelBase}>Check out</p>
            <input
              className={inputBase}
              placeholder="Add dates"
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>

        {/* Guests */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-ds-pebble">
          <Users className="w-4 h-4 text-ds-ocean flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={labelBase}>Guests</p>
            <input
              className={inputBase}
              placeholder="Add guests"
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
            />
          </div>
        </div>

        {/* Search button — full width on mobile */}
        <button
          onClick={handleSearch}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-ds-deep text-ds-white text-[14px] font-semibold transition-colors duration-200 hover:bg-ds-navy"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>
    </div>
  );
}
