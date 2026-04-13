import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bell, Menu, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { Sidebar } from '@/components/Navigation';
import { useParams, useNavigate } from 'react-router-dom';
import ProfileDropdown from '@/components/ProfileDropdown';
import MobileVendorNav from '@/components/MobileVendorNav';
import { offersApi, OfferDTO } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the value has meaningful content */
const filled = (v: any): boolean => {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (typeof v === 'number') return v !== 0;
  if (Array.isArray(v)) return v.filter((x) => (typeof x === 'string' ? x.trim() !== '' : !!x)).length > 0;
  return false;
};

const fmt = (v: number | string | undefined | null) =>
  v !== null && v !== undefined && v !== '' ? Number(v).toLocaleString('en-IN') : '—';

// ─── Re-usable display atoms ──────────────────────────────────────────────────

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide font-plus-jakarta">{label}</p>
    <p className="text-sm text-dashboard-title dark:text-gray-200 font-plus-jakarta">{value ?? '—'}</p>
  </div>
);

const PriceRow = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide font-plus-jakarta">{label}</p>
    <p className="text-sm font-bold text-dashboard-heading dark:text-white font-plus-jakarta">{value}</p>
  </div>
);

const BulletList = ({ label, items }: { label: string; items: string[] }) => {
  const clean = items.filter((x) => x.trim());
  if (!clean.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide font-plus-jakarta">{label}</p>
      <ul className="space-y-0.5">
        {clean.map((item, i) => (
          <li key={i} className="text-sm text-neutral-07 dark:text-gray-400 font-plus-jakarta flex gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Section = ({
  title, expanded, onToggle, children,
}: {
  title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) => (
  <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <h3 className="text-sm font-semibold text-dashboard-title dark:text-gray-200 font-plus-jakarta">{title}</h3>
      {expanded
        ? <ChevronUp size={18} className="text-gray-400" />
        : <ChevronDown size={18} className="text-gray-400" />}
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
  approved:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  rejected:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled:   'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  deactivated: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  blocked:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// ─── Main Component ───────────────────────────────────────────────────────────

const OfferingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [expanded, setExpanded] = useState({
    descriptions: true,
    details: true,
    pricing: true,
    discount: true,
  });
  const toggle = (key: keyof typeof expanded) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const [offer, setOffer] = useState<OfferDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    offersApi.get(id)
      .then((res) => setOffer(res.data))
      .catch((e: any) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const o = offer;

  const addressParts = o
    ? [o.address, o.locality, o.city, o.state, o.pincode].filter(Boolean)
    : [];

  const discount = o?.discountPrice ?? null;
  const discountPct =
    discount && o?.regularPrice && Number(o.regularPrice) > 0
      ? Math.round(((Number(o.regularPrice) - Number(discount)) / Number(o.regularPrice)) * 100)
      : null;

  // Does the details section have anything to show?
  const hasCapacityFields =
    filled(o?.seatingCapacity) || filled(o?.sleepingCapacity) ||
    filled(o?.guestCapacity) || filled(o?.numberOfRooms) ||
    filled(o?.numberOfBeds) || filled(o?.numberOfBathrooms) ||
    filled(o?.personCapacity) || filled(o?.timeDuration) ||
    filled(o?.stayType) || filled(o?.expectations) ||
    addressParts.length > 0;

  return (
    <div className="flex h-screen bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top nav */}
        <header className="flex items-center justify-between px-3 lg:px-9 py-4 bg-dashboard-bg dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden"><Menu size={20} /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0"><Sidebar /></SheetContent>
            </Sheet>
            <h1 className="text-xl lg:text-2xl font-bold text-dashboard-heading dark:text-white tracking-tight font-geist">
              Offering
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="bg-white dark:bg-gray-800 rounded-full border shadow-sm h-9 w-9">
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
            </Button>
            <ProfileDropdown
              onProfileClick={() => {}} onViewAsUserClick={() => {}}
              onBusinessDetailsClick={() => {}} onPersonalDetailsClick={() => {}}
              onChangePasswordClick={() => {}} onLogoutClick={() => {}}
            />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col pr-5 pb-5 overflow-hidden">

          {/* Title bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-dashboard-stroke dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-3xl flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-xl font-bold text-dashboard-heading dark:text-white font-geist truncate">
                {o?.name || 'Offering'}
              </h2>
              {o?.status && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-500'}`}>
                  {o.status}
                </span>
              )}
            </div>
            <Button
              onClick={() => navigate(`/offering/${id}/edit`)}
              className="bg-dashboard-primary text-white hover:bg-gray-800 rounded-full px-5 h-10 font-geist font-medium flex items-center gap-2 flex-shrink-0 ml-4"
            >
              <Edit2 size={16} /> Edit
            </Button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-b-3xl overflow-y-auto">
            <div className="p-5">
              {loading && (
                <div className="flex items-center justify-center h-48 text-neutral-07 dark:text-gray-400">
                  Loading…
                </div>
              )}
              {error && (
                <div className="flex items-center justify-center h-48 text-red-500">{error}</div>
              )}

              {o && (
                <div className="max-w-5xl mx-auto space-y-4">

                  {/* ── Descriptions ───────────────────────────────────────── */}
                  <Section title="Description" expanded={expanded.descriptions} onToggle={() => toggle('descriptions')}>

                    {/* Name / Category / Service Type */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                      <Row label="Name" value={o.name} />
                      <Row label="Category" value={o.category} />
                      {filled(o.serviceType) && <Row label="Service Type" value={o.serviceType} />}
                    </div>

                    {/* Description */}
                    {filled(o.description) && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide font-plus-jakarta">Description</p>
                        <p className="text-sm text-neutral-07 dark:text-gray-400 leading-relaxed font-plus-jakarta whitespace-pre-line">
                          {o.description}
                        </p>
                      </div>
                    )}

                    {/* Rules */}
                    {filled(o.rules) && <BulletList label="Rules & Regulations" items={o.rules} />}

                    {/* Features */}
                    {filled(o.features) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide font-plus-jakarta">Features</p>
                        <div className="flex flex-wrap gap-2">
                          {o.features.filter(Boolean).map((f, i) => (
                            <span key={i} className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rejection reason */}
                    {filled(o.rejectionReason) && (
                      <div className="space-y-1 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wide font-plus-jakarta">Rejection Reason</p>
                        <p className="text-sm text-red-600 dark:text-red-400 font-plus-jakarta">{o.rejectionReason}</p>
                      </div>
                    )}

                    {/* Photos */}
                    {(filled(o.photos?.coverUrl) || filled(o.photos?.galleryUrls)) && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide font-plus-jakarta">Photos</p>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          {filled(o.photos?.coverUrl) && (
                            <div className="lg:col-span-1">
                              <div
                                className="rounded-xl overflow-hidden h-56 bg-cover bg-center relative"
                                style={{ backgroundImage: `url(${getImageUrl(o.photos.coverUrl!)})` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-3">
                                  <span className="text-white text-xs font-semibold bg-black/50 px-2 py-0.5 rounded-full">Cover</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {filled(o.photos?.galleryUrls) && (
                            <div className="lg:col-span-2">
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {o.photos.galleryUrls.map((photo, i) => (
                                  <div
                                    key={i}
                                    className="rounded-xl overflow-hidden h-24 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${getImageUrl(photo)})` }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Section>

                  {/* ── Details ────────────────────────────────────────────── */}
                  {hasCapacityFields && (
                    <Section title="Details" expanded={expanded.details} onToggle={() => toggle('details')}>

                      {/* Capacity grid — show any that are filled */}
                      {(filled(o.seatingCapacity) || filled(o.sleepingCapacity) ||
                        filled(o.guestCapacity) || filled(o.numberOfRooms) ||
                        filled(o.numberOfBeds) || filled(o.numberOfBathrooms) ||
                        filled(o.personCapacity)) && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                          {filled(o.seatingCapacity)     && <Row label="Seating Capacity"  value={o.seatingCapacity} />}
                          {filled(o.sleepingCapacity)    && <Row label="Sleeping Capacity" value={o.sleepingCapacity} />}
                          {filled(o.guestCapacity)       && <Row label="Guest Capacity"    value={o.guestCapacity} />}
                          {filled(o.numberOfRooms)       && <Row label="Rooms"             value={o.numberOfRooms} />}
                          {filled(o.numberOfBeds)        && <Row label="Beds"              value={o.numberOfBeds} />}
                          {filled(o.numberOfBathrooms)   && <Row label="Bathrooms"         value={o.numberOfBathrooms} />}
                          {filled(o.personCapacity)      && <Row label="Person Capacity"   value={o.personCapacity} />}
                        </div>
                      )}

                      {/* Activity: duration */}
                      {filled(o.timeDuration) && <Row label="Duration" value={o.timeDuration} />}

                      {/* Stay type */}
                      {filled(o.stayType) && <Row label="Stay Type" value={o.stayType} />}

                      {/* Expectations */}
                      {filled(o.expectations) && <BulletList label="Expectations" items={o.expectations!} />}

                      {/* Address */}
                      {addressParts.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide font-plus-jakarta">Location</p>
                          <p className="text-sm text-neutral-07 dark:text-gray-400 font-plus-jakarta">
                            {addressParts.join(', ')}
                          </p>
                        </div>
                      )}
                    </Section>
                  )}

                  {/* ── Pricing ────────────────────────────────────────────── */}
                  <Section title="Pricing" expanded={expanded.pricing} onToggle={() => toggle('pricing')}>

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
                        {filled(o.perKmCharge)  && <PriceRow label="Per Km Charge"  value={`₹${fmt(o.perKmCharge)}`} />}
                        {filled(o.perDayCharge) && <PriceRow label="Per Day Charge" value={`₹${fmt(o.perDayCharge)}`} />}
                      </div>
                    )}

                    {/* Per km includes / excludes */}
                    {(filled(o.perKmIncludes) || filled(o.perKmExcludes)) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {filled(o.perKmIncludes) && <BulletList label="Per Km Includes" items={o.perKmIncludes!} />}
                        {filled(o.perKmExcludes) && <BulletList label="Per Km Excludes" items={o.perKmExcludes!} />}
                      </div>
                    )}

                    {/* Per day includes / excludes */}
                    {(filled(o.perDayIncludes) || filled(o.perDayExcludes)) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {filled(o.perDayIncludes) && <BulletList label="Per Day Includes" items={o.perDayIncludes!} />}
                        {filled(o.perDayExcludes) && <BulletList label="Per Day Excludes" items={o.perDayExcludes!} />}
                      </div>
                    )}

                    {/* General price includes / excludes */}
                    {(filled(o.priceIncludes) || filled(o.priceExcludes)) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {filled(o.priceIncludes) && <BulletList label="Price Includes" items={o.priceIncludes} />}
                        {filled(o.priceExcludes) && <BulletList label="Price Excludes" items={o.priceExcludes} />}
                      </div>
                    )}
                  </Section>

                  {/* ── Discount ───────────────────────────────────────────── */}
                  {discount !== null && discount !== undefined && (
                    <Section title="Discount" expanded={expanded.discount} onToggle={() => toggle('discount')}>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide font-plus-jakarta">Discount Price</p>
                          <p className="text-lg font-bold text-green-600 font-plus-jakarta">₹{fmt(discount)}</p>
                        </div>
                        {discountPct !== null && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide font-plus-jakarta">Savings</p>
                            <p className="text-lg font-bold text-green-600 font-plus-jakarta">{discountPct}% off</p>
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide font-plus-jakarta">You Save</p>
                          <p className="text-lg font-bold text-green-600 font-plus-jakarta">
                            ₹{fmt(Number(o.regularPrice) - Number(discount))}
                          </p>
                        </div>
                      </div>
                    </Section>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed"><MobileVendorNav /></div>
    </div>
  );
};

export default OfferingDetails;
