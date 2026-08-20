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
