/**
 * Settings router — SEO + System.
 *
 * Multer is configured for SEO image uploads (favicon, logo, og). Files
 * land in `${cwd}/uploads/`. A future S3/Cloudinary migration would
 * swap out the storage engine here.
 *
 * NOTE: this multer config is duplicated across cmsMedia + settings + cms +
 * profile in the legacy code. Phase 4 cleanup will extract a shared
 * `shared/upload.js` once those modules migrate.
 */
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const validate = require("../../shared/validate");
const controller = require("./settings.controller");
const dto = require("./settings.dto");

const router = express.Router();

// Local-disk multer storage. Files land in cwd/uploads/.
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap (was unlimited)
  fileFilter: (_req, file, cb) => {
    // SEO assets must be images — prevents naive uploads of arbitrary types.
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

router.get("/seo", validate({ query: dto.seoQuery }), controller.getSeo);
router.put("/seo", validate({ body: dto.seoUpsertBody }), controller.upsertSeo);
router.post(
  "/seo/upload",
  upload.single("image"),
  validate({ body: dto.seoUploadBody }),
  controller.uploadSeoAsset,
);

router.get("/system", validate({ query: dto.systemQuery }), controller.getSystem);
router.put("/system", validate({ body: dto.systemUpdateBody }), controller.updateSystem);

module.exports = router;
