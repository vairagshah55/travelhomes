const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

const senderKind = z.enum(["User", "Vendor"]);
const participantKind = z.enum(["User", "Vendor", "Register"]);

// ─── GET /profile ───────────────────────────────────────────────────────────
const profileQuery = z.object({
  email: z.email().trim().max(254),
  type: z.enum(["user", "vendor"]).optional(),
});

// ─── POST /conversations ────────────────────────────────────────────────────
const createConvBody = z.object({
  vendorId: objectIdString,
  userId: objectIdString,
  title: z.string().trim().max(200).optional(),
});

// ─── GET /conversations ─────────────────────────────────────────────────────
const listConvQuery = z.object({
  participantKind,
  participantId: objectIdString,
});

// ─── GET /conversations/:conversationId etc ─────────────────────────────────
const conversationParams = z.object({ conversationId: objectIdString });

// ─── GET /conversations/:id/messages ────────────────────────────────────────
const messagesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

// ─── POST /conversations/:id/messages ───────────────────────────────────────
const attachment = z.object({
  url: z.string().trim().min(1).max(2000),
  filename: z.string().trim().max(255).optional(),
  mimetype: z.string().trim().max(120).optional(),
  size: z.number().int().nonnegative().optional(),
  type: z.string().trim().max(40).optional(),
});

const sendMessageBody = z
  .object({
    senderId: objectIdString,
    senderKind,
    content: z.string().trim().max(20_000).optional(),
    attachments: z.array(attachment).optional(),
    messageType: z.string().trim().max(40).optional(),
  })
  .refine(
    (d) => (d.content && d.content.length > 0) || (d.attachments && d.attachments.length > 0),
    {
      message: "Message must have content or attachments",
    },
  );

// ─── POST /conversations/:id/mark-read ──────────────────────────────────────
const markReadBody = z.object({
  participantId: objectIdString,
});

module.exports = {
  profileQuery,
  createConvBody,
  listConvQuery,
  conversationParams,
  messagesQuery,
  sendMessageBody,
  markReadBody,
};
