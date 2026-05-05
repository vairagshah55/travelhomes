import { describe, it, expect } from "vitest";
import dto from "../onboarding.dto.js";

const validId = "a".repeat(24);

describe("onboarding.dto.submitBody", () => {
  it("accepts and preserves arbitrary fields", () => {
    const parsed = dto.submitBody.parse({
      activityName: "Trekking",
      personCapacity: 6,
      photos: ["a", "b"],
    });
    expect(parsed.activityName).toBe("Trekking");
    expect(parsed.photos.length).toBe(2);
  });
  it("accepts an empty body", () => {
    expect(dto.submitBody.parse({})).toEqual({});
  });
});

describe("onboarding.dto.selfieBody", () => {
  it("accepts a valid id + imageData", () => {
    const parsed = dto.selfieBody.parse({ id: validId, imageData: "data:image/png;base64,xxx" });
    expect(parsed.id).toBe(validId);
  });
  it("rejects missing imageData", () => {
    expect(() => dto.selfieBody.parse({ id: validId })).toThrowError();
  });
  it("rejects empty imageData", () => {
    expect(() => dto.selfieBody.parse({ id: validId, imageData: "" })).toThrowError();
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.selfieBody.parse({ id: "nope", imageData: "x" })).toThrowError();
  });
});

describe("onboarding.dto.idParams", () => {
  it("accepts a 24-hex id", () => {
    expect(dto.idParams.parse({ id: validId }).id).toBe(validId);
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.idParams.parse({ id: "nope" })).toThrowError();
  });
});
