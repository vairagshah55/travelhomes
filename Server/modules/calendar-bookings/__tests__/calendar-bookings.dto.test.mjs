import { describe, it, expect } from "vitest";
import dto from "../calendar-bookings.dto.js";

const validId = "a".repeat(24);
const validCreate = {
  guestName: "Alex",
  resourceName: "Mountain Cabin",
  startDate: "2026-06-01",
  endDate: "2026-06-05",
};

describe("calendar-bookings.dto.listQuery", () => {
  it("accepts an empty query and applies defaults", () => {
    const parsed = dto.listQuery.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(50);
  });

  it("coerces numeric strings", () => {
    const parsed = dto.listQuery.parse({ month: "5", year: "2026", page: "2", limit: "100" });
    expect(parsed.month).toBe(5);
    expect(parsed.year).toBe(2026);
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(100);
  });

  it("rejects month out of range", () => {
    expect(() => dto.listQuery.parse({ month: "13" })).toThrowError();
  });
});

describe("calendar-bookings.dto.createBody", () => {
  it("accepts a minimal valid payload", () => {
    const parsed = dto.createBody.parse(validCreate);
    expect(parsed.guestName).toBe("Alex");
  });

  it("rejects when start is after end", () => {
    expect(() =>
      dto.createBody.parse({ ...validCreate, startDate: "2026-06-10", endDate: "2026-06-05" }),
    ).toThrowError();
  });

  it("rejects an out-of-enum status", () => {
    expect(() => dto.createBody.parse({ ...validCreate, status: "weird" })).toThrowError();
  });

  it("accepts every legacy status value", () => {
    for (const status of ["Confirmed", "Checked-in", "Checked-out", "Cancelled"]) {
      expect(dto.createBody.parse({ ...validCreate, status }).status).toBe(status);
    }
  });
});

describe("calendar-bookings.dto.updateBody", () => {
  it("rejects an empty patch", () => {
    expect(() => dto.updateBody.parse({})).toThrowError();
  });
});

describe("calendar-bookings.dto.updateDatesBody", () => {
  it("requires both startDate and endDate", () => {
    expect(() => dto.updateDatesBody.parse({ startDate: "2026-06-01" })).toThrowError();
  });

  it("rejects start after end", () => {
    expect(() =>
      dto.updateDatesBody.parse({ startDate: "2026-06-10", endDate: "2026-06-05" }),
    ).toThrowError();
  });
});

describe("calendar-bookings.dto.updateStatusBody", () => {
  it("requires the PascalCase enum", () => {
    expect(() => dto.updateStatusBody.parse({ status: "confirmed" })).toThrowError();
    expect(dto.updateStatusBody.parse({ status: "Confirmed" }).status).toBe("Confirmed");
  });
});

describe("calendar-bookings.dto.getByIdParams", () => {
  it("accepts a 24-hex id", () => {
    expect(dto.getByIdParams.parse({ id: validId }).id).toBe(validId);
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.getByIdParams.parse({ id: "nope" })).toThrowError();
  });
});
