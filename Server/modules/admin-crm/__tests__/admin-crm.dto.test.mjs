import { describe, it, expect } from "vitest";
import dto from "../admin-crm.dto.js";

describe("admin-crm.dto.sendBody", () => {
  const valid = { targetType: "Vendor", channels: ["Email"], message: "Hi" };

  it("accepts a valid send", () => {
    expect(dto.sendBody.parse(valid).targetType).toBe("Vendor");
  });

  it("rejects an empty channels array", () => {
    expect(() => dto.sendBody.parse({ ...valid, channels: [] })).toThrowError();
  });

  it("rejects an out-of-enum targetType", () => {
    expect(() => dto.sendBody.parse({ ...valid, targetType: "Robot" })).toThrowError();
  });

  it("rejects an out-of-enum channel", () => {
    expect(() => dto.sendBody.parse({ ...valid, channels: ["Telegram"] })).toThrowError();
  });

  it("accepts empty-string serviceType (no filter)", () => {
    expect(dto.sendBody.parse({ ...valid, serviceType: "" }).serviceType).toBe("");
  });
});
