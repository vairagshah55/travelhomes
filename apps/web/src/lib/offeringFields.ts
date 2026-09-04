/**
 * The offering form registry — ONE definition of the listing field set, shared
 * by every surface that creates or edits an Offer.
 *
 *   admin create/edit   components/admin/ManagementForm.tsx
 *   vendor create       pages/AddOfferings.tsx
 *   vendor edit         pages/EditOfferings.tsx
 *
 * Before this file each surface carried its own idea of the schema, and they
 * drifted the way four hand-maintained copies always do: the vendor edit page
 * was six vehicle fields behind the admin form, the vendor CREATE page had no
 * vehicle-rental tab at all, and a stay created there lost its room counts and
 * its check-in times because no input existed to collect them.
 *
 * A field added here reaches all three surfaces. The admin form renders the
 * registry directly; the vendor wizards render whatever their hand-built steps
 * do not already collect (see `VENDOR_HANDLED` and `vendorFieldsFor`), so a new
 * field cannot silently miss a surface. `offeringFields.spec.ts` enforces that.
 */
import {
  BedDouble,
  Car,
  Clock,
  Images,
  Info,
  IndianRupee,
  ListChecks,
  MapPin,
  Percent,
  ShieldCheck,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ServiceType } from "@/lib/listingKind";

// Mirrors the editable subset of the Offer schema. Index signature keeps any
// extra fields (photos, vendorId, timestamps…) intact so an edit never drops
// data the form doesn't surface.
export interface Offer {
  _id?: string;
  name?: string;
  category?: string;
  status?: string;
  regularPrice?: string | number;
  finalPrice?: string | number;
  description?: string;
  features?: string | string[];
  rules?: string | string[];
  priceIncludes?: string | string[];
  priceExcludes?: string | string[];
  seatingCapacity?: string | number;
  sleepingCapacity?: string | number;
  guestCapacity?: string | number;
  personCapacity?: string | number;
  numberOfBeds?: string | number;
  numberOfRooms?: string | number;
  numberOfBathrooms?: string | number;
  stayType?: string;
  timeDuration?: string;
  perDayCharge?: string | number;
  perKmCharge?: string | number;
  perDayIncludes?: string | string[];
  perDayExcludes?: string | string[];
  perKmIncludes?: string | string[];
  perKmExcludes?: string | string[];
  expectations?: string | string[];
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  vendorId?: string;
  discounts?: Record<string, any>;
  photos?: { coverUrl?: string; galleryUrls?: string[] };
  [key: string]: any;
}

/**
 * Values the Offer schema constrains with an enum — a free-text box here would
 * let an operator save something Mongoose then rejects with a cast error.
 */
export const VEHICLE_CLASS_OPTIONS = [
  { value: "car", label: "Car" },
  { value: "van", label: "Van" },
  { value: "bus", label: "Bus" },
];
export const FUEL_OPTIONS = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"].map((v) => ({
  value: v,
  label: v,
}));
export const TRANSMISSION_OPTIONS = ["Manual", "Automatic"].map((v) => ({ value: v, label: v }));
export const FUEL_POLICY_OPTIONS = [
  { value: "included", label: "Included" },
  { value: "excluded", label: "Excluded" },
  { value: "same-to-same", label: "Same to same" },
];
export const TOLLS_OPTIONS = [
  { value: "included", label: "Included" },
  { value: "on-actuals", label: "On actuals" },
];

/* ── Service type → field relevance ───────────────────────────────────────
   A listing is one of four things, and each uses a different part of this
   schema. Showing "Per km charge" on an activity and "No. of bathrooms" on a
   camper van is what made the old form a 40-field wall: nothing on screen told
   you which fields were actually yours to fill.

   This used to be guessed from the CATEGORY string, which fails on most of the
   real taxonomy — "Havelis", "Palaces" and "A Frame" are stays, "Sedan" and
   "SUV" are vehicle rentals, and none of them contains the word the guess looks
   for, so every one of those listings fell through to "show everything".
   `serviceType` is the field that actually answers this; see lib/listingKind. */
export type Kind = ServiceType;

/* ── Field + section registry ─────────────────────────────────────────────── */
export type Control =
  | "text"
  | "number"
  | "textarea"
  | "tags"
  /* The amenity picker. Its own control rather than `tags`, because the values
     are a CMS list an admin curates (CMS → Features), not free text — typing
     "Wi-Fi" where the catalog says "WiFi" makes a listing invisible to the
     guest filter that matches on the exact string. */
  | "features"
  | "category"
  | "vendor"
  | "serviceType"
  | "select"
  | "switch"
  | "time";

export interface FieldSpec {
  name: string;
  label: string;
  control?: Control;
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** Categories this field belongs to. Omitted = relevant to all of them. */
  only?: Kind[];
  /** Occupy the full width of the section grid. */
  wide?: boolean;
  /** Rendered inside the input, before the value. */
  prefix?: string;
  /** `select` only — the allowed values, which mirror the schema's enum. */
  options?: { value: string; label: string }[];
}

export interface SectionSpec {
  key: string;
  label: string;
  icon: LucideIcon;
  blurb: string;
  /** Columns at ≥768px. Capacity is all short numbers, so it takes three. */
  cols?: 2 | 3;
  fields?: FieldSpec[];
  custom?: "photos" | "discounts" | "rooms" | "compliance";
  /** Scope for a `custom` section, which has no `fields` to derive it from. */
  onlyKinds?: Kind[];
}

export const SECTIONS: SectionSpec[] = [
  {
    key: "basics",
    label: "Basics",
    icon: Info,
    blurb: "What this listing is, and which vendor it belongs to.",
    fields: [
      {
        name: "vendorId",
        label: "Vendor",
        control: "vendor",
        help: "Listings saved without a vendor can't be traced back to an owner.",
      },
      {
        name: "serviceType",
        label: "Service type",
        control: "serviceType",
        required: true,
        help: "Decides which fields apply, and which part of the site the listing appears in.",
      },
      { name: "category", label: "Category", control: "category", required: true },
      {
        name: "name",
        label: "Listing name",
        required: true,
        wide: true,
        placeholder: "e.g. Riverside Camper Van — 4 berth",
      },
      {
        name: "description",
        label: "Description",
        control: "textarea",
        required: true,
        wide: true,
        placeholder: "What makes this worth booking? Shown on the public listing page.",
      },
      {
        name: "features",
        label: "Features",
        control: "features",
        wide: true,
        help: "The catalog for this service type, from CMS → Features. Guests filter on these.",
      },
      {
        name: "rules",
        label: "Rules & regulations",
        control: "tags",
        wide: true,
        placeholder: "No smoking, No pets…",
      },
      {
        name: "optionalRules",
        label: "Optional rules",
        control: "tags",
        wide: true,
        only: ["unique-stay"],
        placeholder: "Quiet hours after 10pm…",
        help: "Shown to guests under their own heading, apart from the house rules.",
      },
    ],
  },
  {
    key: "pricing",
    label: "Pricing",
    icon: IndianRupee,
    blurb: "The headline rate, and what it does and doesn't cover.",
    fields: [
      {
        name: "regularPrice",
        label: "Regular price",
        control: "number",
        required: true,
        prefix: "₹",
        placeholder: "0",
      },
      {
        name: "finalPrice",
        label: "Discounted price",
        control: "number",
        prefix: "₹",
        placeholder: "0",
        help: "Optional. Shown struck through against the regular price.",
      },
      { name: "priceIncludes", label: "Price includes", control: "tags", wide: true },
      { name: "priceExcludes", label: "Price excludes", control: "tags", wide: true },
      {
        name: "perDayCharge",
        label: "Per day charge",
        control: "number",
        prefix: "₹",
        only: ["camper-van"],
      },
      {
        name: "perKmCharge",
        label: "Per km charge",
        control: "number",
        prefix: "₹",
        only: ["camper-van"],
      },
      { name: "perDayIncludes", label: "Per day includes", control: "tags", only: ["camper-van"] },
      { name: "perDayExcludes", label: "Per day excludes", control: "tags", only: ["camper-van"] },
      { name: "perKmIncludes", label: "Per km includes", control: "tags", only: ["camper-van"] },
      { name: "perKmExcludes", label: "Per km excludes", control: "tags", only: ["camper-van"] },
    ],
  },
  {
    key: "capacity",
    label: "Capacity",
    icon: Users,
    blurb: "How many people it takes, and what it's made of.",
    cols: 3,
    fields: [
      { name: "guestCapacity", label: "Guest capacity", control: "number", only: ["unique-stay"] },
      { name: "numberOfRooms", label: "No. of rooms", control: "number", only: ["unique-stay"] },
      { name: "numberOfBathrooms", label: "No. of bathrooms", control: "number", only: ["unique-stay"] },
      {
        name: "numberOfBeds",
        label: "No. of beds",
        control: "number",
        only: ["unique-stay", "camper-van"],
      },
      {
        name: "stayType",
        label: "Stay type",
        only: ["unique-stay"],
        placeholder: "Entire place, Private room…",
      },
      {
        name: "seatingCapacity",
        label: "Seating capacity",
        control: "number",
        only: ["camper-van", "vehicle-rental"],
      },
      {
        name: "sleepingCapacity",
        label: "Sleeping capacity",
        control: "number",
        only: ["camper-van"],
      },
      { name: "personCapacity", label: "Person capacity", control: "number", only: ["activity"] },
      {
        name: "timeDuration",
        label: "Duration",
        only: ["activity"],
        placeholder: "2 hours, 1 day…",
      },
      {
        name: "expectations",
        label: "What to expect",
        control: "tags",
        only: ["activity"],
        wide: true,
        placeholder: "Guide included, Safety gear provided…",
      },
    ],
  },
  {
    /* Its own section rather than tucked under Capacity: an arrival time is not
       a capacity, and `visibleSections` drops a section whose every field is
       scoped away — so this never renders for a vehicle or an activity. */
    key: "stayTimes",
    label: "Check-in & check-out",
    icon: Clock,
    blurb: "Arrival and departure times shown to guests.",
    cols: 2,
    fields: [
      {
        name: "checkInTime",
        label: "Check-in time",
        control: "time",
        only: ["unique-stay"],
        help: "24-hour clock. Shown to guests as e.g. 2:00 PM.",
      },
      {
        name: "checkOutTime",
        label: "Check-out time",
        control: "time",
        only: ["unique-stay"],
      },
    ],
  },
  {
    key: "vehicle",
    label: "Vehicle",
    icon: Car,
    blurb: "What the vehicle is. Fuel, transmission and class are search filters.",
    cols: 3,
    fields: [
      {
        name: "vehicleClass",
        label: "Class",
        control: "select",
        options: VEHICLE_CLASS_OPTIONS,
        only: ["vehicle-rental"],
      },
      { name: "brand", label: "Brand", only: ["vehicle-rental"], placeholder: "Toyota" },
      { name: "model", label: "Model", only: ["vehicle-rental"], placeholder: "Innova Crysta" },
      {
        name: "manufactureYear",
        label: "Manufacture year",
        control: "number",
        only: ["vehicle-rental"],
      },
      {
        name: "registrationNumber",
        label: "Registration number",
        only: ["vehicle-rental"],
        placeholder: "MH12AB1234",
      },
      {
        name: "fuelType",
        label: "Fuel",
        control: "select",
        options: FUEL_OPTIONS,
        only: ["vehicle-rental"],
      },
      {
        name: "transmission",
        label: "Transmission",
        control: "select",
        options: TRANSMISSION_OPTIONS,
        only: ["vehicle-rental"],
      },
      {
        name: "luggageCapacity",
        label: "Luggage capacity",
        control: "number",
        only: ["vehicle-rental"],
      },
      {
        name: "airConditioned",
        label: "Air conditioned",
        control: "switch",
        only: ["vehicle-rental"],
      },
      {
        name: "pickupPoints",
        label: "Pickup points",
        control: "tags",
        wide: true,
        only: ["vehicle-rental"],
      },
    ],
  },
  {
    key: "rates",
    label: "Rental rates",
    icon: IndianRupee,
    blurb: "Self-drive and chauffeur are independent — a listing can offer either or both.",
    cols: 3,
    fields: [
      {
        name: "selfDriveEnabled",
        label: "Self-drive offered",
        control: "switch",
        only: ["vehicle-rental"],
      },
      {
        name: "selfDrivePerDay",
        label: "Self-drive per day",
        control: "number",
        prefix: "₹",
        only: ["vehicle-rental"],
      },
      {
        name: "selfDrivePerKm",
        label: "Self-drive per km",
        control: "number",
        prefix: "₹",
        only: ["vehicle-rental"],
      },
      {
        name: "freeKmPerDay",
        label: "Free km per day",
        control: "number",
        only: ["vehicle-rental"],
      },
      {
        name: "extraKmCharge",
        label: "Extra km charge",
        control: "number",
        prefix: "₹",
        only: ["vehicle-rental"],
      },
      {
        name: "securityDeposit",
        label: "Security deposit",
        control: "number",
        prefix: "₹",
        only: ["vehicle-rental"],
      },
      {
        name: "minRentalHours",
        label: "Minimum rental (hours)",
        control: "number",
        only: ["vehicle-rental"],
      },
      {
        name: "selfDriveIncludes",
        label: "Self-drive includes",
        control: "tags",
        only: ["vehicle-rental"],
      },
      {
        name: "selfDriveExcludes",
        label: "Self-drive excludes",
        control: "tags",
        only: ["vehicle-rental"],
      },
      {
        name: "withDriverEnabled",
        label: "Chauffeur offered",
        control: "switch",
        only: ["vehicle-rental"],
      },
      {
        /* One switch, not two, for a pair that is stored as two booleans:
           exactly one direction is offered, so a second switch could express
           "both" and "neither", neither of which the vendor wizard can produce.
           `withDriverOneWay` is derived as the inverse on save. */
        name: "withDriverTwoWay",
        label: "Two-way trips",
        control: "switch",
        only: ["vehicle-rental"],
        help: "Off means the vehicle is offered for one-way trips only.",
      },
      {
        name: "withDriverPerKm",
        label: "With driver per km",
        control: "number",
        prefix: "₹",
        only: ["vehicle-rental"],
      },
      {
        /* Chauffeur work is quoted per kilometre now, but listings created
           before that carry a day rate and it still feeds the headline price
           fallback in submitVehicle — so it has to be editable, not stranded. */
        name: "withDriverPerDay",
        label: "With driver per day",
        control: "number",
        prefix: "₹",
        only: ["vehicle-rental"],
        help: "Legacy day rate. Leave blank unless this listing already has one.",
      },
      {
        name: "driverAllowancePerDay",
        label: "Driver allowance per day",
        control: "number",
        prefix: "₹",
        only: ["vehicle-rental"],
      },
      {
        name: "nightChargeAfter",
        label: "Night charge after (hour)",
        control: "number",
        only: ["vehicle-rental"],
        help: "0–23. The hour past which the night charge applies.",
      },
      {
        name: "outstationPerKm",
        label: "Outstation per km",
        control: "number",
        prefix: "₹",
        only: ["vehicle-rental"],
      },
      {
        name: "withDriverIncludes",
        label: "With driver includes",
        control: "tags",
        only: ["vehicle-rental"],
      },
      {
        name: "withDriverExcludes",
        label: "With driver excludes",
        control: "tags",
        only: ["vehicle-rental"],
      },
      {
        name: "fuelPolicy",
        label: "Fuel policy",
        control: "select",
        options: FUEL_POLICY_OPTIONS,
        only: ["vehicle-rental"],
      },
      {
        name: "tollsAndParking",
        label: "Tolls & parking",
        control: "select",
        options: TOLLS_OPTIONS,
        only: ["vehicle-rental"],
      },
      {
        name: "cancellationWindowHours",
        label: "Free cancellation (hours)",
        control: "number",
        only: ["vehicle-rental"],
      },
    ],
  },
  {
    key: "location",
    label: "Location",
    icon: MapPin,
    blurb: "Where guests are going. City and state drive search.",
    fields: [
      { name: "city", label: "City", required: true },
      { name: "state", label: "State", required: true },
      { name: "locality", label: "Locality" },
      { name: "pincode", label: "Pincode", placeholder: "6 digits" },
      {
        name: "address",
        label: "Full address",
        control: "textarea",
        wide: true,
        placeholder: "Street, landmark, area…",
      },
    ],
  },
  {
    /* The per-room breakdown, rendered with the SAME `RoomsEditor` the vendor
       edit page uses — identical UI in both consoles by construction rather
       than by two components kept in step by hand. Stays only; `visibleSections`
       hides a custom section via `onlyKinds`. */
    key: "rooms",
    label: "Rooms",
    icon: BedDouble,
    blurb: "Each room's own capacity, price and photos.",
    custom: "rooms",
    onlyKinds: ["unique-stay"],
  },
  {
    key: "photos",
    label: "Photos",
    icon: Images,
    blurb: "The cover is the only image most guests will see.",
    custom: "photos",
  },
  {
    /* Insurance and PUC, plus the paperwork they are checked against.
       `custom` because these are NOT ordinary fields and must never become
       inputs on the generic PUT /api/offers/:id: they have their own endpoint,
       PATCH /api/offers/:id/compliance, which resets the reminder ladder,
       mirrors the dates onto the submission and LIFTS `complianceHold`. A date
       written through the generic update would save and leave the listing dark
       with nobody told. The block renders read-only and hands the edit to
       ComplianceRenewDialog. */
    key: "compliance",
    label: "Documents",
    icon: ShieldCheck,
    blurb: "Insurance and PUC expiry, and the paperwork on file.",
    custom: "compliance",
    onlyKinds: ["vehicle-rental"],
  },
  {
    /* Not vehicles — see the note on WIZARD_STEPS["vehicle-rental"].
       NOTE: no renderer reads `onlyKinds` today (nothing walks SECTIONS as
       sections; the forms walk WIZARD_STEPS, which is keyed per kind, and the
       vendor pages hard-code their custom panels). It is the registry's own
       description of the scope, and `offeringFields.spec.ts` holds the two
       descriptions to each other so they cannot drift. */
    key: "discounts",
    label: "Discounts",
    icon: Percent,
    blurb: "Optional promotional rates, off by default.",
    custom: "discounts",
    onlyKinds: ["unique-stay", "camper-van", "activity"],
  },
];

export const DISCOUNT_SLOTS: { key: string; label: string; blurb: string }[] = [
  { key: "firstUser", label: "First user", blurb: "Applies to a guest's first booking." },
  { key: "festival", label: "Festival", blurb: "Seasonal or holiday rate." },
  { key: "weekly", label: "Weekly", blurb: "For stays of a week or more." },
  { key: "special", label: "Special", blurb: "Anything one-off." },
];

// Comma-separated string ⇄ array fields. Held as arrays in form state now (the
// tag editor works on items, not on a comma string), which also means a value
// containing a comma survives a round-trip.
export const ARRAY_FIELDS = [
  "features",
  "rules",
  "priceIncludes",
  "priceExcludes",
  "expectations",
  "perDayIncludes",
  "perDayExcludes",
  "perKmIncludes",
  "perKmExcludes",
  "optionalRules",
  "pickupPoints",
  "selfDriveIncludes",
  "selfDriveExcludes",
  "withDriverIncludes",
  "withDriverExcludes",
];

// Fields the DB stores as Number — strip empty strings so Mongoose doesn't try
// to cast "" → NaN (which fails the update).
export const NUMERIC_FIELDS = [
  "regularPrice",
  "finalPrice",
  "seatingCapacity",
  "sleepingCapacity",
  "guestCapacity",
  "personCapacity",
  "numberOfBeds",
  "numberOfRooms",
  "numberOfBathrooms",
  "perDayCharge",
  "perKmCharge",
  "manufactureYear",
  "luggageCapacity",
  "selfDrivePerDay",
  "selfDrivePerKm",
  "freeKmPerDay",
  "extraKmCharge",
  "securityDeposit",
  "minRentalHours",
  "withDriverPerKm",
  "withDriverPerDay",
  "driverAllowancePerDay",
  "nightChargeAfter",
  "outstationPerKm",
  "cancellationWindowHours",
];

/* Enum-backed strings. An empty one has to be dropped rather than sent as ""
   or null — Mongoose validates "" against the enum and rejects the update. */
export const ENUM_FIELDS = [
  "vehicleClass",
  "fuelType",
  "transmission",
  "fuelPolicy",
  "tollsAndParking",
];

/* Mongoose declares these `required: true` on the Offer model, so a create
   without them is rejected by the server — the old form only marked `name`,
   which is why "Save" could fail with nothing on screen explaining why. */
export const REQUIRED_FIELDS = [
  "name",
  "category",
  "description",
  "city",
  "state",
  "regularPrice",
  // Not required by the schema, but a listing saved without it is invisible to
  // every surface that filters by service type — which is all of them.
  "serviceType",
];

export const EMPTY: Offer = {
  name: "",
  category: "",
  vendorId: "",
  regularPrice: "",
  finalPrice: "",
  description: "",
  features: [],
  rules: [],
  priceIncludes: [],
  priceExcludes: [],
  seatingCapacity: "",
  sleepingCapacity: "",
  guestCapacity: "",
  personCapacity: "",
  numberOfBeds: "",
  numberOfRooms: "",
  numberOfBathrooms: "",
  stayType: "",
  timeDuration: "",
  perDayCharge: "",
  perKmCharge: "",
  perDayIncludes: [],
  perDayExcludes: [],
  perKmIncludes: [],
  perKmExcludes: [],
  expectations: [],
  locality: "",
  city: "",
  state: "",
  pincode: "",
  address: "",
  discounts: {},
  photos: { coverUrl: "", galleryUrls: [] },
  status: "pending",
  serviceType: "",
  optionalRules: [],
  vehicleClass: "",
  brand: "",
  model: "",
  manufactureYear: "",
  registrationNumber: "",
  fuelType: "",
  transmission: "",
  airConditioned: false,
  luggageCapacity: "",
  pickupPoints: [],
  selfDriveEnabled: false,
  selfDrivePerDay: "",
  selfDrivePerKm: "",
  freeKmPerDay: "",
  extraKmCharge: "",
  securityDeposit: "",
  minRentalHours: "",
  selfDriveIncludes: [],
  selfDriveExcludes: [],
  withDriverEnabled: false,
  withDriverPerKm: "",
  withDriverPerDay: "",
  withDriverTwoWay: false,
  withDriverOneWay: true,
  checkInTime: "",
  checkOutTime: "",
  driverAllowancePerDay: "",
  nightChargeAfter: "",
  outstationPerKm: "",
  withDriverIncludes: [],
  withDriverExcludes: [],
  fuelPolicy: "",
  tollsAndParking: "",
  cancellationWindowHours: "",
};

/* ── Vendor wizard mapping ────────────────────────────────────────────────
   The admin form renders the registry section by section. The vendor wizards
   are step-based and hand-built out of the onboarding step components, so they
   render the registry as a remainder: everything that applies to the listing's
   service type and that the bespoke step does NOT already collect.

   That remainder is what makes the registry a single source of truth rather
   than a fourth copy. A field added to SECTIONS shows up on the vendor screens
   automatically; a field a bespoke step starts collecting is listed in
   VENDOR_HANDLED and drops back out. `offeringFields.spec.ts` fails the build
   if a registry field is assigned to no vendor step at all. */

export type VendorStepKey = "category" | "basics" | "features" | "location" | "pricing";

/** Vendor create (`/offering/add`) vs vendor edit (`/offering/:id/edit`) —
    the two wizards do not collect the same set, so they cannot share one list. */
export type VendorSurface = "create" | "edit";

/** Fields the vendor must never set: they decide ownership and taxonomy. */
export const ADMIN_ONLY_FIELDS: ReadonlySet<string> = new Set(["vendorId", "serviceType"]);

/** Which vendor step a section's fields land on, by default. */
const SECTION_VENDOR_STEP: Record<string, VendorStepKey> = {
  basics: "basics",
  pricing: "pricing",
  capacity: "location",
  stayTimes: "location",
  // Fuel, transmission and AC are collected on the vendor Features step; the
  // identity fields in the same section are overridden to "category" below.
  vehicle: "features",
  rates: "pricing",
  location: "location",
};

/** Per-field overrides, for the fields whose section spans two vendor steps. */
const FIELD_VENDOR_STEP: Record<string, VendorStepKey> = {
  // Collected by VehicleClassStep, which the vendor sees as step "Category".
  vehicleClass: "category",
  brand: "category",
  model: "category",
  manufactureYear: "category",
  registrationNumber: "category",
  // Collected by VehicleCapacityStep, on "Location & capacity".
  luggageCapacity: "location",
  pickupPoints: "location",
};

/* Fields a bespoke vendor step already collects, per surface and service type.
   Derived by reading the two wizards, not guessed — see the step components
   named against each group. Anything absent here is rendered generically. */
const HANDLED_BOTH: Record<Kind, readonly string[]> = {
  "unique-stay": [
    // CategoryStep / ChoiceTile grid, DescriptionStep, feature chips
    "category", "name", "description", "rules", "features",
    // hand-built Location & capacity block
    "address", "locality", "state", "city", "pincode",
    // UniqueStayPricing
    "regularPrice", "priceIncludes", "priceExcludes", "guestCapacity",
  ],
  activity: [
    "category", "name", "description", "rules", "features",
    "address", "locality", "state", "city", "pincode",
    // ActivityPricing
    "regularPrice", "priceIncludes", "priceExcludes", "personCapacity", "timeDuration",
  ],
  "camper-van": [
    "category", "name", "description", "rules", "features",
    // CapacityAddressStep
    "address", "locality", "state", "city", "pincode",
    "seatingCapacity", "sleepingCapacity",
    // PricingStep / CamperVanPricing — a camper van is quoted per km and per
    // day, so the headline price and its include/exclude lists are derived
    // from those rather than asked for twice.
    "perKmCharge", "perDayCharge",
    "perKmIncludes", "perKmExcludes", "perDayIncludes", "perDayExcludes",
    "regularPrice", "finalPrice", "priceIncludes", "priceExcludes",
  ],
  "vehicle-rental": [
    // VehicleClassStep
    "category", "vehicleClass", "brand", "model", "manufactureYear", "registrationNumber",
    // DescriptionStep + SpecsFeaturesStep
    "name", "description", "rules", "features",
    "fuelType", "transmission", "airConditioned",
    // VehicleCapacityStep + the hand-built address block
    "seatingCapacity", "luggageCapacity", "pickupPoints",
    "address", "locality", "state", "city", "pincode",
    // VehiclePricingStep — the whole rate card, both modes
    "selfDriveEnabled", "selfDrivePerDay", "selfDrivePerKm", "securityDeposit",
    "freeKmPerDay", "extraKmCharge", "minRentalHours",
    "selfDriveIncludes", "selfDriveExcludes",
    "withDriverEnabled", "withDriverPerKm", "withDriverPerDay", "withDriverTwoWay",
    "nightChargeAfter", "outstationPerKm", "driverAllowancePerDay",
    "withDriverIncludes", "withDriverExcludes",
    "cancellationWindowHours", "fuelPolicy", "tollsAndParking",
    // Derived from the rate card by the wizard, never typed.
    "regularPrice", "finalPrice", "priceIncludes", "priceExcludes",
  ],
};

/* The edit wizard collects more than the create wizard: optional rules, the
   room breakdown and the check-in times were added there and never backported
   to /offering/add. Listing them here is what makes them render generically on
   create instead of being silently unavailable. */
const HANDLED_EDIT_ONLY: Partial<Record<Kind, readonly string[]>> = {
  "unique-stay": [
    "optionalRules",
    "numberOfRooms", "numberOfBeds", "numberOfBathrooms",
    "checkInTime", "checkOutTime",
  ],
};

const handledSets = (extra: Partial<Record<Kind, readonly string[]>>) => {
  const out = {} as Record<Kind, ReadonlySet<string>>;
  (Object.keys(HANDLED_BOTH) as Kind[]).forEach((k) => {
    out[k] = new Set([...HANDLED_BOTH[k], ...(extra[k] ?? [])]);
  });
  return out;
};

export const VENDOR_HANDLED: Record<VendorSurface, Record<Kind, ReadonlySet<string>>> = {
  create: handledSets({}),
  edit: handledSets(HANDLED_EDIT_ONLY),
};

/* ── Lookups ──────────────────────────────────────────────────────────────── */

const FIELDS_BY_NAME = new Map<string, FieldSpec>();
const SECTION_BY_FIELD = new Map<string, SectionSpec>();
SECTIONS.forEach((s) =>
  (s.fields ?? []).forEach((f) => {
    FIELDS_BY_NAME.set(f.name, f);
    SECTION_BY_FIELD.set(f.name, s);
  }),
);

/** Every field in the registry, in section order. */
export const ALL_FIELDS: FieldSpec[] = SECTIONS.flatMap((s) => s.fields ?? []);

export const findField = (name: string): FieldSpec | undefined => FIELDS_BY_NAME.get(name);

/** Which vendor wizard step a field belongs on. */
export function vendorStepOf(name: string): VendorStepKey | null {
  const override = FIELD_VENDOR_STEP[name];
  if (override) return override;
  const section = SECTION_BY_FIELD.get(name);
  return section ? (SECTION_VENDOR_STEP[section.key] ?? null) : null;
}

/** A field applies to a service type when it is unscoped or names that type. */
export const appliesTo = (f: FieldSpec, kind: Kind | null): boolean =>
  !f.only || !kind || f.only.includes(kind);

/**
 * The registry fields a vendor wizard should render itself on `step` — those
 * that apply to `kind` and that no bespoke step component already collects.
 */
export function vendorFieldsFor(
  surface: VendorSurface,
  kind: Kind | null,
  step: VendorStepKey,
): FieldSpec[] {
  if (!kind) return [];
  const handled = VENDOR_HANDLED[surface][kind];
  return ALL_FIELDS.filter(
    (f) =>
      !ADMIN_ONLY_FIELDS.has(f.name) &&
      appliesTo(f, kind) &&
      !handled.has(f.name) &&
      vendorStepOf(f.name) === step,
  );
}

/* ── Serialisation ────────────────────────────────────────────────────────
   One place that turns form state into an `Offer` update body, shared by the
   admin form and by the vendor wizards' registry-driven fields. The rules are
   not cosmetic — each one is a save that failed silently before it existed. */

/** Comma string or array in, trimmed array out. */
export const toArr = (v: any): string[] =>
  typeof v === "string"
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : Array.isArray(v)
      ? v.map((s) => String(s).trim()).filter(Boolean)
      : [];

const isBlank = (v: any) => v === "" || v === undefined || v === null;

export function serializeOfferingValues(
  values: Record<string, any>,
  baseline: Record<string, any> = {},
  /** Restrict the output to these names — the vendor wizards serialise only
      the generic fields they rendered, and build the rest by hand. */
  only?: readonly string[],
): Record<string, any> {
  const keys = only ?? Object.keys(values);
  const out: Record<string, any> = {};
  keys.forEach((k) => {
    if (k in values) out[k] = values[k];
  });

  /* The trip-direction pair is stored as two booleans but is really one choice,
     and the forms only expose `withDriverTwoWay`. Deriving its partner here
     keeps the two out of an impossible state. */
  if ("withDriverTwoWay" in out) out.withDriverOneWay = !out.withDriverTwoWay;

  ARRAY_FIELDS.forEach((k) => {
    if (k in out) out[k] = toArr(out[k]);
  });

  /* Blank values, and the difference between "never filled in" and "cleared".
     Dropping a blank key keeps Mongoose from casting "" → NaN on a number and
     from failing an enum on "". But dropping it on a field that HAD a value
     makes clearing one impossible — the update simply doesn't mention it and
     the old value survives. So: a never-filled field is dropped, and a cleared
     one is sent explicitly.

     This applies to every field, not just numbers and enums. A form seeds an
     unmapped field as "" and then sends it, which is how an admin save came to
     write empty strings over a stay's stored check-in and check-out times.
     Arrays are exempt by construction — `isBlank` doesn't call [] blank, so an
     emptied tag list is still sent as [] and really does clear. */
  Object.keys(out).forEach((k) => {
    if (!isBlank(out[k])) return;
    if (isBlank(baseline[k])) {
      delete out[k];
      return;
    }
    // Cleared. `null` for a number or an enum, "" for a string — sending null
    // for a String path stores null rather than an empty value.
    out[k] = NUMERIC_FIELDS.includes(k) || ENUM_FIELDS.includes(k) ? null : "";
  });

  /* The Offer model stores the discounted rate as `discountPrice`; there is no
     top-level `finalPrice` path, so Mongoose's strict mode silently dropped
     everything typed into that field. Send both — the read side already falls
     back from one to the other. */
  if ("finalPrice" in out) out.discountPrice = out.finalPrice;

  return out;
}

/** Every vendor wizard step, in the order both wizards present them. */
export const VENDOR_STEP_KEYS: readonly VendorStepKey[] = [
  "category",
  "basics",
  "features",
  "location",
  "pricing",
];

/** The generic fields a whole wizard renders — what its save has to serialise. */
export const vendorGenericFieldNames = (surface: VendorSurface, kind: Kind | null): string[] =>
  VENDOR_STEP_KEYS.flatMap((step) => vendorFieldsFor(surface, kind, step).map((f) => f.name));

/**
 * Seed generic-field state from a saved offer.
 *
 * Only registry fields, and array fields normalised to arrays — a listing saved
 * before the tag editor existed still holds some of them as comma strings.
 */
export function pickOfferingValues(source: Record<string, any> | null | undefined) {
  const out: Record<string, any> = {};
  if (!source) return out;
  ALL_FIELDS.forEach((f) => {
    if (!(f.name in source)) return;
    out[f.name] = ARRAY_FIELDS.includes(f.name) ? toArr(source[f.name]) : source[f.name];
  });
  return out;
}

/* ── Field relevance ──────────────────────────────────────────────────────
   Which fields a form shows for a given listing. Pure and shared so the rule
   is testable — it decides what an operator can see and edit. */

/**
 * Whether a listing genuinely carries a value for `name`.
 *
 * Used only to decide whether an OUT-OF-SCOPE field should be revealed anyway,
 * so that editing a listing never hides data it actually holds. That makes the
 * bar "is there something here worth showing a whole section for", not "is this
 * key present":
 *
 * - A switch that is off is a default, not data. `EMPTY` seeds
 *   `airConditioned`, `selfDriveEnabled`, `withDriverEnabled` and
 *   `withDriverTwoWay` as `false` on every listing, so counting `false` as a
 *   value put the Vehicle and Rental rates sections on every stay, activity and
 *   camper van — which is what "why does my unique stay have vehicle fields?"
 *   was.
 * - A rate of 0 is the same story from the other side: the server stores an
 *   unanswered rate as 0 rather than leaving it out.
 */
export function hasMeaningfulValue(name: string, values: Record<string, any>): boolean {
  const v = values?.[name];
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "boolean") return v;
  if (v === "" || v === undefined || v === null) return false;
  if (NUMERIC_FIELDS.includes(name)) return Number(v) !== 0;
  return true;
}

/**
 * Whether `f` belongs on screen for a listing of `kind`.
 *
 * `showAll` is the operator's "show every field" escape hatch, and a null kind
 * means the listing says nothing about what it is — both show everything rather
 * than hiding fields on a guess.
 */
export function isFieldRelevant(
  f: FieldSpec,
  kind: Kind | null,
  values: Record<string, any>,
  showAll = false,
): boolean {
  if (!f.only || !kind || showAll) return true;
  return f.only.includes(kind) || hasMeaningfulValue(f.name, values);
}

/* ── Admin wizard steps ───────────────────────────────────────────────────
   The admin edit form walks the SAME steps, in the same order, under the same
   phase labels as the vendor onboarding flow for that service type. A listing
   an admin corrects and a listing a vendor submits are then described the same
   way, which is the point — an admin reviewing a stay should be looking at the
   screens the host filled in, not a different decomposition of them.

   Two groupings of one field set, on purpose:
     SECTIONS     groups by schema domain (Vehicle, Rental rates, Location).
     WIZARD_STEPS groups by onboarding order (Property type, Stay details, …).
   Both name fields from the same registry, and `offeringFields.spec.ts` asserts
   the wizard partitions every field that applies to a kind — exactly once — so
   a field can never quietly fall out of the admin form.

   The onboarding flows' Business / Personal / Terms / Documents steps are
   deliberately absent: those are the VENDOR record and the compliance
   documents, not the listing, and each already has its own admin surface
   (VendorDetailsPopup, ComplianceRenewDialog).

   Location has no onboarding equivalent — those flows derive city and state
   from the vendor's business address (see deriveVehicleLocation). Both are
   `required` on the model, so an admin has to be able to set them; they sit
   with capacity, which is where the caravan flow puts its address too
   (CapacityAddressStep). */

export interface WizardStepSpec {
  key: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
  /** Progress-rail grouping, matching that flow's `*_PHASES`. */
  phase: string;
  /** Registry field names, in the order the onboarding step asks for them. */
  fields?: string[];
  /** A custom block — the same names `SECTIONS` uses. */
  custom?: "photos" | "discounts" | "rooms" | "compliance";
}

/* Shared: the vendor/service header every admin step 0 needs, and the location
   block described above. */
const OWNER_FIELDS = ["vendorId", "serviceType"];
const LOCATION_FIELDS = ["address", "locality", "city", "state", "pincode"];

const PHOTOS_STEP = (phase: string): WizardStepSpec => ({
  key: "photos",
  label: "Photos",
  blurb: "The cover is the only image most guests will see.",
  icon: Images,
  phase,
  custom: "photos",
});

const DISCOUNTS_STEP = (label: string, phase: string): WizardStepSpec => ({
  key: "discounts",
  label,
  blurb: "Optional promotional rates, off by default.",
  icon: Percent,
  phase,
  custom: "discounts",
});

export const WIZARD_STEPS: Record<Kind, WizardStepSpec[]> = {
  /* /onboarding/stay — STAY_PHASES: "Your stay" ×4, "Pricing" ×1
     0 Property type · 1 Category · 2 Stay details · 3 Features · 4 Discounts */
  "unique-stay": [
    {
      key: "property-type",
      label: "Property type",
      blurb: "What kind of place this is, and which vendor it belongs to.",
      icon: Info,
      phase: "Your stay",
      fields: [...OWNER_FIELDS, "stayType", "name", "description"],
    },
    {
      key: "category",
      label: "Category",
      blurb: "How guests find it when they filter a search.",
      icon: Tag,
      phase: "Your stay",
      fields: ["category"],
    },
    {
      key: "stay-details",
      label: "Stay details",
      blurb: "Capacity, the nightly rate, arrival times and house rules.",
      icon: BedDouble,
      phase: "Your stay",
      fields: [
        "guestCapacity",
        "numberOfRooms",
        "numberOfBeds",
        "numberOfBathrooms",
        "regularPrice",
        "finalPrice",
        "checkInTime",
        "checkOutTime",
        "rules",
        "optionalRules",
        "priceIncludes",
        "priceExcludes",
        ...LOCATION_FIELDS,
      ],
    },
    {
      key: "rooms",
      label: "Rooms",
      blurb: "Each room carries its own capacity, price and photos.",
      icon: BedDouble,
      phase: "Your stay",
      custom: "rooms",
    },
    PHOTOS_STEP("Your stay"),
    {
      key: "features",
      label: "Features",
      blurb: "Tick everything that applies — guests use these as filters.",
      icon: ListChecks,
      phase: "Your stay",
      fields: ["features"],
    },
    DISCOUNTS_STEP("Discounts", "Pricing"),
  ],

  /* /onboarding/caravan — CARAVAN_PHASES: "Your caravan" ×4, "Pricing" ×2
     0 Details · 1 Category · 2 Features · 3 Capacity · 4 Pricing · 5 Offers */
  "camper-van": [
    {
      key: "details",
      label: "Details",
      blurb: "What this camper van is, and which vendor it belongs to.",
      icon: Info,
      phase: "Your caravan",
      fields: [...OWNER_FIELDS, "name", "description", "rules"],
    },
    {
      key: "category",
      label: "Category",
      blurb: "The vehicle type guests filter on.",
      icon: Tag,
      phase: "Your caravan",
      fields: ["category"],
    },
    {
      key: "features",
      label: "Features",
      blurb: "Everything on board.",
      icon: ListChecks,
      phase: "Your caravan",
      fields: ["features"],
    },
    {
      key: "capacity",
      label: "Capacity & location",
      blurb: "How many it sleeps and seats, and where it is picked up.",
      icon: Users,
      phase: "Your caravan",
      fields: ["seatingCapacity", "sleepingCapacity", "numberOfBeds", ...LOCATION_FIELDS],
    },
    {
      key: "pricing",
      label: "Pricing",
      blurb: "Per day and per km, and what each rate covers.",
      icon: IndianRupee,
      phase: "Pricing",
      fields: [
        "perDayCharge",
        "perDayIncludes",
        "perDayExcludes",
        "perKmCharge",
        "perKmIncludes",
        "perKmExcludes",
        "regularPrice",
        "finalPrice",
        "priceIncludes",
        "priceExcludes",
      ],
    },
    PHOTOS_STEP("Pricing"),
    DISCOUNTS_STEP("Offers", "Pricing"),
  ],

  /* /onboarding/activity — ACTIVITY_PHASES: "Your activity" ×3, "Pricing" ×3
     0 Type · 1 Features · 2 Details · 3 Pricing · 4 Inclusions · 5 Discounts */
  activity: [
    {
      key: "type",
      label: "Type",
      blurb: "What this activity is, and which vendor runs it.",
      icon: Info,
      phase: "Your activity",
      fields: [...OWNER_FIELDS, "category", "name", "description"],
    },
    {
      key: "features",
      label: "Features",
      blurb: "What is provided on the day.",
      icon: ListChecks,
      phase: "Your activity",
      fields: ["features"],
    },
    {
      key: "details",
      label: "Details",
      blurb: "Group size, how long it runs, the rules, and where it happens.",
      icon: Users,
      phase: "Your activity",
      fields: ["personCapacity", "timeDuration", "expectations", "rules", ...LOCATION_FIELDS],
    },
    {
      key: "pricing",
      label: "Pricing",
      blurb: "What a guest pays per person.",
      icon: IndianRupee,
      phase: "Pricing",
      fields: ["regularPrice", "finalPrice"],
    },
    {
      key: "inclusions",
      label: "Inclusions",
      blurb: "What the price does and does not cover.",
      icon: ListChecks,
      phase: "Pricing",
      fields: ["priceIncludes", "priceExcludes"],
    },
    PHOTOS_STEP("Pricing"),
    DISCOUNTS_STEP("Discounts", "Pricing"),
  ],

  /* /onboarding/vehicle — VEHICLE_PHASES: "Your vehicle" ×3, "Pricing" ×1
     0 Details · 1 Class · 2 Specs · 3 Capacity · 4 Pricing
     No Discounts step: that flow drops Discount Offers, and the four
     promotional slots are now dropped for vehicles everywhere else too. The
     admin form used to keep them "because a vehicle listing can still carry
     discounts set from elsewhere" — but the only "elsewhere" was the vendor
     create/edit pages, which offered them for the same non-reason, and nothing
     guest-facing reads them for a vehicle: neither VehicleDetails nor Payment
     touches `discounts`, so they only ever rendered back to the vendor's own
     offering page and the admin drawer. Write-only decoration on three screens.
     Stay, caravan and activity keep theirs — their wizards collect them. */
  "vehicle-rental": [
    {
      key: "details",
      label: "Details",
      blurb: "What this vehicle is, and which vendor it belongs to.",
      icon: Info,
      phase: "Your vehicle",
      fields: [...OWNER_FIELDS, "name", "description", "rules"],
    },
    {
      key: "class",
      label: "Class",
      blurb: "Class, category, and the vehicle's own identity.",
      icon: Car,
      phase: "Your vehicle",
      fields: [
        "vehicleClass",
        "category",
        "brand",
        "model",
        "manufactureYear",
        "registrationNumber",
      ],
    },
    {
      key: "specs",
      label: "Specs & features",
      blurb: "Fuel, transmission and air conditioning are search filters.",
      icon: ListChecks,
      phase: "Your vehicle",
      fields: ["fuelType", "transmission", "airConditioned", "features"],
    },
    {
      key: "capacity",
      label: "Capacity & location",
      blurb: "Seats, luggage, and where it is handed over.",
      icon: Users,
      phase: "Your vehicle",
      fields: ["seatingCapacity", "luggageCapacity", "pickupPoints", ...LOCATION_FIELDS],
    },
    {
      key: "pricing",
      label: "Pricing",
      blurb: "Self-drive and chauffeur are independent — either or both.",
      icon: IndianRupee,
      phase: "Pricing",
      fields: [
        "selfDriveEnabled",
        "selfDrivePerDay",
        "selfDrivePerKm",
        "freeKmPerDay",
        "extraKmCharge",
        "securityDeposit",
        "minRentalHours",
        "selfDriveIncludes",
        "selfDriveExcludes",
        "withDriverEnabled",
        "withDriverTwoWay",
        "withDriverPerKm",
        "withDriverPerDay",
        "driverAllowancePerDay",
        "nightChargeAfter",
        "outstationPerKm",
        "withDriverIncludes",
        "withDriverExcludes",
        "fuelPolicy",
        "tollsAndParking",
        "cancellationWindowHours",
        "regularPrice",
        "finalPrice",
        "priceIncludes",
        "priceExcludes",
      ],
    },
    PHOTOS_STEP("Pricing"),
    {
      /* Read-only, with a Renew button — see the SECTIONS entry for why these
         two dates cannot be plain inputs. Last, and in its own phase, so the
         rail reads "Your vehicle" -> "Pricing" -> "Documents" exactly like
         VEHICLE_PHASES in pages/onboarding/VehicleOnboarding. */
      key: "compliance",
      label: "Documents",
      blurb: "Insurance and PUC expiry, and the paperwork on file.",
      icon: ShieldCheck,
      phase: "Documents",
      custom: "compliance",
    },
  ],
};

export interface ResolvedWizardStep {
  key: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
  phase: string;
  fields: FieldSpec[];
  custom?: SectionSpec["custom"];
}

/**
 * The steps to show for a listing, with each step's field specs resolved.
 *
 * A null kind — a listing whose serviceType says nothing — falls back to the
 * schema-domain `SECTIONS`, the same way the field-relevance rule does: show
 * everything rather than guess at a flow.
 */
export function wizardStepsFor(
  kind: Kind | null,
  isVisible: (f: FieldSpec) => boolean,
): ResolvedWizardStep[] {
  const steps: WizardStepSpec[] = kind
    ? WIZARD_STEPS[kind]
    : SECTIONS.map((s) => ({
        key: s.key,
        label: s.label,
        blurb: s.blurb,
        icon: s.icon,
        phase: "All fields",
        fields: (s.fields ?? []).map((f) => f.name),
        custom: s.custom,
      }));

  return steps
    .map((s) => ({
      key: s.key,
      label: s.label,
      blurb: s.blurb,
      icon: s.icon,
      phase: s.phase,
      custom: s.custom,
      fields: (s.fields ?? [])
        .map((n) => FIELDS_BY_NAME.get(n))
        .filter((f): f is FieldSpec => !!f && isVisible(f)),
    }))
    // A step with nothing on it reads as a broken form.
    .filter((s) => s.custom || s.fields.length > 0);
}
