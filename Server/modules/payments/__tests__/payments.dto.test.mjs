import { describe, it, expect } from "vitest";
import dto from "../payments.dto.js";

const validId = "a".repeat(24);
const validBookingBlob = {
  userId: validId,
  serviceId: "b".repeat(24),
  serviceName: "unique-stay",
  totalAmount: 1000,
  clientName: "Alex",
  clientEmail: "alex@example.com",
  checkInDate: "2026-06-01",
  checkOutDate: "2026-06-05",
  numberOfGuests: 2,
};

describe("payments.dto.listQuery", () => {
  it("accepts an empty query", () => {
    expect(dto.listQuery.parse({})).toEqual({});
  });

  it("accepts the full filter set", () => {
    const parsed = dto.listQuery.parse({
      tab: "vendor",
      serviceType: "camper-van",
      search: "abc",
      sortBy: "amount",
      sortDir: "desc",
    });
    expect(parsed.tab).toBe("vendor");
  });

  it("rejects an out-of-enum tab", () => {
    expect(() => dto.listQuery.parse({ tab: "weird" })).toThrowError();
  });
});

describe("payments.dto.getByIdParams", () => {
  it("accepts a 24-hex id", () => {
    expect(dto.getByIdParams.parse({ id: validId }).id).toBe(validId);
  });
  it("rejects a non-hex id", () => {
    expect(() => dto.getByIdParams.parse({ id: "x" })).toThrowError();
  });
});

describe("payments.dto.createPaymentBody", () => {
  const valid = {
    personName: "Alex",
    amount: 1000,
    paymentMethod: "razorpay",
  };

  it("accepts a minimal valid create payload", () => {
    expect(dto.createPaymentBody.parse(valid).amount).toBe(1000);
  });

  it("rejects a missing personName", () => {
    const { personName: _omit, ...rest } = valid;
    expect(() => dto.createPaymentBody.parse(rest)).toThrowError();
  });

  it("rejects negative amount", () => {
    expect(() => dto.createPaymentBody.parse({ ...valid, amount: -1 })).toThrowError();
  });

  it("rejects an invalid paymentDate (validates the optional field when present)", () => {
    expect(() =>
      dto.createPaymentBody.parse({ ...valid, paymentDate: "not-a-date" }),
    ).toThrowError();
  });

  it("accepts a valid ISO paymentDate", () => {
    const parsed = dto.createPaymentBody.parse({
      ...valid,
      paymentDate: "2026-05-04T10:30:00.000Z",
    });
    expect(parsed.paymentDate).toBe("2026-05-04T10:30:00.000Z");
  });
});

describe("payments.dto.updateStatusBody", () => {
  it("accepts every supported status", () => {
    for (const status of ["pending", "paid", "requested", "processing", "refunded"]) {
      expect(dto.updateStatusBody.parse({ status }).status).toBe(status);
    }
  });
  it("rejects an out-of-enum status", () => {
    expect(() => dto.updateStatusBody.parse({ status: "shipped" })).toThrowError();
  });
});

describe("payments.dto.createOrderBody", () => {
  it("accepts a positive amount", () => {
    expect(dto.createOrderBody.parse({ amount: 500 }).amount).toBe(500);
  });
  it("rejects zero or negative", () => {
    expect(() => dto.createOrderBody.parse({ amount: 0 })).toThrowError();
    expect(() => dto.createOrderBody.parse({ amount: -1 })).toThrowError();
  });
  it("rejects an absurd amount", () => {
    expect(() => dto.createOrderBody.parse({ amount: 10_000_001 })).toThrowError();
  });
});

describe("payments.dto.verifyPaymentBody", () => {
  const valid = {
    razorpay_order_id: "order_xyz",
    razorpay_payment_id: "pay_xyz",
    razorpay_signature: "0".repeat(64),
    booking: validBookingBlob,
  };

  it("accepts a valid verify payload", () => {
    const parsed = dto.verifyPaymentBody.parse(valid);
    expect(parsed.razorpay_order_id).toBe("order_xyz");
    expect(parsed.booking.userId).toBe(validId);
  });

  it("rejects a missing booking blob", () => {
    const { booking: _omit, ...rest } = valid;
    expect(() => dto.verifyPaymentBody.parse(rest)).toThrowError();
  });

  it("rejects a missing razorpay_signature", () => {
    expect(() => dto.verifyPaymentBody.parse({ ...valid, razorpay_signature: "" })).toThrowError();
  });

  it("rejects a booking missing required identity fields", () => {
    const { userId: _omit, ...rest } = validBookingBlob;
    expect(() => dto.verifyPaymentBody.parse({ ...valid, booking: rest })).toThrowError();
  });

  it("accepts string-typed numeric fields (legacy contract)", () => {
    const parsed = dto.verifyPaymentBody.parse({
      ...valid,
      booking: { ...validBookingBlob, totalAmount: "1000", numberOfGuests: "3" },
    });
    expect(parsed.booking.totalAmount).toBe("1000");
  });
});
