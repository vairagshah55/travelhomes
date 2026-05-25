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

// 72 is bcrypt's effective byte limit — longer inputs get silently truncated.
const changePasswordBody = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(128),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(72),
});

module.exports = { loginBody, changePasswordBody };
