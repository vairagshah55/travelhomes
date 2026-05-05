import { describe, it, expect } from "vitest";
import dto from "../profile.dto.js";

describe("profile.dto.upsertBody", () => {
  it("rejects a missing email", () => {
    expect(() => dto.upsertBody.parse({})).toThrowError();
  });
  it("rejects an invalid email", () => {
    expect(() => dto.upsertBody.parse({ email: "nope" })).toThrowError();
  });
  it("accepts arbitrary nested fields (passthrough)", () => {
    const parsed = dto.upsertBody.parse({
      email: "a@b.com",
      firstName: "Alex",
      address: { city: "Pune" },
    });
    expect(parsed.email).toBe("a@b.com");
    expect(parsed.firstName).toBe("Alex");
  });
});

describe("profile.dto.getQuery", () => {
  it("accepts an optional email", () => {
    expect(dto.getQuery.parse({})).toEqual({});
    expect(dto.getQuery.parse({ email: "a@b.com" }).email).toBe("a@b.com");
  });
  it("rejects an invalid email", () => {
    expect(() => dto.getQuery.parse({ email: "nope" })).toThrowError();
  });
});
