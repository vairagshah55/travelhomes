/**
 * CMS Media router. Mounted at /api/cms/media and /api/admin/cms/media.
 *
 * Single-file upload via multer's `image` field; metadata (page, section,
 * position) lives in the form body.
 */
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const validate = require("../../shared/validate");
const controller = require("./cms-media.controller");
const dto = require("./cms-media.dto");

const router = express.Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `cms-${unique}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.get("/", validate({ query: dto.listQuery }), controller.list);
router.post("/", upload.single("image"), validate({ body: dto.uploadBody }), controller.upload);
router.delete("/:id", validate({ params: dto.idParams }), controller.remove);

module.exports = router;
