export type VehicleClass = "car" | "van" | "bus";
export type FuelType = "Petrol" | "Diesel" | "CNG" | "Electric" | "Hybrid";
export type Transmission = "Manual" | "Automatic";
export type FuelPolicy = "included" | "excluded" | "same-to-same";
export type TollsPolicy = "included" | "on-actuals";

export interface FormData {
  // ─── Step 0 · Vehicle details ─────────────────────────────────────────
  name: string;
  description: string;
  rules: string[];
  photos: (string | File)[];
  coverImage: (string | File)[];

  // ─── Step 1 · Class + identity ────────────────────────────────────────
  vehicleClass: VehicleClass | null;
  category: string | null;
  brand: string;
  model: string;
  manufactureYear: string;
  registrationNumber: string;

  // ─── Step 2 · Specs + amenities ───────────────────────────────────────
  fuelType: FuelType | "";
  transmission: Transmission | "";
  airConditioned: boolean;
  features: string[];

  // ─── Step 3 · Capacity + location ─────────────────────────────────────
  seatingCapacity: number;
  luggageCapacity: number;
  address: string;
  locality: string;
  state: string;
  city: string;
  pincode: string;
  pickupPoints: string[];

  // ─── Step 4 · Rental modes + pricing ──────────────────────────────────
  selfDriveEnabled: boolean;
  selfDrivePerDay: string;
  selfDrivePerKm: string;
  freeKmPerDay: string;
  extraKmCharge: string;
  minRentalHours: string;
  selfDriveIncludes: string[];
  selfDriveExcludes: string[];

  withDriverEnabled: boolean;
  withDriverPerKm: string;
  driverAllowancePerDay: string;
  /**
   * Which chauffeur trips the vendor takes. At least one is required once
   * with-driver is on — a mode that accepts neither direction is bookable by
   * nobody. Two booleans rather than one enum because offering both is the
   * common case.
   */
  withDriverOneWay: boolean;
  withDriverTwoWay: boolean;
  withDriverIncludes: string[];
  withDriverExcludes: string[];

  fuelPolicy: FuelPolicy;
  tollsAndParking: TollsPolicy;
  cancellationWindowHours: string;

  // ─── Step 5 · Discount offers ─────────────────────────────────────────
  firstUserDiscount: boolean;
  firstUserDiscountType: "percentage" | "fixed";
  firstUserDiscountValue: string;
  firstUserDiscountFinalPrice: string;

  festivalOffers: boolean;
  festivalOffersType: "percentage" | "fixed";
  festivalOffersValue: string;
  festivalOffersFinalPrice: string;

  weeklyMonthlyOffers: boolean;
  weeklyMonthlyOffersType: "percentage" | "fixed";
  weeklyMonthlyOffersValue: string;
  weeklyMonthlyOffersFinalPrice: string;

  specialOffers: boolean;
  specialOffersType: "percentage" | "fixed";
  specialOffersValue: string;
  specialOffersFinalPrice: string;

  // ─── Step 6 · Business details ────────────────────────────────────────
  brandName: string;
  legalCompanyName: string;
  gstNumber: string;
  businessEmailId: string;
  businessPhoneNumber: string;
  businessAddress: string;
  businessLocality: string;
  businessState: string;
  businessCity: string;
  businessPincode: string;

  // ─── Step 7 · Personal details (+ driver) ─────────────────────────────
  firstName: string;
  lastName: string;
  personalLocality: string;
  personalState: string;
  personalCity: string;
  personalPincode: string;
  dateOfBirth: string;
  maritalStatus: string;
  idProof: string;
  idPhotos: (string | File)[];

  driverName: string;
  driverPhone: string;
  driverLicenceNumber: string;
  driverLicencePhotos: (string | File)[];

  // ─── Step 8 · Terms + compliance ──────────────────────────────────────
  rcPhotos: (string | File)[];
  insuranceExpiry: string;
  pucExpiry: string;
  termsAccepted: boolean;
}

export const defaultVehicleFormData: FormData = {
  name: "",
  description: "",
  rules: [],
  photos: [],
  coverImage: [],

  vehicleClass: null,
  category: null,
  brand: "",
  model: "",
  manufactureYear: "",
  registrationNumber: "",

  fuelType: "",
  transmission: "",
  airConditioned: false,
  features: [],

  seatingCapacity: 4,
  luggageCapacity: 0,
  address: "",
  locality: "India",
  state: "",
  city: "",
  pincode: "",
  pickupPoints: [],

  selfDriveEnabled: false,
  selfDrivePerDay: "",
  selfDrivePerKm: "",
  freeKmPerDay: "",
  extraKmCharge: "",
  minRentalHours: "24",
  selfDriveIncludes: [],
  selfDriveExcludes: [],

  withDriverEnabled: false,
  withDriverPerKm: "",
  driverAllowancePerDay: "",
  withDriverOneWay: true,
  withDriverTwoWay: true,
  withDriverIncludes: [],
  withDriverExcludes: [],

  fuelPolicy: "excluded",
  tollsAndParking: "on-actuals",
  cancellationWindowHours: "24",

  firstUserDiscount: false,
  firstUserDiscountType: "percentage",
  firstUserDiscountValue: "",
  firstUserDiscountFinalPrice: "",

  festivalOffers: false,
  festivalOffersType: "percentage",
  festivalOffersValue: "",
  festivalOffersFinalPrice: "",

  weeklyMonthlyOffers: false,
  weeklyMonthlyOffersType: "percentage",
  weeklyMonthlyOffersValue: "",
  weeklyMonthlyOffersFinalPrice: "",

  specialOffers: false,
  specialOffersType: "percentage",
  specialOffersValue: "",
  specialOffersFinalPrice: "",

  brandName: "",
  legalCompanyName: "",
  gstNumber: "",
  businessEmailId: "",
  businessPhoneNumber: "",
  businessAddress: "",
  businessLocality: "India",
  businessState: "",
  businessCity: "",
  businessPincode: "",

  firstName: "",
  lastName: "",
  personalLocality: "India",
  personalState: "",
  personalCity: "",
  personalPincode: "",
  dateOfBirth: "",
  maritalStatus: "",
  idProof: "",
  idPhotos: [],

  driverName: "",
  driverPhone: "",
  driverLicenceNumber: "",
  driverLicencePhotos: [],

  rcPhotos: [],
  insuranceExpiry: "",
  pucExpiry: "",
  termsAccepted: false,
};

// ─── Option lists ───────────────────────────────────────────────────────
export const VEHICLE_CLASSES: { value: VehicleClass; label: string; blurb: string }[] = [
  { value: "car", label: "Car", blurb: "Hatchbacks, sedans and SUVs — up to 7 seats." },
  { value: "van", label: "Van", blurb: "Tempo travellers and MPVs — 8 to 17 seats." },
  { value: "bus", label: "Bus", blurb: "Mini buses and coaches — 18 seats and up." },
];

export const FUEL_TYPES: FuelType[] = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];
export const TRANSMISSIONS: Transmission[] = ["Manual", "Automatic"];

export const FUEL_POLICIES: { value: FuelPolicy; label: string }[] = [
  { value: "excluded", label: "Fuel paid by the guest" },
  { value: "included", label: "Fuel included in the rate" },
  { value: "same-to-same", label: "Return at the same fuel level" },
];

export const TOLLS_POLICIES: { value: TollsPolicy; label: string }[] = [
  { value: "on-actuals", label: "Tolls & parking on actuals" },
  { value: "included", label: "Tolls & parking included" },
];

/**
 * Seat-count guardrails per class. Only used to seed a sensible default and to
 * warn — not to block — because the classes overlap in the real world (a large
 * MPV is sold as both a car and a van) and refusing the vendor's own number
 * would be wrong more often than the range is.
 */
export const SEAT_HINT_BY_CLASS: Record<VehicleClass, { min: number; max: number }> = {
  car: { min: 2, max: 7 },
  van: { min: 8, max: 17 },
  bus: { min: 18, max: 60 },
};

/**
 * Shown in step 1 only until an admin adds Vehicle Rental categories in CMS
 * (or `npm --prefix Server run seed:vehicle-taxonomy` is run). Without it the
 * shared CategoryStep falls back to its caravan list, which offers a vendor
 * listing a sedan the choice between "Motorhome" and "Travel Trailer".
 */
/**
 * Vehicle rental taxonomy: class → category → the models sold under it.
 *
 * Three things follow from this one structure — the category cards, the model
 * picker, and the guest search sidebar's "Type" checkboxes — so they cannot
 * drift apart the way the hand-retyped category list in searchHelpers once did.
 *
 * Categories are CLASS-SCOPED, which the flat list this replaces was not: it
 * offered "Coach Bus" to someone listing a hatchback. `models` is the picklist
 * for that category and may be empty (the bus categories are defined by seat
 * count, not by model), in which case the vendor types the model.
 *
 * Model strings deliberately carry the manufacturer ("Maruti Swift", not
 * "Swift"): they are what a guest recognises, and VehicleClassStep splits the
 * leading word back out to prefill Brand. deriveVehicleName then has to avoid
 * emitting "Maruti Maruti Swift" — see the note there.
 */
export interface VehicleCategoryDef {
  name: string;
  description: string;
  emoji: string;
  models: string[];
  /**
   * Whether the model select offers "Other (type it in)".
   *
   * Per-category, not global: the spec marks "Other (Can add manually)" on most
   * categories but deliberately omits it from 7-Seater / Premium Car, Budget
   * Vans and Premium Vans — those are closed lists. A category with no models
   * at all (the bus tiers, which are defined by seat count) is always free text
   * and ignores this.
   */
  allowOther: boolean;
}

export const VEHICLE_TAXONOMY: Record<VehicleClass, VehicleCategoryDef[]> = {
  car: [
    {
      name: "Budget / Small Car",
      allowOther: true,
      description: "Compact city car, comfortable for up to 4 people.",
      emoji: "🚗",
      models: [
        "Maruti Swift",
        "Maruti Wagon R",
        "Maruti Baleno",
        "Maruti Celerio",
        "Hyundai Grand i10 Nios",
        "Hyundai i20",
        "Tata Tiago",
      ],
    },
    {
      name: "Sedans",
      allowOther: true,
      description: "Saloon car with a separate boot — 4 passengers and luggage.",
      emoji: "🚙",
      models: [
        "Maruti Dzire",
        "Honda Amaze",
        "Hyundai Aura",
        "Honda City",
        "Hyundai Verna",
        "Volkswagen Virtus",
        "Skoda Slavia",
        "Tata Tigor",
      ],
    },
    {
      name: "SUVs",
      allowOther: true,
      description: "Higher ground clearance, suited to hills and rough roads.",
      emoji: "🚙",
      models: [
        "Hyundai Creta",
        "Kia Seltos",
        "Maruti Brezza",
        "Tata Nexon",
        "Hyundai Venue",
        "Mahindra XUV 3XO",
        "Mahindra XUV700",
        "Mahindra Scorpio",
        "Mahindra Thar",
        "Jeep Compass",
      ],
    },
    {
      name: "7-Seater / Family Cars",
      allowOther: true,
      description: "Seven-seat people carrier for families and small groups.",
      emoji: "🚐",
      models: ["Maruti Ertiga", "Maruti XL6", "Mahindra Marazzo", "Kia Carens", "Mahindra Bolero"],
    },
    {
      name: "Premium / Luxury",
      allowOther: true,
      description: "Premium sedan for weddings, events and corporate travel.",
      emoji: "🏎️",
      models: [
        "Toyota Camry",
        "Skoda Superb",
        "Mercedes-Benz E-Class",
        "BMW 5 Series",
        "Audi A6",
        "Mercedes-Benz S-Class",
        "BMW 7 Series",
        "Audi A8",
      ],
    },
    {
      name: "7-Seater / Premium Car",
      allowOther: false,
      description: "Premium seven-seater for long trips and larger families.",
      emoji: "🚙",
      models: ["Toyota Innova Crysta", "Toyota Innova Hycross", "Toyota Fortuner", "MG Hector"],
    },
  ],
  van: [
    {
      name: "Budget Vans",
      allowOther: false,
      description: "The standard group-travel van, nine to seventeen seats.",
      emoji: "🚐",
      models: [
        "Force Traveller 9-Seater",
        "Force Traveller 12-Seater",
        "Force Traveller 13-Seater",
        "Force Traveller 14-Seater",
        "Force Traveller 17-Seater",
      ],
    },
    {
      name: "Premium Vans",
      allowOther: false,
      description: "Higher-spec cabin and seating for comfortable group travel.",
      emoji: "🚐",
      models: ["Force Urbania 9-Seater", "Force Urbania 13-Seater", "Force Urbania 16-Seater"],
    },
    {
      name: "Maharaja Vans",
      allowOther: true,
      description: "Lounge-style seating for premium group travel.",
      emoji: "🚐",
      models: ["9 Seater"],
    },
    {
      name: "Luxury Customized Vans",
      allowOther: true,
      description: "Custom-built interiors — the top of the van range.",
      emoji: "🚐",
      models: ["9 Seater"],
    },
  ],
  bus: [
    {
      name: "Mini Bus 20–30 Seats",
      allowOther: true,
      description: "Twenty to thirty seats for large groups and tours.",
      emoji: "🚌",
      models: [],
    },
    {
      name: "Standard Bus 31–45 Seats",
      allowOther: true,
      description: "Thirty-one to forty-five seats for long-distance group travel.",
      emoji: "🚌",
      models: [],
    },
    {
      name: "Volvo / Luxury Bus 40–55 Seats",
      allowOther: true,
      description: "Air-suspension luxury coach, forty to fifty-five seats.",
      emoji: "🚌",
      models: [],
    },
    {
      name: "Sleeper Bus 30–50 Berths",
      allowOther: true,
      description: "Berths rather than seats, for overnight journeys.",
      emoji: "🚌",
      models: [],
    },
  ],
};

/** The label the model select uses for a manual entry. */
export const VEHICLE_MODEL_OTHER = "Other";

/** Categories offered for a class — everything, before one is chosen. */
export function vehicleCategoriesFor(vehicleClass: VehicleClass | null): VehicleCategoryDef[] {
  return vehicleClass ? VEHICLE_TAXONOMY[vehicleClass] : [];
}

/** The models listed under one category. Empty means "type it in". */
export function vehicleModelsFor(
  vehicleClass: VehicleClass | null,
  category: string | null,
): string[] {
  return vehicleCategoriesFor(vehicleClass).find((c) => c.name === category)?.models ?? [];
}

/**
 * Whether this category lets a vendor type a model that isn't listed.
 *
 * A category with no models at all is always free text — there is no list to be
 * "other" than — so it reports true regardless of its flag.
 */
export function vehicleAllowsOtherModel(
  vehicleClass: VehicleClass | null,
  category: string | null,
): boolean {
  const def = vehicleCategoriesFor(vehicleClass).find((c) => c.name === category);
  if (!def) return true;
  return def.models.length === 0 || def.allowOther;
}

/**
 * The manufacturer implied by a picked model — "Maruti Swift" → "Maruti".
 *
 * Two-word marques are kept whole because they are written with a hyphen
 * ("Mercedes-Benz E-Class"), so the leading token is still correct. Returns ""
 * for a model that is only a seat count ("9 Seater"), where there is no
 * manufacturer to infer and the vendor fills Brand in themselves.
 */
export function brandFromModel(model: string): string {
  const first = (model || "").trim().split(/\s+/)[0] || "";
  return /^[0-9]/.test(first) ? "" : first;
}

/** Flat category list, every class — the shape CategoryStep renders. */
export const FALLBACK_VEHICLE_CATEGORIES = (
  Object.keys(VEHICLE_TAXONOMY) as VehicleClass[]
).flatMap((k) => VEHICLE_TAXONOMY[k]);

/**
 * Just the names from the taxonomy above.
 *
 * The guest search sidebar filters on `offer.category`, which is exactly one of
 * these — so its "Type" checkboxes have to be these strings verbatim. They were
 * hand-retyped in searchHelpers and had already drifted ("MUV" vs "MUV / MPV",
 * and four of them missing), which silently made those boxes match nothing.
 * Derived rather than restated so that cannot happen again.
 */
export const VEHICLE_CATEGORY_NAMES: string[] = FALLBACK_VEHICLE_CATEGORIES.map((c) => c.name);

/**
 * Step 2's amenity grid, same fallback contract. Fuel type, transmission and air
 * conditioning are absent on purpose — those are structured fields on the offer
 * because the search page filters on them, so listing them here too would let a
 * vendor set the same fact in two places that could then disagree.
 */
export const FALLBACK_VEHICLE_FEATURES: string[] = [
  // "Air Conditioning" is deliberately absent — SpecsFeaturesStep has a
  // dedicated toggle for it, backed by the structured `airConditioned` boolean
  // the search page filters on. Listing it here too let a vendor set the same
  // fact twice, in two places that could then disagree. (The comment above has
  // said as much since this list was written; the entry itself was the bug.)
  "Music System",
  "Bluetooth",
  "USB Charging",
  "GPS Navigation",
  "Reverse Camera",
  "Parking Sensors",
  "Airbags",
  "First Aid Kit",
  "Fire Extinguisher",
  "Spare Tyre",
  "Roof Carrier",
  "Child Seat",
  "Wheelchair Accessible",
  "Push Back Seats",
  "Curtains",
  "Reading Lights",
  "Charging Sockets",
];

const CURRENT_YEAR = new Date().getFullYear();
/** Newest first — vendors are far likelier to list a recent vehicle. */
export const MANUFACTURE_YEARS = Array.from({ length: 30 }, (_, i) => String(CURRENT_YEAR - i));

const DISCOUNT_SLOTS: {
  enabledKey: keyof FormData;
  finalKey: keyof FormData;
  label: string;
}[] = [
  {
    enabledKey: "firstUserDiscount",
    finalKey: "firstUserDiscountFinalPrice",
    label: "Welcome offer",
  },
  { enabledKey: "festivalOffers", finalKey: "festivalOffersFinalPrice", label: "Festival offer" },
  {
    enabledKey: "weeklyMonthlyOffers",
    finalKey: "weeklyMonthlyOffersFinalPrice",
    label: "Long rental offer",
  },
  { enabledKey: "specialOffers", finalKey: "specialOffersFinalPrice", label: "Special offer" },
];

/**
 * The per-day rate the preview card and the guest-facing "from" price use.
 *
 * Self-drive first when both modes are on: it's the cheaper of the two (no
 * driver allowance), so the card advertises the rate a guest can actually get
 * rather than the higher chauffeur rate. Mirrors the `headlinePrice` the server
 * stamps on the Offer in submitVehicle.
 */
export function headlineRate(formData: FormData): number {
  const selfDrive = formData.selfDriveEnabled ? Number(formData.selfDrivePerDay) : 0;
  // Chauffeur listings are priced per KILOMETRE now — the per-day rate is gone
  // from the form. Falling through to it left a with-driver-only listing with a
  // headline of 0, i.e. a card advertising ₹0.
  const withDriver = formData.withDriverEnabled ? Number(formData.withDriverPerKm) : 0;
  if (Number.isFinite(selfDrive) && selfDrive > 0) return selfDrive;
  if (Number.isFinite(withDriver) && withDriver > 0) return withDriver;
  return 0;
}

/**
 * The unit the headline rate is quoted in.
 *
 * Self-drive is a daily rental and chauffeur work is per-kilometre, so the same
 * number means different things depending on which mode the listing leads with.
 * The card has to say which, or "₹12" reads as a day rate.
 */
export function headlineRateUnit(formData: FormData): "day" | "km" {
  const selfDrive = formData.selfDriveEnabled ? Number(formData.selfDrivePerDay) : 0;
  return Number.isFinite(selfDrive) && selfDrive > 0 ? "day" : "km";
}

/**
 * Pick the first enabled discount slot with a valid final price, so the preview
 * card can mirror what guests see (strikethrough original + discounted price).
 */
export function pickActiveDiscount(formData: FormData) {
  const originalPrice = headlineRate(formData);
  if (originalPrice <= 0) return null;

  for (const slot of DISCOUNT_SLOTS) {
    if (!formData[slot.enabledKey]) continue;
    const finalPrice = Number(formData[slot.finalKey]);
    if (!Number.isFinite(finalPrice) || finalPrice <= 0 || finalPrice >= originalPrice) continue;
    return { originalPrice, finalPrice, label: slot.label };
  }
  return null;
}

/**
 * The guest-facing listing name, built from the vehicle's own identity.
 *
 * The wizard used to ask for this as free text on step 0 ("Vehicle Name",
 * placeholder "e.g. Toyota Innova Crysta — 7 seater"). That field is gone, but
 * the name is not optional downstream: VehicleOnboarding.name and Offer.name are
 * both `required` in Mongoose, so a submit with no name fails at Model.create
 * before the offer is ever built. Brand and model are required on step 1 and are
 * exactly what the old placeholder was asking the vendor to retype, so the name
 * is derived from them instead of collected twice.
 *
 * Used by BOTH the submit payload and the live preview card, so what the vendor
 * sees in the panel is what gets published — the card would otherwise sit on its
 * "Your vehicle name" placeholder forever with no field left to fill in.
 */
export function deriveVehicleName(formData: FormData): string {
  const brand = (formData.brand || "").trim();
  const model = (formData.model || "").trim();

  // Models picked from VEHICLE_TAXONOMY already carry the manufacturer
  // ("Maruti Swift"), and Brand is prefilled from that same string — so joining
  // the two blindly produced "Maruti Maruti Swift" on every listing that used
  // the picklist. Only prepend a brand the model does not already state.
  if (model && brand && model.toLowerCase().startsWith(brand.toLowerCase())) return model;

  return [brand, model].filter(Boolean).join(" ") || (formData.category || "").trim() || "Vehicle";
}

/**
 * A spec summary standing in for the removed free-text description.
 *
 * `Offer.description` is `required` and the server falls back to the literal
 * string "Auto-created from vehicle rental onboarding" when the onboarding doc
 * has none — which would be published to guests on the details page. Assembling
 * the specs the wizard already collects keeps that copy off the storefront and
 * still tells a renter something true. Only fields with a value are joined, so a
 * part-filled form never renders a dangling separator.
 */
export function deriveVehicleDescription(formData: FormData): string {
  const seats = Number(formData.seatingCapacity);
  return [
    deriveVehicleName(formData),
    (formData.category || "").trim(),
    (formData.fuelType || "").trim(),
    (formData.transmission || "").trim(),
    Number.isFinite(seats) && seats > 0 ? `${seats} seater` : "",
    formData.airConditioned ? "Air conditioned" : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Where the listing sits, taken from the vendor's business address.
 *
 * The Pickup location card — street address, country, pincode, state, city —
 * was removed from the capacity step, but the fields behind it are not
 * decorative: `Offer.city` and `Offer.state` are `required` in Mongoose, the
 * server substitutes the literal "Default City" / "Default State" when they are
 * blank, and the search page filters on city. Left empty, every vehicle would
 * publish with placeholder location text and disappear from location search.
 *
 * The business address is the closest thing the wizard still collects, it is
 * required on the Business Details step, and for a rental operator it is where
 * the vehicle is actually handed over. The free-text pickup point stays what it
 * was — a human-readable branch name, not an address.
 *
 * Falls back to whatever the form already holds, so a draft saved while the old
 * card still existed keeps the location its vendor typed.
 */
export function deriveVehicleLocation(formData: FormData) {
  const pick = (business: string, existing: string) =>
    (business || "").trim() || (existing || "").trim();
  return {
    address: pick(formData.businessAddress, formData.address),
    locality: pick(formData.businessLocality, formData.locality) || "India",
    state: pick(formData.businessState, formData.state),
    city: pick(formData.businessCity, formData.city),
    pincode: pick(formData.businessPincode, formData.pincode),
  };
}
