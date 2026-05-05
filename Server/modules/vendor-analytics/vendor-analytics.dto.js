const { z } = require("zod");

const graphsQuery = z.object({
  period: z.enum(["daily", "monthly", "yearly"]).default("monthly"),
});

module.exports = { graphsQuery };
