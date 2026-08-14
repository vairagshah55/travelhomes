/**
 * CMS Media routers — one per trust boundary.
 *
 *   publicRouter → /api/cms/media        (GET anonymous, POST any signed-in user)
 *   adminRouter  → /api/admin/cms/media  (requireFeature("manage_cms"))
 *
 * Single-file upload via multer's `image` field; metadata (page, section,
 * position) lives in the form body.
 *
 * These were one router mounted at both prefixes, so the public mount also
 * carried the write routes: anyone on the internet could POST 25 MB files onto
 * the server's disk indefinitely, or DELETE any CMS image by id — no token
 * required. Same defect the main CMS router had (see cms.router.js).
 *
 * The three routes are deliberately not treated alike:
 *
 *   GET    stays anonymous — the login/register pages fetch their imagery
 *          before anyone has signed in (cmsPublicApi.listMedia).
 *   POST   requires a valid JWT but NOT admin rights, because the vendor
 *          Marketing composer uploads through it (/marketing is vendor-only;
 *          see apps/web/src/components/marketing/usePostDraft.ts, which already
 *          sends the user's token). Admins keep their own POST on the admin
 *          mount.
 *   DELETE is admin-only. Nothing outside the admin panel ever called it, and
 *          the panel uses /api/admin/cms/media/:id.
 */
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./cms-media.controller");
const dto = require("./cms-media.dto");

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

// ─── Public router (/api/cms/media) ────────────────────────────────────────
const publicRouter = express.Router();

publicRouter.get("/", validate({ query: dto.listQuery }), controller.list);
// requireJwt runs before multer so an unauthenticated upload is refused before
// its body is written to disk.
publicRouter.post(
  "/",
  requireJwt(),
  upload.single("image"),
  validate({ body: dto.uploadBody }),
  controller.upload,
);

// ─── Admin router (/api/admin/cms/media) ───────────────────────────────────
const adminRouter = express.Router();

adminRouter.get("/", validate({ query: dto.listQuery }), controller.list);
adminRouter.post(
  "/",
  upload.single("image"),
  validate({ body: dto.uploadBody }),
  controller.upload,
);
adminRouter.delete("/:id", validate({ params: dto.idParams }), controller.remove);

module.exports = { adminRouter, publicRouter };
