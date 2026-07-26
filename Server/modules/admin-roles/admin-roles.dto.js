const { z } = require("zod");

const AdminRole = require("../../models/AdminRole");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

const AVAILABLE_FEATURES = AdminRole.AVAILABLE_FEATURES || [];

// Features are enum-constrained by the AdminRole schema. Mirror that here so a
// bad slug comes back as a clean VALIDATION_ERROR instead of a mongoose
// CastError surfaced from deep inside save().
const featureSlug = z
  .string()
  .trim()
  .max(120)
  .refine((v) => AVAILABLE_FEATURES.includes(v), {
    message: `Unknown feature. Allowed: ${AVAILABLE_FEATURES.join(", ")}`,
  });

// Fine-grained permission rows, matching the PermissionSchema sub-document on
// the model. The admin UI's role matrix posts these as objects, not strings.
const permissionEntry = z.object({
  feature: z.string().trim().min(1).max(120),
  canView: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canCreate: z.boolean().optional(),
});

const isActiveBool = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((v) => v === true || v === "true");

const listQuery = z.object({
  search: z.string().trim().max(200).optional(),
  isActive: isActiveBool.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().trim().max(40).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const idParams = z.object({ id: objectIdString });

const createBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  features: z.array(featureSlug).optional(),
  permissions: z.array(permissionEntry).optional(),
  isActive: z.boolean().optional(),
  createdBy: objectIdString.optional(),
});

const updateBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    features: z.array(featureSlug).optional(),
    permissions: z.array(permissionEntry).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

module.exports = { listQuery, idParams, createBody, updateBody };
