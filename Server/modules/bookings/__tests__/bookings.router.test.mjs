import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";

const router = (await import("../bookings.router.js")).default;
const requestId = (await import("../../../shared/requestId.js")).default;
const errorModule = await import("../../../shared/errorMiddleware.js");
const { errorHandler, notFoundHandler } = errorModule.default ?? errorModule;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use("/api/bookings", router);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const validId = "a".repeat(24);

// ─── Reads ──────────────────────────────────────────────────────────────────
describe("GET /api/bookings — validation", () => {
  it("rejects missing date with 422", async () => {
    const res = await request(buildApp()).get("/api/bookings");
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects malformed date with 422", async () => {
    const res = await request(buildApp()).get("/api/bookings").query({ date: "yesterday" });
    expect(res.status).toBe(422);
  });
});

describe("GET /api/bookings/:id — validation", () => {
  it("rejects a non-hex id with 422", async () => {
    const res = await request(buildApp()).get("/api/bookings/not-an-id");
    expect(res.status).toBe(422);
  });
});

describe("GET /api/bookings/user/:userId — auth gate", () => {
  it("returns 401 without a token (requireJwt)", async () => {
    const res = await request(buildApp()).get(`/api/bookings/user/${validId}`);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/bookings/legacy/all — admin filter validation", () => {
  it("rejects an out-of-enum tab", async () => {
    const res = await request(buildApp()).get("/api/bookings/legacy/all").query({ tab: "weird" });
    expect(res.status).toBe(422);
  });
});

// ─── Writes ─────────────────────────────────────────────────────────────────
const validCreate = {
  userId: validId,
  serviceId: "b".repeat(24),
  serviceName: "unique-stay",
  clientName: "Alex",
  clientEmail: "alex@example.com",
  checkInDate: "2026-06-01",
  checkOutDate: "2026-06-05",
  numberOfGuests: 2,
  totalAmount: 1000,
  baseAmount: 800,
};

describe("POST /api/bookings — validation", () => {
  it("rejects an empty body with 422", async () => {
    const res = await request(buildApp()).post("/api/bookings").send({});
    expect(res.status).toBe(422);
  });

  it("rejects an invalid email", async () => {
    const res = await request(buildApp())
      .post("/api/bookings")
      .send({ ...validCreate, clientEmail: "not-an-email" });
    expect(res.status).toBe(422);
  });

  it("rejects negative totalAmount", async () => {
    const res = await request(buildApp())
      .post("/api/bookings")
      .send({ ...validCreate, totalAmount: -1 });
    expect(res.status).toBe(422);
  });

  // Note: mass-assignment defence is asserted at the DTO layer (see
  // bookings.dto.test.mjs) — a router-level test would need to actually
  // invoke the service, which requires a real DB.
});

describe("PATCH /api/bookings/:id/status — validation", () => {
  it("rejects an out-of-enum status with 422", async () => {
    const res = await request(buildApp())
      .patch(`/api/bookings/${validId}/status`)
      .send({ status: "shipped" });
    expect(res.status).toBe(422);
  });

  it("rejects a missing status with 422", async () => {
    const res = await request(buildApp()).patch(`/api/bookings/${validId}/status`).send({});
    expect(res.status).toBe(422);
  });
});

describe("PATCH /api/bookings/:id/dates — validation", () => {
  it("rejects when neither startDate nor endDate is given", async () => {
    const res = await request(buildApp())
      .patch(`/api/bookings/${validId}/dates`)
      .send({ action: "drag" });
    expect(res.status).toBe(422);
  });
});

describe("PUT /api/bookings/:id — validation", () => {
  it("rejects an empty body with 422", async () => {
    const res = await request(buildApp()).put(`/api/bookings/${validId}`).send({});
    expect(res.status).toBe(422);
  });

  it("rejects an invalid id format", async () => {
    const res = await request(buildApp()).put("/api/bookings/not-an-id").send({ clientName: "X" });
    expect(res.status).toBe(422);
  });
});

describe("DELETE /api/bookings/:id — validation", () => {
  it("rejects a non-hex id with 422", async () => {
    const res = await request(buildApp()).delete("/api/bookings/not-an-id");
    expect(res.status).toBe(422);
  });
});

describe("bookings router — central error envelope", () => {
  it("returns 404 for unknown sibling routes", async () => {
    const res = await request(buildApp()).get("/api/bookings/something/weird/extra");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
  });
});
