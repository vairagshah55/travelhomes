import { describe, it, expect } from "vitest";
import dto from "../admin-auth.dto.js";

describe("admin-auth.dto.loginBody", () => {
  it("accepts a normal login payload and lowercases the email", () => {
    const parsed = dto.loginBody.parse({ email: "Admin@Example.com", password: "secret" });
    expect(parsed.email).toBe("admin@example.com");
    expect(parsed.password).toBe("secret");
  });

  it("rejects a missing email", () => {
    expect(() => dto.loginBody.parse({ password: "x" })).toThrowError();
  });

  it("rejects an invalid email", () => {
    expect(() => dto.loginBody.parse({ email: "not-an-email", password: "x" })).toThrowError();
  });

  it("rejects an empty password", () => {
    expect(() => dto.loginBody.parse({ email: "a@b.com", password: "" })).toThrowError();
  });
});
