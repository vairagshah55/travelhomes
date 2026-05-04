/**
 * Router wiring tests (no service mocking required).
 *
 * Covers what the validate middleware + central error handler guarantee:
 *   - DTO violations → 422 with structured details
 *   - Unknown routes → 404 from notFoundHandler
 *   - X-Request-Id header propagated
 *
 * Deeper integration tests (success paths, mapped service errors) need a
 * real test DB and are slated for Phase 4 once mongodb-memory-server is
 * wired up. Those would belong in a sibling `auth.service.test.mjs`.
 */
import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";

const authRouter = (await import("../auth.router.js")).default;
const requestId = (await import("../../../shared/requestId.js")).default;
const errorModule = await import("../../../shared/errorMiddleware.js");
const { errorHandler, notFoundHandler } = errorModule.default ?? errorModule;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use("/api/auth", authRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe("POST /api/auth/register — validation", () => {
  it("returns 422 with structured details on invalid body", async () => {
    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ userType: "user", email: "nope" });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.requestId).toBeTruthy();
  });

  it("returns 422 when userType is missing", async () => {
    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ email: "a@b.com", mobile: "+919876543210", password: "p@ssword123" });
    expect(res.status).toBe(422);
  });

  it("returns 422 when password is too short", async () => {
    const res = await request(buildApp()).post("/api/auth/register").send({
      userType: "user",
      email: "a@b.com",
      mobile: "+919876543210",
      password: "short",
    });
    expect(res.status).toBe(422);
  });

  it("propagates X-Request-Id back on 422 responses", async () => {
    const res = await request(buildApp())
      .post("/api/auth/register")
      .set("X-Request-Id", "client-trace-123")
      .send({});
    expect(res.headers["x-request-id"]).toBe("client-trace-123");
    expect(res.body.requestId).toBe("client-trace-123");
  });
});

describe("POST /api/auth/register/:id/verify-otp — validation", () => {
  const validId = "a".repeat(24);

  it("returns 422 when otp is not 6 digits", async () => {
    const res = await request(buildApp())
      .post(`/api/auth/register/${validId}/verify-otp`)
      .send({ otp: "12" });
    expect(res.status).toBe(422);
  });

  it("returns 422 when otp contains letters", async () => {
    const res = await request(buildApp())
      .post(`/api/auth/register/${validId}/verify-otp`)
      .send({ otp: "abc123" });
    expect(res.status).toBe(422);
  });

  it("returns 422 when id is not a valid ObjectId string", async () => {
    const res = await request(buildApp())
      .post("/api/auth/register/not-an-id/verify-otp")
      .send({ otp: "123456" });
    expect(res.status).toBe(422);
  });
});

describe("PATCH /api/auth/register/:id — validation", () => {
  const validId = "a".repeat(24);

  it("rejects an empty body with 422", async () => {
    const res = await request(buildApp()).patch(`/api/auth/register/${validId}`).send({});
    expect(res.status).toBe(422);
  });

  it("rejects an invalid id with 422", async () => {
    const res = await request(buildApp())
      .patch(`/api/auth/register/not-valid`)
      .send({ firstName: "Alex" });
    expect(res.status).toBe(422);
  });
});

describe("POST /api/auth/google — validation", () => {
  it("rejects a missing code", async () => {
    const res = await request(buildApp()).post("/api/auth/google").send({});
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an empty code", async () => {
    const res = await request(buildApp()).post("/api/auth/google").send({ code: "" });
    expect(res.status).toBe(422);
  });
});

describe("Central error middleware", () => {
  it("returns 404 envelope for an unknown sibling route", async () => {
    const res = await request(buildApp()).get("/api/auth/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
    expect(res.body.requestId).toBeTruthy();
  });
});
