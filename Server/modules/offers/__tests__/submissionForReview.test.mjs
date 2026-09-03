/**
 * Regression tests for the submission attached to a listing detail.
 *
 * Why this exists: an `Offer` is a lossy projection of the vendor's onboarding
 * submission — 129 fields across the four service types have no column on it,
 * including the entire business identity and the personal KYC block. The admin
 * approval drawer reads the Offer, so those fields were invisible and listings
 * were being approved without anyone seeing whose they were. `getById` now
 * attaches the source submission for admins and the listing's own vendor.
 *
 * No DB: the lookup needs a `findById(id).lean()` / `findOne(f).sort(s).lean()`
 * chain, so an in-memory stand-in exercises the real ordering and fallbacks.
 */
import { describe, it, expect } from "vitest";

const service = await import("../offers.service.js");
const { submissionModelNameFor, loadSubmissionFor } = service.default._internal;

/** Minimal stand-in for a Mongoose onboarding model over `docs`. */
function fakeModel(docs) {
  const lean = (v) => ({ lean: () => Promise.resolve(v) });
  return {
    findById(id) {
      return lean(docs.find((d) => String(d._id) === String(id)) || null);
    },
    findOne(filter = {}) {
      const matches = docs.filter((d) =>
        Object.entries(filter).every(([k, v]) => String(d[k]) === String(v)),
      );
      return {
        sort() {
          const [newest] = [...matches].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          );
          return lean(newest || null);
        },
      };
    },
  };
}

describe("submissionModelNameFor", () => {
  it("prefers the stamped sourceModel", () => {
    expect(submissionModelNameFor({ sourceModel: "StayOnboarding" })).toBe("StayOnboarding");
  });

  it("falls back to serviceType for rows created before sourceModel existed", () => {
    expect(submissionModelNameFor({ serviceType: "vehicle-rental" })).toBe("VehicleOnboarding");
    expect(submissionModelNameFor({ serviceType: "camper-van" })).toBe("CaravanOnboarding");
    expect(submissionModelNameFor({ serviceType: "unique-stay" })).toBe("StayOnboarding");
    expect(submissionModelNameFor({ serviceType: "activity" })).toBe("ActivityOnboarding");
  });

  it("is case-insensitive about serviceType", () => {
    expect(submissionModelNameFor({ serviceType: "Vehicle-Rental" })).toBe("VehicleOnboarding");
  });

  it("never guesses from category — a vehicle's category is its class", () => {
    // category: "Sedan" must not resolve to a model; that is the trap
    // pickOnboardingModel documents in management.service.
    expect(submissionModelNameFor({ category: "Sedan" })).toBeNull();
    expect(submissionModelNameFor({ category: "villas" })).toBeNull();
  });

  it("returns null for an unknown service type and for no offer", () => {
    expect(submissionModelNameFor({ serviceType: "spaceship" })).toBeNull();
    expect(submissionModelNameFor(null)).toBeNull();
  });
});

describe("loadSubmissionFor", () => {
  const submission = {
    _id: "sub-1",
    __v: 3,
    status: "cancelled",
    vendorId: "VD1522",
    brandName: "Acme Stays",
    gstNumber: "27AAAA0000A1Z5",
    createdAt: "2026-08-01",
  };

  it("finds the submission by sourceId", async () => {
    const got = await loadSubmissionFor(
      { _id: "off-1", sourceId: "sub-1" },
      fakeModel([submission]),
    );
    expect(got.brandName).toBe("Acme Stays");
  });

  it("strips __v and the submission's own status", async () => {
    // The Offer is the decision of record. A superseded submission reads
    // "cancelled" under a live listing, and echoing that back would make the
    // drawer contradict the badge in its own header.
    const got = await loadSubmissionFor({ sourceId: "sub-1" }, fakeModel([submission]));
    expect(got).not.toHaveProperty("__v");
    expect(got).not.toHaveProperty("status");
    expect(got.gstNumber).toBe("27AAAA0000A1Z5");
  });

  it("does not mutate anything the caller still needs", async () => {
    const got = await loadSubmissionFor({ sourceId: "sub-1" }, fakeModel([submission]));
    expect(got.brandName).toBe("Acme Stays");
  });

  it("falls back to the vendor's newest submission when sourceId is absent", async () => {
    const older = { ...submission, _id: "old", brandName: "Old Name", createdAt: "2026-01-01" };
    const newer = { ...submission, _id: "new", brandName: "New Name", createdAt: "2026-08-20" };
    const got = await loadSubmissionFor(
      { _id: "off-1", vendorId: "VD1522" },
      fakeModel([older, newer]),
    );
    expect(got.brandName).toBe("New Name");
  });

  it("falls back when sourceId points at a submission that no longer exists", async () => {
    const got = await loadSubmissionFor(
      { sourceId: "deleted", vendorId: "VD1522" },
      fakeModel([submission]),
    );
    expect(got.brandName).toBe("Acme Stays");
  });

  it("returns null when there is nothing to find", async () => {
    expect(await loadSubmissionFor({ sourceId: "nope" }, fakeModel([]))).toBeNull();
    expect(await loadSubmissionFor({ vendorId: "VD-other" }, fakeModel([submission]))).toBeNull();
  });

  it("returns null rather than throwing when the model has no service type", async () => {
    expect(await loadSubmissionFor({ sourceId: "sub-1" }, null)).toBeNull();
    expect(await loadSubmissionFor(null, fakeModel([submission]))).toBeNull();
  });

  it("swallows a lookup failure — a bad submission must not cost the listing", async () => {
    const exploding = {
      findById() {
        return {
          lean() {
            return Promise.reject(new Error("connection reset"));
          },
        };
      },
    };
    await expect(
      loadSubmissionFor({ _id: "off-1", sourceId: "sub-1" }, exploding),
    ).resolves.toBeNull();
  });
});
