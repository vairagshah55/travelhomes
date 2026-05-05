import { describe, it, expect } from "vitest";
import dto from "../cms.dto.js";

const validId = "a".repeat(24);

describe("cms.dto.jobBody", () => {
  it("accepts position + jd", () => {
    expect(dto.jobBody.parse({ position: "Engineer", jd: "Build stuff" })).toMatchObject({
      position: "Engineer",
    });
  });
  it("accepts the jobTitle/jobDescription aliases", () => {
    const parsed = dto.jobBody.parse({ jobTitle: "Engineer", jobDescription: "Build" });
    expect(parsed.jobTitle).toBe("Engineer");
  });
  it("rejects when neither title field is set", () => {
    expect(() => dto.jobBody.parse({ jd: "Build" })).toThrowError();
  });
  it("rejects when neither description field is set", () => {
    expect(() => dto.jobBody.parse({ position: "Engineer" })).toThrowError();
  });
});

describe("cms.dto.jobApplyBody", () => {
  it("accepts a minimal application", () => {
    expect(dto.jobApplyBody.parse({ fullName: "Jane", email: "j@x.io" })).toMatchObject({
      fullName: "Jane",
    });
  });
  it("rejects missing email", () => {
    expect(() => dto.jobApplyBody.parse({ fullName: "Jane" })).toThrowError();
  });
  it("rejects an invalid email", () => {
    expect(() => dto.jobApplyBody.parse({ fullName: "Jane", email: "nope" })).toThrowError();
  });
});

describe("cms.dto.faqBody", () => {
  it("accepts a complete FAQ", () => {
    expect(dto.faqBody.parse({ category: "general", question: "q", answer: "a" }).answer).toBe("a");
  });
  it("rejects missing fields", () => {
    expect(() => dto.faqBody.parse({ category: "general" })).toThrowError();
  });
});

describe("cms.dto.testimonialBody", () => {
  it("accepts and coerces rating", () => {
    expect(dto.testimonialBody.parse({ userName: "U", rating: "4", content: "great" }).rating).toBe(
      4,
    );
  });
  it("rejects rating > 5", () => {
    expect(() =>
      dto.testimonialBody.parse({ userName: "U", rating: 6, content: "x" }),
    ).toThrowError();
  });
});

describe("cms.dto.pageKeyParams", () => {
  it("accepts known keys", () => {
    expect(dto.pageKeyParams.parse({ key: "terms-and-conditions" }).key).toBe(
      "terms-and-conditions",
    );
    expect(dto.pageKeyParams.parse({ key: "privacy-policy" }).key).toBe("privacy-policy");
    expect(dto.pageKeyParams.parse({ key: "vendor-policy" }).key).toBe("vendor-policy");
  });
  it("rejects an unknown key", () => {
    expect(() => dto.pageKeyParams.parse({ key: "weird" })).toThrowError();
  });
});

describe("cms.dto.idParams", () => {
  it("accepts a 24-hex id", () => {
    expect(dto.idParams.parse({ id: validId }).id).toBe(validId);
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.idParams.parse({ id: "nope" })).toThrowError();
  });
});

describe("cms.dto.featureBody", () => {
  it("accepts a complete feature", () => {
    expect(dto.featureBody.parse({ name: "Wifi", category: "amenity" }).name).toBe("Wifi");
  });
  it("rejects missing category", () => {
    expect(() => dto.featureBody.parse({ name: "Wifi" })).toThrowError();
  });
});

describe("cms.dto.roleBody", () => {
  it("accepts a name and feature list", () => {
    const parsed = dto.roleBody.parse({ name: "Manager", features: ["Dashboard"] });
    expect(parsed.name).toBe("Manager");
  });
  it("rejects missing name", () => {
    expect(() => dto.roleBody.parse({ features: ["x"] })).toThrowError();
  });
});

describe("cms.dto.jobApplicationStatusBody", () => {
  it("accepts a status string", () => {
    expect(dto.jobApplicationStatusBody.parse({ status: "shortlisted" }).status).toBe(
      "shortlisted",
    );
  });
  it("rejects an empty status", () => {
    expect(() => dto.jobApplicationStatusBody.parse({ status: "" })).toThrowError();
  });
});
