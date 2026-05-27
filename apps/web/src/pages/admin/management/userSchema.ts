import { z } from "zod";

export const USER_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "banned", label: "Banned" },
  { value: "unverified-email", label: "Unverified Email" },
  { value: "unverified-mobile", label: "Unverified Mobile" },
  { value: "subscriber", label: "Subscriber" },
];

/**
 * Validation schema for the Add/Edit User form — replaces the manual
 * `required`-attribute checks with type-safe rules surfaced inline via RHF.
 */
export const userSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  location: z.string().trim().min(1, "Location is required"),
  userSince: z.string().trim().optional(),
  status: z.string().min(1, "Select a status"),
});

export type UserFormValues = z.infer<typeof userSchema>;
