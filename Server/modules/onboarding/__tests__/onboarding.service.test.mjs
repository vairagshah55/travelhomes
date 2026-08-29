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

const doc = (status, createdAt) => ({
  userId: USER,
  status,
  createdAt,
  tag: `${status}@${createdAt}`,
});

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

/**
 * A pending doc whose Offer has already been decided.
 *
 * This is the state an admin approval used to leave behind whenever the
 * offer→onboarding mirror leaked (vehicle rental was the last one), and it is
 * unrecoverable from the admin UI: the offer is approved, so Approve is hidden
 * and the sync can never be re-run. `reconcileWithOffer` is what breaks the
 * vendor out of it — the Offer is what the admin acted on, so it wins.
 */
const { reconcileWithOffer, findLivePendingSubmission } = await import("../onboarding.service.js");

/** Stand-in for the Offer model: `find(filter, projection).lean()`. */
function fakeOffers(rows) {
  return {
    find(filter = {}) {
      const matches = rows.filter((r) => String(r.sourceId) === String(filter.sourceId));
      return { lean: () => Promise.resolve(matches) };
    },
  };
}

/** A saveable onboarding doc, like a Mongoose document. */
function saveableDoc(props) {
  return {
    _id: "doc-1",
    userId: USER,
    saved: 0,
    save() {
      this.saved += 1;
      return Promise.resolve(this);
    },
    ...props,
  };
}

describe("reconcileWithOffer", () => {
  it("corrects a pending doc whose offer was approved", async () => {
    const doc = saveableDoc({ status: "pending" });
    const out = await reconcileWithOffer(
      doc,
      fakeOffers([{ sourceId: "doc-1", status: "approved" }]),
    );
    expect(out.status).toBe("approved");
    expect(out.saved).toBe(1);
  });

  it("carries the admin's reason across on a rejection", async () => {
    const doc = saveableDoc({ status: "pending" });
    const out = await reconcileWithOffer(
      doc,
      fakeOffers([{ sourceId: "doc-1", status: "rejected", rejectionReason: "Blurry RC photo" }]),
    );
    expect(out.status).toBe("rejected");
    expect(out.rejectionReason).toBe("Blurry RC photo");
  });

  it("leaves a live review item alone", async () => {
    const doc = saveableDoc({ status: "pending" });
    const out = await reconcileWithOffer(
      doc,
      fakeOffers([{ sourceId: "doc-1", status: "pending" }]),
    );
    expect(out.status).toBe("pending");
    expect(out.saved).toBe(0);
  });

  it("keeps the doc pending when the offer is pending alongside a superseded one", async () => {
    const doc = saveableDoc({ status: "pending" });
    const out = await reconcileWithOffer(
      doc,
      fakeOffers([
        { sourceId: "doc-1", status: "cancelled" },
        { sourceId: "doc-1", status: "pending" },
      ]),
    );
    expect(out.status).toBe("pending");
  });

  it("leaves a doc with no offer row alone — that's the repair script's call", async () => {
    const doc = saveableDoc({ status: "pending" });
    const out = await reconcileWithOffer(doc, fakeOffers([]));
    expect(out.status).toBe("pending");
    expect(out.saved).toBe(0);
  });

  it("never throws when the offer lookup fails", async () => {
    const doc = saveableDoc({ status: "pending" });
    const boom = { find: () => ({ lean: () => Promise.reject(new Error("no db")) }) };
    const out = await reconcileWithOffer(doc, boom);
    expect(out.status).toBe("pending");
  });
});

describe("the in-flight gate after reconciliation", () => {
  /** findOne().sort() over docs whose status the reconcile pass can mutate. */
  function mutableModel(docs) {
    return {
      findOne(filter = {}) {
        const matches = docs.filter((d) =>
          Object.entries(filter).every(([k, v]) => String(d[k]) === String(v)),
        );
        return {
          sort() {
            const [newest] = [...matches].sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            );
            return Promise.resolve(newest || null);
          },
        };
      },
    };
  }

  const live = (id, status, createdAt) =>
    saveableDoc({
      _id: id,
      status,
      createdAt,
      save() {
        return Promise.resolve(this);
      },
    });

  it("stops reporting a submission whose offer was already approved", async () => {
    const docs = [live("a", "pending", "2026-08-20T18:50:00Z")];
    const offers = fakeOffers([{ sourceId: "a", status: "approved" }]);
    expect(await findLivePendingSubmission(mutableModel(docs), USER, offers)).toBeNull();
    expect(await findCurrentSubmission(mutableModel(docs), USER, offers)).toMatchObject({
      status: "approved",
    });
  });

  it("still reports a submission the admin has not decided", async () => {
    const docs = [live("a", "pending", "2026-08-20T18:50:00Z")];
    const offers = fakeOffers([{ sourceId: "a", status: "pending" }]);
    const found = await findLivePendingSubmission(mutableModel(docs), USER, offers);
    expect(found && found.status).toBe("pending");
  });

  it("skips a stranded pending doc and surfaces the one still in review", async () => {
    const docs = [
      live("stranded", "pending", "2026-08-20T18:50:00Z"),
      live("real", "pending", "2026-08-19T10:00:00Z"),
    ];
    const offers = fakeOffers([
      { sourceId: "stranded", status: "approved" },
      { sourceId: "real", status: "pending" },
    ]);
    const found = await findLivePendingSubmission(mutableModel(docs), USER, offers);
    expect(found && found._id).toBe("real");
  });
});
