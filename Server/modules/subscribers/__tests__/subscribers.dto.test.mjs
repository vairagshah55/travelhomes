import { describe, it, expect } from "vitest";
import dto from "../subscribers.dto.js";

describe("subscribers.dto.subscribeBody", () => {
  it("accepts a valid email and lowercases it", () => {
    expect(dto.subscribeBody.parse({ email: "User@Example.com" }).email).toBe("user@example.com");
  });

  it("rejects a missing email", () => {
    expect(() => dto.subscribeBody.parse({})).toThrowError();
  });

  it("rejects an invalid email", () => {
    expect(() => dto.subscribeBody.parse({ email: "not-an-email" })).toThrowError();
  });
});
