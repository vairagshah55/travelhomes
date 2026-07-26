import { describe, it, expect } from "vitest";
import dto from "../helpdesk.dto.js";

describe("helpdesk.dto.ticketBody", () => {
  it("rejects a missing subject", () => {
    expect(() => dto.ticketBody.parse({ description: "d" })).toThrowError();
  });
  it("rejects a missing description", () => {
    // The model marks description required; dropping it here produced a
    // mongoose failure instead of a 422.
    expect(() => dto.ticketBody.parse({ subject: "Help" })).toThrowError();
  });
  it("accepts a minimal valid ticket", () => {
    const parsed = dto.ticketBody.parse({ subject: "Help", description: "It broke" });
    expect(parsed.subject).toBe("Help");
    expect(parsed.description).toBe("It broke");
  });
  it("keeps the fields the raise-ticket forms send", () => {
    const parsed = dto.ticketBody.parse({
      name: "Alex",
      phoneNumber: "9876543210",
      email: "alex@example.com",
      subject: "Help",
      description: "It broke",
    });
    // Regression: these were silently stripped, so tickets lost the phone
    // number and failed on the required description.
    expect(parsed.phoneNumber).toBe("9876543210");
    expect(parsed.description).toBe("It broke");
  });
  it("rejects an out-of-enum status", () => {
    expect(() =>
      dto.ticketBody.parse({ subject: "x", description: "d", status: "weird" }),
    ).toThrowError();
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
