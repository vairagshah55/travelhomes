import { describe, it, expect } from "vitest";
import dto from "../users.dto.js";

describe("users.dto.listQuery", () => {
  it("accepts every status alias", () => {
    for (const status of [
      "all-users",
      "active-users",
      "inactive-users",
      "banned-users",
      "unverified-email",
      "unverified-mobile",
      "subscribers",
    ]) {
      expect(dto.listQuery.parse({ status }).status).toBe(status);
    }
  });
  it("rejects an out-of-enum status", () => {
    expect(() => dto.listQuery.parse({ status: "weird" })).toThrowError();
  });
});

describe("users.dto.idParams", () => {
  it("rejects a non-hex id", () => {
    expect(() => dto.idParams.parse({ id: "nope" })).toThrowError();
  });
});

describe("users.dto.updateBody", () => {
  it("rejects an empty patch", () => {
    expect(() => dto.updateBody.parse({})).toThrowError();
  });
  it("accepts a single-field patch (passthrough)", () => {
    expect(dto.updateBody.parse({ name: "Alex" }).name).toBe("Alex");
  });
});
