const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

// Slugs are URL path segments. Allow lowercase letters, digits, and hyphens.
const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")
  .max(200);

const blogStatus = z.enum(["draft", "published", "archived"]);

const listQuery = z.object({
  status: blogStatus.optional(),
  limit: z.coerce.number().int().nonnegative().max(50).optional(),
});

const createBody = z.object({
  title: z.string().trim().min(1).max(200),
  slug: slug.optional(),
  category: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  content: z.string().trim().max(200_000).optional(),
  coverImage: z.string().trim().max(2000).optional(),
  authorName: z.string().trim().max(120).optional(),
  authorImg: z.string().trim().max(2000).optional(),
  authorRole: z.string().trim().max(80).optional(),
  status: blogStatus.optional(),
});

const idParams = z.object({ id: objectIdString });
const slugParams = z.object({ slug: slug });

const updateBody = createBody
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "At least one field must be provided" });

module.exports = { listQuery, createBody, idParams, slugParams, updateBody };
