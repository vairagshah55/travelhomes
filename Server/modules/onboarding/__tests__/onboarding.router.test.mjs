/**
 * Router wiring tests for onboarding — covers the auth gate (requireJwt /
 * adminOnly), the validate middleware boundary, and the central error
 * envelope for the flow behind /onboarding/caravan (and its activity/stay
 * siblings, which share the same router).
 *
 * Submit bodies are validated with a passthrough schema (see
 * onboarding.dto.test.mjs), so the only body-shape rejection the router can
 * produce is a non-object payload. Deeper integration tests (a real submit
 * creating a Vendor/Offer/CaravanOnboarding row) need a real test DB and are
 * deferred to Phase 4 alongside the other modules' router tests — every case
 * below is chosen so it resolves before the controller/service touches
 * Mongo, since this suite runs with no DB connection.
 */
import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

const router = (await import("../onboarding.router.js")).default;
const requestId = (await import("../../../shared/requestId.js")).default;
const errorModule = await import("../../../shared/errorMiddleware.js");
const { errorHandler, notFoundHandler } = errorModule.default ?? errorModule;
const { JWT_SECRET } = (await import("../../../config/auth.js")).default;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use("/api/onboarding", router);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const validId = "a".repeat(24);

const userToken = jwt.sign(
  { _id: validId, email: "vendor@example.com", type: "user" },
  JWT_SECRET,
  { expiresIn: "1h" },
);
const adminToken = jwt.sign(
  { _id: validId, email: "admin@example.com", type: "admin" },
  JWT_SECRET,
  { expiresIn: "1h" },
);

// ─── Submit ─────────────────────────────────────────────────────────────────
describe("POST /api/onboarding/caravan — auth gate", () => {
  it("rejects an anonymous submit with 401", async () => {
    const res = await request(buildApp()).post("/api/onboarding/caravan").send({ name: "Van" });
    expect(res.status).toBe(401);
  });

  it("rejects a malformed bearer token with 401", async () => {
    const res = await request(buildApp())
      .post("/api/onboarding/caravan")
      .set("Authorization", "Bearer not-a-real-token")
      .send({ name: "Van" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/onboarding/caravan — validation", () => {
  it("rejects a non-object body (array) while authenticated", async () => {
    const res = await request(buildApp())
      .post("/api/onboarding/caravan")
      .set("Authorization", `Bearer ${userToken}`)
      .send([1, 2, 3]);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/onboarding/activity — auth gate", () => {
  it("rejects an anonymous submit with 401", async () => {
    const res = await request(buildApp()).post("/api/onboarding/activity").send({});
    expect(res.status).toBe(401);
  });
});

describe("POST /api/onboarding/stay — auth gate", () => {
  it("rejects an anonymous submit with 401", async () => {
    const res = await request(buildApp()).post("/api/onboarding/stay").send({});
    expect(res.status).toBe(401);
  });
});

// ─── Selfie attach ──────────────────────────────────────────────────────────
describe("POST /api/onboarding/caravan/selfie — auth gate", () => {
  it("rejects an anonymous request with 401", async () => {
    const res = await request(buildApp())
      .post("/api/onboarding/caravan/selfie")
      .send({ id: validId, imageData: "data:image/png;base64,xxx" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/onboarding/caravan/selfie — validation", () => {
  it("rejects missing imageData with 422", async () => {
    const res = await request(buildApp())
      .post("/api/onboarding/caravan/selfie")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ id: validId });
    expect(res.status).toBe(422);
  });

  it("rejects empty imageData with 422", async () => {
    const res = await request(buildApp())
      .post("/api/onboarding/caravan/selfie")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ id: validId, imageData: "" });
    expect(res.status).toBe(422);
  });

  it("rejects a non-hex id with 422", async () => {
    const res = await request(buildApp())
      .post("/api/onboarding/caravan/selfie")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ id: "not-an-id", imageData: "data:image/png;base64,xxx" });
    expect(res.status).toBe(422);
  });
});

// ─── Read ───────────────────────────────────────────────────────────────────
describe("GET /api/onboarding/mine — auth gate", () => {
  it("rejects an anonymous request with 401", async () => {
    const res = await request(buildApp()).get("/api/onboarding/mine");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/onboarding/caravan — admin gate", () => {
  it("rejects an anonymous list with 401", async () => {
    const res = await request(buildApp()).get("/api/onboarding/caravan");
    expect(res.status).toBe(401);
  });

  it("rejects a non-admin token with 403", async () => {
    const res = await request(buildApp())
      .get("/api/onboarding/caravan")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe("GET /api/onboarding/caravan/:id — admin gate + validation", () => {
  it("rejects an anonymous read with 401", async () => {
    const res = await request(buildApp()).get(`/api/onboarding/caravan/${validId}`);
    expect(res.status).toBe(401);
  });

  it("rejects a non-admin token with 403", async () => {
    const res = await request(buildApp())
      .get(`/api/onboarding/caravan/${validId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("rejects a non-hex id for an admin caller with 422", async () => {
    const res = await request(buildApp())
      .get("/api/onboarding/caravan/not-an-id")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(422);
  });
});

describe("onboarding router — central error envelope", () => {
  it("returns 404 for an unknown sibling route", async () => {
    const res = await request(buildApp()).get("/api/onboarding/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
    expect(res.body.requestId).toBeTruthy();
  });
});
