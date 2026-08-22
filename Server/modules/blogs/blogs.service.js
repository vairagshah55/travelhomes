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

async function list({ status, limit }) {
  const query = {};
  if (status) query.status = status;
  let cursor = Blog.find(query).sort({ createdAt: -1 });
  if (limit && limit > 0) cursor = cursor.limit(limit);
  const data = await cursor;
  return { data };
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

module.exports = { list, getBySlug, create, update, remove, toSlug };
