const { z } = require("zod");

const subscribeBody = z.object({
  email: z
    .email()
    .trim()
    .max(254)
    .transform((s) => s.toLowerCase()),
});

module.exports = { subscribeBody };
