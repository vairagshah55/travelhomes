/**
 * CMS routers — one per trust boundary.
 *
 *   publicRouter → /api/cms        (no auth)
 *   adminRouter  → /api/admin/cms  (requireJwt + requireFeature("manage_cms"))
 *
 * These used to be the SAME router object mounted at both prefixes, which made
 * every CMS write reachable unauthenticated on the public mount: homepage
 * section toggles, FAQ/job/feature/testimonial/role deletes, page upserts — and
 * `GET /jobs/applications`, which handed out applicants' names, emails, phone
 * numbers and CV URLs to anyone who asked. Only `upsertContact` defended itself
 * (via the `isAdminContext` check in cms.service).
 *
 * So `publicRouter` now spells out the complete set of endpoints the public site
 * actually calls — see `cmsPublicApi` in apps/web/src/lib/api.ts and
 * apps/web/src/lib/testimonials.ts. Adding a route to `adminRouter` no longer
 * exposes it to the world; publishing something has to be a deliberate edit
 * here, in a list short enough to audit at a glance.
 *
 * `adminRouter` keeps the full surface it always had, so no admin path changes.
 *
 * Handlers are shared between the two routers. Where a handler must behave
 * differently for the two audiences it branches on `req.isAdminContext`, which
 * api/index.js sets on the admin mount (e.g. `GET /testimonials` returns only
 * active rows publicly, all rows for admins).
 *
 * Note: /jobs/applications must be declared before /jobs/:id so the dynamic id
 * doesn't swallow the literal "applications" segment.
 */
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const validate = require("../../shared/validate");
const controller = require("./cms.controller");
const dto = require("./cms.dto");

// Multer config — CVs land in /uploads with a `cv-` prefix.
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const cvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = path.extname(file.originalname) || ".pdf";
    cb(null, `cv-${unique}${ext}`);
  },
});
const cvUpload = multer({
  storage: cvStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB CV ceiling
});

// ─── Public router (/api/cms) ──────────────────────────────────────────────
// Reads the marketing site needs, plus the two writes a visitor is meant to
// perform: applying for a job and leaving a testimonial. Nothing else.
const publicRouter = express.Router();

publicRouter.get("/homepage-sections", controller.listHomepageSections);
publicRouter.get("/faqs", controller.listFaqs);
publicRouter.get("/contact", controller.getContact);
publicRouter.get("/features", validate({ query: dto.featuresListQuery }), controller.listFeatures);
publicRouter.get("/pages/:key", validate({ params: dto.pageKeyParams }), controller.getPage);
publicRouter.get("/jobs", validate({ query: dto.jobsListQuery }), controller.listJobs);
publicRouter.post(
  "/jobs/apply",
  cvUpload.single("cv"),
  validate({ body: dto.jobApplyBody }),
  controller.applyToJob,
);
publicRouter.get("/testimonials", controller.listTestimonials);
publicRouter.post(
  "/testimonials",
  validate({ body: dto.testimonialBody }),
  controller.createTestimonial,
);

// ─── Admin router (/api/admin/cms) ─────────────────────────────────────────
const adminRouter = express.Router();

// ─── Job Applications (must come before /jobs/:id) ─────────────────────
adminRouter.get("/jobs/applications", controller.listApplications);
adminRouter.post(
  "/jobs/apply",
  cvUpload.single("cv"),
  validate({ body: dto.jobApplyBody }),
  controller.applyToJob,
);
adminRouter.put(
  "/jobs/applications/:id/status",
  validate({ params: dto.idParams, body: dto.jobApplicationStatusBody }),
  controller.setApplicationStatus,
);
adminRouter.delete(
  "/jobs/applications/:id",
  validate({ params: dto.idParams }),
  controller.removeApplication,
);

// ─── Jobs ──────────────────────────────────────────────────────────────
adminRouter.get("/jobs", validate({ query: dto.jobsListQuery }), controller.listJobs);
adminRouter.post("/jobs", validate({ body: dto.jobBody }), controller.createJob);
adminRouter.put(
  "/jobs/:id",
  validate({ params: dto.idParams, body: dto.jobUpdateBody }),
  controller.updateJob,
);
adminRouter.patch("/jobs/:id/status", validate({ params: dto.idParams }), controller.toggleJob);
adminRouter.delete("/jobs/:id", validate({ params: dto.idParams }), controller.removeJob);

// ─── FAQ ───────────────────────────────────────────────────────────────
adminRouter.get("/faqs", controller.listFaqs);
adminRouter.post("/faqs", validate({ body: dto.faqBody }), controller.createFaq);
adminRouter.put(
  "/faqs/:id",
  validate({ params: dto.idParams, body: dto.faqUpdateBody }),
  controller.updateFaq,
);
adminRouter.delete("/faqs/:id", validate({ params: dto.idParams }), controller.removeFaq);

// ─── Testimonials ──────────────────────────────────────────────────────
adminRouter.get("/testimonials", controller.listTestimonials);
adminRouter.post(
  "/testimonials",
  validate({ body: dto.testimonialBody }),
  controller.createTestimonial,
);
adminRouter.patch(
  "/testimonials/:id/toggle",
  validate({ params: dto.idParams }),
  controller.toggleTestimonial,
);
adminRouter.delete(
  "/testimonials/:id",
  validate({ params: dto.idParams }),
  controller.removeTestimonial,
);

// ─── Features ──────────────────────────────────────────────────────────
adminRouter.get("/features", validate({ query: dto.featuresListQuery }), controller.listFeatures);
adminRouter.post("/features", validate({ body: dto.featureBody }), controller.createFeature);
adminRouter.patch(
  "/features/:id/toggle",
  validate({ params: dto.idParams }),
  controller.toggleFeature,
);
adminRouter.delete("/features/:id", validate({ params: dto.idParams }), controller.removeFeature);

// ─── Roles ─────────────────────────────────────────────────────────────
adminRouter.get("/roles", controller.listRoles);
adminRouter.post("/roles", validate({ body: dto.roleBody }), controller.createRole);
adminRouter.delete("/roles/:id", validate({ params: dto.roleIdParams }), controller.removeRole);

// ─── CMS Pages ─────────────────────────────────────────────────────────
adminRouter.get("/pages/:key", validate({ params: dto.pageKeyParams }), controller.getPage);
adminRouter.put(
  "/pages/:key",
  validate({ params: dto.pageKeyParams, body: dto.pageUpdateBody }),
  controller.upsertPage,
);

// ─── Contact ───────────────────────────────────────────────────────────
adminRouter.get("/contact", controller.getContact);
adminRouter.post("/contact", validate({ body: dto.contactBody }), controller.upsertContact);

// ─── Homepage Sections ─────────────────────────────────────────────────
adminRouter.get("/homepage-sections", controller.listHomepageSections);
adminRouter.patch(
  "/homepage-sections/:key/toggle",
  validate({ params: dto.homepageSectionKeyParams }),
  controller.toggleHomepageSection,
);

module.exports = { adminRouter, publicRouter };
