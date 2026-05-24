import React from "react";
import { Flame, BedDouble, Gamepad } from "lucide-react";

/**
 * Static configuration for the Stays onboarding flow:
 * - `propertyCategories`: sub-categories keyed by property type (villa, cabin, …)
 * - `STAY_DISCOUNT_SLOTS`: which discount toggles map to which user-facing label
 * - `pickStayDiscount`: utility that returns the first enabled discount, or null
 * - `getFeaturesForProperty`: feature suggestions based on stayType + propertyType
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
 * Feature suggestions shown on the Features step. The list adapts to whether
 * the user is onboarding an entire-stay or individual-room property, and to
 * the property type they picked earlier.
 */
export const getFeaturesForProperty = (
  propertyType: string,
  category: string,
  stayType: string,
): FeatureItem[] => {
  if (stayType === "entire") {
    const entireStayFeatures: FeatureItem[] = [
      { label: "Garden", value: "garden", icon: "🌳" },
      { label: "Parking", value: "parking", icon: "🚗" },
      { label: "Sports Facilities", value: "sports", icon: Gamepad },
      { label: "Swimming Pool", value: "pool", icon: "🏊" },
      { label: "BBQ Area", value: "bbq", icon: "🍖" },
      { label: "Fireplace", value: "fireplace", icon: Flame },
      { label: "Jacuzzi", value: "jacuzzi", icon: "🛁" },
      { label: "Gym", value: "gym", icon: "💪" },
      { label: "Spa", value: "spa", icon: "💆" },
    ];

    switch (propertyType) {
      case "villa":
        return [
          ...entireStayFeatures,
          { label: "Private Pool", value: "private_pool", icon: "🏊" },
          { label: "Ocean View", value: "ocean_view", icon: "🌊" },
          { label: "Tennis Court", value: "tennis", icon: "🎾" },
        ];
      case "cabin":
        return [
          ...entireStayFeatures,
          { label: "Wood Stove", value: "wood_stove", icon: Flame },
          { label: "Hiking Trails", value: "hiking", icon: "🥾" },
          { label: "Fishing Access", value: "fishing", icon: "🎣" },
        ];
      case "castle":
        return [
          ...entireStayFeatures,
          { label: "Castle Tower", value: "tower", icon: "🏰" },
          { label: "Moat", value: "moat", icon: "🏞️" },
          { label: "Dungeon", value: "dungeon", icon: "🕳️" },
        ];
      case "farmhouse":
        return [
          ...entireStayFeatures,
          { label: "Farm Animals", value: "animals", icon: "🐄" },
          { label: "Organic Garden", value: "organic_garden", icon: "🌱" },
          { label: "Barn", value: "barn", icon: "🏭" },
        ];
      case "heritage":
        return [
          ...entireStayFeatures,
          { label: "Historical Artifacts", value: "artifacts", icon: "🏛️" },
          { label: "Antique Furniture", value: "antiques", icon: "🪑" },
          { label: "Museum Access", value: "museum", icon: "🎨" },
        ];
      default:
        return entireStayFeatures;
    }
  }

  // Individual rooms
  const roomFeatures: FeatureItem[] = [];
  switch (propertyType) {
    case "tent":
      return [
        ...roomFeatures,
        { label: "Campfire Pit", value: "campfire", icon: Flame },
        { label: "Safari Bed", value: "safari_bed", icon: BedDouble },
        { label: "Mosquito Net", value: "mosquito_net", icon: "🦟" },
      ];
    case "treehouse":
      return [
        ...roomFeatures,
        { label: "Tree Views", value: "tree_views", icon: "🌳" },
        { label: "Rope Bridge", value: "rope_bridge", icon: "🌉" },
        { label: "Bird Watching", value: "birds", icon: "🐦" },
      ];
    case "container":
      return [
        ...roomFeatures,
        { label: "Industrial Design", value: "industrial", icon: "🏗️" },
        { label: "Modern Amenities", value: "modern", icon: "✨" },
        { label: "Eco-Friendly", value: "eco", icon: "🌱" },
      ];
    default:
      return roomFeatures;
  }
};
