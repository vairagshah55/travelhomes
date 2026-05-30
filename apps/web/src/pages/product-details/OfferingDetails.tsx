import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Edit2,
  ChevronDown,
  ChevronUp,
  Users,
  BedDouble,
  ImageIcon,
  MapPin,
  CalendarClock,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { offersApi, bookingDetailsApi, OfferDTO } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from "@/lib/utils";
import { BRAND, BRAND_HOVER, NAVY } from "@/lib/brandColors";

// Local accent palette — primary uses the brand teal; secondary accents (used
// only on the QuickStat icons) are kept here so they're consistent across the
// page instead of being magic strings sprinkled inline.
const ACCENT_PRIMARY = BRAND;
const ACCENT_VIOLET = "#8b5cf6";
const ACCENT_GREEN = "#22c55e";
const STROKE_LIGHT = "#E5E7EB";
const STROKE_SUBTLE = "#EBEBEB";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the value has meaningful content */
const filled = (v: any): boolean => {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "number") return v !== 0;
  if (Array.isArray(v))
    return v.filter((x) => (typeof x === "string" ? x.trim() !== "" : !!x)).length > 0;
  return false;
};

const fmt = (v: number | string | undefined | null) =>
  v !== null && v !== undefined && v !== "" ? Number(v).toLocaleString("en-IN") : "—";

// ─── Re-usable display atoms ──────────────────────────────────────────────────

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide font-plus-jakarta">
      {label}
    </p>
    <p className="text-sm text-dashboard-title dark:text-gray-200 font-plus-jakarta">
      {value ?? "—"}
    </p>
  </div>
);

const PriceRow = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide font-plus-jakarta">
      {label}
    </p>
    <p className="text-sm font-bold text-dashboard-heading dark:text-white font-plus-jakarta">
      {value}
    </p>
  </div>
);

const BulletList = ({ label, items }: { label: string; items: string[] }) => {
  const clean = items.filter((x) => x.trim());
  if (!clean.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide font-plus-jakarta">
        {label}
      </p>
      <ul className="space-y-0.5">
        {clean.map((item, i) => (
          <li
            key={i}
            className="text-sm text-neutral-07 dark:text-gray-400 font-plus-jakarta flex gap-2"
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Section = ({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <h3 className="text-sm font-semibold text-dashboard-title dark:text-gray-200 font-plus-jakarta">
        {title}
      </h3>
      {expanded ? (
        <ChevronUp size={18} className="text-gray-400" />
      ) : (
        <ChevronDown size={18} className="text-gray-400" />
      )}
    </button>
    {expanded && (
      <>
        <hr className="border-dashboard-stroke dark:border-gray-600" />
        <div className="px-5 py-5 space-y-5">{children}</div>
      </>
    )}
  </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  deactivated: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// ─── Main Component ───────────────────────────────────────────────────────────

/* ── Quick-stat card (small KPI block above the description) ─────────── */
const QuickStat = ({
  icon,
  label,
  value,
  accent = ACCENT_PRIMARY,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) => (
  <div className="flex items-center gap-3 rounded-2xl border border-dashboard-stroke dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3">
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{
        width: 38,
        height: 38,
        backgroundColor: `${accent}14`,
        border: `1.5px solid ${accent}30`,
      }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 font-plus-jakarta">
        {label}
      </p>
      <p className="text-lg font-extrabold leading-tight text-dashboard-heading dark:text-white font-geist">
        {value}
      </p>
    </div>
  </div>
);

const OfferingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token: authToken } = useAuth();
  const token = authToken ?? undefined;

  const [expanded, setExpanded] = useState({
    description: true,
    features: true,
    location: true,
    pricing: true,
    discount: true,
    history: true,
  });
  const toggle = (key: keyof typeof expanded) => setExpanded((p) => ({ ...p, [key]: !p[key] }));
  // Index into the deduped photos array. null means "default to slot 0 (cover)".
  // Tracking by index — not URL — so duplicate URLs in the source data can't
  // light up two thumbnails at once.
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Shared cache key with the public detail pages and EditOfferings —
  // navigating between e.g. /offering and /offering/:id hits warm cache.
  const offerQuery = useQuery<OfferDTO | null>({
    queryKey: ["offer", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await offersApi.get(id!);
      return (res.data as OfferDTO) ?? null;
    },
  });
  const offer = offerQuery.data ?? null;
  const loading = offerQuery.isLoading;
  const error = offerQuery.error ? (offerQuery.error as Error).message || "Failed to load" : null;

  // ── Derived ───────────────────────────────────────────────────────────────
  const o = offer;

  const addressParts = o ? [o.address, o.locality, o.city, o.state, o.pincode].filter(Boolean) : [];

  // Photos that drive the gallery — cover first, then gallery thumbs. Deduped
  // because the backend sometimes stores the cover URL inside galleryUrls too,
  // which would otherwise produce a doubled thumbnail.
  const photos = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();
    const push = (url: string | undefined | null) => {
      if (!filled(url) || seen.has(url!)) return;
      seen.add(url!);
      list.push(url!);
    };
    push(o?.photos?.coverUrl);
    (o?.photos?.galleryUrls ?? []).forEach(push);
    return list;
  }, [o]);
  const heroPhoto = photos[activeIdx ?? 0] ?? null;

  // Per-type "guests" and "sleeps" — the OfferDTO has separate capacity fields
  // per service type. Pick the one that's filled.
  const guestsValue = useMemo(() => {
    const v =
      Number(o?.seatingCapacity || 0) ||
      Number(o?.guestCapacity || 0) ||
      Number(o?.personCapacity || 0);
    return v > 0 ? String(v) : "—";
  }, [o]);
  const sleepsValue = useMemo(() => {
    const v = Number(o?.sleepingCapacity || 0) || Number(o?.numberOfBeds || 0);
    return v > 0 ? String(v) : "—";
  }, [o]);

  // Activity / booking history for THIS offering. Filtered by serviceName
  // since BookingDetailDTO doesn't carry the offering's _id directly. Limited
  // to the 5 most recent so the section stays compact.
  const historyQuery = useQuery({
    queryKey: ["offering", "history", id, token],
    enabled: !!o?.name,
    queryFn: async () => {
      try {
        const res = await bookingDetailsApi.list(token, { mine: true });
        const list = ((res as any)?.data ?? []) as Array<any>;
        return list
          .filter((b) => b.serviceName === o!.name)
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
          )
          .slice(0, 5);
      } catch {
        return [];
      }
    },
  });
  const recentBookings: any[] = historyQuery.data ?? [];

  const discount = o?.discountPrice ?? null;
  const discountPct =
    discount && o?.regularPrice && Number(o.regularPrice) > 0
      ? Math.round(((Number(o.regularPrice) - Number(discount)) / Number(o.regularPrice)) * 100)
      : null;

  // Does the details section have anything to show?
  const hasCapacityFields =
    filled(o?.seatingCapacity) ||
    filled(o?.sleepingCapacity) ||
    filled(o?.guestCapacity) ||
    filled(o?.numberOfRooms) ||
    filled(o?.numberOfBeds) ||
    filled(o?.numberOfBathrooms) ||
    filled(o?.personCapacity) ||
    filled(o?.timeDuration) ||
    filled(o?.stayType) ||
    filled(o?.expectations) ||
    addressParts.length > 0;

  return (
    <DashboardLayout title="Offering" contentClassName="flex-1 overflow-hidden flex flex-col pr-5 pb-5">
          {/* Scrollable body — title moved into the hero banner below */}
          <div className="flex-1 bg-tpl-body-bg dark:bg-gray-900 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center h-48 text-neutral-07 dark:text-gray-400">
                Loading…
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-48 text-red-500">{error}</div>
            )}

            {o && (
              <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-5">
                {/* ── Hero banner: cover photo backdrop + overlaid title/status/Edit ── */}
                <div
                  className="relative rounded-3xl overflow-hidden h-[280px] sm:h-[320px] lg:h-[360px]"
                  style={{ backgroundColor: NAVY }}
                  // Two-layer image strategy:
                  //  1) Blurred + zoomed version using object-cover fills the
                  //     whole hero so the side gutters don't look like letterbox
                  //     bars when the source is portrait-oriented.
                  //  2) Foreground uses object-contain so the full image is
                  //     visible and never gets cropped.
                >
                  {heroPhoto && (
                    <>
                      <img
                        src={getImageUrl(heroPhoto)}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: "blur(28px)", transform: "scale(1.15)", opacity: 0.55 }}
                      />
                      <img
                        src={getImageUrl(heroPhoto)}
                        alt={o.name || "Offering"}
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </>
                  )}
                  {/* Dark gradient overlay for legibility — bottom only so the
                      title text is readable without darkening the image. */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)",
                    }}
                  />
                  {/* Top-right Edit button */}
                  <Button
                    onClick={() => navigate(`/offering/${id}/edit`)}
                    className="absolute top-4 right-4 bg-white/95 hover:bg-white rounded-full px-5 h-10 font-geist font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md"
                    style={{ color: BRAND }}
                  >
                    <Edit2 size={16} /> Edit
                  </Button>
                  {/* Cover badge top-left when hero is the cover (slot 0). */}
                  {filled(o.photos?.coverUrl) && (activeIdx ?? 0) === 0 && (
                    <span className="absolute left-4 top-4 text-white text-[11px] font-bold uppercase tracking-wider bg-black/55 backdrop-blur-md px-2.5 py-1 rounded-full">
                      Cover
                    </span>
                  )}
                  {/* Title + status overlay (bottom of hero) */}
                  <div className="absolute left-0 right-0 bottom-0 p-6 lg:p-8">
                    <div className="flex flex-wrap items-end gap-3">
                      <h1 className="text-2xl lg:text-3xl font-extrabold text-white font-geist drop-shadow-sm truncate max-w-[80%]">
                        {o.name || "Offering"}
                      </h1>
                      {o.status && (
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${STATUS_STYLES[o.status] || "bg-gray-100 text-gray-500"}`}
                        >
                          {o.status}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-white/85 text-sm font-plus-jakarta">
                      {filled(o.category) && (
                        <span className="flex items-center gap-1.5">
                          <span className="text-white/60">·</span>
                          {o.category}
                        </span>
                      )}
                      {filled(o.serviceType) && (
                        <span className="flex items-center gap-1.5">
                          <span className="text-white/60">·</span>
                          {o.serviceType}
                        </span>
                      )}
                      {addressParts.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} />
                          {[o.city, o.state].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Thumbnail rail (other photos) ─────────────────────── */}
                {photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((src, i) => {
                      const isActive = (activeIdx ?? 0) === i;
                      return (
                        <button
                          key={`${src}-${i}`}
                          type="button"
                          onClick={() => setActiveIdx(i)}
                          className="rounded-xl overflow-hidden transition-all cursor-pointer flex-shrink-0 relative bg-gray-100"
                          style={{
                            width: 96,
                            height: 72,
                            outline: isActive ? `2.5px solid ${BRAND}` : `1.5px solid ${STROKE_LIGHT}`,
                            outlineOffset: isActive ? 2 : 0,
                          }}
                        >
                          <img
                            src={getImageUrl(src)}
                            alt={`Photo ${i + 1}`}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{
                              objectPosition: "center 30%",
                              opacity: isActive ? 1 : 0.75,
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── Quick stats ─────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                  <QuickStat
                    icon={<Users size={16} color={ACCENT_PRIMARY} strokeWidth={2.2} />}
                    label="Guests"
                    value={guestsValue}
                  />
                  <QuickStat
                    icon={<BedDouble size={16} color={ACCENT_VIOLET} strokeWidth={2.2} />}
                    label="Sleeps"
                    value={sleepsValue}
                    accent={ACCENT_VIOLET}
                  />
                  <QuickStat
                    icon={<ImageIcon size={16} color={ACCENT_GREEN} strokeWidth={2.2} />}
                    label="Photos"
                    value={String(photos.length)}
                    accent={ACCENT_GREEN}
                  />
                </div>

                {/* ── Two-column body: content (8/12) + sticky price card (4/12) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-8 space-y-4">

                  {/* ── Description (text + rules only) ─────────────────── */}
                  <Section
                    title="Description"
                    expanded={expanded.description}
                    onToggle={() => toggle("description")}
                  >
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                      <Row label="Name" value={o.name} />
                      <Row label="Category" value={o.category} />
                      {filled(o.serviceType) && <Row label="Service Type" value={o.serviceType} />}
                    </div>

                    {filled(o.description) && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide font-plus-jakarta">
                          About
                        </p>
                        <p className="text-sm text-neutral-07 dark:text-gray-400 leading-relaxed font-plus-jakarta whitespace-pre-line">
                          {o.description}
                        </p>
                      </div>
                    )}

                    {filled(o.rules) && <BulletList label="Rules & Regulations" items={o.rules} />}

                    {filled(o.rejectionReason) && (
                      <div className="space-y-1 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wide font-plus-jakarta">
                          Rejection Reason
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400 font-plus-jakarta">
                          {o.rejectionReason}
                        </p>
                      </div>
                    )}
                  </Section>

                  {/* ── Features ───────────────────────────────────────── */}
                  {filled(o.features) && (
                    <Section
                      title="Features"
                      expanded={expanded.features}
                      onToggle={() => toggle("features")}
                    >
                      <div className="flex flex-wrap gap-2">
                        {o.features.filter(Boolean).map((f, i) => (
                          <span
                            key={i}
                            className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-dashboard-title dark:text-gray-300 font-plus-jakarta"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* ── Location + capacity details ─────────────────────── */}
                  {hasCapacityFields && (
                    <Section
                      title="Location"
                      expanded={expanded.location}
                      onToggle={() => toggle("location")}
                    >
                      {addressParts.length > 0 && (
                        <div className="flex items-start gap-2.5">
                          <MapPin
                            size={16}
                            className="text-gray-400 flex-shrink-0 mt-0.5"
                          />
                          <p className="text-sm text-dashboard-title dark:text-gray-200 font-plus-jakarta">
                            {addressParts.join(", ")}
                          </p>
                        </div>
                      )}

                      {(filled(o.seatingCapacity) ||
                        filled(o.sleepingCapacity) ||
                        filled(o.guestCapacity) ||
                        filled(o.numberOfRooms) ||
                        filled(o.numberOfBeds) ||
                        filled(o.numberOfBathrooms) ||
                        filled(o.personCapacity) ||
                        filled(o.timeDuration) ||
                        filled(o.stayType)) && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                          {filled(o.seatingCapacity) && (
                            <Row label="Seating" value={o.seatingCapacity} />
                          )}
                          {filled(o.sleepingCapacity) && (
                            <Row label="Sleeping" value={o.sleepingCapacity} />
                          )}
                          {filled(o.guestCapacity) && (
                            <Row label="Guests" value={o.guestCapacity} />
                          )}
                          {filled(o.numberOfRooms) && <Row label="Rooms" value={o.numberOfRooms} />}
                          {filled(o.numberOfBeds) && <Row label="Beds" value={o.numberOfBeds} />}
                          {filled(o.numberOfBathrooms) && (
                            <Row label="Bathrooms" value={o.numberOfBathrooms} />
                          )}
                          {filled(o.personCapacity) && (
                            <Row label="Persons" value={o.personCapacity} />
                          )}
                          {filled(o.timeDuration) && (
                            <Row label="Duration" value={o.timeDuration} />
                          )}
                          {filled(o.stayType) && <Row label="Stay Type" value={o.stayType} />}
                        </div>
                      )}

                      {filled(o.expectations) && (
                        <BulletList label="Expectations" items={o.expectations!} />
                      )}
                    </Section>
                  )}

                  {/* ── Pricing ────────────────────────────────────────────── */}
                  <Section
                    title="Pricing"
                    expanded={expanded.pricing}
                    onToggle={() => toggle("pricing")}
                  >
                    {/* Regular price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-dashboard-heading dark:text-white font-geist">
                        ₹{fmt(o.regularPrice)}
                      </span>
                      <span className="text-sm text-gray-400 font-plus-jakarta">/ day</span>
                    </div>

                    {/* Per km / per day charges */}
                    {(filled(o.perKmCharge) || filled(o.perDayCharge)) && (
                      <div className="grid grid-cols-2 gap-5">
                        {filled(o.perKmCharge) && (
                          <PriceRow label="Per Km Charge" value={`₹${fmt(o.perKmCharge)}`} />
                        )}
                        {filled(o.perDayCharge) && (
                          <PriceRow label="Per Day Charge" value={`₹${fmt(o.perDayCharge)}`} />
                        )}
                      </div>
                    )}

                    {/* Per km includes / excludes */}
                    {(filled(o.perKmIncludes) || filled(o.perKmExcludes)) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {filled(o.perKmIncludes) && (
                          <BulletList label="Per Km Includes" items={o.perKmIncludes!} />
                        )}
                        {filled(o.perKmExcludes) && (
                          <BulletList label="Per Km Excludes" items={o.perKmExcludes!} />
                        )}
                      </div>
                    )}

                    {/* Per day includes / excludes */}
                    {(filled(o.perDayIncludes) || filled(o.perDayExcludes)) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {filled(o.perDayIncludes) && (
                          <BulletList label="Per Day Includes" items={o.perDayIncludes!} />
                        )}
                        {filled(o.perDayExcludes) && (
                          <BulletList label="Per Day Excludes" items={o.perDayExcludes!} />
                        )}
                      </div>
                    )}

                    {/* General price includes / excludes */}
                    {(filled(o.priceIncludes) || filled(o.priceExcludes)) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {filled(o.priceIncludes) && (
                          <BulletList label="Price Includes" items={o.priceIncludes} />
                        )}
                        {filled(o.priceExcludes) && (
                          <BulletList label="Price Excludes" items={o.priceExcludes} />
                        )}
                      </div>
                    )}
                  </Section>

                  {/* ── Activity / Booking History ──────────────────────── */}
                  <Section
                    title="Activity / Booking History"
                    expanded={expanded.history}
                    onToggle={() => toggle("history")}
                  >
                    {historyQuery.isLoading ? (
                      <p className="text-sm text-gray-400 font-plus-jakarta">
                        Loading recent bookings…
                      </p>
                    ) : recentBookings.length === 0 ? (
                      <div className="flex items-center gap-3 text-gray-400">
                        <CalendarClock size={18} />
                        <p className="text-sm font-plus-jakarta">
                          No bookings yet for this offering.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {recentBookings.map((b, idx) => (
                          <button
                            key={b._id ?? b.id ?? idx}
                            type="button"
                            onClick={() => navigate(`/bookings/details`)}
                            className="flex items-center justify-between py-3 text-left border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/40 rounded-md px-2 -mx-2 transition-colors"
                            style={{ borderColor: STROKE_SUBTLE }}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-dashboard-title dark:text-gray-200 font-plus-jakarta truncate">
                                {b.clientName || "Guest"}{" "}
                                <span className="text-gray-400 font-normal">· {b.id}</span>
                              </p>
                              <p className="text-xs text-gray-400 font-plus-jakarta mt-0.5">
                                {b.checkIn} → {b.checkOut}
                              </p>
                            </div>
                            <span
                              className={`text-[10.5px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                                b.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : b.status === "cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : b.status === "confirmed"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {b.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </Section>

                  {/* ── Discount ───────────────────────────────────────────── */}
                  {discount !== null && discount !== undefined && (
                    <Section
                      title="Discount"
                      expanded={expanded.discount}
                      onToggle={() => toggle("discount")}
                    >
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide font-plus-jakarta">
                            Discount Price
                          </p>
                          <p className="text-lg font-bold text-green-600 font-plus-jakarta">
                            ₹{fmt(discount)}
                          </p>
                        </div>
                        {discountPct !== null && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide font-plus-jakarta">
                              Savings
                            </p>
                            <p className="text-lg font-bold text-green-600 font-plus-jakarta">
                              {discountPct}% off
                            </p>
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide font-plus-jakarta">
                            You Save
                          </p>
                          <p className="text-lg font-bold text-green-600 font-plus-jakarta">
                            ₹{fmt(Number(o.regularPrice) - Number(discount))}
                          </p>
                        </div>
                      </div>
                    </Section>
                  )}
                  </div>

                  {/* ── Sticky price/at-a-glance sidebar ─────────────── */}
                  <div className="lg:col-span-4">
                    <div
                      className="lg:sticky lg:top-4 rounded-2xl border border-dashboard-stroke dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4"
                      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
                    >
                      <div>
                        <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 font-plus-jakarta mb-1">
                          {filled(o.perDayCharge) ? "Per Day" : filled(o.perKmCharge) ? "Per Km" : "Starting From"}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold text-dashboard-heading dark:text-white font-geist tracking-tight">
                            ₹{fmt(o.perDayCharge || o.perKmCharge || o.regularPrice)}
                          </span>
                          <span className="text-xs text-gray-400 font-plus-jakarta">
                            {filled(o.perKmCharge) && !filled(o.perDayCharge) ? "/ km" : "/ day"}
                          </span>
                        </div>
                        {discountPct !== null && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[11px] font-bold">
                            {discountPct}% off · ₹{fmt(discount)} after discount
                          </div>
                        )}
                      </div>

                      <hr className="border-dashboard-stroke dark:border-gray-700" />

                      <div className="space-y-2.5">
                        {filled(o.perKmCharge) && filled(o.perDayCharge) && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400 font-plus-jakarta">
                              Per km
                            </span>
                            <span className="font-semibold text-dashboard-title dark:text-gray-200 font-plus-jakarta">
                              ₹{fmt(o.perKmCharge)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400 font-plus-jakarta">
                            Guests
                          </span>
                          <span className="font-semibold text-dashboard-title dark:text-gray-200 font-plus-jakarta">
                            {guestsValue}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400 font-plus-jakarta">
                            Sleeps
                          </span>
                          <span className="font-semibold text-dashboard-title dark:text-gray-200 font-plus-jakarta">
                            {sleepsValue}
                          </span>
                        </div>
                        {filled(o.timeDuration) && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400 font-plus-jakarta">
                              Duration
                            </span>
                            <span className="font-semibold text-dashboard-title dark:text-gray-200 font-plus-jakarta">
                              {o.timeDuration}
                            </span>
                          </div>
                        )}
                      </div>

                      {addressParts.length > 0 && (
                        <>
                          <hr className="border-dashboard-stroke dark:border-gray-700" />
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin
                              size={14}
                              className="text-gray-400 flex-shrink-0 mt-0.5"
                            />
                            <p className="text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                              {addressParts.join(", ")}
                            </p>
                          </div>
                        </>
                      )}

                      <Button
                        onClick={() => navigate(`/offering/${id}/edit`)}
                        className="w-full text-white rounded-xl h-11 font-geist font-semibold flex items-center justify-center gap-2 transition-colors"
                        style={{ backgroundColor: BRAND }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = BRAND_HOVER;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = BRAND;
                        }}
                      >
                        <Edit2 size={15} /> Edit Listing
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
    </DashboardLayout>
  );
};

export default OfferingDetails;
