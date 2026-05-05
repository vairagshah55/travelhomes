const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

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
  features: z.array(z.string().trim().max(120)).optional(),
  permissions: z.array(z.string().trim().max(120)).optional(),
  isActive: z.boolean().optional(),
  createdBy: objectIdString.optional(),
});

const updateBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    features: z.array(z.string().trim().max(120)).optional(),
    permissions: z.array(z.string().trim().max(120)).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

module.exports = { listQuery, idParams, createBody, updateBody };
