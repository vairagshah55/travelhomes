import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";

const router = (await import("../admin-auth.router.js")).default;
const requestId = (await import("../../../shared/requestId.js")).default;
const errorModule = await import("../../../shared/errorMiddleware.js");
const { errorHandler, notFoundHandler } = errorModule.default ?? errorModule;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use("/api/admin/auth", router);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe("POST /api/admin/auth/login — validation", () => {
  it("rejects empty body with 422", async () => {
    const res = await request(buildApp()).post("/api/admin/auth/login").send({});
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an invalid email", async () => {
    const res = await request(buildApp())
      .post("/api/admin/auth/login")
      .send({ email: "not-email", password: "x" });
    expect(res.status).toBe(422);
  });
});

describe("POST /api/admin/auth/login/superadmin — validation", () => {
  it("rejects missing password", async () => {
    const res = await request(buildApp())
      .post("/api/admin/auth/login/superadmin")
      .send({ email: "a@b.com" });
    expect(res.status).toBe(422);
  });
});

describe("GET /api/admin/auth/me — auth gate", () => {
  it("returns 401 without a token", async () => {
    const res = await request(buildApp()).get("/api/admin/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("admin-auth router — central error envelope", () => {
  it("returns 404 for unknown sibling routes", async () => {
    const res = await request(buildApp()).get("/api/admin/auth/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
  });
});
