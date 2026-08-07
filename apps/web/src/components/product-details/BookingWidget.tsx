import React, { useEffect, useRef, useState } from "react";
import { Calendar, Users, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarDropdown } from "@/components/CalendarDropdown";
import { GuestDropdown } from "@/components/GuestDropdown";

export interface GuestsState {
  adults: number;
  children: number;
  infants: number;
  pet: number;
}

interface BookingWidgetProps {
  /** Display unit shown after price, e.g. "night" | "day" | "person". */
  priceLabel: string;
  /** Noun in the "Rare find" subtitle, e.g. "place" | "van" | "activity". */
  rareItemNoun: string;
  regularPrice?: number;
  checkInDate: Date;
  checkOutDate: Date;
  onDateChange: (range: { start: Date; end: Date }) => void;
  guests: GuestsState;
  setGuests: (g: GuestsState) => void;
  /** Each page formats display dates its own way; default matches UniqueStay/CamperVan ("23 May"). */
  formatDate?: (d: Date) => string;
  onReserve: () => void;
}

const defaultFormatDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

/**
 * Sticky booking sidebar shown on UniqueStay / CamperVan / Activity detail
 * pages. Owns its own calendar + guest dropdown state and click-outside
 * handling; parents only need to pass the date/guest values and a reserve
 * callback for navigation.
 */
export function BookingWidget({
  priceLabel,
  rareItemNoun,
  regularPrice,
  checkInDate,
  checkOutDate,
  onDateChange,
  guests,
  setGuests,
  formatDate = defaultFormatDate,
  onReserve,
}: BookingWidgetProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
        setShowGuests(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasPrice = regularPrice != null && regularPrice > 0;

  return (
    // Below lg, MobileBookingBar (fixed bottom bar) is the booking CTA — this
    // full sidebar (with its own calendar/guest dropdowns) would otherwise
    // render stacked in the single-column grid underneath the content and
    // double up with it. ProductDetailsSkeleton's loading placeholder already
    // hides its "aside" the same way, so this now matches its loaded state.
    <div className="hidden lg:block lg:col-span-1 lg:mt-24 mt-8">
      <div className="sticky top-8 bg-white dark:bg-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="mb-5">
          <div className="flex items-baseline gap-2 flex-wrap">
            {hasPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{Math.round(Number(regularPrice) * 1.2).toLocaleString()}
              </span>
            )}
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              ₹{Number(regularPrice || 0).toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">/ {priceLabel}</span>
            {hasPrice && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                Save 17%
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 mb-5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
          <span className="text-lg flex-shrink-0">💎</span>
          <div>
            <div className="text-sm font-semibold text-rose-800 dark:text-rose-300">Rare find</div>
            <div className="text-xs text-rose-600 dark:text-rose-400">
              This {rareItemNoun} is usually booked. Don't miss out.
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="relative z-50" ref={calendarRef}>
              <div
                className="p-4 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-gray-300 transition-colors"
                onClick={() => {
                  setShowCalendar((v) => !v);
                  setShowGuests(false);
                }}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Date</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-black">{formatDate(checkInDate)}</span>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-black">{formatDate(checkOutDate)}</span>
                </div>
              </div>
              {showCalendar && (
                <CalendarDropdown
                  onClose={() => setShowCalendar(false)}
                  onSelect={(range) => {
                    onDateChange(range);
                    setShowCalendar(false);
                  }}
                />
              )}
            </div>

            <div className="relative" ref={guestRef}>
              <div
                className="p-4 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-gray-300 transition-colors"
                onClick={() => {
                  setShowGuests((v) => !v);
                  setShowCalendar(false);
                }}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Guests</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-black">
                  {guests.adults + guests.children + guests.infants} Guests
                </span>
              </div>
              {showGuests && (
                <GuestDropdown
                  guests={guests}
                  onUpdate={setGuests}
                  onClose={() => setShowGuests(false)}
                />
              )}
            </div>
          </div>
        </div>

        <Button
          className="w-full bg-[#117479] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#0d4548] shadow-[0_4px_16px_rgba(59, 217, 218, 0.5)] hover:shadow-[0_6px_20px_rgba(13, 69, 72,0.35)] transition-all mb-6"
          onClick={onReserve}
        >
          Reserve
        </Button>
      </div>
    </div>
  );
}

export default BookingWidget;
