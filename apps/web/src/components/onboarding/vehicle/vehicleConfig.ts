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
  securityDeposit: string;
  minRentalHours: string;
  selfDriveIncludes: string[];
  selfDriveExcludes: string[];

  withDriverEnabled: boolean;
  withDriverPerDay: string;
  withDriverPerKm: string;
  driverAllowancePerDay: string;
  nightChargeAfter: string;
  outstationPerKm: string;
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
  securityDeposit: "",
  minRentalHours: "24",
  selfDriveIncludes: [],
  selfDriveExcludes: [],

  withDriverEnabled: false,
  withDriverPerDay: "",
  withDriverPerKm: "",
  driverAllowancePerDay: "",
  nightChargeAfter: "22",
  outstationPerKm: "",
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
export const FALLBACK_VEHICLE_CATEGORIES = [
  { name: "Hatchback", description: "Compact city car, comfortable for up to 4 people.", emoji: "🚗" },
  { name: "Sedan", description: "Saloon car with a separate boot — 4 passengers and luggage.", emoji: "🚙" },
  { name: "SUV", description: "Higher ground clearance, suited to hills and rough roads.", emoji: "🚙" },
  { name: "MUV / MPV", description: "Seven-seat people carrier for families and small groups.", emoji: "🚐" },
  { name: "Luxury Car", description: "Premium sedan or SUV for weddings, events and corporate travel.", emoji: "🏎️" },
  { name: "Electric Car", description: "Battery-electric vehicle — quiet, and cheaper per kilometre.", emoji: "⚡" },
  { name: "Tempo Traveller", description: "Nine to seventeen seats, the standard group-travel van.", emoji: "🚐" },
  { name: "Cargo Van", description: "Van configured for goods rather than passengers.", emoji: "🚚" },
  { name: "Mini Bus", description: "Eighteen to twenty-six seats for large groups and tours.", emoji: "🚌" },
  { name: "Coach Bus", description: "Full-size coach for long-distance group travel.", emoji: "🚌" },
];

/**
 * Just the names from the list above.
 *
 * The guest search sidebar filters on `offer.category`, which is exactly one of
 * these — so its "Type" checkboxes have to be these strings verbatim. They were
 * hand-retyped in searchHelpers and had already drifted ("MUV" vs "MUV / MPV",
 * and four of them missing), which silently made those boxes match nothing.
 */
export const VEHICLE_CATEGORY_NAMES: string[] = FALLBACK_VEHICLE_CATEGORIES.map((c) => c.name);

/**
 * Step 2's amenity grid, same fallback contract. Fuel type, transmission and air
 * conditioning are absent on purpose — those are structured fields on the offer
 * because the search page filters on them, so listing them here too would let a
 * vendor set the same fact in two places that could then disagree.
 */
export const FALLBACK_VEHICLE_FEATURES: string[] = [
  "Air Conditioning",
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
  const withDriver = formData.withDriverEnabled ? Number(formData.withDriverPerDay) : 0;
  if (Number.isFinite(selfDrive) && selfDrive > 0) return selfDrive;
  if (Number.isFinite(withDriver) && withDriver > 0) return withDriver;
  return 0;
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
