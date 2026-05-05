const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

const listQuery = z.object({
  status: z.string().trim().max(60).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const idParams = z.object({ id: objectIdString });

const upsertBody = z.object({}).passthrough();

module.exports = { listQuery, idParams, upsertBody };
