const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

const offerStatus = z.enum([
  "pending",
  "approved",
  "cancelled",
  "deactivated",
  "blocked",
  "rejected",
]);

const sortOrder = z.enum(["rating", "price_desc", "price_asc", "latest"]);

const listQuery = z.object({
  status: offerStatus.optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  q: z.string().trim().max(200).optional(),
  vendorId: z.string().trim().max(120).optional(),
  // `mine` is a boolean-ish flag. The SPA passes it as the literal string "true".
  mine: z.union([z.literal("true"), z.literal("false"), z.boolean()]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: sortOrder.optional(),
});

const idParams = z.object({ id: objectIdString });

// Offer is a sprawling content schema — keep .passthrough() so we don't
// drop any legacy fields. The model is the schema-of-record.
const upsertBody = z.object({}).passthrough();

const rateBody = z.object({
  rating: z.coerce.number().min(1).max(5),
});

const updateStatusBody = z.object({
  status: offerStatus,
  reason: z.string().trim().max(2000).optional(),
});

module.exports = {
  listQuery,
  idParams,
  upsertBody,
  rateBody,
  updateStatusBody,
};
