import { describe, it, expect } from "vitest";
import dto from "../offers.dto.js";

const validId = "a".repeat(24);

describe("offers.dto.listQuery", () => {
  it("applies pagination defaults", () => {
    const parsed = dto.listQuery.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });
  it("coerces string ints", () => {
    const parsed = dto.listQuery.parse({ page: "5", limit: "50" });
    expect(parsed.page).toBe(5);
    expect(parsed.limit).toBe(50);
  });
  it("rejects limit > 100", () => {
    expect(() => dto.listQuery.parse({ limit: "500" })).toThrowError();
  });
  it("rejects an unknown sort", () => {
    expect(() => dto.listQuery.parse({ sort: "weird" })).toThrowError();
  });
  it('accepts mine="true"', () => {
    expect(dto.listQuery.parse({ mine: "true" }).mine).toBe("true");
  });
  it("accepts an unknown status (rejected)", () => {
    expect(() => dto.listQuery.parse({ status: "weird" })).toThrowError();
  });
});

describe("offers.dto.idParams", () => {
  it("accepts a 24-hex id", () => {
    expect(dto.idParams.parse({ id: validId }).id).toBe(validId);
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.idParams.parse({ id: "nope" })).toThrowError();
  });
});

describe("offers.dto.rateBody", () => {
  it("accepts a number rating in range", () => {
    expect(dto.rateBody.parse({ rating: 4 }).rating).toBe(4);
  });
  it("coerces a string rating", () => {
    expect(dto.rateBody.parse({ rating: "5" }).rating).toBe(5);
  });
  it("rejects rating > 5", () => {
    expect(() => dto.rateBody.parse({ rating: 6 })).toThrowError();
  });
  it("rejects rating < 1", () => {
    expect(() => dto.rateBody.parse({ rating: 0 })).toThrowError();
  });
});

describe("offers.dto.updateStatusBody", () => {
  it("accepts a known status", () => {
    expect(dto.updateStatusBody.parse({ status: "approved" }).status).toBe("approved");
  });
  it("accepts a status with reason", () => {
    expect(dto.updateStatusBody.parse({ status: "rejected", reason: "spam" }).reason).toBe("spam");
  });
  it("rejects an unknown status", () => {
    expect(() => dto.updateStatusBody.parse({ status: "weird" })).toThrowError();
  });
});

describe("offers.dto.upsertBody", () => {
  it("accepts and preserves arbitrary fields", () => {
    const parsed = dto.upsertBody.parse({ name: "x", description: "y", weird: 1 });
    expect(parsed.name).toBe("x");
    expect(parsed.weird).toBe(1);
  });
});

describe("offers.dto.listQuery — availability window", () => {
  it("coerces ISO date strings", () => {
    const q = dto.listQuery.parse({
      checkin: "2026-09-25T00:00:00.000Z",
      checkout: "2026-09-28T00:00:00.000Z",
    });
    expect(q.checkin).toBeInstanceOf(Date);
    expect(q.checkout.toISOString()).toBe("2026-09-28T00:00:00.000Z");
  });

  it("rejects an unparseable date rather than silently ignoring it", () => {
    expect(() => dto.listQuery.parse({ checkin: "notadate" })).toThrowError();
  });

  it("leaves both optional — a browse with no dates is still valid", () => {
    const q = dto.listQuery.parse({ status: "approved" });
    expect(q.checkin).toBeUndefined();
    expect(q.checkout).toBeUndefined();
  });
});
