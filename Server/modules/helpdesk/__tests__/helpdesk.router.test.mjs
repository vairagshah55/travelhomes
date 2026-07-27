import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";

const router = (await import("../helpdesk.router.js")).default;
const requestId = (await import("../../../shared/requestId.js")).default;
const errorModule = await import("../../../shared/errorMiddleware.js");
const { errorHandler, notFoundHandler } = errorModule.default ?? errorModule;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use("/api/helpdesk", router);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const validId = "a".repeat(24);

/**
 * Regression: this router carried no auth at all, so the non-admin mount
 * (/api/helpdesk) returned every ticket in the system — names, emails and
 * phone numbers — to anonymous callers, and let anyone edit or delete a
 * ticket by id. Every route must reject a request with no token.
 */
describe("helpdesk router — authentication required", () => {
  it("rejects an anonymous list", async () => {
    const res = await request(buildApp()).get("/api/helpdesk");
    expect(res.status).toBe(401);
  });

  it("rejects an anonymous read by id", async () => {
    const res = await request(buildApp()).get(`/api/helpdesk/${validId}`);
    expect(res.status).toBe(401);
  });

  it("rejects an anonymous create", async () => {
    const res = await request(buildApp())
      .post("/api/helpdesk")
      .send({ subject: "Help", description: "It broke" });
    expect(res.status).toBe(401);
  });

  it("rejects an anonymous status change", async () => {
    const res = await request(buildApp())
      .patch(`/api/helpdesk/${validId}/status`)
      .send({ status: "Resolved" });
    expect(res.status).toBe(401);
  });

  it("rejects an anonymous update", async () => {
    const res = await request(buildApp())
      .put(`/api/helpdesk/${validId}`)
      .send({ subject: "Changed" });
    expect(res.status).toBe(401);
  });

  it("rejects an anonymous delete", async () => {
    const res = await request(buildApp()).delete(`/api/helpdesk/${validId}`);
    expect(res.status).toBe(401);
  });
});
