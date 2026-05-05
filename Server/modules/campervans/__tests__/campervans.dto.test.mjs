import { describe, it, expect } from "vitest";
import dto from "../campervans.dto.js";

const validId = "a".repeat(24);

describe("campervans.dto.listQuery", () => {
  it("applies pagination defaults", () => {
    const parsed = dto.listQuery.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });
  it("rejects limit > 100", () => {
    expect(() => dto.listQuery.parse({ limit: "500" })).toThrowError();
  });
});

describe("campervans.dto.idParams", () => {
  it("accepts a 24-hex id", () => {
    expect(dto.idParams.parse({ id: validId }).id).toBe(validId);
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.idParams.parse({ id: "nope" })).toThrowError();
  });
});

describe("campervans.dto.updateStatusBody", () => {
  it("accepts a status string", () => {
    expect(dto.updateStatusBody.parse({ status: "approved" }).status).toBe("approved");
  });
  it("rejects empty status", () => {
    expect(() => dto.updateStatusBody.parse({ status: "" })).toThrowError();
  });
});
