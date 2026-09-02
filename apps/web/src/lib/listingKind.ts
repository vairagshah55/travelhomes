/**
 * What kind of thing a listing is, and which fields therefore apply to it.
 *
 * Every surface that renders or edits an Offer needs this answer, and each one
 * used to work it out from the `category` STRING — a guess that fails on most
 * of the real taxonomy. "Havelis", "Palaces", "A Frame", "Igloo" and "Yurt" are
 * all stays; "Sedan", "SUV" and "Tempo Traveller" are all vehicle rentals; none
 * of them contains the word the guess looks for, so the admin form fell back to
 * showing every field it has and the drawer showed none of the specific ones.
 *
 * `serviceType` is stamped by the onboarding pipeline and is exactly this
 * answer, so it comes first. The category guess stays as the fallback for rows
 * that predate it (listings typed straight into the admin form never had one).
 */

export const SERVICE_TYPES = [
  { value: "camper-van", label: "Camper Van" },
  { value: "unique-stay", label: "Unique Stay" },
  { value: "activity", label: "Activity" },
  { value: "vehicle-rental", label: "Vehicle Rental" },
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number]["value"];

const VALUES = SERVICE_TYPES.map((s) => s.value) as readonly string[];

export const serviceTypeLabel = (value?: string) =>
  SERVICE_TYPES.find((s) => s.value === value)?.label ?? value ?? "";

/**
 * Best guess from a category name alone. Same fuzzy rules the public site uses
 * to route an offer (getNormCategory in pages/Index.tsx), widened with the
 * seeded stay taxonomy (scripts/seed-stay-taxonomy.js) and the vehicle one
 * (components/onboarding/vehicle/vehicleConfig.ts) so the names admins actually
 * see resolve instead of falling through.
 */
function guessFromCategory(category?: string): ServiceType | null {
  const c = String(category || "")
    .toLowerCase()
    .replace(/[\s_/-]+/g, "");
  if (!c) return null;

  if (["caravan", "campervan", "campertrailer", "motorhome", "rv"].some((k) => c.includes(k)))
    return "camper-van";

  if (
    ["sedan", "hatchback", "suv", "muv", "mpv", "tempo", "traveller", "minibus", "coach"].some(
      (k) => c.includes(k),
    )
  )
    return "vehicle-rental";

  if (
    c.includes("stay") ||
    [
      "glamping",
      "resort",
      "villa",
      "cottage",
      "homestay",
      "guesthouse",
      "holidayhome",
      "hostel",
      "haveli",
      "palace",
      "treehouse",
      "houseboat",
      "cabin",
      "farmhouse",
      "camping",
      "tent",
      "igloo",
      "yurt",
      "dome",
      "aframe",
      "cavehouse",
      "farmstay",
    ].some((k) => c.includes(k))
  )
    return "unique-stay";

  if (
    ["activity", "activities", "trekking", "tour", "rafting", "safari"].some((k) => c.includes(k))
  )
    return "activity";

  return null;
}

/**
 * The listing's service type: the stored value when it has one, otherwise a
 * guess from its category. Returns null when neither says anything, which the
 * admin form treats as "show everything" rather than hiding fields on a hunch.
 */
export function serviceTypeOf(listing?: {
  serviceType?: string;
  category?: string;
}): ServiceType | null {
  const stored = String(listing?.serviceType || "").toLowerCase();
  if (VALUES.includes(stored)) return stored as ServiceType;
  // Legacy rows wrote the caravan type here before the taxonomy settled.
  if (stored === "caravan") return "camper-van";
  return guessFromCategory(listing?.category);
}
