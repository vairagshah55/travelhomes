/**
 * Regression tests for the "one submission in flight" gate.
 *
 * `findCurrentSubmission` is what GET /onboarding/mine reports per service type,
 * and the wizard's cross-type block (loadStayDraft / loadCaravanDraft) plus the
 * ServiceSelection tile locking are both driven by it. It must agree with
 * `findPendingSubmission`, which the submit handlers use to reject a second
 * in-flight submission — otherwise the wizard renders every step and only the
 * final submit fails.
 *
 * No DB here: the function needs nothing but a `findOne(filter).sort(spec)`
 * chain, so a plain in-memory stand-in exercises the real query logic.
 */
import { describe, it, expect } from "vitest";

const { findCurrentSubmission } = await import("../onboarding.service.js");

const USER = "user-1";

/** Minimal stand-in for a Mongoose model over `docs`. */
function fakeModel(docs) {
  return {
    findOne(filter = {}) {
      const matches = docs.filter((doc) =>
        Object.entries(filter).every(([key, value]) => String(doc[key]) === String(value)),
      );
      return {
        sort() {
          // Every call site sorts createdAt descending.
          const [newest] = [...matches].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          );
          return Promise.resolve(newest || null);
        },
      };
    },
  };
}

const doc = (status, createdAt) => ({ userId: USER, status, createdAt, tag: `${status}@${createdAt}` });

describe("findCurrentSubmission", () => {
  it("returns null when the vendor has no submissions", async () => {
    expect(await findCurrentSubmission(fakeModel([]), USER)).toBeNull();
  });

  it("surfaces a pending submission hidden behind a newer approved one", async () => {
    const model = fakeModel([
      doc("approved", "2026-08-13T18:15:00Z"),
      doc("pending", "2026-08-13T17:50:00Z"),
    ]);
    const found = await findCurrentSubmission(model, USER);
    expect(found.status).toBe("pending");
  });

  it("returns the newest doc when nothing is pending", async () => {
    const model = fakeModel([
      doc("approved", "2026-08-13T18:15:00Z"),
      doc("rejected", "2026-08-13T17:50:00Z"),
    ]);
    const found = await findCurrentSubmission(model, USER);
    expect(found.status).toBe("approved");
  });

  it("returns the newest pending doc when duplicates exist", async () => {
    const model = fakeModel([
      doc("pending", "2026-03-24T12:40:00Z"),
      doc("pending", "2026-03-24T12:42:00Z"),
    ]);
    const found = await findCurrentSubmission(model, USER);
    expect(found.createdAt).toBe("2026-03-24T12:42:00Z");
  });

  it("ignores another vendor's pending submission", async () => {
    const model = fakeModel([
      { userId: "someone-else", status: "pending", createdAt: "2026-08-13T18:00:00Z" },
      doc("approved", "2026-08-01T10:00:00Z"),
    ]);
    const found = await findCurrentSubmission(model, USER);
    expect(found.status).toBe("approved");
  });
});
