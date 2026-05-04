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
    const res = await request(buildApp()).get(`/api/bookings/user/${"a".repeat(24)}`);
    expect(res.status).toBe(401);
  });
});

describe("bookings router — central error envelope", () => {
  it("returns 404 for unknown sibling routes", async () => {
    const res = await request(buildApp()).get("/api/bookings/something/weird/extra");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
  });
});
