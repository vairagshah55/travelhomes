import { getImageUrl } from "@/lib/utils";
import { VEHICLE_CATEGORY_NAMES } from "@/components/onboarding/vehicle/vehicleConfig";

export type FilterType = "camper-van" | "unique-stays" | "activity" | "vehicle-rental";
export type RangeVal = { minVal: number; maxVal: number };

/**
 * Normalize the wide variety of "category" / "serviceType" strings the API
 * returns into our 4 homepage buckets: caravan / unique-stays / activity /
 * vehicle-rental. Used for both filtering and downstream card rendering.
 *
 * `serviceType` is stamped by the server on submit, so it's the reliable key
 * and is checked first. The category fallbacks below only run for legacy rows
 * that predate it — note that a vehicle-rental offer must be matched on
 * serviceType, because its category is free text like "Sedan" or "Mini bus"
 * which the caravan keyword list would happily claim ("van" is a substring of
 * "Cargo van" AND of "Minivan").
 */
export function getNormCategory(cat?: string, serviceType?: string) {
  const s = String(serviceType || "").toLowerCase();
  if (s === "camper-van") return "caravan" as const;
  if (s === "unique-stay" || s === "unique-stays") return "unique-stays" as const;
  if (s === "activity") return "activity" as const;
  if (s === "vehicle-rental") return "vehicle-rental" as const;

  const c = String(cat || "").toLowerCase();
  const cClean = c.replace(/[\s_-]+/g, "");
  if (cClean === "vehiclerental") return "vehicle-rental" as const;
  if (
    ["caravan", "campervan", "campertrailer", "motorhome", "rv", "van"].some((k) =>
      cClean.includes(k),
    )
  )
    return "caravan" as const;
  if (
    cClean.includes("stay") ||
    cClean === "uniquestays" ||
    cClean === "unique" ||
    cClean === "stays" ||
    cClean === "glamping" ||
    cClean === "resort" ||
    cClean === "villa"
  )
    return "unique-stays" as const;
  if (
    cClean === "activity" ||
    cClean === "activities" ||
    cClean === "trekking" ||
    cClean === "tour"
  )
    return "activity" as const;
  return "unique-stays" as const;
}

export interface FilterArgs {
  activeFilter: FilterType;
  priceRange: RangeVal;
  selectedTypes: string[];
  selectedCategories: string[];
  selectedFacilities: string[];
  sleepRange: RangeVal;
  seatRange: RangeVal;
  /** Vehicle-rental only. Empty/undefined means "don't filter on this". */
  selectedFuelTypes?: string[];
  selectedTransmissions?: string[];
  selectedRentalModes?: string[];
  acOnly?: boolean;
}

/**
 * Apply price / type / category / facilities filters to a list of offers,
 * plus the camper-van-only sleeps / seating range filters.
 */
export function filterSearchItems(items: any[], args: FilterArgs) {
  const {
    activeFilter,
    priceRange,
    selectedTypes,
    selectedCategories,
    selectedFacilities,
    sleepRange,
    seatRange,
    selectedFuelTypes,
    selectedTransmissions,
    selectedRentalModes,
    acOnly,
  } = args;
  return items.filter((item) => {
    const price = Number(item.regularPrice || 0);
    if (price < priceRange.minVal || price > priceRange.maxVal) return false;

    if (selectedTypes.length > 0) {
      const itemType = item.type || item.category || "";
      if (!selectedTypes.some((type) => itemType.toLowerCase().includes(type.toLowerCase()))) {
        return false;
      }
    }

    if (selectedCategories.length > 0) {
      const itemCategory = item.category || "";
      if (
        !selectedCategories.some((cat) => itemCategory.toLowerCase().includes(cat.toLowerCase()))
      ) {
        return false;
      }
    }

    if (selectedFacilities.length > 0) {
      const itemFacilities = item.features || item.facilities || item.amenities || [];
      const facilitiesArray = Array.isArray(itemFacilities) ? itemFacilities : [itemFacilities];
      if (
        !selectedFacilities.some((facility) =>
          facilitiesArray.some((itemFac: string) =>
            itemFac.toLowerCase().includes(facility.toLowerCase()),
          ),
        )
      ) {
        return false;
      }
    }

    if (activeFilter === "camper-van" && sleepRange) {
      const sleeps = Number(item.sleepingCapacity || item.sleeps || item.capacity || 0);
      if (sleeps < sleepRange.minVal || sleeps > sleepRange.maxVal) return false;
    }

    if (activeFilter === "camper-van" && seatRange) {
      const seating = Number(item.seatingCapacity || item.seating || item.passengers || 0);
      if (seating < seatRange.minVal || seating > seatRange.maxVal) return false;
    }

    // ─── Vehicle-rental facets ──────────────────────────────────────────
    if (activeFilter === "vehicle-rental") {
      if (seatRange) {
        const seating = Number(item.seatingCapacity || item.seating || item.passengers || 0);
        if (seating < seatRange.minVal || seating > seatRange.maxVal) return false;
      }

      if (selectedFuelTypes && selectedFuelTypes.length > 0) {
        if (!selectedFuelTypes.includes(String(item.fuelType || ""))) return false;
      }

      if (selectedTransmissions && selectedTransmissions.length > 0) {
        if (!selectedTransmissions.includes(String(item.transmission || ""))) return false;
      }

      // A mode filter asks "can I book it this way", so it reads the vendor's
      // enabled flags rather than a stored mode on the offer.
      if (selectedRentalModes && selectedRentalModes.length > 0) {
        const offered: string[] = [];
        if (item.selfDriveEnabled) offered.push("self-drive");
        if (item.withDriverEnabled) offered.push("with-driver");
        if (!selectedRentalModes.some((m) => offered.includes(m))) return false;
      }

      if (acOnly && !item.airConditioned) return false;
    }

    return true;
  });
}

/** Sort offers using one of: price-low, price-high, rating, newest, recommended. */
export function sortSearchItems(items: any[], sortBy: string) {
  const sorted = [...items];
  switch (sortBy) {
    case "price-low":
      return sorted.sort((a, b) => Number(a.regularPrice || 0) - Number(b.regularPrice || 0));
    case "price-high":
      return sorted.sort((a, b) => Number(b.regularPrice || 0) - Number(a.regularPrice || 0));
    case "rating":
      return sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      );
    case "recommended":
    default:
      return sorted;
  }
}

/**
 * Map a raw offer doc into the simplified card shape rendered by DefaultCard,
 * picking the route + price unit + fallback image based on `activeFilter`.
 */
export function mapOfferToCard(doc: any, activeFilter: FilterType) {
  if (activeFilter === "camper-van") {
    const cover =
      getImageUrl(doc?.photos?.coverUrl) ||
      getImageUrl(doc?.photos?.galleryUrls?.[0]) ||
      "https://api.builder.io/api/v1/image/assets/TEMP/89f609eeb750fe283dc03242d757caafc89778de?width=610";
    return {
      id: `/campervan/${doc?._id}`,
      title: doc?.name || "Camper Van",
      details: [doc?.city, doc?.state].filter(Boolean).join(", ") || doc?.category || "",
      price:
        typeof doc?.regularPrice === "number"
          ? `₹${doc.regularPrice}`
          : `₹${Number(doc?.regularPrice || 0)}`,
      Maxprice: doc?.regularPrice || "0",
      unit: "/ day",
      image: cover,
    };
  }
  if (activeFilter === "vehicle-rental") {
    const cover =
      getImageUrl(doc?.photos?.coverUrl) ||
      getImageUrl(doc?.photos?.galleryUrls?.[0]) ||
      "https://api.builder.io/api/v1/image/assets/TEMP/89f609eeb750fe283dc03242d757caafc89778de?width=610";
    // Details line leads with brand + model when the vendor supplied them —
    // "Toyota Innova Crysta · 7 seats" identifies a rental far better than the
    // city does, which the guest already filtered by.
    const make = [doc?.brand, doc?.model].filter(Boolean).join(" ");
    const seats = doc?.seatingCapacity ? `${doc.seatingCapacity} seats` : "";
    const place = [doc?.city, doc?.state].filter(Boolean).join(", ");
    return {
      id: `/vehicle/${doc?._id}`,
      title: doc?.name || "Vehicle",
      details: [make, seats].filter(Boolean).join(" · ") || place,
      price:
        typeof doc?.regularPrice === "number"
          ? `₹${doc.regularPrice}`
          : `₹${Number(doc?.regularPrice || 0)}`,
      Maxprice: doc?.regularPrice || "0",
      unit: "/ day",
      image: cover,
    };
  }
  if (activeFilter === "unique-stays") {
    const cover =
      getImageUrl(doc?.photos?.coverUrl) ||
      getImageUrl(doc?.photos?.galleryUrls?.[0]) ||
      "https://api.builder.io/api/v1/image/assets/TEMP/25e2e450e32f87a421008f2fe2aed42df10fdc1d?width=610";
    return {
      id: `/unique-stay/${doc?._id}`,
      title: doc?.title || "Stay",
      details: [doc?.address?.city, doc?.address?.state].filter(Boolean).join(", "),
      price: typeof doc?.regularPrice === "number" ? `₹${doc.regularPrice}` : "₹0",
      Maxprice: doc?.regularPrice || "0",
      unit: "/ night",
      image: cover,
    };
  }
  const cover =
    getImageUrl(doc?.photos?.coverUrl) ||
    getImageUrl(doc?.photos?.galleryUrls?.[0]) ||
    "https://api.builder.io/api/v1/image/assets/TEMP/656745c46883e051f1f370be11b6598af4ab6549?width=610";
  return {
    id: `/activity/${doc?._id}`,
    title: doc?.name || "Activity",
    details: [doc?.city, doc?.state].filter(Boolean).join(", "),
    price: typeof doc?.regularPrice === "number" ? `₹${doc.regularPrice}` : "₹0",
    Maxprice: doc?.regularPrice || "0",
    unit: "/ person",
    image: cover,
  };
}

/** Filter chips shown in the sidebar — per-tab list of types/categories/facilities. */
export function getFilterOptions(activeFilter: FilterType) {
  switch (activeFilter) {
    case "camper-van":
      return {
        types: ["Motorhome", "Camper Trailer", "RV", "Caravan"],
        categories: ["Luxury", "Standard", "Budget", "Eco"],
        facilities: ["AC", "Kitchen", "Parking", "Wi-Fi", "Shower", "Toilet"],
      };
    case "unique-stays":
      return {
        types: ["Villa", "Apartment", "House", "Resort"],
        categories: ["Luxury", "Standard", "Budget", "Eco"],
        facilities: ["Pool", "Wi-Fi", "Kitchen", "Parking", "AC", "Garden"],
      };
    case "activity":
      return {
        types: ["Adventure", "Cultural", "Sports", "Relaxation"],
        categories: ["Luxury", "Standard", "Budget", "Eco"],
        facilities: ["Equipment Included", "Guide", "Transportation", "Meals", "Insurance"],
      };
    case "vehicle-rental":
      // `categories` is deliberately empty. Both the Type and the Category
      // checkbox groups filter the SAME field (`item.type || item.category`, and
      // an Offer has no `type`), so shipping two lists for one field meant
      // ticking one box from each — Type "Sedan" + Category "Luxury" — demanded
      // a category containing both words and always returned nothing. For a
      // vehicle the CMS category IS the type, so there is only one list.
      return {
        types: VEHICLE_CATEGORY_NAMES,
        categories: [],
        facilities: [
          "AC",
          "Music System",
          "Bluetooth",
          "GPS",
          "Reverse Camera",
          "Child Seat",
          "Roof Carrier",
        ],
      };
    default:
      return { types: [], categories: [], facilities: [] };
  }
}
