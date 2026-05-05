import { describe, it, expect } from "vitest";
import dto from "../notifications.dto.js";

const validId = "a".repeat(24);

describe("notifications.dto.listQuery", () => {
  it("applies sensible defaults", () => {
    const parsed = dto.listQuery.parse({});
    expect(parsed.limit).toBe(50);
    expect(parsed.unreadOnly).toBe(false);
  });

  it("accepts string boolean for unreadOnly", () => {
    expect(dto.listQuery.parse({ unreadOnly: "true" }).unreadOnly).toBe(true);
    expect(dto.listQuery.parse({ unreadOnly: "false" }).unreadOnly).toBe(false);
  });

  it("rejects an out-of-enum recipientRole", () => {
    expect(() => dto.listQuery.parse({ recipientRole: "weird" })).toThrowError();
  });

  it("rejects a limit > 500", () => {
    expect(() => dto.listQuery.parse({ limit: "1000" })).toThrowError();
  });
});

describe("notifications.dto.idParams", () => {
  it("accepts a 24-hex id", () => {
    expect(dto.idParams.parse({ id: validId }).id).toBe(validId);
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.idParams.parse({ id: "nope" })).toThrowError();
  });
});

describe("notifications.dto.bulkDeleteBody", () => {
  it("accepts a non-empty array of valid ids", () => {
    expect(dto.bulkDeleteBody.parse({ ids: [validId, "b".repeat(24)] }).ids.length).toBe(2);
  });
  it("rejects an empty array", () => {
    expect(() => dto.bulkDeleteBody.parse({ ids: [] })).toThrowError();
  });
  it("rejects an array with an invalid id", () => {
    expect(() => dto.bulkDeleteBody.parse({ ids: [validId, "nope"] })).toThrowError();
  });
});
