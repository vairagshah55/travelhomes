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
  MapPin,
  Percent,
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
  custom?: "photos" | "discounts" | "rooms";
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
        control: "tags",
        wide: true,
        placeholder: "WiFi, Air conditioning, Parking…",
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
    key: "discounts",
    label: "Discounts",
    icon: Percent,
    blurb: "Optional promotional rates, off by default.",
    custom: "discounts",
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

  /* Empty numbers: dropping the key keeps Mongoose from casting "" → NaN, but
     dropping it on a field that HAD a value means clearing one is impossible —
     the update simply doesn't mention it and the old figure survives. So an
     emptied field is sent as an explicit null, and only a never-filled one is
     dropped. Enum fields need the same treatment for a different reason: a
     blank one is the string "", which fails validation and rejects the whole
     update rather than just that field. */
  [...NUMERIC_FIELDS, ...ENUM_FIELDS].forEach((k) => {
    if (!(k in out) || !isBlank(out[k])) return;
    if (isBlank(baseline[k])) delete out[k];
    else out[k] = null;
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
