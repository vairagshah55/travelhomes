import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";

const router = (await import("../payments.router.js")).default;
const requestId = (await import("../../../shared/requestId.js")).default;
const errorModule = await import("../../../shared/errorMiddleware.js");
const { errorHandler, notFoundHandler } = errorModule.default ?? errorModule;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use("/api/payments", router);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const validId = "a".repeat(24);

describe("GET /api/payments — validation", () => {
  it("rejects an out-of-enum tab with 422", async () => {
    const res = await request(buildApp()).get("/api/payments").query({ tab: "weird" });
    expect(res.status).toBe(422);
  });
});

describe("GET /api/payments/:id — validation", () => {
  it("rejects a non-hex id with 422", async () => {
    const res = await request(buildApp()).get("/api/payments/not-an-id");
    expect(res.status).toBe(422);
  });
});

describe("POST /api/payments — validation", () => {
  it("rejects an empty body with 422", async () => {
    const res = await request(buildApp()).post("/api/payments").send({});
    expect(res.status).toBe(422);
  });

  it("rejects a missing required field", async () => {
    const res = await request(buildApp())
      .post("/api/payments")
      .send({ personName: "Alex", amount: 100 });
    expect(res.status).toBe(422);
  });

  it("rejects negative amount", async () => {
    const res = await request(buildApp()).post("/api/payments").send({
      personName: "Alex",
      paymentMethod: "razorpay",
      amount: -1,
    });
    expect(res.status).toBe(422);
  });
});

describe("PATCH /api/payments/:id/status — validation", () => {
  it("rejects an out-of-enum status with 422", async () => {
    const res = await request(buildApp())
      .patch(`/api/payments/${validId}/status`)
      .send({ status: "shipped" });
    expect(res.status).toBe(422);
  });
});

describe("POST /api/payments/razor/create-order — validation", () => {
  it("rejects missing amount with 422", async () => {
    const res = await request(buildApp()).post("/api/payments/razor/create-order").send({});
    expect(res.status).toBe(422);
  });

  it("rejects zero amount", async () => {
    const res = await request(buildApp())
      .post("/api/payments/razor/create-order")
      .send({ amount: 0 });
    expect(res.status).toBe(422);
  });
});

describe("POST /api/payments/razor/verify-payment — validation", () => {
  it("rejects missing booking blob with 422", async () => {
    const res = await request(buildApp()).post("/api/payments/razor/verify-payment").send({
      razorpay_order_id: "x",
      razorpay_payment_id: "y",
      razorpay_signature: "z",
    });
    expect(res.status).toBe(422);
  });

  it("rejects an empty signature with 422", async () => {
    const res = await request(buildApp())
      .post("/api/payments/razor/verify-payment")
      .send({
        razorpay_order_id: "order_x",
        razorpay_payment_id: "pay_x",
        razorpay_signature: "",
        booking: {
          userId: validId,
          serviceId: "b".repeat(24),
          serviceName: "unique-stay",
          totalAmount: 1000,
          clientName: "Alex",
          checkInDate: "2026-06-01",
          checkOutDate: "2026-06-05",
        },
      });
    expect(res.status).toBe(422);
  });
});

describe("payments router — central error envelope", () => {
  it("returns 404 for unknown sibling routes", async () => {
    const res = await request(buildApp()).get("/api/payments/unknown/path");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
  });
});
