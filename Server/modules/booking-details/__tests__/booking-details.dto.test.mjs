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

// There is no client create route any more; the same field whitelist now
// reaches the API only through updateBody, so assert the constraints there.
describe("booking-details.dto.updateBody — field constraints", () => {
  it("accepts a valid patch", () => {
    expect(
      dto.updateBody.parse({ clientName: "Alex", serviceName: "Mountain Cabin" }).clientName,
    ).toBe("Alex");
  });
  it("rejects an empty clientName", () => {
    expect(() => dto.updateBody.parse({ clientName: "" })).toThrowError();
  });
  it("rejects an empty serviceName", () => {
    expect(() => dto.updateBody.parse({ serviceName: "" })).toThrowError();
  });
  it("rejects an out-of-enum status", () => {
    expect(() => dto.updateBody.parse({ status: "weird" })).toThrowError();
  });
  it("rejects negative guests", () => {
    expect(() => dto.updateBody.parse({ guests: -1 })).toThrowError();
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
