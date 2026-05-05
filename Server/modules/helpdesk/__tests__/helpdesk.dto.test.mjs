import { describe, it, expect } from "vitest";
import dto from "../helpdesk.dto.js";

describe("helpdesk.dto.ticketBody", () => {
  it("rejects a missing subject", () => {
    expect(() => dto.ticketBody.parse({})).toThrowError();
  });
  it("accepts a minimal valid ticket", () => {
    expect(dto.ticketBody.parse({ subject: "Help" }).subject).toBe("Help");
  });
  it("rejects an out-of-enum status", () => {
    expect(() => dto.ticketBody.parse({ subject: "x", status: "weird" })).toThrowError();
  });
});

describe("helpdesk.dto.updateStatusBody", () => {
  it("accepts every legacy status value", () => {
    for (const status of ["Pending", "Resolved", "Read"]) {
      expect(dto.updateStatusBody.parse({ status }).status).toBe(status);
    }
  });
  it("rejects lowercase status", () => {
    expect(() => dto.updateStatusBody.parse({ status: "pending" })).toThrowError();
  });
});

describe("helpdesk.dto.listQuery", () => {
  it("accepts 'all' as a status value", () => {
    expect(dto.listQuery.parse({ status: "all" }).status).toBe("all");
  });
  it("rejects an out-of-enum sortDir", () => {
    expect(() => dto.listQuery.parse({ sortDir: "weird" })).toThrowError();
  });
});
