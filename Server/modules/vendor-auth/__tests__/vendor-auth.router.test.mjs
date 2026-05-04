/**
 * Router wiring tests for vendor-auth — covers the validate middleware
 * boundary and the central error envelope.
 *
 * Service-mocked success/error tests are deferred to Phase 4 alongside a
 * proper mongodb-memory-server setup (same constraint as auth.router.test).
 */
import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";

const router = (await import("../vendor-auth.router.js")).default;
const requestId = (await import("../../../shared/requestId.js")).default;
const errorModule = await import("../../../shared/errorMiddleware.js");
const { errorHandler, notFoundHandler } = errorModule.default ?? errorModule;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use("/api/vendorlogin", router);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe("POST /api/vendorlogin/login — validation", () => {
  it("rejects empty body with 422", async () => {
    const res = await request(buildApp()).post("/api/vendorlogin/login").send({});
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects empty identifier", async () => {
    const res = await request(buildApp())
      .post("/api/vendorlogin/login")
      .send({ email: "", password: "x" });
    expect(res.status).toBe(422);
  });
});

describe("POST /api/vendorlogin/forgot — validation", () => {
  it("rejects missing identifier", async () => {
    const res = await request(buildApp()).post("/api/vendorlogin/forgot").send({});
    expect(res.status).toBe(422);
  });
});

describe("POST /api/vendorlogin/verify-otp — validation", () => {
  it("rejects a 5-digit OTP", async () => {
    const res = await request(buildApp())
      .post("/api/vendorlogin/verify-otp")
      .send({ email: "x@y.com", otp: "12345" });
    expect(res.status).toBe(422);
  });
});

describe("POST /api/vendorlogin/reset — validation", () => {
  it("rejects newPassword shorter than 8", async () => {
    const res = await request(buildApp())
      .post("/api/vendorlogin/reset")
      .send({ email: "x@y.com", otp: "123456", newPassword: "short" });
    expect(res.status).toBe(422);
  });
});

describe("POST /api/vendorlogin/update-account — validation", () => {
  it("rejects newPassword without currentPassword", async () => {
    const res = await request(buildApp())
      .post("/api/vendorlogin/update-account")
      .send({ currentEmail: "x@y.com", newPassword: "newer-password" });
    expect(res.status).toBe(422);
    expect(res.body.error.details?.[0]?.path).toBe("currentPassword");
  });
});

describe("POST /api/vendorlogin/send-change-otp — validation", () => {
  it("rejects when neither newEmail nor newMobile is given", async () => {
    const res = await request(buildApp())
      .post("/api/vendorlogin/send-change-otp")
      .send({ currentEmail: "x@y.com" });
    expect(res.status).toBe(422);
  });
});

describe("vendor-auth router — central error envelope", () => {
  it("returns 404 for an unknown sibling route", async () => {
    const res = await request(buildApp()).get("/api/vendorlogin/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
    expect(res.body.requestId).toBeTruthy();
  });
});
