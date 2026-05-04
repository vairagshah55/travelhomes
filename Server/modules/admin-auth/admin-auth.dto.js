/**
 * Zod schemas for the admin-auth module.
 *
 * Both AdminStaff login and the legacy superadmin Admin login share the
 * same shape (email + password), so they share one DTO.
 */
const { z } = require("zod");

const loginBody = z.object({
  email: z
    .email()
    .trim()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(1, "Password is required").max(128),
});

module.exports = { loginBody };
