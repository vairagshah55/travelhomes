/**
 * DTO unit tests. Purely zod schema behavior — no DB, no mocks.
 *
 * These pin down the public contract of the registration sub-flow: which
 * fields are required, which are optional, what shapes are rejected.
 */
import { describe, it, expect } from "vitest";
import dto from "../auth.dto.js";

describe("auth.dto.registerBody", () => {
  const valid = {
    userType: "user",
    email: "User@Example.com",
    mobile: "+919876543210",
    password: "p@ssword123",
  };

  it("accepts a minimal valid user payload and lowercases the email", () => {
    const parsed = dto.registerBody.parse(valid);
    expect(parsed.email).toBe("user@example.com");
    expect(parsed.userType).toBe("user");
  });

  it("accepts a vendor without a mobile number", () => {
    const { mobile: _ignored, ...rest } = valid;
    const parsed = dto.registerBody.parse({ ...rest, userType: "vendor" });
    expect(parsed.userType).toBe("vendor");
    expect(parsed.mobile).toBeUndefined();
  });

  it("rejects a user without a mobile number", () => {
    const { mobile: _ignored, ...rest } = valid;
    expect(() => dto.registerBody.parse(rest)).toThrowError();
  });

  it("rejects a userType outside the enum", () => {
    expect(() => dto.registerBody.parse({ ...valid, userType: "admin" })).toThrowError();
  });

  it("rejects an invalid email", () => {
    expect(() => dto.registerBody.parse({ ...valid, email: "not-an-email" })).toThrowError();
  });

  it("rejects a short password", () => {
    expect(() => dto.registerBody.parse({ ...valid, password: "short" })).toThrowError();
  });

  it("rejects extraneous mobile shapes", () => {
    expect(() => dto.registerBody.parse({ ...valid, mobile: "abc" })).toThrowError();
  });
});

describe("auth.dto.verifyOtpBody / Params", () => {
  it("accepts a 24-char hex id and 6-digit otp", () => {
    const id = "a".repeat(24);
    expect(dto.verifyOtpParams.parse({ id }).id).toBe(id);
    expect(dto.verifyOtpBody.parse({ otp: "123456" }).otp).toBe("123456");
  });

  it("rejects a non-hex id", () => {
    expect(() => dto.verifyOtpParams.parse({ id: "not-an-id" })).toThrowError();
  });

  it("rejects an otp that isn't 6 digits", () => {
    expect(() => dto.verifyOtpBody.parse({ otp: "12345" })).toThrowError();
    expect(() => dto.verifyOtpBody.parse({ otp: "abcdef" })).toThrowError();
    expect(() => dto.verifyOtpBody.parse({ otp: "1234567" })).toThrowError();
  });
});

describe("auth.dto.updateRegisterBody", () => {
  it("accepts a single-field update", () => {
    const parsed = dto.updateRegisterBody.parse({ firstName: "Alex" });
    expect(parsed.firstName).toBe("Alex");
  });

  it("rejects an empty update body", () => {
    expect(() => dto.updateRegisterBody.parse({})).toThrowError();
  });
});

describe("auth.dto.googleSignInBody", () => {
  it("accepts a non-empty code", () => {
    const parsed = dto.googleSignInBody.parse({ code: "4/0Aabc" });
    expect(parsed.code).toBe("4/0Aabc");
  });

  it("rejects a missing code", () => {
    expect(() => dto.googleSignInBody.parse({})).toThrowError();
  });

  it("rejects an empty code string", () => {
    expect(() => dto.googleSignInBody.parse({ code: "" })).toThrowError();
  });
});
