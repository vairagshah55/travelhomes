import { describe, it, expect } from "vitest";
import dto from "../trips.dto.js";

describe("trips.dto.createBody", () => {
  const valid = {
    tripId: "T1",
    userId: "U1",
    destination: "Pune",
    startDate: "2026-06-01",
    endDate: "2026-06-05",
    status: "upcoming",
  };

  it("accepts a valid payload", () => {
    expect(dto.createBody.parse(valid).tripId).toBe("T1");
  });

  it("rejects a missing field", () => {
    for (const k of ["tripId", "userId", "destination", "startDate", "endDate", "status"]) {
      const partial = { ...valid };
      delete partial[k];
      expect(() => dto.createBody.parse(partial)).toThrowError();
    }
  });

  it("rejects a malformed date", () => {
    expect(() => dto.createBody.parse({ ...valid, startDate: "tomorrow" })).toThrowError();
  });
});
