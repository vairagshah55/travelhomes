import { describe, expect, it } from "vitest";

import { VEHICLE_CATEGORY_NAMES } from "@/components/onboarding/vehicle/vehicleConfig";

import {
  filterSearchItems,
  getFilterOptions,
  getNormCategory,
  mapOfferToCard,
  type FilterArgs,
} from "./searchHelpers";

/** A vehicle-rental offer shaped like what submitVehicle stamps on the Offer. */
const vehicleOffer = {
  _id: "veh1",
  name: "Toyota Innova Crysta",
  serviceType: "vehicle-rental",
  category: "MUV / MPV",
  brand: "Toyota",
  model: "Innova Crysta",
  city: "Pune",
  state: "Maharashtra",
  regularPrice: 2400,
  seatingCapacity: 7,
  fuelType: "Diesel",
  transmission: "Manual",
  airConditioned: true,
  selfDriveEnabled: true,
  withDriverEnabled: false,
  features: ["Air Conditioning", "Bluetooth"],
};

/** Filter args with everything wide open — tests narrow one axis at a time. */
const openFilters = (over: Partial<FilterArgs> = {}): FilterArgs => ({
  activeFilter: "vehicle-rental",
  priceRange: { minVal: 0, maxVal: 99999 },
  selectedTypes: [],
  selectedCategories: [],
  selectedFacilities: [],
  sleepRange: { minVal: 0, maxVal: 99 },
  seatRange: { minVal: 0, maxVal: 99 },
  ...over,
});

describe("getNormCategory — vehicle rental", () => {
  it("routes on serviceType, which the server stamps", () => {
    expect(getNormCategory("MUV / MPV", "vehicle-rental")).toBe("vehicle-rental");
  });

  it("does not let a caravan keyword steal a vehicle offer", () => {
    // "Cargo Van" and "Minivan" both contain "van", which is in the caravan
    // keyword list — serviceType has to win, or rentals land in the caravan tab.
    expect(getNormCategory("Cargo Van", "vehicle-rental")).toBe("vehicle-rental");
    expect(getNormCategory("Minivan", "vehicle-rental")).toBe("vehicle-rental");
  });

  it("still classifies the three original services unchanged", () => {
    expect(getNormCategory("anything", "camper-van")).toBe("caravan");
    expect(getNormCategory("anything", "unique-stay")).toBe("unique-stays");
    expect(getNormCategory("anything", "activity")).toBe("activity");
  });
});

describe("getFilterOptions — vehicle rental", () => {
  const opts = getFilterOptions("vehicle-rental");

  it("offers exactly the category names the wizard can produce", () => {
    // Hand-retyped lists drift. This is the guard for that.
    expect(opts.types).toEqual(VEHICLE_CATEGORY_NAMES);
  });

  it("ships no second taxonomy for the same field", () => {
    // Type and Category both filter `item.type || item.category`. Two lists for
    // one field meant one box from each could never co-match.
    expect(opts.categories).toEqual([]);
  });

  it("every Type value actually matches its own category", () => {
    for (const type of opts.types) {
      const kept = filterSearchItems(
        [{ ...vehicleOffer, category: type }],
        openFilters({ selectedTypes: [type] }),
      );
      expect(kept, `Type "${type}" matched nothing`).toHaveLength(1);
    }
  });
});

describe("filterSearchItems — vehicle facets", () => {
  const keeps = (over: Partial<FilterArgs>) =>
    filterSearchItems([vehicleOffer], openFilters(over)).length;

  it("matches on seats, fuel, transmission and AC", () => {
    expect(keeps({ seatRange: { minVal: 4, maxVal: 7 } })).toBe(1);
    expect(keeps({ selectedFuelTypes: ["Diesel"] })).toBe(1);
    expect(keeps({ selectedTransmissions: ["Manual"] })).toBe(1);
    expect(keeps({ acOnly: true })).toBe(1);
  });

  it("excludes on each of them", () => {
    expect(keeps({ seatRange: { minVal: 8, maxVal: 20 } })).toBe(0);
    expect(keeps({ selectedFuelTypes: ["Petrol"] })).toBe(0);
    expect(keeps({ selectedTransmissions: ["Automatic"] })).toBe(0);
  });

  it("reads rental mode off the vendor's enabled flags", () => {
    expect(keeps({ selectedRentalModes: ["self-drive"] })).toBe(1);
    expect(keeps({ selectedRentalModes: ["with-driver"] })).toBe(0);
    // Either-of, not all-of: a listing offering one of the ticked modes stays.
    expect(keeps({ selectedRentalModes: ["self-drive", "with-driver"] })).toBe(1);
  });

  it("leaves an AC-less vehicle out when AC-only is on", () => {
    const noAc = [{ ...vehicleOffer, airConditioned: false }];
    expect(filterSearchItems(noAc, openFilters({ acOnly: true }))).toHaveLength(0);
  });

  it("ignores vehicle facets on the other tabs", () => {
    // A stay has no fuelType; the vehicle branch must not run for it.
    const stay = { _id: "s1", serviceType: "unique-stay", regularPrice: 1000, features: [] };
    const kept = filterSearchItems(
      [stay],
      openFilters({ activeFilter: "unique-stays", selectedFuelTypes: ["Diesel"] }),
    );
    expect(kept).toHaveLength(1);
  });
});

describe("mapOfferToCard — vehicle rental", () => {
  const card = mapOfferToCard(vehicleOffer, "vehicle-rental");

  it("routes to the vehicle detail page", () => {
    expect(card.id).toBe("/vehicle/veh1");
  });

  it("prices per day", () => {
    expect(card.unit).toBe("/ day");
    expect(card.price).toBe("₹2400");
  });

  it("leads the detail line with make and seat count", () => {
    expect(card.details).toBe("Toyota Innova Crysta · 7 seats");
  });

  it("falls back to the city when make is missing", () => {
    const bare = mapOfferToCard(
      { ...vehicleOffer, brand: undefined, model: undefined, seatingCapacity: undefined },
      "vehicle-rental",
    );
    expect(bare.details).toBe("Pune, Maharashtra");
  });
});

/* ── Regressions from the end-to-end search pass ─────────────────────────── */

/** A unique-stay exactly as the API returns one: `name`, flat city/state. */
const stayOffer = {
  _id: "stay1",
  name: "cave house",
  serviceType: "unique-stay",
  category: "stay",
  city: "Ahmedabad",
  state: "Gujarat",
  regularPrice: 10000,
  discountPrice: null,
  features: [],
};

describe("mapOfferToCard — unique stays read the fields the API sends", () => {
  const card = mapOfferToCard(stayOffer, "unique-stays");

  it("titles the card from `name`, not the absent `title`", () => {
    // Regression: this read `doc.title`, which Offer has no field for, so
    // every stay in the catalog rendered the literal fallback "Stay".
    expect(card.title).toBe("cave house");
  });

  it("locates it from the flat city/state, not `address.city`", () => {
    // Regression: `address` is a plain String on Offer, so `address.city` was
    // always undefined and the location line rendered empty.
    expect(card.details).toBe("Ahmedabad, Gujarat");
  });

  it("still falls back to a nested address on a legacy row", () => {
    const legacy = mapOfferToCard(
      { ...stayOffer, city: undefined, state: undefined, address: { city: "Patan", state: "Gujarat" } },
      "unique-stays",
    );
    expect(legacy.details).toBe("Patan, Gujarat");
  });

  it("keeps the fallback title when a row really has no name", () => {
    expect(mapOfferToCard({ ...stayOffer, name: undefined }, "unique-stays").title).toBe("Stay");
  });
});

describe("mapOfferToCard — strikethrough only for a real discount", () => {
  it("shows no struck price when the vendor set none", () => {
    // Regression: Maxprice was regularPrice, the same number printed beside
    // it, so every card advertised a discount that did not exist.
    for (const tab of ["unique-stays", "camper-van", "vehicle-rental", "activity"] as const) {
      const card = mapOfferToCard({ ...stayOffer, regularPrice: 10000 }, tab);
      expect(card.price).toBe("₹10000");
      expect(card.Maxprice).toBeUndefined();
    }
  });

  it("shows the regular price struck through when there is a markdown", () => {
    const card = mapOfferToCard({ ...stayOffer, regularPrice: 10000, discountPrice: 7500 }, "unique-stays");
    expect(card.price).toBe("₹7500");
    expect(card.Maxprice).toBe(10000);
  });

  it("ignores a discount that isn't one", () => {
    const higher = mapOfferToCard({ ...stayOffer, discountPrice: 12000 }, "unique-stays");
    expect(higher.Maxprice).toBeUndefined();
    const zero = mapOfferToCard({ ...stayOffer, discountPrice: 0 }, "unique-stays");
    expect(zero.Maxprice).toBeUndefined();
  });
});

describe("filterSearchItems — a missing capacity is not a zero", () => {
  const van = {
    _id: "van1",
    serviceType: "camper-van",
    category: "Off Road Caravan",
    regularPrice: 5775,
    features: [],
  };
  const camperArgs = (over: Partial<FilterArgs> = {}) =>
    openFilters({ activeFilter: "camper-van", ...over });

  it("keeps a van that never declared its sleeping capacity", () => {
    // Regression: `Number(x || 0)` turned "unknown" into 0, which fell below
    // the slider's floor and removed the listing from results entirely.
    const kept = filterSearchItems([van], camperArgs({ sleepRange: { minVal: 2, maxVal: 16 } }));
    expect(kept).toHaveLength(1);
  });

  it("keeps a van that never declared its seating capacity", () => {
    const kept = filterSearchItems([van], camperArgs({ seatRange: { minVal: 2, maxVal: 16 } }));
    expect(kept).toHaveLength(1);
  });

  it("still excludes one that declares a value outside the range", () => {
    const sleepsOne = { ...van, sleepingCapacity: 1 };
    expect(
      filterSearchItems([sleepsOne], camperArgs({ sleepRange: { minVal: 2, maxVal: 16 } })),
    ).toHaveLength(0);
    expect(
      filterSearchItems([sleepsOne], camperArgs({ sleepRange: { minVal: 1, maxVal: 16 } })),
    ).toHaveLength(1);
  });

  it("treats a declared zero as a real value, not as missing", () => {
    const zeroSeats = { ...van, seatingCapacity: 0 };
    expect(
      filterSearchItems([zeroSeats], camperArgs({ seatRange: { minVal: 2, maxVal: 16 } })),
    ).toHaveLength(0);
  });
});
