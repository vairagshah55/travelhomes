import React, { useEffect, useRef, useState } from "react";
import { Calendar, Clock, Users, ChevronDown, ArrowRight } from "lucide-react";
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

  // ─── Vehicle-rental extras ────────────────────────────────────────────
  // All optional, so the stay / caravan / activity pages render exactly as
  // before. A rental differs in three ways the other three don't: it can be
  // booked in two modes at two different rates, it starts and ends at an hour
  // rather than on a date, and self-drive holds a refundable deposit.
  /** Only the modes this listing actually offers. Omit to hide the selector. */
  rentalModes?: { value: string; label: string; perDay: number; hint?: string }[];
  rentalMode?: string;
  onRentalModeChange?: (mode: string) => void;
  pickupTime?: string;
  returnTime?: string;
  onPickupTimeChange?: (t: string) => void;
  onReturnTimeChange?: (t: string) => void;
  securityDeposit?: number;
  /** Overrides the "Reserve" button text. */
  ctaLabel?: string;
}

/** Half-hour slots for the pickup/return selects. */
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

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
  rentalModes,
  rentalMode,
  onRentalModeChange,
  pickupTime,
  returnTime,
  onPickupTimeChange,
  onReturnTimeChange,
  securityDeposit,
  ctaLabel,
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

        {/* Rental mode. Rendered only when the caller passes modes, and only
            as a choice when there is more than one — a self-drive-only listing
            shows the single mode as a label rather than a one-option radio. */}
        {rentalModes && rentalModes.length > 0 && (
          <div className="mb-5">
            <div className="text-sm font-medium text-gray-500 mb-2">Rental option</div>
            <div className="grid grid-cols-1 gap-2">
              {rentalModes.map((mode) => {
                const selected = rentalMode === mode.value;
                const only = rentalModes.length === 1;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    aria-pressed={selected}
                    disabled={only}
                    onClick={() => onRentalModeChange?.(mode.value)}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-colors ${
                      selected || only
                        ? "border-[#3BD9DA] bg-[#3BD9DA]/10"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    } ${only ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-900">
                        {mode.label}
                      </span>
                      {mode.hint && (
                        <span className="block text-xs text-gray-500 mt-0.5">{mode.hint}</span>
                      )}
                    </span>
                    <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                      ₹{mode.perDay.toLocaleString()}
                      <span className="font-normal text-gray-500"> / day</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {securityDeposit != null && securityDeposit > 0 && rentalMode === "self-drive" && (
              <p className="mt-2 text-xs text-gray-500">
                Refundable security deposit of ₹{securityDeposit.toLocaleString()} collected at
                pickup. A valid driving licence is required.
              </p>
            )}
          </div>
        )}

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

            {pickupTime != null && returnTime != null && (
              <div className="grid grid-cols-2 gap-3">
                <label className="p-4 border border-gray-200 rounded-xl bg-white block">
                  <span className="flex items-center gap-2 text-gray-500 mb-3">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Pickup time</span>
                  </span>
                  <select
                    value={pickupTime}
                    onChange={(e) => onPickupTimeChange?.(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-black focus:outline-none cursor-pointer"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="p-4 border border-gray-200 rounded-xl bg-white block">
                  <span className="flex items-center gap-2 text-gray-500 mb-3">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Return time</span>
                  </span>
                  <select
                    value={returnTime}
                    onChange={(e) => onReturnTimeChange?.(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-black focus:outline-none cursor-pointer"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

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
          className="w-full bg-[#3BD9DA] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#2BC7C8] shadow-[0_4px_16px_rgba(59,217,218,0.5)] hover:shadow-[0_6px_20px_rgba(13,69,72,0.35)] transition-all mb-6"
          onClick={onReserve}
        >
          {ctaLabel || "Reserve"}
        </Button>
      </div>
    </div>
  );
}

export default BookingWidget;
