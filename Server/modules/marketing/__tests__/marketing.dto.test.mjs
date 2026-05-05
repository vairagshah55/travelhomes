import { describe, it, expect } from "vitest";
import dto from "../marketing.dto.js";

describe("marketing.dto.createBody", () => {
  it("rejects when both images and content are missing/empty", () => {
    expect(() => dto.createBody.parse({})).toThrowError();
    expect(() => dto.createBody.parse({ images: [], content: "" })).toThrowError();
  });

  it("accepts images-only payload", () => {
    expect(dto.createBody.parse({ images: ["http://x/y.jpg"] }).images.length).toBe(1);
  });

  it("accepts content-only payload", () => {
    expect(dto.createBody.parse({ content: "Hello" }).content).toBe("Hello");
  });
});

describe("marketing.dto.postBody", () => {
  it("rejects an invalid platform", () => {
    expect(() =>
      dto.postBody.parse({ itemId: "a".repeat(24), platform: "twitter" }),
    ).toThrowError();
  });

  it("accepts facebook + instagram", () => {
    for (const platform of ["facebook", "instagram"]) {
      expect(dto.postBody.parse({ itemId: "a".repeat(24), platform }).platform).toBe(platform);
    }
  });
});
