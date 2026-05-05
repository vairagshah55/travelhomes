import { describe, it, expect } from "vitest";
import dto from "../admin-staff.dto.js";

describe("admin-staff.dto.createBody", () => {
  const valid = {
    firstName: "Alex",
    lastName: "Rivera",
    email: "Alex@Example.com",
    phone: "+15551234567",
    role: "Manager",
  };
  it("accepts a valid payload and lowercases email", () => {
    expect(dto.createBody.parse(valid).email).toBe("alex@example.com");
  });
  it("rejects a missing required field", () => {
    for (const k of ["firstName", "lastName", "email", "phone", "role"]) {
      const p = { ...valid };
      delete p[k];
      expect(() => dto.createBody.parse(p)).toThrowError();
    }
  });
  it("rejects an out-of-enum status", () => {
    expect(() => dto.createBody.parse({ ...valid, status: "Suspended" })).toThrowError();
  });
});

describe("admin-staff.dto.bulkStatusBody", () => {
  it("rejects empty staffIds", () => {
    expect(() => dto.bulkStatusBody.parse({ staffIds: [], status: "Active" })).toThrowError();
  });
  it("rejects an invalid status", () => {
    expect(() =>
      dto.bulkStatusBody.parse({ staffIds: ["a".repeat(24)], status: "Suspended" }),
    ).toThrowError();
  });
});

describe("admin-staff.dto.listQuery", () => {
  it("applies pagination defaults", () => {
    const parsed = dto.listQuery.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(10);
    expect(parsed.sortOrder).toBe("desc");
  });
});
