import { describe, it, expect } from "vitest";
import dto from "../admin-analytics.dto.js";

describe("admin-analytics.dto.reportQuery", () => {
  it("applies pagination defaults", () => {
    const parsed = dto.reportQuery.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });

  it("rejects an out-of-enum tab", () => {
    expect(() => dto.reportQuery.parse({ tab: "weird" })).toThrowError();
  });

  it("rejects limit > 200", () => {
    expect(() => dto.reportQuery.parse({ limit: "1000" })).toThrowError();
  });

  it("coerces numeric strings", () => {
    const parsed = dto.reportQuery.parse({ page: "5", limit: "100" });
    expect(parsed.page).toBe(5);
    expect(parsed.limit).toBe(100);
  });
});
