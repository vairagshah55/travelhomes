import { describe, it, expect } from "vitest";
import dto from "../plugins.dto.js";

describe("plugins.dto.createBody", () => {
  it("rejects a missing vendorName", () => {
    expect(() => dto.createBody.parse({})).toThrowError();
  });
  it("accepts a minimal payload", () => {
    expect(dto.createBody.parse({ vendorName: "Acme" }).vendorName).toBe("Acme");
  });
  it("rejects a non-boolean enabled", () => {
    expect(() => dto.createBody.parse({ vendorName: "Acme", enabled: "yes" })).toThrowError();
  });
});

describe("plugins.dto.updateBody", () => {
  it("rejects an empty patch", () => {
    expect(() => dto.updateBody.parse({})).toThrowError();
  });
});

describe("plugins.dto.setLicenseBody", () => {
  it("rejects a missing licenseKey", () => {
    expect(() => dto.setLicenseBody.parse({})).toThrowError();
  });
  it("accepts an empty string licenseKey (matches legacy clear-license behavior)", () => {
    expect(dto.setLicenseBody.parse({ licenseKey: "" }).licenseKey).toBe("");
  });
});
