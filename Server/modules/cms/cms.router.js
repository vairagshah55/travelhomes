/**
 * CMS router. Mounted at /api/cms and /api/admin/cms.
 *
 * The /jobs/apply endpoint uses multer to receive a single CV file as the
 * `cv` field. Everything else is JSON.
 *
 * Note: /jobs/applications must come before /jobs/:id to avoid the dynamic
 * id matching the literal "applications" segment.
 */
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const validate = require("../../shared/validate");
const controller = require("./cms.controller");
const dto = require("./cms.dto");

const router = express.Router();

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

// ─── Job Applications (must come before /jobs/:id) ─────────────────────
router.get("/jobs/applications", controller.listApplications);
router.post(
  "/jobs/apply",
  cvUpload.single("cv"),
  validate({ body: dto.jobApplyBody }),
  controller.applyToJob,
);
router.put(
  "/jobs/applications/:id/status",
  validate({ params: dto.idParams, body: dto.jobApplicationStatusBody }),
  controller.setApplicationStatus,
);
router.delete(
  "/jobs/applications/:id",
  validate({ params: dto.idParams }),
  controller.removeApplication,
);

// ─── Jobs ──────────────────────────────────────────────────────────────
router.get("/jobs", validate({ query: dto.jobsListQuery }), controller.listJobs);
router.post("/jobs", validate({ body: dto.jobBody }), controller.createJob);
router.put(
  "/jobs/:id",
  validate({ params: dto.idParams, body: dto.jobUpdateBody }),
  controller.updateJob,
);
router.patch("/jobs/:id/status", validate({ params: dto.idParams }), controller.toggleJob);
router.delete("/jobs/:id", validate({ params: dto.idParams }), controller.removeJob);

// ─── FAQ ───────────────────────────────────────────────────────────────
router.get("/faqs", controller.listFaqs);
router.post("/faqs", validate({ body: dto.faqBody }), controller.createFaq);
router.delete("/faqs/:id", validate({ params: dto.idParams }), controller.removeFaq);

// ─── Testimonials ──────────────────────────────────────────────────────
router.get("/testimonials", controller.listTestimonials);
router.post("/testimonials", validate({ body: dto.testimonialBody }), controller.createTestimonial);
router.patch(
  "/testimonials/:id/toggle",
  validate({ params: dto.idParams }),
  controller.toggleTestimonial,
);
router.delete(
  "/testimonials/:id",
  validate({ params: dto.idParams }),
  controller.removeTestimonial,
);

// ─── Features ──────────────────────────────────────────────────────────
router.get("/features", validate({ query: dto.featuresListQuery }), controller.listFeatures);
router.post("/features", validate({ body: dto.featureBody }), controller.createFeature);
router.patch("/features/:id/toggle", validate({ params: dto.idParams }), controller.toggleFeature);
router.delete("/features/:id", validate({ params: dto.idParams }), controller.removeFeature);

// ─── Roles ─────────────────────────────────────────────────────────────
router.get("/roles", controller.listRoles);
router.post("/roles", validate({ body: dto.roleBody }), controller.createRole);
router.delete("/roles/:id", validate({ params: dto.roleIdParams }), controller.removeRole);

// ─── CMS Pages ─────────────────────────────────────────────────────────
router.get("/pages/:key", validate({ params: dto.pageKeyParams }), controller.getPage);
router.put(
  "/pages/:key",
  validate({ params: dto.pageKeyParams, body: dto.pageUpdateBody }),
  controller.upsertPage,
);

// ─── Contact ───────────────────────────────────────────────────────────
router.get("/contact", controller.getContact);
router.post("/contact", validate({ body: dto.contactBody }), controller.upsertContact);

// ─── Homepage Sections ─────────────────────────────────────────────────
router.get("/homepage-sections", controller.listHomepageSections);
router.patch(
  "/homepage-sections/:key/toggle",
  validate({ params: dto.homepageSectionKeyParams }),
  controller.toggleHomepageSection,
);

module.exports = router;
