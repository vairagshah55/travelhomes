/**
 * Blogs service.
 *
 * Slug uniqueness is handled at create + update time. On create we suffix
 * with `-1`, `-2`, ... until we find a free one (matches legacy behavior).
 * On update we reject the patch if the new slug collides with another blog.
 */
const Blog = require("../../models/Blog");
const { NotFoundError, ConflictError } = require("../../shared/errors");

function toSlug(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniquify(baseSlug) {
  let candidate = baseSlug;
  let i = 1;
  while (await Blog.findOne({ slug: candidate })) {
    candidate = `${baseSlug}-${i++}`;
  }
  return candidate;
}

/** Page size used when a caller asks for a `page` without naming a `limit`. */
const DEFAULT_PAGE_SIZE = 12;

/**
 * Neutralise regex metacharacters in caller-supplied text.
 *
 * `search` and `category` go into a `RegExp`. Unescaped, a visitor typing `(`
 * throws on the server, and `(a+)+$` is a ReDoS against it.
 */
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * List blogs, newest first.
 *
 * Back-compatible by design: with no `page`, this behaves exactly as it always
 * did — `limit` truncates, and omitting it returns everything (which the admin
 * table relies on). `pagination` is additive; callers that only read `data` are
 * unaffected.
 *
 * `search` matches title, description, category and author, because that's the
 * set the /blogs search box used to filter on client-side.
 */
async function list({ status, limit, page, search, category }) {
  const query = {};
  if (status) query.status = status;

  // Anchored and case-insensitive: the facet pills send back the exact stored
  // label, and category casing is inconsistent across existing posts.
  if (category) query.category = new RegExp(`^${escapeRegex(category)}$`, "i");

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    query.$or = [{ title: rx }, { description: rx }, { category: rx }, { authorName: rx }];
  }

  const pageSize = page ? limit || DEFAULT_PAGE_SIZE : limit;
  const skip = page ? (page - 1) * pageSize : 0;

  let cursor = Blog.find(query).sort({ createdAt: -1 });
  if (skip > 0) cursor = cursor.skip(skip);
  if (pageSize && pageSize > 0) cursor = cursor.limit(pageSize);

  const [data, total] = await Promise.all([cursor, Blog.countDocuments(query)]);

  return {
    data,
    pagination: {
      page: page || 1,
      limit: pageSize || total,
      total,
      totalPages: pageSize && pageSize > 0 ? Math.ceil(total / pageSize) : 1,
      hasMore: skip + data.length < total,
    },
  };
}

/**
 * Distinct categories with post counts, for the /blogs filter pills.
 *
 * Needed once listing went server-paged: counts derived from the current page
 * would have claimed a category held 3 posts when the archive held 30. Blank
 * categories are dropped — the client labels those "Journal".
 */
async function listCategories({ status }) {
  const match = status ? { status } : {};
  /* `total` counts every matching post, uncategorised ones included, so the
     client's "All" pill and its "12 of 87" line don't need a second request
     that would drag down full article bodies just to read a count. */
  const [rows, total] = await Promise.all([
    Blog.aggregate([
      { $match: match },
      { $group: { _id: { $trim: { input: { $ifNull: ["$category", ""] } } }, count: { $sum: 1 } } },
      { $match: { _id: { $ne: "" } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    Blog.countDocuments(match),
  ]);
  return { data: rows.map((r) => ({ name: r._id, count: r.count })), total };
}

async function getBySlug(slug) {
  const data = await Blog.findOne({ slug });
  if (!data) throw new NotFoundError("Blog");
  return { data };
}

async function create(input) {
  const baseSlug = input.slug ? input.slug : toSlug(input.title);
  const finalSlug = await uniquify(baseSlug);

  const data = await Blog.create({
    ...input,
    slug: finalSlug,
    status: input.status || "published",
  });
  return { data };
}

async function update(id, patch) {
  const update = { ...patch };
  if (update.title && !update.slug) {
    update.slug = toSlug(update.title);
  }
  if (update.slug) {
    const exists = await Blog.findOne({ slug: update.slug, _id: { $ne: id } });
    if (exists) throw new ConflictError("Slug already exists for another blog");
  }
  const data = await Blog.findByIdAndUpdate(id, update, { new: true });
  if (!data) throw new NotFoundError("Blog", id);
  return { data };
}

async function remove(id) {
  const deleted = await Blog.findByIdAndDelete(id);
  if (!deleted) throw new NotFoundError("Blog", id);
  return { message: "Blog deleted" };
}

module.exports = { list, listCategories, getBySlug, create, update, remove, toSlug };
