import { describe, it, expect } from "vitest";

import {
  classifyValue,
  collectReviewPhotos,
  extraSubmissionFields,
  humanizeKey,
  isPresent,
  mergeListingForReview,
  missingForApproval,
} from "./listingReview";

/**
 * These pin the behaviour that made the approval drawer incomplete.
 *
 * The bug: an Offer is a lossy projection of the vendor's submission — 129
 * fields across the four service types never reach it, including the whole
 * business identity and personal KYC block — and the drawer read the Offer. So
 * its "Business details" / "Personal details" sections could never populate and
 * listings were approved without anyone seeing whose they were.
 */

describe("isPresent", () => {
  it("treats blank strings, empty arrays and empty objects as absent", () => {
    expect(isPresent("")).toBe(false);
    expect(isPresent("   ")).toBe(false);
    expect(isPresent([])).toBe(false);
    expect(isPresent({})).toBe(false);
    expect(isPresent(null)).toBe(false);
    expect(isPresent(undefined)).toBe(false);
  });
  it("keeps falsy-but-real values", () => {
    // `false` and `0` are answers, not gaps — an air-conditioned:false vehicle
    // must not read as "not provided".
    expect(isPresent(false)).toBe(true);
    expect(isPresent(0)).toBe(true);
  });
});

describe("mergeListingForReview", () => {
  it("surfaces submission-only fields the Offer has no column for", () => {
    const merged = mergeListingForReview({
      _id: "off1",
      name: "villas",
      submission: { brandName: "Acme Stays", gstNumber: "27AAAA0000A1Z5", dateOfBirth: "1990-01-01" },
    });
    expect(merged.brandName).toBe("Acme Stays");
    expect(merged.gstNumber).toBe("27AAAA0000A1Z5");
    expect(merged.dateOfBirth).toBe("1990-01-01");
  });

  it("lets the Offer win where it holds a real value — that transform is intentional", () => {
    const merged = mergeListingForReview({
      regularPrice: 6000,
      category: "nature-retreats",
      submission: { regularPrice: "6000", category: "stay" },
    });
    expect(merged.regularPrice).toBe(6000);
    expect(merged.category).toBe("nature-retreats");
  });

  it("falls back to the submission when the Offer's value is empty", () => {
    const merged = mergeListingForReview({
      address: "",
      description: "   ",
      submission: { address: "Jawai Camp, Nana", description: "A real description" },
    });
    expect(merged.address).toBe("Jawai Camp, Nana");
    expect(merged.description).toBe("A real description");
  });

  it("keeps the offer's own id rather than the submission's", () => {
    const merged = mergeListingForReview({ _id: "offer-id", submission: { _id: "submission-id" } });
    expect(merged._id).toBe("offer-id");
  });

  it("keeps the vendor account even when there is no submission", () => {
    // The legacy case: a seeded or admin-created listing has no onboarding
    // document, and the vendor account is then the ONLY identity available.
    const merged = mergeListingForReview({
      name: "seeded listing",
      vendor: { vendorId: "VD1522", brandName: "Acme", email: "a@b.c" },
    });
    expect(merged.__submission).toBeNull();
    expect(merged.__vendor?.brandName).toBe("Acme");
  });

  it("keeps the vendor account alongside a submission", () => {
    const merged = mergeListingForReview({
      vendor: { vendorId: "VD1522", email: "acct@x.c" },
      submission: { businessEmail: "wizard@x.c" },
    });
    expect(merged.__vendor?.email).toBe("acct@x.c");
    expect(merged.businessEmail).toBe("wizard@x.c");
  });

  it("never lets the vendor account leak into the catch-all", () => {
    const merged = mergeListingForReview({
      vendor: { vendorId: "VD1522" },
      submission: { termsAccepted: true },
    });
    const keys = extraSubmissionFields(merged).map((f) => f.key);
    expect(keys).toEqual(["termsAccepted"]);
  });

  it("is a no-op when no submission is attached (guest payload, legacy row)", () => {
    const merged = mergeListingForReview({ name: "x", regularPrice: 1 });
    expect(merged.name).toBe("x");
    expect(merged.__submission).toBeNull();
  });

  it("tolerates null / non-object input", () => {
    expect(mergeListingForReview(null)).toEqual({});
    expect(mergeListingForReview(undefined)).toEqual({});
  });
});

describe("collectReviewPhotos", () => {
  it("recovers photos beyond the Offer's six-image gallery cap", () => {
    const all = Array.from({ length: 12 }, (_, i) => `/uploads/p${i}.jpg`);
    const photos = collectReviewPhotos({
      photos: { coverUrl: "/uploads/cover.jpg", galleryUrls: all.slice(0, 6) },
      __submission: null,
      images: all,
    });
    expect(photos[0]).toBe("/uploads/cover.jpg");
    expect(photos).toHaveLength(13); // cover + 12 unique gallery images
    expect(photos).toContain("/uploads/p11.jpg");
  });

  it("gathers a stay's per-room photos", () => {
    const photos = collectReviewPhotos({
      __submission: null,
      rooms: [{ photos: ["/uploads/r1a.jpg", "/uploads/r1b.jpg"] }, { photos: ["/uploads/r2.jpg"] }],
    });
    expect(photos).toEqual(["/uploads/r1a.jpg", "/uploads/r1b.jpg", "/uploads/r2.jpg"]);
  });

  it("dedupes the same file reached by two keys", () => {
    const photos = collectReviewPhotos({
      __submission: null,
      photos: { coverUrl: "/uploads/a.jpg", galleryUrls: ["/uploads/a.jpg"] },
      coverImage: "/uploads/a.jpg",
    });
    expect(photos).toEqual(["/uploads/a.jpg"]);
  });

  it("returns nothing rather than throwing on odd shapes", () => {
    expect(collectReviewPhotos({ __submission: null })).toEqual([]);
    expect(collectReviewPhotos({ __submission: null, rooms: "nope", images: 5 })).toEqual([]);
  });
});

describe("extraSubmissionFields", () => {
  it("shows submitted fields that no curated section claims", () => {
    const merged = mergeListingForReview({
      submission: {
        termsAccepted: true,
        festivalOffersValue: "15",
        weeklyMonthlyOffersType: "percentage",
        selectedActivities: ["Trekking"],
      },
    });
    const keys = extraSubmissionFields(merged).map((f) => f.key);
    expect(keys).toContain("termsAccepted");
    expect(keys).toContain("festivalOffersValue");
    expect(keys).toContain("weeklyMonthlyOffersType");
    expect(keys).toContain("selectedActivities");
  });

  it("excludes the granular address parts, which are composed into one line", () => {
    // businessLocality/City/State/Pincode are folded into "Business address"
    // and the personal set into "Personal address"; repeating them here would
    // put eight loose values under the composed line that already says it.
    const merged = mergeListingForReview({
      submission: {
        businessLocality: "Ambavadi",
        businessCity: "Ahmedabad",
        businessState: "Gujarat",
        businessPincode: "380015",
        personalLocality: "Sabarmati",
        personalCity: "Ahmedabad",
        personalState: "Gujarat",
        personalPincode: "380005",
        personalCountry: "India",
      },
    });
    expect(extraSubmissionFields(merged)).toEqual([]);
  });

  it("does not repeat fields the curated sections already render", () => {
    const merged = mergeListingForReview({
      submission: { brandName: "Acme", city: "Jaipur", rooms: [{ name: "A" }], gstNumber: "X" },
    });
    const keys = extraSubmissionFields(merged).map((f) => f.key);
    for (const shown of ["brandName", "city", "rooms", "gstNumber"]) {
      expect(keys).not.toContain(shown);
    }
  });

  it("drops empty values so the section is not padded with blanks", () => {
    const merged = mergeListingForReview({
      submission: { termsAccepted: true, somethingBlank: "", emptyList: [] },
    });
    const keys = extraSubmissionFields(merged).map((f) => f.key);
    expect(keys).toEqual(["termsAccepted"]);
  });

  it("reads only the submission, never derived Offer columns", () => {
    // Guards against the catch-all turning into a dump of the whole Offer.
    const merged = mergeListingForReview({ someOfferOnlyField: "x", submission: { a: 1 } });
    expect(extraSubmissionFields(merged).map((f) => f.key)).toEqual(["a"]);
  });

  it("returns nothing when there is no submission", () => {
    expect(extraSubmissionFields({ __submission: null })).toEqual([]);
  });
});

describe("classifyValue", () => {
  it("picks a presentation from the value's shape", () => {
    expect(classifyValue(true)).toBe("boolean");
    expect(classifyValue(42)).toBe("number");
    expect(classifyValue("2026-08-27T00:00:00.000Z")).toBe("date");
    expect(classifyValue("/uploads/a.jpg")).toBe("url");
    expect(classifyValue("https://example.com/x")).toBe("url");
    expect(classifyValue("plain text")).toBe("text");
    expect(classifyValue(["a", "b"])).toBe("list");
    expect(classifyValue([{ name: "room" }])).toBe("objectList");
    expect(classifyValue({ a: 1 })).toBe("object");
  });
  it("does not mistake a numeric-looking string for a date", () => {
    expect(classifyValue("306504")).toBe("text");
  });
});

describe("humanizeKey", () => {
  it("turns wizard field names into labels", () => {
    expect(humanizeKey("firstUserDiscountType")).toBe("First user discount type");
    expect(humanizeKey("personalLocality")).toBe("Personal locality");
    expect(humanizeKey("termsAccepted")).toBe("Terms accepted");
  });
  it("keeps acronyms upper-case", () => {
    expect(humanizeKey("gstNumber")).toBe("GST number");
    expect(humanizeKey("rcPhotos")).toBe("RC photos");
    expect(humanizeKey("idProof")).toBe("ID proof");
  });
});

describe("missingForApproval", () => {
  const complete = {
    __submission: null,
    name: "villas",
    category: "nature-retreats",
    city: "Jaipur",
    state: "Rajasthan",
    regularPrice: 6000,
    photos: { coverUrl: "/uploads/c.jpg", galleryUrls: [] },
    brandName: "Acme Stays",
    businessEmail: "a@b.c",
  };

  it("finds nothing missing on a complete submission", () => {
    expect(missingForApproval(complete)).toEqual([]);
  });

  it("flags the business identity gap that started this audit", () => {
    const { brandName, businessEmail, ...withoutBusiness } = complete;
    const labels = missingForApproval(withoutBusiness).map((m) => m.label);
    expect(labels).toContain("Business name");
    expect(labels).toContain("Business contact");
  });

  it("treats a zero price as missing", () => {
    const labels = missingForApproval({ ...complete, regularPrice: 0 }).map((m) => m.label);
    expect(labels).toContain("Price");
  });

  it("flags a listing with no photos", () => {
    const labels = missingForApproval({ ...complete, photos: undefined }).map((m) => m.label);
    expect(labels).toContain("Photos");
  });

  it("requires insurance and an RC only for vehicle rentals", () => {
    const vehicle = { ...complete, serviceType: "vehicle-rental" };
    const labels = missingForApproval(vehicle).map((m) => m.label);
    expect(labels).toContain("Insurance expiry");
    expect(labels).toContain("Registration certificate");

    // A stay must not be asked for a registration certificate.
    expect(missingForApproval(complete).map((m) => m.label)).not.toContain(
      "Registration certificate",
    );
  });

  it("accepts the wizard's own name fields, not just the Offer's", () => {
    const { name, ...noName } = complete;
    expect(missingForApproval({ ...noName, propertyName: "Villa Rosa" }).map((m) => m.label))
      .not.toContain("Listing name");
    expect(missingForApproval({ ...noName, activityName: "Trek" }).map((m) => m.label))
      .not.toContain("Listing name");
  });
});
