import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { getImageUrl } from "@/lib/adminUtils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ComplianceBadge } from "@/components/compliance";
import {
  COMPLIANCE_TONE,
  describeDays,
  complianceHeadline,
  evaluateCompliance,
  formatExpiry,
} from "@/lib/vehicleCompliance";
import { formatINR } from "@/utils/formatCurrency";
import { BTN_DANGER_SOFT, BTN_PRIMARY, EYEBROW } from "./adminUI";
import {
  AdminDetailDrawer,
  DetailField,
  DetailList,
  DetailPhotos,
  DetailSection,
} from "./AdminDetailDrawer";
import {
  collectReviewPhotos,
  extraSubmissionFields,
  mergeListingForReview,
  missingForApproval,
} from "./listingReview";
import { ReviewExtraField } from "./ReviewValue";

/**
 * Listing inspector.
 *
 * Was a 5xl centred modal — the widest surface in the admin — sitting on top of
 * the listings table with its own grey/white palette and a teal pricing panel
 * left over from an earlier skin. It is now the widest drawer (`xl`), which is
 * still narrower than the modal was but keeps the queue of pending listings
 * visible beside it: reviewing a submission is a comparison task, and the row
 * above ("is this the third caravan from this vendor today?") is context the
 * modal deleted.
 *
 * Every section, fallback chain and conditional from the modal is preserved —
 * only the container and the styling changed. Approve / Reject move to the
 * drawer footer, where they stay pinned instead of scrolling away below a
 * photo gallery.
 */

interface ViewDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  listingData?: any;
  /** While the full listing is being fetched, the drawer body shimmers. */
  isLoading?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  /** Approve request is in flight — spins the button and blocks both actions. */
  isApproving?: boolean;
  /** Walk the filtered list without closing. */
  position?: { index: number; total: number };
  onPrev?: () => void;
  onNext?: () => void;
  /**
   * Which console is rendering this inspector — defaults to the admin's blue.
   * The vendor console renders the same one for its own offerings and passes
   * `"vendor"`, since a listing is a listing and forking it would give the two
   * consoles two different renderings of one record.
   */
  portalScope?: "admin" | "vendor";
  /** Escape hatch for a one-off token set. Overrides `portalScope`'s vars. */
  portalStyle?: React.CSSProperties;
  /**
   * Opens the expiry-date dialog from the compliance section. Omitted where
   * the viewer cannot renew, which hides the button rather than disabling it.
   */
  onRenewCompliance?: () => void;
}

/* ── Value helpers (unchanged) ────────────────────────────────────────────── */
const has = (v: any) => v !== undefined && v !== null && v !== "";
const uniq = (arr: string[]) => Array.from(new Set(arr));

const toArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((v) => String(v)).filter(Boolean);
  if (typeof val === "string") {
    if (val.includes("\n"))
      return val
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [String(val)];
};

const getPhotos = (data: any): string[] => {
  const photoSource = data?.photos || data?.images;
  if (!photoSource) return [];
  let extracted: string[] = [];
  if (photoSource.coverUrl || photoSource.galleryUrls) {
    if (photoSource.coverUrl) extracted.push(photoSource.coverUrl);
    if (Array.isArray(photoSource.galleryUrls))
      extracted = [...extracted, ...photoSource.galleryUrls];
  } else if (Array.isArray(photoSource)) {
    extracted = photoSource;
  } else if (typeof photoSource === "object") {
    Object.values(photoSource).forEach((val) => {
      if (typeof val === "string") extracted.push(val);
      if (Array.isArray(val)) val.forEach((v) => typeof v === "string" && extracted.push(v));
    });
  }
  return extracted.filter(Boolean).map((p) => getImageUrl(p));
};

const DISCOUNT_SLOTS: [string, string][] = [
  ["firstUser", "First User"],
  ["festival", "Festival"],
  ["weekly", "Weekly"],
  ["special", "Special"],
];

/** Labelled block for free-form groups that aren't label/value pairs. */
const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="col-span-full space-y-2">
    <h4 className={EYEBROW}>{title}</h4>
    {children}
  </div>
);

const ViewDetailsPopup: React.FC<ViewDetailsPopupProps> = ({
  isOpen,
  onClose,
  listingData,
  isLoading,
  onApprove,
  onReject,
  isApproving = false,
  position,
  onPrev,
  onNext,
  portalScope,
  portalStyle,
  onRenewCompliance,
}) => {
  if (!isOpen) return null;

  /* The offer folded together with the submission it was created from.
     `GET /api/offers/:id` attaches that submission for admins and the listing's
     own vendor, because an Offer is a lossy projection of the wizard — 129
     submitted fields across the four service types have no column on it,
     including the entire business identity and personal KYC block. Merging here
     rather than in each section is what makes the existing "Business details"
     and "Personal details" sections populate at all: they always read the right
     keys, the keys were simply never in the payload. */
  const d = mergeListingForReview(listingData);

  /* Cover + gallery + per-room photos, deduped. Not `getPhotos(d)` alone: the
     submit handlers cap `Offer.photos.galleryUrls` at six, so a vendor who
     uploaded twelve had half of them invisible to the reviewer. */
  const photos = Array.from(
    new Set([...getPhotos(d), ...collectReviewPhotos(d).map((u) => getImageUrl(u))]),
  );

  /* Required information that is absent. Surfaced, never blocking — an admin
     may have a reason to approve anyway, but not without being told.
     Only computed once the submission is actually attached: the vendor console
     renders this same drawer straight from a LIST row, which legitimately
     carries no business or KYC fields, and judging completeness from a partial
     record would report seven missing fields on a complete listing. */
  const missing = d.__submission ? missingForApproval(d) : [];

  /* Whatever the vendor submitted that no section below claims. Keeps the
     promise that a field added to a wizard cannot become invisible here. */
  const extras = extraSubmissionFields(d);
  const rcPhotos = toArray(d.rcPhotos).map((p) => getImageUrl(p));
  /* KYC and driver documents. Both live on the submission only, so before the
     submission was attached there was nothing to render — which is why they had
     no section despite being the point of a KYC review. */
  const idPhotos = toArray(d.idPhotos).map((p) => getImageUrl(p));
  const licencePhotos = toArray(d.driverLicencePhotos).map((p) => getImageUrl(p));
  const hasDriver =
    has(d.driverName) || has(d.driverPhone) || has(d.driverLicenceNumber) || licencePhotos.length > 0;

  const rules = toArray(d.rules || d.rulesAndRegulations || d.policies?.rules);
  /* House rules the vendor marked optional. Stay onboarding has always
     collected these; they only started reaching the Offer once the field was
     declared on the schema, so older rows show none until the backfill runs. */
  const optionalRules = toArray(d.optionalRules);
  const features = toArray(d.features || d.amenities || d.requirements);
  const expectations = toArray(d.expectations);
  const includes = uniq([...toArray(d.priceIncludes), ...toArray(d.included)]);
  const excludes = uniq([...toArray(d.priceExcludes), ...toArray(d.excluded)]);

  // Caravan pricing block
  const perKmInc = toArray(d.perKmIncludes);
  const perKmExc = toArray(d.perKmExcludes);
  const perDayInc = toArray(d.perDayIncludes);
  const perDayExc = toArray(d.perDayExcludes);
  const hasCaravanPricing =
    has(d.perKmCharge) ||
    has(d.perDayCharge) ||
    perKmInc.length > 0 ||
    perKmExc.length > 0 ||
    perDayInc.length > 0 ||
    perDayExc.length > 0;

  /* Per-room breakdown. An `individual` stay carries its real capacity and
     price here — the top-level numbers are a rollup — so a drawer that showed
     only those was describing the property and not what is actually bookable. */
  const rooms: any[] = Array.isArray(d.rooms) ? d.rooms.filter(Boolean) : [];

  // ── Vehicle rental ──────────────────────────────────────────────────────
  const vehicleSpecs = (
    [
      ["Class", d.vehicleClass],
      ["Brand", d.brand],
      ["Model", d.model],
      ["Manufacture year", d.manufactureYear],
      ["Registration", d.registrationNumber],
      ["Fuel", d.fuelType],
      ["Transmission", d.transmission],
      ["Air conditioned", has(d.airConditioned) ? (d.airConditioned ? "Yes" : "No") : undefined],
      ["Luggage capacity", d.luggageCapacity],
    ] as [string, any][]
  ).filter(([, v]) => has(v));
  const pickupPoints = toArray(d.pickupPoints);

  /* The two rate cards are independent — a vendor can offer either or both —
     so each renders only when its mode is on, rather than showing an empty
     chauffeur block on a self-drive-only listing. */
  const selfDriveRates = (
    [
      ["Per day", has(d.selfDrivePerDay) ? formatINR(Number(d.selfDrivePerDay)) : undefined],
      ["Per km", has(d.selfDrivePerKm) ? formatINR(Number(d.selfDrivePerKm)) : undefined],
      ["Free km / day", d.freeKmPerDay],
      ["Extra km", has(d.extraKmCharge) ? formatINR(Number(d.extraKmCharge)) : undefined],
      ["Security deposit", has(d.securityDeposit) ? formatINR(Number(d.securityDeposit)) : undefined],
      ["Minimum rental", has(d.minRentalHours) ? `${d.minRentalHours} hours` : undefined],
    ] as [string, any][]
  ).filter(([, v]) => has(v));

  const withDriverRates = (
    [
      ["Per km", has(d.withDriverPerKm) ? formatINR(Number(d.withDriverPerKm)) : undefined],
      ["Per day", has(d.withDriverPerDay) ? formatINR(Number(d.withDriverPerDay)) : undefined],
      [
        "Driver allowance",
        has(d.driverAllowancePerDay) ? `${formatINR(Number(d.driverAllowancePerDay))} / day` : undefined,
      ],
      ["Night charge after", has(d.nightChargeAfter) ? `${d.nightChargeAfter}:00` : undefined],
      ["Outstation per km", has(d.outstationPerKm) ? formatINR(Number(d.outstationPerKm)) : undefined],
      [
        "Trips",
        d.withDriverTwoWay ? "Two way" : d.withDriverOneWay ? "One way" : undefined,
      ],
    ] as [string, any][]
  ).filter(([, v]) => has(v));

  const policies = (
    [
      ["Fuel policy", d.fuelPolicy],
      ["Tolls & parking", d.tollsAndParking],
      [
        "Free cancellation",
        has(d.cancellationWindowHours) ? `${d.cancellationWindowHours} hours before` : undefined,
      ],
    ] as [string, any][]
  ).filter(([, v]) => has(v));

  const hasVehicleDetail =
    vehicleSpecs.length > 0 ||
    pickupPoints.length > 0 ||
    d.selfDriveEnabled ||
    d.withDriverEnabled ||
    selfDriveRates.length > 0 ||
    withDriverRates.length > 0 ||
    policies.length > 0;

  // Address
  const address =
    typeof d.address === "string" && d.address
      ? d.address
      : [d.locality, d.city, d.state, d.pincode, d.country || "India"].filter(Boolean).join(", ");

  // Prices
  const regPrice = d.regularPrice ?? d.pricing?.basePrice ?? d.price;
  const finPrice = d.finalPrice ?? d.discountPrice ?? d.salePrice ?? d.discountedPrice;
  const perNightOrPerson = d.category?.toLowerCase() === "activity" ? "Per Person" : "Per Night";

  // Property / capacity details (render only what's present)
  const propertyDetails = (
    [
      ["Seating capacity", d.seatingCapacity],
      ["Sleeping capacity", d.sleepingCapacity],
      ["Guest capacity", d.guestCapacity ?? d.personCapacity ?? d.maxParticipants],
      ["No. of beds", d.numberOfBeds],
      ["No. of rooms", d.numberOfRooms],
      ["No. of bathrooms", d.numberOfBathrooms],
      ["Stay type", d.stayType],
      ["Duration", d.timeDuration || d.duration],
    ] as [string, any][]
  ).filter(([, v]) => has(v));

  // Active discount slots (real schema shape: discounts.{firstUser,festival,…})
  const activeDiscounts = DISCOUNT_SLOTS.map(([key, label]) => ({
    key,
    label,
    ...(d.discounts?.[key] || {}),
  })).filter((x) => x.enabled);

  const createdAt = d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN") : null;
  const place = [d.locality, d.city, d.state].filter(Boolean).join(", ");

  /* Vehicle rental compliance. Null for every other service type, which is
     also the test for whether the section renders at all. */
  const compliance = evaluateCompliance(d);

  /* The wizards store an address twice over: sometimes as one string, and
     always as separate locality / city / state / pincode fields. Compose the
     parts when the single field is absent, so the reviewer sees one readable
     address instead of four loose values in the catch-all below. */
  const joinAddress = (...parts: unknown[]) =>
    parts
      .map((v) => (typeof v === "string" ? v.trim() : v ? String(v) : ""))
      .filter(Boolean)
      .join(", ");

  const businessAddress =
    d.businessDetails?.address ||
    d.businessAddress ||
    joinAddress(d.businessLocality, d.businessCity, d.businessState, d.businessPincode);

  const personalAddress =
    d.personalDetails?.address ||
    d.personalAddress ||
    joinAddress(
      d.personalLocality,
      d.personalCity,
      d.personalState,
      d.personalPincode,
      d.personalCountry,
    );

  /* The vendor account behind the listing. Attached by the detail endpoint
     independently of the submission, so it is the one identity that resolves
     even for a listing seeded or created straight through the admin. */
  const vendorAccount = d.__vendor;

  const hasBusiness = d.businessDetails || d.brandName || d.businessEmail || d.businessName;
  const hasPersonal = d.personalDetails || d.personName || d.firstName;

  return (
    <AdminDetailDrawer
      open={isOpen}
      onClose={onClose}
      eyebrow="Listing"
      title={d.name || d.title || "Listing details"}
      subtitle={[d.category, place].filter(Boolean).join(" · ") || undefined}
      status={
        has(d.status) || compliance ? (
          <span className="flex flex-wrap items-center justify-end gap-1.5">
            {has(d.status) && <StatusBadge status={d.status} />}
            <ComplianceBadge listing={d} />
          </span>
        ) : undefined
      }
      /* `lg`, not `xl`: at 920px the panel swallowed the review queue it is
         meant to be read against, which is the whole reason this stopped being
         a modal. 720px still fits the three-up overview and a four-across
         photo grid. */
      width="lg"
      portalScope={portalScope}
      portalStyle={portalStyle}
      loading={isLoading || !listingData}
      media={
        photos[0] ? (
          <img
            src={photos[0]}
            alt=""
            className="w-11 h-11 rounded-lg object-cover ring-1 ring-black/[0.06]"
          />
        ) : undefined
      }
      position={position}
      onPrev={onPrev}
      onNext={onNext}
      footer={
        onReject || onApprove ? (
          <>
            {onReject && (
              <button onClick={onReject} disabled={isApproving} className={BTN_DANGER_SOFT}>
                Reject
              </button>
            )}
            {onApprove && (
              <button onClick={onApprove} disabled={isApproving} className={BTN_PRIMARY}>
                {isApproving && <Loader2 size={15} className="animate-spin" />}
                {isApproving ? "Approving…" : "Approve"}
              </button>
            )}
          </>
        ) : undefined
      }
    >
      {missing.length > 0 && (
        <div className="mb-1 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 dark:border-amber-400/30 dark:bg-amber-400/[0.08]">
          <p className="flex items-center gap-2 text-[12.5px] font-bold text-amber-900 dark:text-amber-200">
            <AlertTriangle size={14} strokeWidth={2.3} />
            {missing.length} required {missing.length === 1 ? "field is" : "fields are"} missing
            from this submission
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {missing.map((m) => (
              <li
                key={m.label}
                className="text-[12px] text-amber-900/90 dark:text-amber-200/85"
              >
                <span className="font-semibold">{m.label}</span>
                <span className="opacity-70"> — {m.hint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <DetailSection title="Overview" columns={3}>
        <DetailField label="Name" value={d.name || d.title} />
        <DetailField label="Category" value={d.category} />
        <DetailField label="Vendor ID" value={d.vendorId} />
        <DetailField label="Created" value={createdAt ?? ""} />
        <DetailField label="Listing ID" value={d._id} />
        <DetailField label="Address" value={address} full />
        {has(d.description) && (
          <Block title="Description">
            <p className="text-[13px] leading-relaxed text-app-fg whitespace-pre-wrap">
              {d.description}
            </p>
          </Block>
        )}
        {has(d.rejectionReason) && (
          <div className="col-span-full rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 dark:border-red-500/30 dark:bg-red-500/10">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-red-700 dark:text-red-300 mb-1">
              Rejection / cancellation reason
            </h4>
            <p className="text-[13px] leading-relaxed text-red-800 dark:text-red-200">
              {d.rejectionReason}
            </p>
          </div>
        )}
      </DetailSection>

      {/* Location as discrete values, not just the composed line in Overview:
          a reviewer checking whether a listing belongs in the city it claims
          needs to read the parts, and a wrong pincode is invisible inside a
          run-on address string. No map here — no flow collects coordinates. */}
      <DetailSection title="Location" columns={3}>
        <DetailField label="Locality" value={d.locality} />
        <DetailField label="City" value={d.city} />
        <DetailField label="State" value={d.state} />
        <DetailField label="Pincode" value={d.pincode} />
        <DetailField label="Country" value={d.country || "India"} />
        <DetailField label="Full address" value={address} full />
      </DetailSection>

      <DetailSection title="Pricing" columns={3}>
        <DetailField
          label={`Regular price · ${perNightOrPerson}`}
          value={
            has(regPrice) ? (
              <span className="tabular-nums">{formatINR(Number(regPrice))}</span>
            ) : (
              ""
            )
          }
        />
        <DetailField
          label="Final price"
          value={
            has(finPrice) ? (
              <span className="text-[15px] font-bold text-app-fg tabular-nums">
                {formatINR(Number(finPrice))}
              </span>
            ) : (
              ""
            )
          }
        />
        {includes.length > 0 && (
          <Block title="Price includes">
            <DetailList items={includes} />
          </Block>
        )}
        {excludes.length > 0 && (
          <Block title="Price excludes">
            <DetailList items={excludes} />
          </Block>
        )}
      </DetailSection>

      {activeDiscounts.length > 0 && (
        <DetailSection title="Discount offers">
          {activeDiscounts.map((disc) => (
            <div
              key={disc.key}
              className="col-span-1 rounded-lg border border-app-border bg-app-surface-2/50 px-3.5 py-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-app-fg">{disc.label}</span>
                <span className="rounded-full bg-app-accent-soft px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-app-accent">
                  {disc.type || "percentage"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DetailField
                  label="Value"
                  value={
                    has(disc.value)
                      ? disc.type === "fixed"
                        ? `₹${disc.value}`
                        : `${disc.value}%`
                      : ""
                  }
                />
                <DetailField
                  label="Final price"
                  value={has(disc.finalPrice) ? `₹${disc.finalPrice}` : ""}
                />
              </div>
            </div>
          ))}
        </DetailSection>
      )}

      {hasVehicleDetail && (
        <DetailSection title="Vehicle" columns={3}>
          {vehicleSpecs.map(([label, value]) => (
            <DetailField key={label} label={label} value={String(value)} />
          ))}
          {pickupPoints.length > 0 && (
            <Block title="Pickup points">
              <DetailList items={pickupPoints} />
            </Block>
          )}
        </DetailSection>
      )}

      {hasVehicleDetail && (
        <DetailSection title="Rental modes and rates" columns={3}>
          <DetailField
            label="Modes offered"
            value={
              [d.selfDriveEnabled && "Self-drive", d.withDriverEnabled && "With driver"]
                .filter(Boolean)
                .join(" · ") || "—"
            }
            full
          />

          {(d.selfDriveEnabled || selfDriveRates.length > 0) && (
            <>
              {selfDriveRates.map(([label, value]) => (
                <DetailField key={`sd-${label}`} label={`Self-drive · ${label}`} value={value} />
              ))}
              {toArray(d.selfDriveIncludes).length > 0 && (
                <Block title="Self-drive includes">
                  <DetailList items={toArray(d.selfDriveIncludes)} />
                </Block>
              )}
              {toArray(d.selfDriveExcludes).length > 0 && (
                <Block title="Self-drive excludes">
                  <DetailList items={toArray(d.selfDriveExcludes)} />
                </Block>
              )}
            </>
          )}

          {(d.withDriverEnabled || withDriverRates.length > 0) && (
            <>
              {withDriverRates.map(([label, value]) => (
                <DetailField key={`wd-${label}`} label={`With driver · ${label}`} value={value} />
              ))}
              {toArray(d.withDriverIncludes).length > 0 && (
                <Block title="With driver includes">
                  <DetailList items={toArray(d.withDriverIncludes)} />
                </Block>
              )}
              {toArray(d.withDriverExcludes).length > 0 && (
                <Block title="With driver excludes">
                  <DetailList items={toArray(d.withDriverExcludes)} />
                </Block>
              )}
            </>
          )}

          {policies.map(([label, value]) => (
            <DetailField key={label} label={label} value={String(value)} />
          ))}
        </DetailSection>
      )}

      {hasCaravanPricing && (
        <DetailSection title="Caravan pricing" columns={4}>
          <DetailField
            label="Per day charge"
            value={has(d.perDayCharge) ? <span className="tabular-nums">₹{d.perDayCharge}</span> : ""}
          />
          <DetailField
            label="Per km charge"
            value={has(d.perKmCharge) ? <span className="tabular-nums">₹{d.perKmCharge}</span> : ""}
          />
          {perDayInc.length > 0 && (
            <Block title="Per day includes">
              <DetailList items={perDayInc} />
            </Block>
          )}
          {perDayExc.length > 0 && (
            <Block title="Per day excludes">
              <DetailList items={perDayExc} />
            </Block>
          )}
          {perKmInc.length > 0 && (
            <Block title="Per km includes">
              <DetailList items={perKmInc} />
            </Block>
          )}
          {perKmExc.length > 0 && (
            <Block title="Per km excludes">
              <DetailList items={perKmExc} />
            </Block>
          )}
        </DetailSection>
      )}

      {propertyDetails.length > 0 && (
        <DetailSection title="Property & capacity" columns={4}>
          {propertyDetails.map(([label, value]) => (
            <DetailField key={label} label={label} value={String(value)} />
          ))}
        </DetailSection>
      )}

      {rooms.length > 0 && (
        <DetailSection title={`Rooms (${rooms.length})`}>
          <div className="col-span-full space-y-2">
            {rooms.map((room: any, i: number) => {
              const stats = [
                has(room?.guestCapacity ?? room?.capacity)
                  ? `${room.guestCapacity ?? room.capacity} guests`
                  : null,
                has(room?.beds ?? room?.bedCount) ? `${room.beds ?? room.bedCount} beds` : null,
                has(room?.bathrooms) ? `${room.bathrooms} bath` : null,
                has(room?.price) && Number(room.price) > 0 ? formatINR(Number(room.price)) : null,
                Array.isArray(room?.photos) && room.photos.length
                  ? `${room.photos.length} photos`
                  : null,
              ].filter(Boolean);
              return (
                <div
                  key={room?.id || i}
                  className="rounded-lg border border-app-border bg-app-surface-2/60 px-3.5 py-2.5"
                >
                  <p className="text-[13px] font-semibold text-app-fg">
                    {String(room?.name || "").trim() || `Room ${i + 1}`}
                  </p>
                  {stats.length > 0 && (
                    <p className="mt-0.5 text-[12px] text-app-fg-muted">{stats.join(" · ")}</p>
                  )}
                  {has(room?.description) && (
                    <p className="mt-1 text-[12.5px] leading-relaxed text-app-fg">
                      {room.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </DetailSection>
      )}

      {photos.length > 0 && (
        <DetailSection title={`Photos (${photos.length})`}>
          <DetailPhotos photos={photos} label="listing photo" />
        </DetailSection>
      )}

      {compliance && (
        <DetailSection title="Compliance documents" columns={2}>
          <div
            className={`col-span-full rounded-lg border px-3.5 py-3 ${COMPLIANCE_TONE[compliance.state].band}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-[13px] leading-relaxed text-app-fg max-w-[46ch]">
                {complianceHeadline(compliance)}
              </p>
              {onRenewCompliance && compliance.state !== "ok" && (
                <button
                  onClick={onRenewCompliance}
                  className="h-8 shrink-0 rounded-lg bg-app-accent px-3 text-[12.5px] font-semibold
                    text-app-accent-fg outline-none transition-colors hover:bg-app-accent-hover
                    focus-visible:ring-4 focus-visible:ring-app-accent/25"
                >
                  Update dates
                </button>
              )}
            </div>
            {compliance.onHold && d.complianceHold?.since && (
              <p className="mt-2 text-[12px] text-app-fg-muted">
                Removed automatically on{" "}
                {new Date(d.complianceHold.since).toLocaleDateString("en-IN")}.
              </p>
            )}
          </div>

          {compliance.docs.map((doc) => (
            <DetailField
              key={doc.key}
              label={`${doc.label} valid until`}
              value={
                <span className="inline-flex items-center gap-2">
                  {formatExpiry(doc.expiry)}
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold ${
                      doc.state === "expired" || doc.state === "missing"
                        ? "text-red-600 dark:text-red-400"
                        : doc.state === "expiring"
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-app-fg-subtle"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        COMPLIANCE_TONE[
                          doc.state === "absent" || doc.state === "ok" ? "ok" : doc.state
                        ].dot
                      }`}
                    />
                    {describeDays(doc.days)}
                  </span>
                </span>
              }
            />
          ))}

          {rcPhotos.length > 0 && (
            <Block title={`Registration certificate (${rcPhotos.length})`}>
              <DetailPhotos photos={rcPhotos} label="registration certificate" />
            </Block>
          )}
        </DetailSection>
      )}

      {/* Chauffeur details. Collected only when the vendor enabled the
          with-driver rate card, and required in that case — a self-drive-only
          listing has no driver, so the section stays hidden rather than
          rendering four empty fields. */}
      {hasDriver && (
        <DetailSection title="Driver" columns={3}>
          <DetailField label="Driver name" value={d.driverName} />
          <DetailField label="Driver phone" value={d.driverPhone} />
          <DetailField label="Licence number" value={d.driverLicenceNumber} />
          {licencePhotos.length > 0 && (
            <Block title={`Driving licence (${licencePhotos.length})`}>
              <DetailPhotos photos={licencePhotos} label="driving licence" />
            </Block>
          )}
        </DetailSection>
      )}

      {(features.length > 0 ||
        rules.length > 0 ||
        optionalRules.length > 0 ||
        expectations.length > 0) && (
        <DetailSection title="Details">
          {features.length > 0 && (
            <Block title={d.category ? `${d.category} features` : "Features"}>
              <p className="text-[13px] leading-relaxed text-app-fg">{features.join(", ")}</p>
            </Block>
          )}
          {expectations.length > 0 && (
            <Block title="What to expect">
              <DetailList items={expectations} />
            </Block>
          )}
          {rules.length > 0 && (
            <Block title={optionalRules.length > 0 ? "House rules" : "Rules & regulations"}>
              <DetailList items={rules} />
            </Block>
          )}
          {optionalRules.length > 0 && (
            <Block title="Optional rules">
              <DetailList items={optionalRules} />
            </Block>
          )}
        </DetailSection>
      )}

      {/* Vendor account — who is being approved, as opposed to what.
          Rendered before the wizard's own business block because this is the
          record of account: for a listing with no onboarding submission it is
          the only identity available, and where both exist it is the one that
          survived registration. */}
      {vendorAccount && (
        <DetailSection title="Vendor account" columns={3}>
          <DetailField label="Vendor ID" value={vendorAccount.vendorId} />
          <DetailField label="Brand name" value={vendorAccount.brandName} />
          <DetailField label="Contact person" value={vendorAccount.personName} />
          <DetailField
            label="Email"
            value={
              vendorAccount.email ? (
                <a href={`mailto:${vendorAccount.email}`} className="text-app-accent hover:underline">
                  {vendorAccount.email}
                </a>
              ) : (
                ""
              )
            }
          />
          <DetailField label="Phone" value={vendorAccount.phone} />
          <DetailField
            label="Account status"
            value={vendorAccount.status ? <StatusBadge status={vendorAccount.status} /> : ""}
          />
          <DetailField label="Location" value={vendorAccount.location} full />
          {Array.isArray(vendorAccount.servicesOffered) &&
            vendorAccount.servicesOffered.length > 0 && (
              <Block title="Services offered">
                <DetailList items={vendorAccount.servicesOffered.map(String)} />
              </Block>
            )}
        </DetailSection>
      )}

      {hasBusiness && (
        <DetailSection title="Business details">
          <DetailField
            label="Business name"
            value={d.businessDetails?.name || d.brandName || d.businessName}
          />
          <DetailField
            label="Email"
            value={d.businessDetails?.email || d.businessEmail || d.email}
          />
          <DetailField
            label="Phone"
            value={d.businessDetails?.phone || d.businessPhone || d.phone || d.phoneNumber}
          />
          {/* The trading name and the registered entity are different things,
              and the registered one is what a GST number has to match. */}
          <DetailField
            label="Legal company name"
            value={d.legalCompanyName || d.companyName}
          />
          <DetailField label="GST number" value={d.businessDetails?.gst || d.gstNumber} />
          <DetailField
            label="Business address"
            value={businessAddress}
            full
          />
        </DetailSection>
      )}

      {hasPersonal && (
        <DetailSection title="Personal details">
          <DetailField
            label="Full name"
            value={
              d.personalDetails?.name ||
              d.personName ||
              (d.firstName ? `${d.firstName} ${d.lastName || ""}`.trim() : "")
            }
          />
          <DetailField
            label="Date of birth"
            value={
              d.personalDetails?.dob || d.dateOfBirth
                ? new Date(d.personalDetails?.dob || d.dateOfBirth).toLocaleDateString("en-IN")
                : ""
            }
          />
          <DetailField
            label="Marital status"
            value={
              d.personalDetails?.maritalStatus || d.maritalStatus ? (
                <span className="capitalize">
                  {d.personalDetails?.maritalStatus || d.maritalStatus}
                </span>
              ) : (
                ""
              )
            }
          />
          {(d.personalDetails?.idProof || d.idProof) && (
            <DetailField
              label="ID proof"
              value={
                <a
                  href={getImageUrl(d.personalDetails?.idProof || d.idProof)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-app-accent hover:underline"
                >
                  View document
                </a>
              }
            />
          )}
          <DetailField
            label="Personal address"
            value={personalAddress}
            full
          />
          {/* The scans behind the ID proof. A KYC review that shows the document
              TYPE but not the document is not a review. */}
          {idPhotos.length > 0 && (
            <Block title={`ID photos (${idPhotos.length})`}>
              <DetailPhotos photos={idPhotos} label="ID photo" />
            </Block>
          )}
        </DetailSection>
      )}

      {/* Everything else the vendor submitted. Rendered generically by shape —
          strings, numbers, booleans, dates, URLs, string arrays, arrays of
          objects and nested objects all get a readable presentation. This is
          the section that makes the drawer complete by default instead of by
          maintenance: a new wizard field lands here on its own. */}
      {extras.length > 0 && (
        <DetailSection title="Also submitted by the vendor" columns={2}>
          {extras.map((field) => (
            <ReviewExtraField key={field.key} field={field} />
          ))}
        </DetailSection>
      )}
    </AdminDetailDrawer>
  );
};

export default ViewDetailsPopup;
