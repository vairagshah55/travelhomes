const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

const statusEnum = z.enum(["draft", "published", "archived", "approved", "pending", "rejected"]);

const listQuery = z.object({
  q: z.string().trim().max(200).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const idParams = z.object({ id: objectIdString });

// Activity has a sprawling content shape (rules / features / expectations
// / time fields) and the SPA evolves it freely. Stay permissive.
const upsertBody = z.object({}).passthrough();

const updateStatusBody = z.object({ status: statusEnum });

module.exports = {
  listQuery,
  idParams,
  upsertBody,
  updateStatusBody,
};
