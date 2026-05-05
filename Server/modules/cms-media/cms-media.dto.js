const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

const listQuery = z.object({
  page: z.string().trim().max(120).optional(),
  section: z.string().trim().max(120).optional(),
});

// page + section are required for upserting; position defaults to 0.
const uploadBody = z.object({
  page: z.string().trim().min(1).max(120),
  section: z.string().trim().min(1).max(120),
  position: z.coerce.number().int().nonnegative().default(0),
});

const idParams = z.object({ id: objectIdString });

module.exports = { listQuery, uploadBody, idParams };
