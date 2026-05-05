/**
 * Profile router. Mounted at /api/profile.
 *
 * Multer is configured for profile-photo uploads with a 5MB cap and an
 * image/* MIME filter (matches legacy limits). A future shared/upload.js
 * extraction will collapse the multer scattered across cms/cmsMedia/
 * settings/profile.
 */
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const validate = require("../../shared/validate");
const controller = require("./profile.controller");
const dto = require("./profile.dto");

const router = express.Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, "_");
    cb(null, `profile-${Date.now()}-${safeBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// Photo upload — register before /:email so the static segment wins.
router.post(
  "/photo",
  upload.single("photo"),
  validate({ body: dto.uploadBody }),
  controller.uploadPhoto,
);

// /api/profile?email=... — query-string variant.
router.get("/", validate({ query: dto.getQuery }), controller.get);

router.put("/", validate({ body: dto.upsertBody }), controller.upsert);

// /api/profile/:email — params variant.
router.get("/:email", validate({ params: dto.getParams }), controller.get);

module.exports = router;
