import { describe, it, expect } from "vitest";
import dto from "../blogs.dto.js";

describe("blogs.dto.createBody", () => {
  it("rejects a missing title", () => {
    expect(() => dto.createBody.parse({})).toThrowError();
  });
  it("accepts a minimal valid payload", () => {
    expect(dto.createBody.parse({ title: "Hello world" }).title).toBe("Hello world");
  });
  it("rejects a slug with spaces", () => {
    expect(() => dto.createBody.parse({ title: "x", slug: "with spaces" })).toThrowError();
  });
  it("rejects a slug with uppercase", () => {
    expect(() => dto.createBody.parse({ title: "x", slug: "Hello-World" })).toThrowError();
  });
  it("accepts a valid slug", () => {
    expect(dto.createBody.parse({ title: "x", slug: "hello-world-1" }).slug).toBe("hello-world-1");
  });
  it("rejects an out-of-enum status", () => {
    expect(() => dto.createBody.parse({ title: "x", status: "weird" })).toThrowError();
  });
});

describe("blogs.dto.listQuery", () => {
  it("coerces limit string to number", () => {
    expect(dto.listQuery.parse({ limit: "5" }).limit).toBe(5);
  });
  it("rejects limit > 50", () => {
    expect(() => dto.listQuery.parse({ limit: "100" })).toThrowError();
  });
});

describe("blogs.dto.updateBody", () => {
  it("rejects an empty patch", () => {
    expect(() => dto.updateBody.parse({})).toThrowError();
  });
});
