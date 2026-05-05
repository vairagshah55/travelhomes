import { describe, it, expect } from "vitest";
import dto from "../vendors.dto.js";

describe("vendors.dto.listQuery", () => {
  it("applies defaults", () => {
    const parsed = dto.listQuery.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(10);
  });
  it("coerces numeric strings", () => {
    const parsed = dto.listQuery.parse({ page: "3", limit: "50" });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(50);
  });
  it("rejects limit > 100", () => {
    expect(() => dto.listQuery.parse({ limit: "500" })).toThrowError();
  });
});

describe("vendors.dto.createBody", () => {
  it("rejects a missing email", () => {
    expect(() => dto.createBody.parse({})).toThrowError();
  });
  it("accepts arbitrary nested fields (passthrough)", () => {
    const parsed = dto.createBody.parse({
      email: "v@example.com",
      brandName: "Acme",
      kycDetails: { idProof: "passport" },
    });
    expect(parsed.brandName).toBe("Acme");
  });
});

describe("vendors.dto.updateStatusBody", () => {
  it("accepts every model status", () => {
    for (const status of [
      "pending",
      "approved",
      "rejected",
      "suspended",
      "active",
      "inactive",
      "banned",
      "kyc-unverified",
    ]) {
      expect(dto.updateStatusBody.parse({ status }).status).toBe(status);
    }
  });
  it("rejects an invalid status", () => {
    expect(() => dto.updateStatusBody.parse({ status: "weird" })).toThrowError();
  });
});

describe("vendors.dto.idParams", () => {
  it("accepts an ObjectId or a custom vendorId string", () => {
    expect(dto.idParams.parse({ id: "a".repeat(24) }).id).toBe("a".repeat(24));
    expect(dto.idParams.parse({ id: "VND-XYZ" }).id).toBe("VND-XYZ");
  });
});
