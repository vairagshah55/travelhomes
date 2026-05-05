import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";

const router = (await import("../calendar-bookings.router.js")).default;
const requestId = (await import("../../../shared/requestId.js")).default;
const errorModule = await import("../../../shared/errorMiddleware.js");
const { errorHandler, notFoundHandler } = errorModule.default ?? errorModule;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use("/api/calendarbooking", router);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const validId = "a".repeat(24);

describe("GET /api/calendarbooking — validation", () => {
  it("rejects a month outside 1-12", async () => {
    const res = await request(buildApp()).get("/api/calendarbooking").query({ month: "13" });
    expect(res.status).toBe(422);
  });
});

describe("GET /api/calendarbooking/:id — validation", () => {
  it("rejects a non-hex id", async () => {
    const res = await request(buildApp()).get("/api/calendarbooking/nope");
    expect(res.status).toBe(422);
  });
});

describe("POST /api/calendarbooking — validation", () => {
  it("rejects an empty body", async () => {
    const res = await request(buildApp()).post("/api/calendarbooking").send({});
    expect(res.status).toBe(422);
  });

  it("rejects when start is after end", async () => {
    const res = await request(buildApp()).post("/api/calendarbooking").send({
      guestName: "Alex",
      resourceName: "Cabin",
      startDate: "2026-06-10",
      endDate: "2026-06-05",
    });
    expect(res.status).toBe(422);
  });
});

describe("PATCH /api/calendarbooking/:id/dates — validation", () => {
  it("requires both dates", async () => {
    const res = await request(buildApp())
      .patch(`/api/calendarbooking/${validId}/dates`)
      .send({ startDate: "2026-06-01" });
    expect(res.status).toBe(422);
  });
});

describe("PATCH /api/calendarbooking/:id/status — validation", () => {
  it("rejects lowercase status (legacy is PascalCase)", async () => {
    const res = await request(buildApp())
      .patch(`/api/calendarbooking/${validId}/status`)
      .send({ status: "confirmed" });
    expect(res.status).toBe(422);
  });
});

describe("calendar-bookings router — central error envelope", () => {
  it("returns 404 for unknown sibling routes", async () => {
    const res = await request(buildApp()).get("/api/calendarbooking/something/weird");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
  });
});
