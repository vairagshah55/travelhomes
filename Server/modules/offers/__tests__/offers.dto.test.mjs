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

describe("offers.dto.listQuery compliance facet", () => {
  it("accepts the three compliance views", () => {
    for (const value of ["hold", "expired", "expiring"]) {
      expect(dto.listQuery.parse({ compliance: value }).compliance).toBe(value);
    }
  });
  it("rejects anything else", () => {
    expect(() => dto.listQuery.parse({ compliance: "lapsed" })).toThrowError();
  });
  it("is optional", () => {
    expect(dto.listQuery.parse({}).compliance).toBeUndefined();
  });
});

describe("offers.dto.complianceBody", () => {
  it("accepts one date on its own, so renewing the PUC leaves insurance alone", () => {
    const parsed = dto.complianceBody.parse({ pucExpiry: "2027-01-01" });
    expect(parsed.pucExpiry).toBeInstanceOf(Date);
    expect(parsed.insuranceExpiry).toBeUndefined();
  });
  it("accepts both", () => {
    const parsed = dto.complianceBody.parse({
      insuranceExpiry: "2027-06-01",
      pucExpiry: "2027-01-01",
    });
    expect(parsed.insuranceExpiry).toBeInstanceOf(Date);
    expect(parsed.pucExpiry).toBeInstanceOf(Date);
  });
  it("accepts null to clear a date", () => {
    expect(dto.complianceBody.parse({ pucExpiry: null }).pucExpiry).toBeNull();
  });
  it("rejects an empty body — there would be nothing to renew", () => {
    expect(() => dto.complianceBody.parse({})).toThrowError();
  });
  it("rejects an unparseable date", () => {
    expect(() => dto.complianceBody.parse({ insuranceExpiry: "soon" })).toThrowError();
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

/* `upsertBody` used to be `z.object({}).passthrough()`, and this suite asserted
   that contract: an arbitrary key came back untouched. That was the bug, not the
   feature — Mongoose then dropped the key and the save returned 200 having
   written nothing. The body is now derived from `Offer.schema`; the behaviour it
   replaced this with is covered in depth by offerBody.test.mjs. */
describe("offers.dto.upsertBody", () => {
  it("keeps the fields the model can store", () => {
    const parsed = dto.upsertBody.parse({ name: "x", description: "y" });
    expect(parsed.name).toBe("x");
    expect(parsed.description).toBe("y");
  });

  it("rejects a field the model cannot store, instead of passing it through", () => {
    expect(() => dto.upsertBody.parse({ name: "x", weird: 1 })).toThrowError();
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
