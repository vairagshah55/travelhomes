import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";

const router = (await import("../booking-details.router.js")).default;
const requestId = (await import("../../../shared/requestId.js")).default;
const errorModule = await import("../../../shared/errorMiddleware.js");
const { errorHandler, notFoundHandler } = errorModule.default ?? errorModule;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use("/api/bookingDetails", router);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const validId = "a".repeat(24);

describe("GET /api/bookingDetails/:id — validation", () => {
  it("rejects a non-hex id with 422", async () => {
    const res = await request(buildApp()).get("/api/bookingDetails/nope");
    expect(res.status).toBe(422);
  });
});

describe("POST /api/bookingDetails — validation", () => {
  it("rejects an empty body", async () => {
    const res = await request(buildApp()).post("/api/bookingDetails").send({});
    expect(res.status).toBe(422);
  });
  it("rejects a missing serviceName", async () => {
    const res = await request(buildApp()).post("/api/bookingDetails").send({ clientName: "Alex" });
    expect(res.status).toBe(422);
  });
  it("rejects an out-of-enum status", async () => {
    const res = await request(buildApp())
      .post("/api/bookingDetails")
      .send({ clientName: "Alex", serviceName: "Cabin", status: "weird" });
    expect(res.status).toBe(422);
  });
});

describe("PUT /api/bookingDetails/:id — validation", () => {
  it("rejects an empty body", async () => {
    const res = await request(buildApp()).put(`/api/bookingDetails/${validId}`).send({});
    expect(res.status).toBe(422);
  });
});

describe("DELETE /api/bookingDetails/:id — validation", () => {
  it("rejects a non-hex id", async () => {
    const res = await request(buildApp()).delete("/api/bookingDetails/nope");
    expect(res.status).toBe(422);
  });
});

describe("booking-details router — central error envelope", () => {
  it("returns 404 for unknown sibling routes", async () => {
    const res = await request(buildApp()).get("/api/bookingDetails/something/weird");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
  });
});
