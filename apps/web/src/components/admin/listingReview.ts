/**
 * What the admin needs to see before approving a listing.
 *
 * The problem this solves. An `Offer` is a LOSSY projection of what the vendor
 * filled in. The four onboarding wizards collect the business identity (brand,
 * legal company, GST, business email/phone), a personal KYC block (name, date
 * of birth, marital status, ID proof + photos), the vendor's own category and
 * feature picks, and raw per-flow discount fields — and none of those have a
 * home on `Offer`. Across the four service types **129 submitted fields never
 * reach it**. The approval drawer reads the `Offer`, so it could not show them:
 * its "Business details" and "Personal details" sections have existed all along
 * and never once populated for an onboarding-created listing. Listings were
 * being approved without anyone seeing who they belonged to.
 *
 * Patching the projection field by field is what has been happening
 * (`categoryFromOnboarding`, `addressFromOnboarding`, `coverUrlFor`,
 * `optionalRules`) and it loses to 129. So `GET /api/offers/:id` now attaches
 * the source `submission` for admins and the listing's own vendor, and this
 * module folds the two into one record to review.
 *
 * The design rule is "nothing disappears silently": the curated sections render
 * the fields worth laying out by hand, and everything else on the submission
 * falls through to a generic renderer. A field added to a wizard tomorrow shows
 * up in the drawer on its own — at worst in the wrong section, never nowhere.
 */

/** A value the admin should be shown. Empty string / empty array count as absent. */
export function isPresent(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as object).length > 0;
  return true;
}

export interface VendorAccount {
  vendorId?: string;
  brandName?: string;
  personName?: string;
  email?: string;
  phone?: string;
  location?: string;
  status?: string;
  servicesOffered?: string[];
}

export interface ListingWithSubmission {
  submission?: Record<string, unknown> | null;
  submissionModel?: string | null;
  /** The vendor account of record, attached independently of the submission. */
  vendor?: VendorAccount | null;
  [key: string]: unknown;
}

/**
 * The merged record the drawer reads.
 *
 * Indexed as `any` on purpose, matching `ViewDetailsPopup`'s existing
 * `listingData?: any`: an Offer plus a submission is a sprawling legacy payload
 * with four service types' worth of optional keys and several
 * `businessDetails?.phone`-style fallback chains, and the Mongoose schemas are
 * the record of truth. The functions in this module that actually inspect
 * values take `unknown` explicitly, so the loose index signature does not leak
 * into the type-checking that matters.
 */
export type ReviewRecord = Record<string, any> & {
  /** The raw submission, kept so the catch-all can enumerate it. */
  __submission?: Record<string, unknown> | null;
  /** The vendor account of record, present even when no submission exists. */
  __vendor?: VendorAccount | null;
  /* Declared rather than left to the index signature so the record satisfies
     `ComplianceSource` structurally — TypeScript's weak-type check rejects an
     all-optional target that shares no named property with the source. */
  serviceType?: string;
  insuranceExpiry?: string | Date | null;
  pucExpiry?: string | Date | null;
  complianceHold?: {
    active?: boolean;
    documents?: string[];
    since?: string;
    previousStatus?: string;
  };
};

/**
 * Fold the submission into the offer.
 *
 * Precedence is deliberate: where the `Offer` holds a real value it wins,
 * because the Offer is the record that goes live and the transform into it is
 * intentional (a parsed numeric price, a normalised `photos.coverUrl`). The
 * submission fills every gap. So the admin sees what the system will publish,
 * plus everything the vendor said that the system dropped.
 */
export function mergeListingForReview(
  listing: ListingWithSubmission | null | undefined,
): ReviewRecord {
  if (!listing || typeof listing !== "object") return {};

  const { submission, submissionModel, vendor, ...offer } = listing;
  if (!submission || typeof submission !== "object") {
    return { ...offer, __submission: null, __vendor: vendor ?? null };
  }

  // Start from the raw truth, then let the offer's real values overwrite it.
  const merged: ReviewRecord = { ...submission };
  for (const [key, value] of Object.entries(offer)) {
    if (isPresent(value) || !(key in merged)) merged[key] = value;
  }

  merged.__submission = submission;
  merged.__vendor = vendor ?? null;
  merged.submissionModel = submissionModel ?? null;
  return merged;
}

/**
 * Every photo the vendor uploaded, from wherever it ended up.
 *
 * `Offer.photos.galleryUrls` is capped at six by the submit handlers
 * (`strPhotos.slice(0, 6)`), so a vendor who uploaded twelve had six of them
 * invisible at approval time. The submission keeps the full set — under a
 * different key per flow, and for a stay inside `rooms[].photos`. Union of all
 * of them, cover first, deduped, order preserved.
 */
export function collectReviewPhotos(record: ReviewRecord): string[] {
  const out: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string" && v.trim()) out.push(v.trim());
  };
  const pushAll = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(push);
    else push(v);
  };

  // Cover first — it is the hero and should lead the grid.
  const photos = record.photos as { coverUrl?: string; galleryUrls?: string[] } | undefined;
  if (photos && !Array.isArray(photos)) {
    push(photos.coverUrl);
    pushAll(photos.galleryUrls);
  }
  pushAll(record.coverImage);

  // Per-flow gallery keys: caravan/vehicle/activity use `photos`, stay uses
  // `images` for an entire-stay gallery and per-room arrays otherwise.
  if (Array.isArray(record.photos)) pushAll(record.photos);
  pushAll(record.images);

  const rooms = record.rooms;
  if (Array.isArray(rooms)) {
    for (const room of rooms) {
      if (room && typeof room === "object") pushAll((room as Record<string, unknown>).photos);
    }
  }

  return Array.from(new Set(out));
}

/**
 * Keys the curated sections already render, plus internal noise.
 *
 * The catch-all below shows everything NOT listed here, which makes "show it"
 * the default — the safe direction. Adding a field to this set is a decision to
 * hide it, so it should only ever hold things genuinely rendered elsewhere.
 */
const ALREADY_SHOWN = new Set<string>([
  // identity / plumbing
  "_id", "__v", "__submission", "__vendor", "vendor", "id", "userId", "vendorId",
  "sourceId", "sourceModel",
  "submission", "submissionModel", "createdAt", "updatedAt", "status", "rejectionReason",
  // overview
  "name", "title", "category", "description", "serviceType",
  // location — rendered as one composed address line
  "address", "locality", "city", "state", "pincode", "country", "businessAddress",
  // pricing
  "regularPrice", "finalPrice", "discountPrice", "salePrice", "discountedPrice",
  "priceIncludes", "priceExcludes", "included", "excluded", "discounts", "priceDetails",
  // media
  "photos", "images", "coverImage", "rcPhotos", "idPhotos", "driverLicencePhotos",
  // capacity / property
  "seatingCapacity", "sleepingCapacity", "guestCapacity", "personCapacity", "maxParticipants",
  "numberOfBeds", "numberOfRooms", "numberOfBathrooms", "stayType", "timeDuration", "duration",
  "rooms",
  // caravan pricing
  "perKmCharge", "perDayCharge", "perKmIncludes", "perKmExcludes",
  "perDayIncludes", "perDayExcludes",
  // vehicle identity + rate cards
  "vehicleClass", "brand", "model", "manufactureYear", "registrationNumber", "fuelType",
  "transmission", "airConditioned", "luggageCapacity", "pickupPoints",
  "selfDriveEnabled", "selfDrivePerDay", "selfDrivePerKm", "freeKmPerDay", "extraKmCharge",
  "securityDeposit", "minRentalHours", "selfDriveIncludes", "selfDriveExcludes",
  "withDriverEnabled", "withDriverPerDay", "withDriverPerKm", "withDriverOneWay",
  "withDriverTwoWay", "driverAllowancePerDay", "nightChargeAfter", "outstationPerKm",
  "withDriverIncludes", "withDriverExcludes", "fuelPolicy", "tollsAndParking",
  "cancellationWindowHours",
  // compliance
  "insuranceExpiry", "pucExpiry", "complianceHold", "complianceNotified",
  "driverName", "driverPhone", "driverLicenceNumber",
  // features / rules
  "features", "amenities", "rules", "rulesAndRegulations", "optionalRules", "expectations",
  "requirements", "policies",
  // business / personal
  "businessDetails", "personalDetails", "brandName", "legalCompanyName", "companyName",
  "businessName", "businessEmail", "businessPhone", "gstNumber", "email", "phone",
  "phoneNumber", "personName", "firstName", "lastName", "dateOfBirth", "maritalStatus",
  "idProof", "personalAddress",
  // granular address parts — composed into the two address lines above
  "businessLocality", "businessCity", "businessState", "businessPincode",
  "personalLocality", "personalCity", "personalState", "personalPincode",
  "personalCountry",
  // analytics — never part of a review
  "clicks", "visitors", "ratingsCount", "ratingsSum", "averageRating",
]);

export type ReviewValueKind =
  | "boolean"
  | "date"
  | "number"
  | "url"
  | "text"
  | "list"
  | "objectList"
  | "object";

export interface ReviewField {
  key: string;
  label: string;
  value: unknown;
  kind: ReviewValueKind;
}

const ACRONYMS: Record<string, string> = {
  gst: "GST",
  puc: "PUC",
  rc: "RC",
  id: "ID",
  km: "km",
  ac: "AC",
  url: "URL",
  dob: "DOB",
};

/** `firstUserDiscountType` → "First user discount type"; keeps GST/PUC/RC upper. */
export function humanizeKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/);
  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (ACRONYMS[lower]) return ACRONYMS[lower];
      return i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : lower;
    })
    .join(" ");
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T|$)/;

/** Classify a value so the renderer can pick a presentation for it. */
export function classifyValue(value: unknown): ReviewValueKind {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (value instanceof Date) return "date";
  if (typeof value === "string") {
    if (ISO_DATE.test(value) && !Number.isNaN(Date.parse(value))) return "date";
    if (/^(https?:\/\/|\/uploads\/|data:image\/)/i.test(value)) return "url";
    return "text";
  }
  if (Array.isArray(value)) {
    return value.some((v) => v && typeof v === "object" && !Array.isArray(v))
      ? "objectList"
      : "list";
  }
  if (value && typeof value === "object") return "object";
  return "text";
}

/**
 * Everything the vendor submitted that no curated section claims.
 *
 * Drawn from the submission only — not from the merged record — so the
 * catch-all cannot start echoing derived Offer columns. Sorted by label so the
 * order is stable across records instead of following key insertion order.
 */
export function extraSubmissionFields(record: ReviewRecord): ReviewField[] {
  const submission = record.__submission;
  if (!submission || typeof submission !== "object") return [];

  return Object.entries(submission)
    .filter(([key, value]) => !ALREADY_SHOWN.has(key) && isPresent(value))
    .map(([key, value]) => ({
      key,
      label: humanizeKey(key),
      value,
      kind: classifyValue(value),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export interface MissingRequirement {
  label: string;
  hint: string;
}

/**
 * Required information that is absent, for the banner at the top of a pending
 * review. This does not block approval — an admin may have a reason to approve
 * anyway — it just means nobody can approve incomplete data without being told.
 */
export function missingForApproval(record: ReviewRecord): MissingRequirement[] {
  const gaps: MissingRequirement[] = [];
  const need = (ok: boolean, label: string, hint: string) => {
    if (!ok) gaps.push({ label, hint });
  };
  const any = (...keys: string[]) => keys.some((k) => isPresent(record[k]));

  need(any("name", "title", "propertyName", "activityName"), "Listing name", "No name submitted");
  need(any("category", "selectedCategories", "selectedProperties"), "Category", "Not chosen");
  need(any("city") && any("state"), "City and state", "Incomplete location");
  need(
    Number(record.regularPrice ?? record.finalPrice ?? 0) > 0,
    "Price",
    "No price above zero",
  );
  need(collectReviewPhotos(record).length > 0, "Photos", "No images uploaded");
  need(
    any("brandName", "businessName", "legalCompanyName", "companyName"),
    "Business name",
    "Not provided",
  );
  need(any("businessEmail", "email", "businessPhone", "phone"), "Business contact", "Not provided");

  // Vehicle rentals cannot go live without the documents the sweep polices.
  if (record.serviceType === "vehicle-rental") {
    need(isPresent(record.insuranceExpiry), "Insurance expiry", "Not provided");
    need(isPresent(record.rcPhotos), "Registration certificate", "Not uploaded");
  }

  return gaps;
}
