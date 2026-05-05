import { describe, it, expect } from "vitest";
import dto from "../contact.dto.js";

const validId = "a".repeat(24);

describe("contact.dto.submitBody", () => {
  const valid = { firstName: "Alex", email: "a@b.com", message: "Hi" };

  it("accepts a minimal valid payload and lowercases email", () => {
    const parsed = dto.submitBody.parse({ ...valid, email: "A@B.COM" });
    expect(parsed.email).toBe("a@b.com");
  });

  it("rejects a missing firstName", () => {
    const { firstName: _omit, ...rest } = valid;
    expect(() => dto.submitBody.parse(rest)).toThrowError();
  });

  it("rejects an invalid email", () => {
    expect(() => dto.submitBody.parse({ ...valid, email: "no" })).toThrowError();
  });

  it("rejects an empty message", () => {
    expect(() => dto.submitBody.parse({ ...valid, message: "" })).toThrowError();
  });
});

describe("contact.dto params", () => {
  it("accepts a 24-hex id", () => {
    expect(dto.markReadParams.parse({ id: validId }).id).toBe(validId);
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.markReadParams.parse({ id: "nope" })).toThrowError();
    expect(() => dto.deleteParams.parse({ id: "nope" })).toThrowError();
  });
});

describe("contact.dto.replyBody", () => {
  it("rejects missing subject or body", () => {
    expect(() => dto.replyBody.parse({})).toThrowError();
    expect(() => dto.replyBody.parse({ subject: "Re" })).toThrowError();
    expect(() => dto.replyBody.parse({ body: "Hi" })).toThrowError();
  });
});
