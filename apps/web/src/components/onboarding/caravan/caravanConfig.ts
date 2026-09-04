export interface FormData {
  name: string;
  description: string;
  rules: string[];
  photos: (string | File)[];
  coverImage: (string | File)[];

  category: string | null;
  features: string[];

  seatingCapacity: number;
  sleepingCapacity: number;
  address: string;
  locality: string;
  state: string;
  city: string;
  pincode: string;

  perKmCharge: string;
  perDayCharge: string;
  perKmIncludes: string[];
  perKmExcludes: string[];
  perDayIncludes: string[];
  perDayExcludes: string[];
  priceIncludes: string[];
  priceExcludes: string[];

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

  brandName: string;
  legalCompanyName: string;
  gstNumber: string;
  businessEmailId: string;
  businessPhoneNumber: string;
  businessAddress: string;
  businessLocality: string;
  personalLocality: string;
  businessState: string;
  businessCity: string;
  businessPincode: string;

  firstName: string;
  lastName: string;
  personalState: string;
  personalCity: string;
  personalPincode: string;
  dateOfBirth: string;
  maritalStatus: string;
  idProof: string;
  idPhotos: (string | File)[];
  termsAccepted: boolean;
}

export const defaultCaravanFormData: FormData = {
  name: "",
  description: "",
  rules: [],
  photos: [],
  coverImage: [],
  category: null,
  features: [],
  seatingCapacity: 1,
  sleepingCapacity: 0,
  address: "",
  locality: "India",
  state: "",
  city: "",
  pincode: "",
  perKmCharge: "",
  perDayCharge: "",
  perKmIncludes: [],
  perKmExcludes: [],
  perDayIncludes: [],
  perDayExcludes: [],
  priceIncludes: [],
  priceExcludes: [],

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
  personalLocality: "India",
  businessState: "",
  businessCity: "",
  businessPincode: "",
  firstName: "",
  lastName: "",
  personalState: "",
  personalCity: "",
  personalPincode: "",
  dateOfBirth: "",
  maritalStatus: "",
  idProof: "",
  idPhotos: [],
  termsAccepted: false,
};

const DISCOUNT_SLOTS: {
  enabledKey: keyof FormData;
  finalKey: keyof FormData;
  label: string;
}[] = [
  { enabledKey: "firstUserDiscount", finalKey: "firstUserDiscountFinalPrice", label: "Welcome offer" },
  { enabledKey: "festivalOffers", finalKey: "festivalOffersFinalPrice", label: "Festival offer" },
  { enabledKey: "weeklyMonthlyOffers", finalKey: "weeklyMonthlyOffersFinalPrice", label: "Long stay offer" },
  { enabledKey: "specialOffers", finalKey: "specialOffersFinalPrice", label: "Special offer" },
];

/**
 * Pick the first enabled discount slot with a valid final price so the preview
 * card can mirror what guests see (strikethrough original + discounted price).
 * Falls back to per-km rate when per-day isn't set, since the preview uses
 * whichever rate is filled in.
 */
export function pickActiveDiscount(formData: FormData) {
  const originalPrice =
    Number(formData.perDayCharge) > 0
      ? Number(formData.perDayCharge)
      : Number(formData.perKmCharge) > 0
        ? Number(formData.perKmCharge)
        : 0;
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
 * Camper-van amenities shown when CMS has none published yet.
 *
 * Lives here rather than in FeaturesStep so `useOfferingCatalog` can import it
 * without pulling a React component into a hook — the admin listing form needs
 * the same fallback the vendor wizard has always had, or the two show different
 * amenity grids for the same listing. Keep in step with
 * Server/scripts/seed-caravan-features.js.
 */
export const FALLBACK_CARAVAN_FEATURES: string[] = [
  "Air Conditioning",
  "Heating",
  "Sofa / Lounge Seating",
  "Recliner Seats",
  "Storage Cabinets",
  "Double Bed",
  "Single Beds",
  "Bunk Beds",
  "Sofa Cum Bed",
  "Pillows",
  "Blankets",
  "Induction Stove / Gas Stove",
  "Microwave",
  "Refrigerator",
  "Basic Kitchen Utensils",
  "Bathroom",
  "Toilet",
  "Hot Water / Geyser",
  "Wash Basin",
  "Mirror",
  "Toiletries",
  "TV",
  "Wi-Fi",
  "Speaker",
  "Charging Points",
  "Generator",
  "Power Backup",
  "Exterior Lights",
  "Drinking Water Facility",
  "Fire Extinguisher",
  "First Aid Kit",
  "CCTV",
  "GPS Tracking",
  "Awning",
  "Outdoor Kitchen",
  "BBQ",
  "Rooftop Terrace",
  "Camping Chairs",
  "Camping Table",
  "Wheelchair Accessible",
];
