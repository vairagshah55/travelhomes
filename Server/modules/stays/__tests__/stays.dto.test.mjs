import { describe, it, expect } from "vitest";
import dto from "../stays.dto.js";

const validId = "a".repeat(24);

describe("stays.dto.listQuery", () => {
  it("applies pagination defaults", () => {
    const parsed = dto.listQuery.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });
  it("rejects limit > 100", () => {
    expect(() => dto.listQuery.parse({ limit: "500" })).toThrowError();
  });
  it("accepts city / state filters", () => {
    expect(dto.listQuery.parse({ city: "Goa", state: "Goa" })).toMatchObject({ city: "Goa" });
  });
});

describe("stays.dto.idParams", () => {
  it("accepts a 24-hex id", () => {
    expect(dto.idParams.parse({ id: validId }).id).toBe(validId);
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.idParams.parse({ id: "nope" })).toThrowError();
  });
});
