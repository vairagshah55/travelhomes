const { z } = require("zod");

const isoDate = z.union([z.iso.datetime(), z.iso.date()]);

// The legacy contract uses opaque string ids on tripId/userId — accept any
// non-empty short string.
const idLike = z.string().trim().min(1).max(60);

const createBody = z.object({
  tripId: idLike,
  userId: idLike,
  destination: z.string().trim().min(1).max(200),
  startDate: isoDate,
  endDate: isoDate,
  status: z.string().trim().min(1).max(40),
});

module.exports = { createBody };
