import { describe, it, expect } from "vitest";
import dto from "../vendor-analytics.dto.js";

describe("vendor-analytics.dto.graphsQuery", () => {
  it("defaults to monthly", () => {
    expect(dto.graphsQuery.parse({}).period).toBe("monthly");
  });
  it("accepts daily/monthly/yearly", () => {
    for (const period of ["daily", "monthly", "yearly"]) {
      expect(dto.graphsQuery.parse({ period }).period).toBe(period);
    }
  });
  it("rejects an out-of-enum period", () => {
    expect(() => dto.graphsQuery.parse({ period: "weekly" })).toThrowError();
  });
});
