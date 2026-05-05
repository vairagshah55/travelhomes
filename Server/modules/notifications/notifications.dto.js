const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

// ─── GET /api/notifications ─────────────────────────────────────────────────
// `unreadOnly` is a boolean flag the client sends as `'true'|'false'`. We
// coerce explicitly because z.coerce.boolean is too permissive (any non-empty
// string becomes true).
const listQuery = z.object({
  unreadOnly: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((v) => v === true || v === "true"),
  limit: z.coerce.number().int().positive().max(500).default(50),
  recipientRole: z.enum(["admin", "vendor", "user"]).optional(),
});

// ─── PUT /api/notifications/:id/read & DELETE /:id ──────────────────────────
const idParams = z.object({ id: objectIdString });

// ─── POST /api/notifications/bulk-delete ────────────────────────────────────
const bulkDeleteBody = z.object({
  ids: z.array(objectIdString).min(1).max(500),
});

module.exports = { listQuery, idParams, bulkDeleteBody };
