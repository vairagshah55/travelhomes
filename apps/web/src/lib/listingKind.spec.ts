import { describe, it, expect } from "vitest";
import { serviceTypeOf, serviceTypeLabel } from "./listingKind";

/**
 * The admin form decides which third of the schema to show from this answer,
 * and the drawer decides which sections to render. It used to be guessed from
 * the category string alone, which is why a "Havelis" stay and an "SUV" rental
 * both fell through to "unknown" and were shown every field the form has.
 */
describe("serviceTypeOf", () => {
  it("trusts the stored serviceType over the category", () => {
    // A vehicle's category is its class — nothing in "SUV" says "rental".
    expect(serviceTypeOf({ serviceType: "vehicle-rental", category: "SUV" })).toBe(
      "vehicle-rental",
    );
    expect(serviceTypeOf({ serviceType: "unique-stay", category: "Villas" })).toBe("unique-stay");
  });

  it("maps the legacy 'caravan' serviceType onto camper-van", () => {
    expect(serviceTypeOf({ serviceType: "caravan" })).toBe("camper-van");
  });

  it("falls back to the category for rows that carry no serviceType", () => {
    // Listings typed straight into the admin form never had one.
    expect(serviceTypeOf({ category: "Motorhome" })).toBe("camper-van");
    expect(serviceTypeOf({ category: "Farm Stays" })).toBe("unique-stay");
    expect(serviceTypeOf({ category: "Trekking" })).toBe("activity");
    expect(serviceTypeOf({ category: "Tempo Traveller" })).toBe("vehicle-rental");
  });

  it("resolves the seeded stay taxonomy the old guess missed", () => {
    for (const category of ["Havelis", "Palaces", "A Frame", "Igloo", "Yurt", "Guest Houses"]) {
      expect(serviceTypeOf({ category })).toBe("unique-stay");
    }
  });

  it("returns null when neither field says anything", () => {
    expect(serviceTypeOf({})).toBeNull();
    expect(serviceTypeOf({ category: "Miscellaneous" })).toBeNull();
  });
});

describe("serviceTypeLabel", () => {
  it("names the known types and passes anything else through", () => {
    expect(serviceTypeLabel("vehicle-rental")).toBe("Vehicle Rental");
    expect(serviceTypeLabel("something-else")).toBe("something-else");
  });
});
