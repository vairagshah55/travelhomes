import { describe, it, expect } from "vitest";
import dto from "../admin-roles.dto.js";

describe("admin-roles.dto.createBody", () => {
  it("rejects a missing name", () => {
    expect(() => dto.createBody.parse({})).toThrowError();
  });
  it("accepts a minimal payload", () => {
    expect(dto.createBody.parse({ name: "Manager" }).name).toBe("Manager");
  });
  it("rejects a non-array features", () => {
    expect(() =>
      dto.createBody.parse({ name: "Manager", features: "not-an-array" }),
    ).toThrowError();
  });
});

describe("admin-roles.dto.listQuery", () => {
  it("coerces string boolean isActive", () => {
    expect(dto.listQuery.parse({ isActive: "true" }).isActive).toBe(true);
    expect(dto.listQuery.parse({ isActive: "false" }).isActive).toBe(false);
  });
});

describe("admin-roles.dto.updateBody", () => {
  it("rejects an empty patch", () => {
    expect(() => dto.updateBody.parse({})).toThrowError();
  });
});
