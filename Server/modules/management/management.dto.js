const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

const statusEnum = z.enum([
  "approved",
  "pending",
  "modified",
  "deactivated",
  "blocked",
  "cancelled",
  "rejected",
]);

const listQuery = z.object({
  status: statusEnum.optional(),
});

const idParams = z.object({ id: objectIdString });

// Management is an open key/value schema (the legacy controller does
// `Management.create(req.body)` and `findByIdAndUpdate(req.params.id, req.body)`
// with no whitelist). Keep .passthrough() so we don't drop fields, but require
// at least an empty object so we still parse instead of accepting `undefined`.
const upsertBody = z.object({}).passthrough();

const updateStatusBody = z
  .object({
    status: statusEnum,
    rejectionReason: z.string().trim().min(1).max(2000).optional(),
  })
  .refine((d) => d.status !== "rejected" || (d.rejectionReason && d.rejectionReason.length > 0), {
    message: "Rejection reason is required when rejecting a service",
    path: ["rejectionReason"],
  });

module.exports = {
  listQuery,
  idParams,
  upsertBody,
  updateStatusBody,
};
