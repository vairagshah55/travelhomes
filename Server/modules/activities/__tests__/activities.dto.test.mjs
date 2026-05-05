import { describe, it, expect } from "vitest";
import dto from "../activities.dto.js";

const validId = "a".repeat(24);

describe("activities.dto.listQuery", () => {
  it("applies pagination defaults", () => {
    const parsed = dto.listQuery.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });
  it("coerces minPrice / maxPrice", () => {
    expect(dto.listQuery.parse({ minPrice: "100", maxPrice: "500" })).toMatchObject({
      minPrice: 100,
      maxPrice: 500,
    });
  });
  it("rejects negative minPrice", () => {
    expect(() => dto.listQuery.parse({ minPrice: -1 })).toThrowError();
  });
  it("rejects limit > 100", () => {
    expect(() => dto.listQuery.parse({ limit: "500" })).toThrowError();
  });
});

describe("activities.dto.idParams", () => {
  it("accepts a 24-hex id", () => {
    expect(dto.idParams.parse({ id: validId }).id).toBe(validId);
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.idParams.parse({ id: "nope" })).toThrowError();
  });
});

describe("activities.dto.updateStatusBody", () => {
  it("accepts known statuses", () => {
    expect(dto.updateStatusBody.parse({ status: "approved" }).status).toBe("approved");
    expect(dto.updateStatusBody.parse({ status: "draft" }).status).toBe("draft");
  });
  it("rejects an unknown status", () => {
    expect(() => dto.updateStatusBody.parse({ status: "weird" })).toThrowError();
  });
});

describe("activities.dto.upsertBody", () => {
  it("accepts and preserves arbitrary fields", () => {
    expect(dto.upsertBody.parse({ name: "Trekking", x: 1 })).toMatchObject({ name: "Trekking" });
  });
});
