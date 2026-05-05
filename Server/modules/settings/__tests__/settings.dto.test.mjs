import { describe, it, expect } from "vitest";
import dto from "../settings.dto.js";

describe("settings.dto.seoUpsertBody", () => {
  it("rejects a missing page", () => {
    expect(() => dto.seoUpsertBody.parse({})).toThrowError();
  });

  it("accepts arbitrary SEO fields (passthrough — model is an open bag)", () => {
    const parsed = dto.seoUpsertBody.parse({
      page: "Home",
      metaTitle: "T",
      metaDescription: "D",
      socialTitle: "S",
      ogImageUrl: "/uploads/x.png",
    });
    expect(parsed.page).toBe("Home");
    expect(parsed.metaTitle).toBe("T");
  });
});

describe("settings.dto.systemUpdateBody", () => {
  it("requires userType", () => {
    expect(() => dto.systemUpdateBody.parse({})).toThrowError();
  });

  it("allows arbitrary keys (system bag is open)", () => {
    const parsed = dto.systemUpdateBody.parse({ userType: "Vendor", some: "thing" });
    expect(parsed.userType).toBe("Vendor");
    expect(parsed.some).toBe("thing");
  });
});

describe("settings.dto.seoUploadBody", () => {
  it("rejects an out-of-enum type", () => {
    expect(() => dto.seoUploadBody.parse({ page: "Home", type: "header" })).toThrowError();
  });

  it("accepts each valid type", () => {
    for (const type of ["favicon", "logo", "logo_dark", "og"]) {
      expect(dto.seoUploadBody.parse({ page: "Home", type }).type).toBe(type);
    }
  });
});
