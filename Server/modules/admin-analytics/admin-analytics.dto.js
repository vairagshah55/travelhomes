const { z } = require("zod");

// `sortBy` doubles as a category filter via the legacy "sort by dropdown".
// We accept anything stringy and let the service interpret it.
const reportQuery = z.object({
  tab: z.enum(["user", "vendor", "payment", "offerings", "bookings"]).optional(),
  search: z.string().trim().max(200).optional(),
  sortBy: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
  filters: z.string().trim().max(2000).optional(),
});

module.exports = { reportQuery };
