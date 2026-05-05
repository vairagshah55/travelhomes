import { describe, it, expect } from "vitest";
import dto from "../booking-details.dto.js";

const validId = "a".repeat(24);

describe("booking-details.dto.listQuery", () => {
  it("accepts an empty query", () => {
    expect(dto.listQuery.parse({})).toEqual({});
  });
  it("accepts a vendorId filter", () => {
    expect(dto.listQuery.parse({ vendorId: "VND123" }).vendorId).toBe("VND123");
  });
});

describe("booking-details.dto.getByIdParams + getByIdQuery", () => {
  it("accepts a hex id and optional vendorId", () => {
    expect(dto.getByIdParams.parse({ id: validId }).id).toBe(validId);
    expect(dto.getByIdQuery.parse({ vendorId: "x" }).vendorId).toBe("x");
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.getByIdParams.parse({ id: "nope" })).toThrowError();
  });
});

describe("booking-details.dto.createBody", () => {
  it("accepts a minimal valid create payload", () => {
    expect(
      dto.createBody.parse({ clientName: "Alex", serviceName: "Mountain Cabin" }).clientName,
    ).toBe("Alex");
  });
  it("rejects a missing clientName", () => {
    expect(() => dto.createBody.parse({ serviceName: "x" })).toThrowError();
  });
  it("rejects a missing serviceName", () => {
    expect(() => dto.createBody.parse({ clientName: "x" })).toThrowError();
  });
  it("rejects an out-of-enum status", () => {
    expect(() =>
      dto.createBody.parse({ clientName: "x", serviceName: "y", status: "weird" }),
    ).toThrowError();
  });
  it("rejects negative guests", () => {
    expect(() =>
      dto.createBody.parse({ clientName: "x", serviceName: "y", guests: -1 }),
    ).toThrowError();
  });
});

describe("booking-details.dto.updateBody", () => {
  it("rejects an empty patch", () => {
    expect(() => dto.updateBody.parse({})).toThrowError();
  });
  it("accepts a single-field patch", () => {
    expect(dto.updateBody.parse({ status: "confirmed" }).status).toBe("confirmed");
  });
});
