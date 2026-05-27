import { z } from "zod";

/**
 * Validation schema for the Add Vendor form. Replaces the page's manual
 * `if (!field) setError(...)` checks with declarative, type-safe rules used by
 * react-hook-form via zodResolver.
 */
export const vendorSchema = z.object({
  brandName: z.string().trim().min(1, "Brand name is required"),
  personName: z.string().trim().min(1, "Person name is required"),
  location: z.string().trim().min(1, "Location is required"),
  vendorId: z.string().trim().optional(),
  photo: z.string().trim().optional(),
  listedServices: z.coerce.number().min(0, "Must be 0 or more").default(0),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;
