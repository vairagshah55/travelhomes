import { describe, it, expect } from "vitest";

import service from "../onboarding.service.js";

const { coverUrlFor } = service;

/**
 * `coverUrlFor` decides what a listing's hero photo is.
 *
 * The bug it fixes: submitActivity, submitCaravan and submitStay all built the
 * Offer with `coverUrl: gallery[0]`, so the cover the vendor uploaded
 * separately was stored on the onboarding doc and then never displayed
 * anywhere — every surface reads `Offer.photos.coverUrl`.
 *
 * The awkward part it has to absorb is that `coverImage` is a String on
 * ActivityOnboarding and StayOnboarding but an array on CaravanOnboarding and
 * VehicleOnboarding, so all four shapes are pinned here.
 */

const GALLERY = ["/uploads/gallery-1.jpg", "/uploads/gallery-2.jpg"];
const COVER = "/uploads/stay-cover-1786734616647-tits4x.jpg";

describe("coverUrlFor — model shapes", () => {
  it("reads a String coverImage (activity, stay)", () => {
    expect(coverUrlFor({ coverImage: COVER }, GALLERY)).toBe(COVER);
  });

  it("reads an array coverImage (caravan, vehicle)", () => {
    expect(coverUrlFor({ coverImage: [COVER, "/uploads/second.jpg"] }, GALLERY)).toBe(COVER);
  });

  it("skips blank entries in an array rather than returning them", () => {
    expect(coverUrlFor({ coverImage: ["", "   ", COVER] }, GALLERY)).toBe(COVER);
  });
});

describe("coverUrlFor — the cover wins over the gallery", () => {
  it("prefers the vendor's cover to the first gallery photo", () => {
    // The whole point: before the fix this returned GALLERY[0].
    expect(coverUrlFor({ coverImage: COVER }, GALLERY)).not.toBe(GALLERY[0]);
  });

  it("does not care what order the gallery is in", () => {
    expect(coverUrlFor({ coverImage: COVER }, [...GALLERY].reverse())).toBe(COVER);
  });
});

describe("coverUrlFor — fallback when there is no cover on file", () => {
  it("falls back to the first gallery photo when the field is absent", () => {
    // Every listing submitted before the cover was collected is in this state,
    // and it must keep showing a photo rather than a broken image.
    expect(coverUrlFor({}, GALLERY)).toBe(GALLERY[0]);
  });

  it("falls back when the cover is null", () => {
    expect(coverUrlFor({ coverImage: null }, GALLERY)).toBe(GALLERY[0]);
  });

  it("falls back when the cover is an empty array", () => {
    expect(coverUrlFor({ coverImage: [] }, GALLERY)).toBe(GALLERY[0]);
  });

  it("falls back when the cover is whitespace", () => {
    expect(coverUrlFor({ coverImage: "   " }, GALLERY)).toBe(GALLERY[0]);
  });

  it("returns an empty string when there is neither cover nor gallery", () => {
    // Offer.photos.coverUrl defaults to "", so this must not be undefined.
    expect(coverUrlFor({}, [])).toBe("");
    expect(coverUrlFor({ coverImage: null }, [])).toBe("");
  });
});

describe("coverUrlFor — defensive inputs", () => {
  it("tolerates a missing doc", () => {
    expect(coverUrlFor(null, GALLERY)).toBe(GALLERY[0]);
    expect(coverUrlFor(undefined, GALLERY)).toBe(GALLERY[0]);
  });

  it("tolerates a missing gallery", () => {
    expect(coverUrlFor({ coverImage: COVER })).toBe(COVER);
    expect(coverUrlFor({})).toBe("");
  });

  it("ignores a non-string cover instead of leaking an object into the URL", () => {
    expect(coverUrlFor({ coverImage: { url: COVER } }, GALLERY)).toBe(GALLERY[0]);
    expect(coverUrlFor({ coverImage: [{ url: COVER }] }, GALLERY)).toBe(GALLERY[0]);
  });
});
