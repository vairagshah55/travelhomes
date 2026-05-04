/**
 * DTO unit tests for the vendor-auth module — pure zod schema behavior.
 */
import { describe, it, expect } from "vitest";
import dto from "../vendor-auth.dto.js";

describe("vendor-auth.dto.loginBody", () => {
  it("accepts email + password", () => {
    const parsed = dto.loginBody.parse({ email: "v@example.com", password: "secret" });
    expect(parsed.email).toBe("v@example.com");
  });

  it("accepts mobile-as-identifier in the email field", () => {
    const parsed = dto.loginBody.parse({ email: "+919876543210", password: "secret" });
    expect(parsed.email).toBe("+919876543210");
  });

  it("rejects an empty identifier", () => {
    expect(() => dto.loginBody.parse({ email: "", password: "x" })).toThrowError();
  });

  it("rejects a missing password", () => {
    expect(() => dto.loginBody.parse({ email: "v@example.com" })).toThrowError();
  });
});

describe("vendor-auth.dto.forgotBody", () => {
  it("accepts an identifier", () => {
    expect(dto.forgotBody.parse({ email: "x@y.com" }).email).toBe("x@y.com");
  });
  it("rejects empty input", () => {
    expect(() => dto.forgotBody.parse({})).toThrowError();
  });
});

describe("vendor-auth.dto.verifyOtpBody", () => {
  it("accepts a 6-digit otp", () => {
    expect(dto.verifyOtpBody.parse({ email: "x@y.com", otp: "123456" }).otp).toBe("123456");
  });
  it("rejects a non-6-digit otp", () => {
    expect(() => dto.verifyOtpBody.parse({ email: "x@y.com", otp: "12345" })).toThrowError();
    expect(() => dto.verifyOtpBody.parse({ email: "x@y.com", otp: "abcdef" })).toThrowError();
  });
});

describe("vendor-auth.dto.resetBody", () => {
  it("accepts identifier + otp + ≥8-char password", () => {
    const parsed = dto.resetBody.parse({
      email: "x@y.com",
      otp: "654321",
      newPassword: "longer-password",
    });
    expect(parsed.newPassword).toBe("longer-password");
  });

  it("rejects a short newPassword", () => {
    expect(() =>
      dto.resetBody.parse({ email: "x@y.com", otp: "123456", newPassword: "short" }),
    ).toThrowError();
  });
});

describe("vendor-auth.dto.updateAccountBody", () => {
  it("accepts a profile-only update without password change", () => {
    const parsed = dto.updateAccountBody.parse({
      currentEmail: "Old@Example.com",
      mobile: "+919999999999",
    });
    expect(parsed.currentEmail).toBe("old@example.com");
  });

  it("rejects newPassword without currentPassword", () => {
    expect(() =>
      dto.updateAccountBody.parse({
        currentEmail: "x@y.com",
        newPassword: "longer-password",
      }),
    ).toThrowError();
  });

  it("accepts a password change with both passwords", () => {
    const parsed = dto.updateAccountBody.parse({
      currentEmail: "x@y.com",
      currentPassword: "old",
      newPassword: "newer-password",
    });
    expect(parsed.newPassword).toBe("newer-password");
  });
});

describe("vendor-auth.dto.sendChangeOtpBody", () => {
  it("accepts a new email", () => {
    const parsed = dto.sendChangeOtpBody.parse({
      currentEmail: "x@y.com",
      newEmail: "z@y.com",
    });
    expect(parsed.newEmail).toBe("z@y.com");
  });

  it("accepts a new mobile", () => {
    const parsed = dto.sendChangeOtpBody.parse({
      currentEmail: "x@y.com",
      newMobile: "+919876543210",
    });
    expect(parsed.newMobile).toBe("+919876543210");
  });

  it("rejects when neither new email nor new mobile is provided", () => {
    expect(() => dto.sendChangeOtpBody.parse({ currentEmail: "x@y.com" })).toThrowError();
  });
});
