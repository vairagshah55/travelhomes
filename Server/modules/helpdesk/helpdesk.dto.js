const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");
const ticketStatus = z.enum(["Pending", "Resolved", "Read"]);

// Whitelist of fields a client may set on a ticket. The HelpDesk model is
// permissive — kept this conservative to avoid mass-assignment.
//
// Field names must match the model: zod strips anything not listed here, so a
// name that only *looks* right is silently dropped. This whitelist used to
// call the body `message` while the model requires `description`, which meant
// every create was stripped down to a doc with no description and rejected by
// mongoose as "Path `description` is required" — the raise-ticket forms could
// never submit. `phoneNumber` was missing for the same reason.
const ticketBody = z.object({
  vendorName: z.string().trim().max(120).optional(),
  vendorEmail: z.email().trim().max(254).optional(),
  companyName: z.string().trim().max(200).optional(),
  email: z.email().trim().max(254).optional(),
  name: z.string().trim().max(120).optional(),
  phoneNumber: z.string().trim().max(40).optional(),
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  status: ticketStatus.optional(),
  category: z.string().trim().max(80).optional(),
  priority: z.string().trim().max(40).optional(),
  // userId/vendorId are deliberately absent: ownership is stamped from the
  // JWT in the service, so a caller cannot file a ticket as someone else.
});

const listQuery = z.object({
  status: z.union([z.literal("all"), ticketStatus]).optional(),
  search: z.string().trim().max(200).optional(),
  sortBy: z.string().trim().max(40).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

const idParams = z.object({ id: objectIdString });

const updateBody = ticketBody
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "At least one field must be provided" });

const updateStatusBody = z.object({ status: ticketStatus });

module.exports = {
  listQuery,
  idParams,
  ticketBody,
  updateBody,
  updateStatusBody,
};
