const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

// ─── POST /api/contact ──────────────────────────────────────────────────────
const submitBody = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional(),
  email: z
    .email()
    .trim()
    .max(254)
    .transform((s) => s.toLowerCase()),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(1).max(5000),
});

// ─── PATCH /api/contact/read/:id ────────────────────────────────────────────
const markReadParams = z.object({ id: objectIdString });

// ─── DELETE /api/contact/:id ────────────────────────────────────────────────
const deleteParams = z.object({ id: objectIdString });

// ─── POST /api/contact/reply/:id ────────────────────────────────────────────
const replyParams = z.object({ id: objectIdString });
const replyBody = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(20000),
});

module.exports = {
  submitBody,
  markReadParams,
  deleteParams,
  replyParams,
  replyBody,
};
