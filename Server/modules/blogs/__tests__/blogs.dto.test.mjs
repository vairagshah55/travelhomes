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
  // The cap was 50 while /blogs fetched the whole set and filtered in the
  // browser. Paging chooses its own page size, so the ceiling moved to 100.
  it("accepts limit up to 100", () => {
    expect(dto.listQuery.parse({ limit: "100" }).limit).toBe(100);
  });
  it("rejects limit > 100", () => {
    expect(() => dto.listQuery.parse({ limit: "101" })).toThrowError();
  });
  it("coerces page string to number", () => {
    expect(dto.listQuery.parse({ page: "3" }).page).toBe(3);
  });
  it("rejects page 0 and negative pages", () => {
    expect(() => dto.listQuery.parse({ page: "0" })).toThrowError();
    expect(() => dto.listQuery.parse({ page: "-1" })).toThrowError();
  });
  it("trims search and category", () => {
    const parsed = dto.listQuery.parse({ search: "  goa  ", category: " Road trips " });
    expect(parsed.search).toBe("goa");
    expect(parsed.category).toBe("Road trips");
  });
  it("rejects an over-long search", () => {
    expect(() => dto.listQuery.parse({ search: "x".repeat(121) })).toThrowError();
  });
  it("still accepts the original status-only query", () => {
    expect(dto.listQuery.parse({ status: "published" })).toEqual({ status: "published" });
  });
});

describe("blogs.dto.categoriesQuery", () => {
  it("accepts an empty query", () => {
    expect(dto.categoriesQuery.parse({})).toEqual({});
  });
  it("accepts a status filter", () => {
    expect(dto.categoriesQuery.parse({ status: "published" }).status).toBe("published");
  });
  it("rejects an out-of-enum status", () => {
    expect(() => dto.categoriesQuery.parse({ status: "weird" })).toThrowError();
  });
});

describe("blogs.dto.updateBody", () => {
  it("rejects an empty patch", () => {
    expect(() => dto.updateBody.parse({})).toThrowError();
  });
});
