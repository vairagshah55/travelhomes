import { describe, it, expect } from "vitest";
import dto from "../cms-media.dto.js";

const validId = "a".repeat(24);

describe("cms-media.dto.uploadBody", () => {
  it("accepts page + section with default position 0", () => {
    const parsed = dto.uploadBody.parse({ page: "Homepage", section: "Hero" });
    expect(parsed.position).toBe(0);
  });
  it("coerces a string position", () => {
    expect(
      dto.uploadBody.parse({ page: "Homepage", section: "Hero", position: "3" }).position,
    ).toBe(3);
  });
  it("rejects missing page", () => {
    expect(() => dto.uploadBody.parse({ section: "Hero" })).toThrowError();
  });
  it("rejects missing section", () => {
    expect(() => dto.uploadBody.parse({ page: "Homepage" })).toThrowError();
  });
  it("rejects negative position", () => {
    expect(() =>
      dto.uploadBody.parse({ page: "Homepage", section: "Hero", position: -1 }),
    ).toThrowError();
  });
});

describe("cms-media.dto.listQuery", () => {
  it("accepts an empty query", () => {
    expect(dto.listQuery.parse({})).toEqual({});
  });
  it("accepts both filters", () => {
    expect(dto.listQuery.parse({ page: "Homepage", section: "Hero" })).toMatchObject({
      page: "Homepage",
    });
  });
});

describe("cms-media.dto.idParams", () => {
  it("accepts a 24-hex id", () => {
    expect(dto.idParams.parse({ id: validId }).id).toBe(validId);
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.idParams.parse({ id: "nope" })).toThrowError();
  });
});
