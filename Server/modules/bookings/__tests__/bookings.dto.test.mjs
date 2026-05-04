import { describe, it, expect } from "vitest";
import dto from "../bookings.dto.js";

describe("bookings.dto.listByDateQuery", () => {
  it("accepts a YYYY-MM-DD date", () => {
    expect(dto.listByDateQuery.parse({ date: "2026-05-04" }).date).toBe("2026-05-04");
  });

  it("rejects a missing date", () => {
    expect(() => dto.listByDateQuery.parse({})).toThrowError();
  });

  it("rejects a malformed date", () => {
    expect(() => dto.listByDateQuery.parse({ date: "5/4/2026" })).toThrowError();
    expect(() => dto.listByDateQuery.parse({ date: "2026-5-4" })).toThrowError();
  });
});

describe("bookings.dto.getByIdParams", () => {
  it("accepts a 24-char hex ObjectId", () => {
    const id = "a".repeat(24);
    expect(dto.getByIdParams.parse({ id }).id).toBe(id);
  });

  it("rejects a non-hex id", () => {
    expect(() => dto.getByIdParams.parse({ id: "not-an-id" })).toThrowError();
  });
});

describe("bookings.dto.listForUserParams", () => {
  it("accepts an ObjectId-shaped userId", () => {
    const userId = "b".repeat(24);
    expect(dto.listForUserParams.parse({ userId }).userId).toBe(userId);
  });

  it("accepts a legacy non-ObjectId userId", () => {
    expect(dto.listForUserParams.parse({ userId: "VD1234567" }).userId).toBe("VD1234567");
  });

  it("rejects an empty userId", () => {
    expect(() => dto.listForUserParams.parse({ userId: "" })).toThrowError();
  });
});
