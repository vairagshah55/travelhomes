const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

// Slugs are URL path segments. Allow lowercase letters, digits, and hyphens.
const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")
  .max(200);

const blogStatus = z.enum(["draft", "published", "archived"]);

/**
 * Public list query.
 *
 * `status` + `limit` are the original pair and behave exactly as before: no
 * `page` means no paging, and omitting `limit` returns everything (the admin
 * table depends on that — it needs drafts and the full set).
 *
 * `page` / `search` / `category` were added because /blogs used to fetch up to
 * 50 posts and filter them in the browser: past 50 published articles the rest
 * were unreachable on the site despite being live.
 */
const listQuery = z.object({
  status: blogStatus.optional(),
  // Raised from 50 — a page size is chosen by the caller now, and the admin
  // table pulls the whole archive in one go.
  limit: z.coerce.number().int().nonnegative().max(100).optional(),
  page: z.coerce.number().int().positive().max(10_000).optional(),
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
});

/** Facet counts are per-status, so the pills can read "Road trips (4)". */
const categoriesQuery = z.object({ status: blogStatus.optional() });

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
  metaTitle: z.string().trim().max(200).optional(),
  metaKeywords: z.string().trim().max(500).optional(),
  metaDescription: z.string().trim().max(2000).optional(),
});

const idParams = z.object({ id: objectIdString });
const slugParams = z.object({ slug: slug });

const updateBody = createBody
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "At least one field must be provided" });

module.exports = { listQuery, categoriesQuery, createBody, idParams, slugParams, updateBody };
