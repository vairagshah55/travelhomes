/**
 * Vendor-chats router. Mounted at /api/vendorchats.
 *
 * The /upload endpoint accepts up to 10 files via multipart and stores them
 * to the local /uploads dir; everything else is JSON. We keep the legacy
 * mount path (/api/vendorchats, no underscore/hyphen) so the SPA doesn't
 * have to change.
 */
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const validate = require("../../shared/validate");
const controller = require("./vendor-chats.controller");
const dto = require("./vendor-chats.dto");

const router = express.Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `chat-${unique}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB per file
});

router.post("/upload", upload.array("files", 10), controller.upload);

router.get("/profile", validate({ query: dto.profileQuery }), controller.getChatProfile);

router.post(
  "/conversations",
  validate({ body: dto.createConvBody }),
  controller.createOrGetConversation,
);

router.get("/conversations", validate({ query: dto.listConvQuery }), controller.listConversations);

router.get(
  "/conversations/:conversationId",
  validate({ params: dto.conversationParams }),
  controller.getConversationById,
);

router.get(
  "/conversations/:conversationId/messages",
  validate({ params: dto.conversationParams, query: dto.messagesQuery }),
  controller.getMessages,
);

router.post(
  "/conversations/:conversationId/messages",
  validate({ params: dto.conversationParams, body: dto.sendMessageBody }),
  controller.sendMessage,
);

router.post(
  "/conversations/:conversationId/mark-read",
  validate({ params: dto.conversationParams, body: dto.markReadBody }),
  controller.markAsRead,
);

module.exports = router;
