import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, Search, Minus, Plus, X, Star as StarIcon } from "lucide-react";
import indianCities from "../../data/indian_cities.json";
import CamperVanIcon from "../icons/CamperVanIcon";
import HomeIcon from "../icons/HomeIcon";
import RocketIcon from "../icons/RocketIcon";
import CarIcon from "../icons/CarIcon";

type FilterType = "camper-van" | "unique-stays" | "activity" | "vehicle-rental";

/** Half-hour pickup/return slots for the vehicle-rental tab. */
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

const ACTIVITIES = ["Tracking", "Hiking", "Camping", "Photography", "Bird Watching"];
const MAX_CITY_RESULTS = 8;

interface MobileSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilter: FilterType;
  onFilterChange: (f: FilterType) => void;
  homepageSections: Record<string, boolean>;
}

/* ── A labelled block in the sheet. One concern per card, stacked. ───────── */
function Field({
  icon: Icon,
  label,
  error,
  children,
}: {
  icon: React.ElementType;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white px-4 py-3 transition-colors ${
        error ? "border-red-300" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
        {error && <span className="text-[11px] font-medium text-red-500 ml-auto">{error}</span>}
      </div>
      {children}
    </div>
  );
}

/* ── City picker: types straight into the field, results inline. ─────────── */
function CityField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = indianCities as string[];
    if (!q) return list.slice(0, MAX_CITY_RESULTS);
    const out: string[] = [];
    for (const city of list) {
      if (city.toLowerCase().includes(q)) {
        out.push(city);
        if (out.length >= MAX_CITY_RESULTS) break;
      }
    }
    return out;
  }, [value]);

  const exactMatch =
    results.length === 1 && results[0].toLowerCase() === value.trim().toLowerCase();

  return (
    <Field icon={MapPin} label={label} error={error}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="search"
          autoComplete="off"
          placeholder="Search a city"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          className="flex-1 min-w-0 bg-transparent text-gray-900 font-semibold text-base focus:outline-none placeholder:text-gray-300 placeholder:font-normal"
        />
        {value && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => {
              onChange("");
              setFocused(true);
            }}
            className="w-8 h-8 -mr-1.5 rounded-full flex items-center justify-center text-gray-400 active:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {focused && !exactMatch && (
        <div className="mt-2 -mx-1 max-h-52 overflow-y-auto scrollbar-hide border-t border-gray-100 pt-1.5">
          {results.length > 0 ? (
            results.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  onChange(city);
                  setFocused(false);
                }}
                className="flex items-center gap-3 w-full text-left px-1 py-2.5 rounded-xl active:bg-gray-50"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0">
                  <MapPin className="w-4 h-4 text-gray-500" />
                </span>
                <span className="font-medium text-sm text-gray-800 truncate">{city}</span>
              </button>
            ))
          ) : (
            <p className="px-1 py-3 text-sm text-gray-400">No cities match “{value}”.</p>
          )}
        </div>
      )}
    </Field>
  );
}

/* ── Guest stepper row. 40px controls — comfortable for thumbs. ──────────── */
function GuestRow({
  label,
  hint,
  value,
  min = 0,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-semibold text-gray-900 leading-tight">{label}</p>
        <p className="text-xs text-gray-400">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-30 active:scale-95 active:bg-gray-50 transition-transform"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 active:scale-95 active:bg-gray-50 transition-transform"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function MobileSearchSheet({
  open,
  onOpenChange,
  activeFilter,
  onFilterChange,
  homepageSections,
}: MobileSearchSheetProps) {
  const navigate = useNavigate();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [activity, setActivity] = useState("");
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isCamperVan = activeFilter === "camper-van";
  const isActivity = activeFilter === "activity";
  const isVehicle = activeFilter === "vehicle-rental";
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("10:00");
  const [vehicleClass, setVehicleClass] = useState<"" | "car" | "van" | "bus">("");
  const totalGuests = guests.adults + guests.children + guests.infants;
  const today = new Date().toISOString().slice(0, 10);

  const tabs = [
    { id: "camper-van" as const, label: "Camper Van", icon: CamperVanIcon, key: "camper-van" },
    { id: "unique-stays" as const, label: "Stays", icon: HomeIcon, key: "unique-stays" },
    { id: "activity" as const, label: "Activity", icon: RocketIcon, key: "best-activity" },
    {
      id: "vehicle-rental" as const,
      label: "Vehicles",
      icon: CarIcon,
      key: "vehicle-rental",
    },
  ].filter((t) => homepageSections[t.key] !== false);

  const handleSearch = () => {
    const next: Record<string, string> = {};
    if (!from.trim()) next.from = "Required";
    if (isCamperVan && !to.trim()) next.to = "Required";
    if (!checkIn) next.checkIn = "Required";
    if (!isActivity && !checkOut) next.checkOut = "Required";
    if (isActivity && !activity.trim()) next.activity = "Required";
    if (checkIn && checkOut && checkOut < checkIn) next.checkOut = "After check-in";
    if (isVehicle && checkIn && checkOut && checkIn === checkOut && returnTime <= pickupTime) {
      next.checkOut = "Return must be after pickup";
    }
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setErrors({});
    const params = new URLSearchParams({
      filter: activeFilter,
      location: from,
      locationTo: to,
      checkin: checkIn ? new Date(checkIn).toISOString() : "",
      checkout: checkOut ? new Date(checkOut).toISOString() : "",
      guests: String(totalGuests),
      activity: activity || "Tracking",
    });
    if (isVehicle) {
      params.set("pickupTime", pickupTime);
      params.set("returnTime", returnTime);
      params.set("vehicleClass", vehicleClass);
    }
    onOpenChange(false);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        // Hugs its content and only grows to 92svh — a fixed height left a
        // dead half-screen between the last field and the CTA. svh (not vh)
        // so a collapsing URL bar can't push the sticky CTA off-screen.
        className="max-h-[92svh] rounded-t-3xl p-0 gap-0 flex flex-col border-0 bg-white lg:hidden"
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 pb-3 pr-12 flex-shrink-0">
          <SheetTitle className="text-xl font-semibold text-[#0a1c1c] tracking-tight text-left">
            Where are you going?
          </SheetTitle>
        </div>

        {/* Category switcher */}
        {tabs.length > 1 && (
          <div className="px-5 pb-4 flex-shrink-0">
            <div
              className="grid gap-1.5 p-1 rounded-full bg-[#F2F4F5]"
              style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))` }}
            >
              {tabs.map(({ id, label, icon: Icon }) => {
                const active = activeFilter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onFilterChange(id);
                      setErrors({});
                    }}
                    className={`flex items-center justify-center gap-1.5 h-10 rounded-full text-[13px] font-semibold transition-colors ${
                      active ? "bg-[#3BD9DA] text-white shadow-sm" : "text-[#5F6A82]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-white" : "text-[#5F6A82]"}`} />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 space-y-3">
          <CityField
            label={isCamperVan ? "From" : isVehicle ? "Pickup city" : "Location"}
            value={from}
            onChange={setFrom}
            error={errors.from}
          />

          {isVehicle && (
            <Field icon={CarIcon} label="Vehicle type">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "", label: "Any" },
                    { value: "car", label: "Car" },
                    { value: "van", label: "Van" },
                    { value: "bus", label: "Bus" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value || "any"}
                    type="button"
                    aria-pressed={vehicleClass === option.value}
                    onClick={() => setVehicleClass(option.value)}
                    className={`px-3 h-8 rounded-full text-xs font-semibold border transition-colors ${
                      vehicleClass === option.value
                        ? "bg-[#3BD9DA] text-white border-[#3BD9DA]"
                        : "bg-white text-[#5F6A82] border-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {isCamperVan && <CityField label="To" value={to} onChange={setTo} error={errors.to} />}

          {isActivity && (
            <Field icon={StarIcon} label="Activity" error={errors.activity}>
              <input
                type="text"
                placeholder="What do you want to do?"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full bg-transparent text-gray-900 font-semibold text-base focus:outline-none placeholder:text-gray-300 placeholder:font-normal"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {ACTIVITIES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setActivity(a)}
                    className={`px-3 h-8 rounded-full text-xs font-semibold border transition-colors ${
                      activity === a
                        ? "bg-[#3BD9DA] text-white border-[#3BD9DA]"
                        : "bg-white text-[#5F6A82] border-gray-200"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Native date inputs — the OS wheel picker beats any custom
              calendar on a phone, and it needs zero vertical space. */}
          <div className={isActivity ? "" : "grid grid-cols-2 gap-3"}>
            <Field
              icon={Calendar}
              label={isActivity ? "Date" : isVehicle ? "Pickup" : "Check in"}
              error={errors.checkIn}
            >
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-transparent text-gray-900 font-semibold text-[15px] focus:outline-none"
              />
              {isVehicle && (
                <select
                  aria-label="Pickup time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="mt-2 w-full bg-transparent text-gray-900 font-semibold text-[15px] focus:outline-none"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            {!isActivity && (
              <Field
                icon={Calendar}
                label={isVehicle ? "Return" : "Check out"}
                error={errors.checkOut}
              >
                <input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-transparent text-gray-900 font-semibold text-[15px] focus:outline-none"
                />
                {isVehicle && (
                  <select
                    aria-label="Return time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="mt-2 w-full bg-transparent text-gray-900 font-semibold text-[15px] focus:outline-none"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            )}
          </div>

          <Field icon={Users} label={`Guests · ${totalGuests}`}>
            <div className="divide-y divide-gray-100">
              <GuestRow
                label="Adults"
                hint="Ages 13+"
                value={guests.adults}
                min={1}
                onChange={(n) => setGuests((g) => ({ ...g, adults: n }))}
              />
              <GuestRow
                label="Children"
                hint="Ages 2–12"
                value={guests.children}
                onChange={(n) => setGuests((g) => ({ ...g, children: n }))}
              />
              <GuestRow
                label="Infants"
                hint="Under 2"
                value={guests.infants}
                onChange={(n) => setGuests((g) => ({ ...g, infants: n }))}
              />
            </div>
          </Field>
        </div>

        {/* Sticky CTA — always reachable, clears the home indicator */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-white px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <Button
            onClick={handleSearch}
            className="w-full h-[52px] rounded-2xl bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white text-base font-semibold shadow-md active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            Search
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
