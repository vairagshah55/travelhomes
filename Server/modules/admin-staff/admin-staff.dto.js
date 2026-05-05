const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");
const status = z.enum(["Active", "Inactive"]);

const listQuery = z.object({
  search: z.string().trim().max(200).optional(),
  status: status.optional(),
  role: z.string().trim().max(80).optional(),
  department: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().trim().max(40).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const idParams = z.object({ id: objectIdString });

// Address / emergency contact are loose nested shapes — keep permissive.
const addressShape = z.object({}).passthrough();

const createBody = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z
    .email()
    .trim()
    .max(254)
    .transform((s) => s.toLowerCase()),
  phone: z.string().trim().min(1).max(40),
  role: z.string().trim().min(1).max(80),
  status: status.optional(),
  department: z.string().trim().max(80).optional(),
  salary: z.number().nonnegative().optional(),
  address: addressShape.optional(),
  emergencyContact: addressShape.optional(),
  password: z.string().min(8).max(128).optional(),
  avatar: z.string().trim().max(2000).optional(),
});

const updateBody = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    email: z
      .email()
      .trim()
      .max(254)
      .transform((s) => s.toLowerCase())
      .optional(),
    phone: z.string().trim().min(1).max(40).optional(),
    role: z.string().trim().min(1).max(80).optional(),
    status: status.optional(),
    department: z.string().trim().max(80).optional(),
    salary: z.number().nonnegative().optional(),
    address: addressShape.optional(),
    emergencyContact: addressShape.optional(),
    avatar: z.string().trim().max(2000).optional(),
    password: z.string().min(8).max(128).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

const bulkStatusBody = z.object({
  staffIds: z.array(objectIdString).min(1).max(500),
  status,
});

module.exports = { listQuery, idParams, createBody, updateBody, bulkStatusBody };
