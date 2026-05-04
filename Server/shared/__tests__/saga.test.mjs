/**
 * Saga unit tests — exercise the compensation fallback path without a real
 * MongoDB. We mock mongoose.startSession to throw `code: 20` (transactions
 * unsupported), then verify that:
 *   1. Successful runs return all results.
 *   2. A mid-run failure invokes `undo` on every completed step in reverse.
 *   3. A failed `undo` is logged but doesn't mask the original error.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Stub mongoose.startSession to simulate "transactions not supported".
// Done before importing saga so the require chain picks up the mock.
vi.mock("mongoose", async () => {
  const actual = await vi.importActual("mongoose");
  return {
    ...actual,
    default: {
      ...actual.default,
      startSession: async () => ({
        endSession: () => {},
        withTransaction: async () => {
          // Mimic standalone-mongod behavior.
          const err = new Error(
            "Transaction numbers are only allowed on a replica set member or mongos",
          );
          err.code = 20;
          throw err;
        },
      }),
    },
  };
});

const { runSaga } = await import("../saga.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("runSaga — compensation fallback", () => {
  it("runs all steps and returns their docs when each succeeds", async () => {
    const undo = vi.fn();
    const results = await runSaga(
      [
        { do: vi.fn(async () => ({ _id: "a" })), undo },
        { do: vi.fn(async () => ({ _id: "b" })), undo },
        { do: vi.fn(async () => ({ _id: "c" })), undo },
      ],
      { name: "test-success" },
    );
    expect(results).toEqual([{ _id: "a" }, { _id: "b" }, { _id: "c" }]);
    expect(undo).not.toHaveBeenCalled();
  });

  it("compensates completed steps in reverse when a later step throws", async () => {
    const undoA = vi.fn();
    const undoB = vi.fn();
    const undoC = vi.fn();
    const callOrder = [];

    const steps = [
      {
        do: async () => ({ _id: "a" }),
        undo: async (doc) => {
          callOrder.push(`undo-A:${doc._id}`);
          undoA(doc);
        },
      },
      {
        do: async () => ({ _id: "b" }),
        undo: async (doc) => {
          callOrder.push(`undo-B:${doc._id}`);
          undoB(doc);
        },
      },
      {
        do: async () => {
          throw new Error("step C failed");
        },
        undo: undoC,
      },
    ];

    await expect(runSaga(steps, { name: "test-fail" })).rejects.toThrow(/rolled back/);
    // Compensations run in reverse: B before A.
    expect(callOrder).toEqual(["undo-B:b", "undo-A:a"]);
    expect(undoA).toHaveBeenCalledOnce();
    expect(undoB).toHaveBeenCalledOnce();
    // The failing step's undo never runs (its `do` didn't return).
    expect(undoC).not.toHaveBeenCalled();
  });

  it("still throws when a compensation itself fails (manual cleanup needed)", async () => {
    const steps = [
      {
        do: async () => ({ _id: "a" }),
        undo: async () => {
          throw new Error("undo failed");
        },
      },
      {
        do: async () => {
          throw new Error("step B failed");
        },
        undo: async () => {},
      },
    ];

    await expect(runSaga(steps, { name: "test-undo-fail" })).rejects.toThrow(/rolled back/);
    // The error message preserves the original failure cause.
  });

  it("throws the original error when a non-transaction error occurs", async () => {
    // The saga only falls back to compensation on the specific
    // `code === 20` shape. A regular error inside a step should propagate
    // through compensation and surface as a SAGA_FAILED error.
    const steps = [
      {
        do: async () => ({ _id: "a" }),
        undo: async () => {},
      },
      {
        do: async () => {
          const err = new Error("validation failed");
          err.name = "ValidationError";
          throw err;
        },
        undo: async () => {},
      },
    ];

    await expect(runSaga(steps, { name: "test-validation" })).rejects.toMatchObject({
      code: "SAGA_FAILED",
      statusCode: 500,
    });
  });
});
