import { describe, it, expect } from "vitest";
import dto from "../management.dto.js";

const validId = "a".repeat(24);

describe("management.dto.listQuery", () => {
  it("accepts an empty query", () => {
    expect(dto.listQuery.parse({})).toEqual({});
  });
  it("accepts known statuses", () => {
    expect(dto.listQuery.parse({ status: "approved" }).status).toBe("approved");
    expect(dto.listQuery.parse({ status: "rejected" }).status).toBe("rejected");
  });
  it("rejects an unknown status", () => {
    expect(() => dto.listQuery.parse({ status: "weird" })).toThrowError();
  });
});

describe("management.dto.idParams", () => {
  it("accepts a 24-hex id", () => {
    expect(dto.idParams.parse({ id: validId }).id).toBe(validId);
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.idParams.parse({ id: "nope" })).toThrowError();
  });
});

describe("management.dto.upsertBody", () => {
  it("accepts and preserves arbitrary fields (passthrough)", () => {
    const parsed = dto.upsertBody.parse({ name: "x", price: 100, weird: true });
    expect(parsed.name).toBe("x");
    expect(parsed.price).toBe(100);
    expect(parsed.weird).toBe(true);
  });
  it("accepts an empty object", () => {
    expect(dto.upsertBody.parse({})).toEqual({});
  });
});

describe("management.dto.updateStatusBody", () => {
  it("accepts non-rejection status without reason", () => {
    expect(dto.updateStatusBody.parse({ status: "approved" }).status).toBe("approved");
  });
  it("accepts rejection with reason", () => {
    const parsed = dto.updateStatusBody.parse({ status: "rejected", rejectionReason: "spam" });
    expect(parsed.rejectionReason).toBe("spam");
  });
  it("rejects rejection without reason", () => {
    expect(() => dto.updateStatusBody.parse({ status: "rejected" })).toThrowError();
  });
  it("rejects rejection with empty reason", () => {
    expect(() =>
      dto.updateStatusBody.parse({ status: "rejected", rejectionReason: "   " }),
    ).toThrowError();
  });
  it("rejects unknown status", () => {
    expect(() => dto.updateStatusBody.parse({ status: "wat" })).toThrowError();
  });
});
