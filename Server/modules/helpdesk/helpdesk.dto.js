const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");
const ticketStatus = z.enum(["Pending", "Resolved", "Read"]);

// Whitelist of fields a client may set on a ticket. The HelpDesk model is
// permissive — kept this conservative to avoid mass-assignment.
const ticketBody = z.object({
  vendorName: z.string().trim().max(120).optional(),
  vendorEmail: z.email().trim().max(254).optional(),
  companyName: z.string().trim().max(200).optional(),
  email: z.email().trim().max(254).optional(),
  name: z.string().trim().max(120).optional(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().max(5000).optional(),
  status: ticketStatus.optional(),
  category: z.string().trim().max(80).optional(),
  priority: z.string().trim().max(40).optional(),
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
