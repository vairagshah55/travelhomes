import { describe, it, expect } from "vitest";
import dto from "../vendor-setting.dto.js";

describe("vendor-setting.dto.createBody", () => {
  it("rejects a missing vendorId", () => {
    expect(() => dto.createBody.parse({})).toThrowError();
  });
  it("accepts arbitrary nested fields (passthrough)", () => {
    const parsed = dto.createBody.parse({ vendorId: "VND123", general: { name: "X" } });
    expect(parsed.vendorId).toBe("VND123");
  });
});

describe("vendor-setting.dto.sectionParams", () => {
  it("rejects an out-of-enum section", () => {
    expect(() => dto.sectionParams.parse({ vendorId: "VND123", section: "weird" })).toThrowError();
  });
  it("accepts general/account/preferences", () => {
    for (const s of ["general", "account", "preferences"]) {
      expect(dto.sectionParams.parse({ vendorId: "VND123", section: s }).section).toBe(s);
    }
  });
});

describe("vendor-setting.dto.sectionPatchBody", () => {
  it("rejects empty body", () => {
    expect(() => dto.sectionPatchBody.parse({})).toThrowError();
  });
  it("accepts arbitrary key/value", () => {
    expect(dto.sectionPatchBody.parse({ name: "X" }).name).toBe("X");
  });
});
