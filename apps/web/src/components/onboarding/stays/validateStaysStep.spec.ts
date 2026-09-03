import { describe, it, expect } from "vitest";

import { validateStaysStep } from "./validateStaysStep";

/**
 * Step 2 of the stay wizard — the screen carrying Pricing, Check-in &
 * Check-out, and House Rules.
 *
 * The check-in/check-out assertions guard two things at once: that both fields
 * are genuinely required, and that requiring them does NOT leak into the
 * individual-room layout, which does not render the card. Validating a field
 * the vendor cannot see makes a step impossible to pass and names an input that
 * is not on screen — the failure mode that had to be unpicked twice when the
 * personal-address card was removed.
 */

/** A step-2 entire-stay input that passes, so each test can break one thing. */
const validEntire = {
  currentStep: 2,
  selectedProperties: ["villas"],
  selectedCategories: ["nature-retreats"],
  stayType: "entire" as const,
  guestCapacity: 4,
  numberOfRooms: 2,
  numberOfBeds: 2,
  numberOfBathrooms: 1,
  regularPrice: "6000",
  checkInTime: "14:00",
  checkOutTime: "11:00",
  entireStayRules: ["No smoking"],
  coverImage: "/uploads/cover.jpg",
  entireStayImages: ["a", "b", "c", "d", "e"],
  rooms: [],
  selectedFeatures: [],
  firstUserDiscount: false,
  festivalOffers: false,
  weeklyOffers: false,
  specialOffers: false,
  discountPercentage: "",
  finalPrice: "",
  brandName: "",
  companyName: "",
  businessEmail: "",
  businessPhone: "",
  businessAddress: "",
  locality: "",
  state: "",
  city: "",
  businessPincode: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  idProof: "",
  idProofImage: null,
  hasCategoriesForSelection: true,
} as unknown as Parameters<typeof validateStaysStep>[0];

describe("validateStaysStep — check-in / check-out", () => {
  it("passes when both times are set", () => {
    const { errors } = validateStaysStep(validEntire);
    expect(errors.checkInTime).toBeUndefined();
    expect(errors.checkOutTime).toBeUndefined();
  });

  it("requires a check-in time", () => {
    const { errors } = validateStaysStep({ ...validEntire, checkInTime: "" });
    expect(errors.checkInTime).toBe("Check-in time is required");
  });

  it("requires a check-out time", () => {
    const { errors } = validateStaysStep({ ...validEntire, checkOutTime: "" });
    expect(errors.checkOutTime).toBe("Check-out time is required");
  });

  it("rejects a malformed time, not just an empty one", () => {
    const { errors } = validateStaysStep({
      ...validEntire,
      checkInTime: "2pm",
      checkOutTime: "25:00",
    });
    expect(errors.checkInTime).toBe("Check-in time is required");
    expect(errors.checkOutTime).toBe("Check-out time is required");
  });

  it("accepts midnight, which is falsy-looking but valid", () => {
    // "00:00" must not be treated as "not provided".
    const { errors } = validateStaysStep({ ...validEntire, checkInTime: "00:00" });
    expect(errors.checkInTime).toBeUndefined();
  });

  it("does NOT require them for an individual-room stay, which has no such card", () => {
    const { errors } = validateStaysStep({
      ...validEntire,
      stayType: "individual",
      checkInTime: "",
      checkOutTime: "",
      rooms: [
        {
          name: "Room 1",
          description: "A room",
          photos: ["a", "b", "c", "d", "e"],
          guestCapacity: 2,
          beds: 1,
          bathrooms: 1,
          price: 2000,
        },
      ],
    } as unknown as Parameters<typeof validateStaysStep>[0]);
    expect(errors.checkInTime).toBeUndefined();
    expect(errors.checkOutTime).toBeUndefined();
  });

  it("leaves the other step-2 rules working", () => {
    // Regression guard: the new checks sit alongside the existing ones rather
    // than replacing them.
    const { errors } = validateStaysStep({ ...validEntire, regularPrice: "0" });
    expect(errors.regularPrice).toBe("Enter a valid price");
    expect(errors.checkInTime).toBeUndefined();
  });

  it("does not apply the check on other steps", () => {
    const { errors } = validateStaysStep({
      ...validEntire,
      currentStep: 0,
      checkInTime: "",
      checkOutTime: "",
    });
    expect(errors.checkInTime).toBeUndefined();
    expect(errors.checkOutTime).toBeUndefined();
  });
});
