import React from "react";
import {
  Bandage,
  Bath,
  BedDouble,
  Bike,
  Bus,
  Car,
  CarFront,
  ChefHat,
  Clapperboard,
  ConciergeBell,
  CookingPot,
  Droplets,
  Dumbbell,
  Flame,
  Flower2,
  Gamepad2,
  Heart,
  HeartPulse,
  Laptop,
  Martini,
  MonitorPlay,
  Mountain,
  PawPrint,
  PlugZap,
  Presentation,
  ShieldCheck,
  ShowerHead,
  Sparkles,
  Sprout,
  Sun,
  Thermometer,
  Trees,
  TreePalm,
  Tv,
  ToyBrick,
  Users,
  Utensils,
  UtensilsCrossed,
  WashingMachine,
  Waves,
  Wifi,
  Wind,
} from "lucide-react";

/**
 * Static configuration for the Stays onboarding flow:
 * - `propertyCategories`: sub-categories keyed by property type (villa, cabin, …)
 * - `STAY_DISCOUNT_SLOTS`: which discount toggles map to which user-facing label
 * - `pickStayDiscount`: utility that returns the first enabled discount, or null
 * - `STAY_AMENITIES`: the canonical amenity list shown on the Features step
 *
 * Kept out of the page file so the page stays focused on state/handlers.
 */

export const propertyCategories: Record<string, { id: string; name: string; icon: string }[]> = {
  villa: [],
  cabin: [
    { id: "rustic", name: "Rustic Cabin", icon: "🏕️" },
    { id: "modern", name: "Modern Cabin", icon: "🏠" },
    { id: "glamping", name: "Glamping Cabin", icon: "✨" },
    { id: "lakefront", name: "Lakefront Cabin", icon: "🏞️" },
  ],
  castle: [
    { id: "medieval", name: "Medieval Castle", icon: "🏰" },
    { id: "contemporary", name: "Contemporary Castle", icon: "🏛️" },
    { id: "boutique", name: "Boutique Castle", icon: "💎" },
  ],
  cave: [
    { id: "natural", name: "Natural Cave", icon: "🕳️" },
    { id: "luxury", name: "Luxury Cave", icon: "💎" },
    { id: "adventure", name: "Adventure Cave", icon: "🧗" },
  ],
  farmhouse: [
    { id: "traditional", name: "Traditional Farmhouse", icon: "🏘️" },
    { id: "modern", name: "Modern Farmhouse", icon: "🏠" },
    { id: "organic", name: "Organic Farmhouse", icon: "🌱" },
  ],
  camping: [
    { id: "tent", name: "Tent Camping", icon: "⛺" },
    { id: "rv", name: "RV Camping", icon: "🚐" },
    { id: "glamping", name: "Glamping Site", icon: "🏕️" },
  ],
  hut: [
    { id: "traditional", name: "Traditional Hut", icon: "🏠" },
    { id: "beach", name: "Beach Hut", icon: "🏖️" },
    { id: "mountain", name: "Mountain Hut", icon: "🏔️" },
  ],
  heritage: [
    { id: "colonial", name: "Colonial Heritage", icon: "🏛️" },
    { id: "palace", name: "Heritage Palace", icon: "🏰" },
    { id: "manor", name: "Heritage Manor", icon: "🏡" },
  ],
  tiny: [
    { id: "modern", name: "Modern Tiny Home", icon: "🏠" },
    { id: "rustic", name: "Rustic Tiny Home", icon: "🏕️" },
    { id: "offgrid", name: "Off-Grid Tiny Home", icon: "🔋" },
  ],
  tent: [
    { id: "safari", name: "Safari Tent", icon: "🦁" },
    { id: "luxury", name: "Luxury Tent", icon: "💎" },
    { id: "adventure", name: "Adventure Tent", icon: "🧗" },
  ],
  village: [
    { id: "traditional", name: "Traditional Village", icon: "🏘️" },
    { id: "cultural", name: "Cultural Village", icon: "🎭" },
    { id: "homestay", name: "Homestay Village", icon: "🏠" },
  ],
  container: [
    { id: "modern", name: "Modern Container", icon: "🏗️" },
    { id: "shipping", name: "Shipping Container", icon: "🚢" },
    { id: "luxury", name: "Luxury Container", icon: "💎" },
  ],
  cruise: [
    { id: "luxury", name: "Luxury Cruise", icon: "🛳️" },
    { id: "adventure", name: "Adventure Cruise", icon: "🗺️" },
    { id: "family", name: "Family Cruise", icon: "👨‍👩‍👧‍👦" },
  ],
};

export const STAY_DISCOUNT_SLOTS: { key: string; label: string }[] = [
  { key: "firstUserDiscount", label: "Welcome offer" },
  { key: "festivalOffers", label: "Festival offer" },
  { key: "weeklyOffers", label: "Long stay offer" },
  { key: "specialOffers", label: "Special offer" },
];

/**
 * Returns the discount data for the first enabled offer toggle, or null if no
 * offer is enabled or the prices don't actually represent a discount.
 */
export function pickStayDiscount(
  regularPrice: string,
  finalPrice: string,
  offers: Record<string, boolean>,
): { originalPrice: number; finalPrice: number; label: string } | null {
  const original = Number(regularPrice);
  const discounted = Number(finalPrice);
  if (!Number.isFinite(original) || original <= 0) return null;
  if (!Number.isFinite(discounted) || discounted <= 0 || discounted >= original) return null;
  for (const slot of STAY_DISCOUNT_SLOTS) {
    if (offers[slot.key])
      return { originalPrice: original, finalPrice: discounted, label: slot.label };
  }
  return null;
}

type FeatureItem = { label: string; value: string; icon: string | React.ComponentType<any> };

/**
 * The canonical stay amenity list, in the order it is shown on the Features
 * step. Grouped by what a guest is actually deciding on — where they sleep and
 * wash, then climate and connectivity, then the facilities, then the outside,
 * then food, service, getting there, who it suits, safety, things to do, and
 * the extras. "Other" is not an entry: it is the "Add custom" pill the step
 * already renders after this list.
 *
 * ── Two things about this list that are load-bearing ──────────────────────
 *
 * 1. `value === label`, deliberately. `selectedFeatures` is persisted verbatim
 *    and the server hands it to the Offer as `features`
 *    (onboarding.service.js: `features: doc.selectedFeatures`), which
 *    `UniqueStayDetails` renders straight into the amenity grid as the display
 *    name. The old list used slugs, so a published stay showed travellers
 *    "pool", "bbq" and "ocean_view" — while admin-defined and custom amenities
 *    in the same array were already human text. One array, two conventions;
 *    this settles it on the readable one. Existing listings keep whatever they
 *    stored, so nothing regresses — they simply stop being added to.
 *
 * 2. It does not vary by property type any more. The old function branched on
 *    `stayType`/`propertyType` and, for individual-room stays, returned an
 *    EMPTY array for every property type except tent, treehouse and container —
 *    so a homestay or villa onboarding reached the amenities step and was shown
 *    nothing to pick. The per-type extras it did have (Ocean View, Farm
 *    Animals, Castle Tower…) are the exact case "Add custom" exists for, and
 *    the caravan flow already works this way: one flat canonical list.
 */
export const STAY_AMENITIES: FeatureItem[] = [
  { label: "Room & Bedroom", value: "Room & Bedroom", icon: BedDouble },
  { label: "Bathroom", value: "Bathroom", icon: ShowerHead },
  { label: "Kitchen & Dining", value: "Kitchen & Dining", icon: UtensilsCrossed },
  { label: "Air Conditioning", value: "Air Conditioning", icon: Wind },
  { label: "Room Heater", value: "Room Heater", icon: Thermometer },
  { label: "Wi-Fi & Internet", value: "Wi-Fi & Internet", icon: Wifi },
  { label: "TV & Entertainment", value: "TV & Entertainment", icon: Tv },
  { label: "Smart TV", value: "Smart TV", icon: MonitorPlay },
  { label: "Swimming Pool", value: "Swimming Pool", icon: Waves },
  { label: "Spa & Wellness", value: "Spa & Wellness", icon: Flower2 },
  { label: "Gym & Fitness", value: "Gym & Fitness", icon: Dumbbell },
  { label: "Outdoor Space", value: "Outdoor Space", icon: Trees },
  { label: "Garden & Lawn", value: "Garden & Lawn", icon: Sprout },
  { label: "Balcony & Terrace", value: "Balcony & Terrace", icon: Sun },
  { label: "Food & Dining", value: "Food & Dining", icon: Utensils },
  { label: "Private Kitchen", value: "Private Kitchen", icon: CookingPot },
  { label: "Private Chef", value: "Private Chef", icon: ChefHat },
  { label: "Room Service", value: "Room Service", icon: ConciergeBell },
  { label: "Housekeeping", value: "Housekeeping", icon: Sparkles },
  { label: "Laundry", value: "Laundry", icon: WashingMachine },
  { label: "Parking", value: "Parking", icon: Car },
  { label: "Valet Parking", value: "Valet Parking", icon: CarFront },
  { label: "EV Charging", value: "EV Charging", icon: PlugZap },
  { label: "Transportation", value: "Transportation", icon: Bus },
  { label: "Family & Kids Friendly", value: "Family & Kids Friendly", icon: Users },
  { label: "Kids Play Area", value: "Kids Play Area", icon: ToyBrick },
  { label: "Pet Friendly", value: "Pet Friendly", icon: PawPrint },
  { label: "Couple Friendly", value: "Couple Friendly", icon: Heart },
  { label: "Safety & Security", value: "Safety & Security", icon: ShieldCheck },
  { label: "First Aid", value: "First Aid", icon: Bandage },
  { label: "Adventure Activities", value: "Adventure Activities", icon: Mountain },
  { label: "Outdoor Activities", value: "Outdoor Activities", icon: Bike },
  { label: "Indoor Activities", value: "Indoor Activities", icon: Gamepad2 },
  { label: "Bonfire & BBQ", value: "Bonfire & BBQ", icon: Flame },
  { label: "Wellness & Yoga", value: "Wellness & Yoga", icon: HeartPulse },
  { label: "Private Cinema", value: "Private Cinema", icon: Clapperboard },
  { label: "Private Bar", value: "Private Bar", icon: Martini },
  { label: "Workspace", value: "Workspace", icon: Laptop },
  { label: "Meeting Room", value: "Meeting Room", icon: Presentation },
  { label: "Hammock", value: "Hammock", icon: TreePalm },
  { label: "Bathtub", value: "Bathtub", icon: Bath },
  { label: "Jacuzzi", value: "Jacuzzi", icon: Droplets },
];

/**
 * Kept as a function because the Features step is fed through several layers of
 * props, and because a future property type may genuinely want to append to the
 * list. It ignores its arguments today — see the note on STAY_AMENITIES.
 */
export const getFeaturesForProperty = (
  _propertyType: string,
  _category: string,
  _stayType: string,
): FeatureItem[] => STAY_AMENITIES;

/**
 * Names only, for the two surfaces that render amenities as plain strings: the
 * vendor console's Add/Edit offering wizards, whose unique-stay list comes from
 * CMS → Features → Unique Stays and had NO fallback — so on a CMS that has not
 * been seeded, a vendor adding a stay from the console reached the Features
 * step and was shown an empty grid.
 *
 * Same list, same order, so a vendor sees the same amenities whether they are
 * onboarding a property or adding one from the console. This mirrors what
 * camper vans already do with `CAMPER_VAN_FEATURES`.
 */
export const STAY_AMENITY_NAMES: string[] = STAY_AMENITIES.map((a) => a.value);
