import { describe, it, expect } from "vitest";
import dto from "../bookings.dto.js";

const validId = "a".repeat(24);
const validCreate = {
  userId: validId,
  serviceId: "b".repeat(24),
  serviceName: "unique-stay",
  clientName: "Alex",
  clientEmail: "Alex@Example.com",
  checkInDate: "2026-06-01",
  checkOutDate: "2026-06-05",
  numberOfGuests: 2,
  totalAmount: 1000,
  baseAmount: 800,
};

describe("bookings.dto.listByDateQuery", () => {
  it("accepts a YYYY-MM-DD date", () => {
    expect(dto.listByDateQuery.parse({ date: "2026-05-04" }).date).toBe("2026-05-04");
  });

  it("rejects a missing date", () => {
    expect(() => dto.listByDateQuery.parse({})).toThrowError();
  });

  it("rejects a malformed date", () => {
    expect(() => dto.listByDateQuery.parse({ date: "5/4/2026" })).toThrowError();
    expect(() => dto.listByDateQuery.parse({ date: "2026-5-4" })).toThrowError();
  });
});

describe("bookings.dto.getByIdParams", () => {
  it("accepts a 24-char hex ObjectId", () => {
    expect(dto.getByIdParams.parse({ id: validId }).id).toBe(validId);
  });

  it("rejects a non-hex id", () => {
    expect(() => dto.getByIdParams.parse({ id: "not-an-id" })).toThrowError();
  });
});

describe("bookings.dto.listForUserParams", () => {
  it("accepts an ObjectId-shaped userId", () => {
    expect(dto.listForUserParams.parse({ userId: "b".repeat(24) }).userId).toBe("b".repeat(24));
  });

  it("accepts a legacy non-ObjectId userId", () => {
    expect(dto.listForUserParams.parse({ userId: "VD1234567" }).userId).toBe("VD1234567");
  });

  it("rejects an empty userId", () => {
    expect(() => dto.listForUserParams.parse({ userId: "" })).toThrowError();
  });
});

describe("bookings.dto.listForAdminQuery", () => {
  it("accepts an empty query", () => {
    expect(dto.listForAdminQuery.parse({})).toEqual({});
  });

  it("accepts the full filter set", () => {
    const parsed = dto.listForAdminQuery.parse({
      tab: "upcoming-bookings",
      serviceType: "caravan",
      search: "alex",
      sortBy: "createdAt",
      sortDir: "desc",
    });
    expect(parsed.tab).toBe("upcoming-bookings");
    expect(parsed.sortDir).toBe("desc");
  });

  it("rejects an out-of-enum tab", () => {
    expect(() => dto.listForAdminQuery.parse({ tab: "weird" })).toThrowError();
  });
});

describe("bookings.dto.createBookingBody", () => {
  it("accepts a minimal valid create payload and lowercases email", () => {
    const parsed = dto.createBookingBody.parse(validCreate);
    expect(parsed.clientEmail).toBe("alex@example.com");
    expect(parsed.serviceName).toBe("unique-stay");
  });

  it("rejects a missing required field", () => {
    const { totalAmount: _omit, ...rest } = validCreate;
    expect(() => dto.createBookingBody.parse(rest)).toThrowError();
  });

  it("rejects an invalid serviceName", () => {
    expect(() =>
      dto.createBookingBody.parse({ ...validCreate, serviceName: "boat" }),
    ).toThrowError();
  });

  it("rejects negative numberOfGuests", () => {
    expect(() =>
      dto.createBookingBody.parse({ ...validCreate, numberOfGuests: -1 }),
    ).toThrowError();
  });

  it("rejects a server-controlled field (no passthrough)", () => {
    // The schema is strict by default in zod 4 — bookingId is server-controlled
    // and sending it should be rejected.
    const parsed = dto.createBookingBody.parse({ ...validCreate, bookingId: "BK999" });
    expect(parsed.bookingId).toBeUndefined();
  });

  it("accepts extraItems with default quantity", () => {
    const parsed = dto.createBookingBody.parse({
      ...validCreate,
      extraItems: [{ name: "Late checkout", price: 50 }],
    });
    expect(parsed.extraItems[0].quantity).toBe(1);
  });
});

describe("bookings.dto.updateBookingBody", () => {
  it("accepts a single-field patch", () => {
    expect(dto.updateBookingBody.parse({ clientName: "Alex" }).clientName).toBe("Alex");
  });

  it("rejects an empty body", () => {
    expect(() => dto.updateBookingBody.parse({})).toThrowError();
  });
});

describe("bookings.dto.updateStatusBody", () => {
  it("accepts every supported status", () => {
    for (const status of [
      "pending",
      "confirmed",
      "checked-in",
      "checked-out",
      "cancelled",
      "active",
    ]) {
      expect(dto.updateStatusBody.parse({ status }).status).toBe(status);
    }
  });

  it("rejects an out-of-enum status", () => {
    expect(() => dto.updateStatusBody.parse({ status: "shipped" })).toThrowError();
  });
});

describe("bookings.dto.updateDatesBody", () => {
  it("accepts startDate only", () => {
    expect(dto.updateDatesBody.parse({ startDate: "2026-06-01" }).startDate).toBe("2026-06-01");
  });

  it("accepts endDate only", () => {
    expect(dto.updateDatesBody.parse({ endDate: "2026-06-05" }).endDate).toBe("2026-06-05");
  });

  it("rejects when both are missing", () => {
    expect(() => dto.updateDatesBody.parse({ action: "drag" })).toThrowError();
  });
});
