const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

// Status filter alias keys the SPA uses (legacy contract).
const statusAlias = z.enum([
  "all-users",
  "active-users",
  "inactive-users",
  "banned-users",
  "unverified-email",
  "unverified-mobile",
  "subscribers",
]);

const listQuery = z.object({
  status: statusAlias.optional(),
});

const idParams = z.object({ id: objectIdString });

// User is a permissive shape at the model level — kept open via passthrough
// to preserve the legacy `User.create(req.body)` contract. Phase 4 will
// tighten this once the User model itself is normalized.
const createBody = z
  .object({
    email: z.email().trim().max(254).optional(),
    name: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(40).optional(),
    location: z.string().trim().max(200).optional(),
    status: z.string().trim().max(40).optional(),
  })
  .passthrough();

const updateBody = createBody.refine((d) => Object.keys(d).length > 0, {
  message: "At least one field must be provided",
});

module.exports = { listQuery, idParams, createBody, updateBody };
