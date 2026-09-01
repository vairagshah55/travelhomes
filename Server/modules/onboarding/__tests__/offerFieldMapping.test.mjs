/**
 * Regression tests for the submission → Offer field mapping.
 *
 * Every listing created through a vendor onboarding wizard is read back by the
 * vendor edit wizard (/offering/:id/edit), which loads it straight from the
 * Offer document. Four of these mappings were wrong or missing, and each one
 * surfaced there as data the vendor had entered and could no longer see:
 *
 *   - stay and activity wrote their SERVICE TYPE into `category`, so the edit
 *     wizard's category grid matched nothing and showed a required step as
 *     unanswered;
 *   - the activity flow stores house rules under `rulesAndRegulations`, and the
 *     mapping read `rules`, so no activity listing carried any;
 *   - no flow copied the street address across, so the address field opened
 *     blank on every listing;
 *   - the four flows spell their discount fields three different ways and none
 *     of them reached `Offer.discounts`, so every discount read as "off".
 *
 * These are pure functions over a plain submission object — no DB needed.
 */
import { describe, it, expect } from "vitest";

const {
  categoryFromOnboarding,
  addressFromOnboarding,
  discountsFromOnboarding,
  rulesFromOnboarding,
} = await import("../onboarding.service.js");

describe("categoryFromOnboarding", () => {
  it("takes a stay's category from the property type the vendor picked", () => {
    // What the stay wizard actually stores: no `category` at all, the choice is
    // in selectedProperties. This used to be hard-coded to "stay".
    expect(
      categoryFromOnboarding({ selectedProperties: ["villas"] }, "unique-stay"),
    ).toBe("villas");
  });

  it("prefers selectedCategories over selectedProperties", () => {
    expect(
      categoryFromOnboarding(
        { selectedCategories: ["Farm Stay"], selectedProperties: ["villas"] },
        "unique-stay",
      ),
    ).toBe("Farm Stay");
  });

  it("ignores a stored category that is really a service type", () => {
    // Rows written by the old mapping carry category: "stay". Treating that as
    // a real category is what kept the wizard's grid empty.
    expect(
      categoryFromOnboarding({ category: "stay", selectedProperties: ["Havelis"] }, "unique-stay"),
    ).toBe("Havelis");
  });

  it("keeps a real category the vendor chose", () => {
    expect(categoryFromOnboarding({ category: "SUV" }, "vehicle-rental")).toBe("SUV");
  });

  it("takes an activity's category from selectedActivities", () => {
    expect(
      categoryFromOnboarding({ category: "activity", selectedActivities: ["Rafting"] }, "activity"),
    ).toBe("Rafting");
  });

  it("falls back to the service type when nothing usable is on the submission", () => {
    expect(categoryFromOnboarding({}, "camper-van")).toBe("camper-van");
  });
});

describe("rulesFromOnboarding", () => {
  it("reads an activity's rules from `rulesAndRegulations`", () => {
    // The activity wizard has no `rules` field, so reading only that name meant
    // no activity listing ever carried the rules its vendor typed.
    expect(
      rulesFromOnboarding({ rulesAndRegulations: ["No alcohol", "  ", "Wear a life jacket"] }),
    ).toEqual(["No alcohol", "Wear a life jacket"]);
  });

  it("prefers `rules` when the flow populates it", () => {
    expect(
      rulesFromOnboarding({ rules: ["Quiet hours"], rulesAndRegulations: ["stale"] }),
    ).toEqual(["Quiet hours"]);
  });

  it("returns an empty array when the submission has neither", () => {
    expect(rulesFromOnboarding({})).toEqual([]);
  });
});

describe("addressFromOnboarding", () => {
  it("reads caravan / vehicle's `address`", () => {
    expect(addressFromOnboarding({ address: "12 MG Road" })).toBe("12 MG Road");
  });

  it("reads a stay's `businessAddress`, which is the only address it collects", () => {
    expect(addressFromOnboarding({ businessAddress: "  7 Church Street  " })).toBe(
      "7 Church Street",
    );
  });

  it("returns an empty string rather than undefined when there is none", () => {
    expect(addressFromOnboarding({})).toBe("");
  });
});

describe("discountsFromOnboarding", () => {
  it("maps the caravan / vehicle field names", () => {
    const d = discountsFromOnboarding({
      festivalOffers: true,
      festivalOffersType: "fixed",
      festivalOffersValue: "500",
      festivalOffersFinalPrice: "2500",
    });
    expect(d.festival).toEqual({
      enabled: true,
      type: "fixed",
      value: "500",
      finalPrice: "2500",
    });
  });

  it("maps the activity field names", () => {
    const d = discountsFromOnboarding({
      specialOffers: true,
      specialDiscountType: "percentage",
      specialDiscountAmount: "15",
      specialFinalPrice: "1700",
    });
    expect(d.special).toEqual({
      enabled: true,
      type: "percentage",
      value: "15",
      finalPrice: "1700",
    });
  });

  it("maps a stay's single shared percentage onto the slots it enabled", () => {
    const d = discountsFromOnboarding({
      firstUserDiscount: true,
      weeklyOffers: true,
      discountType: "percentage",
      discountPercentage: "10",
      finalPrice: 2700,
    });
    expect(d.firstUser).toEqual({
      enabled: true,
      type: "percentage",
      value: "10",
      finalPrice: "2700",
    });
    // weeklyOffers, not weeklyMonthlyOffers — stay and activity use the shorter
    // name for the same slot.
    expect(d.weekly.enabled).toBe(true);
    expect(d.weekly.value).toBe("10");
  });

  it("leaves a disabled slot empty instead of inheriting the shared value", () => {
    const d = discountsFromOnboarding({
      firstUserDiscount: true,
      discountType: "percentage",
      discountPercentage: "10",
    });
    expect(d.festival).toEqual({
      enabled: false,
      type: "percentage",
      value: "",
      finalPrice: "",
    });
  });

  it("produces the full four-slot shape for a submission with no discounts", () => {
    const d = discountsFromOnboarding({});
    expect(Object.keys(d)).toEqual(["firstUser", "festival", "weekly", "special"]);
    for (const slot of Object.values(d)) {
      expect(slot).toEqual({ enabled: false, type: "percentage", value: "", finalPrice: "" });
    }
  });
});
