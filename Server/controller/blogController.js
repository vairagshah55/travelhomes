const Blog = require('../models/Blog');

// Helper to generate a URL-friendly slug from title
function toSlug(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const createBlog = async (req, res) => {
  try {
    const { title, category, description, content, coverImage, authorName, authorImg, authorRole, status } = req.body || {};
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    let slug = req.body.slug ? String(req.body.slug) : toSlug(title);
    // Ensure slug is unique
    let finalSlug = slug;
    let i = 1;
    while (await Blog.findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${i++}`;
    }

    const blog = await Blog.create({
      title,
      slug: finalSlug,
      category,
      description,
      content,
      coverImage,
      authorName,
      authorImg,
      authorRole,
      status: status || 'published'
    });

    res.status(201).json({ success: true, data: blog });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const listBlogs = async (req, res) => {
  try {
    const { status, limit } = req.query;
    const query = {};
    if (status) query.status = status;

    const lim = Math.min(Number(limit) || 0, 50) || undefined;
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(lim || 0);

    res.json({ success: true, data: blogs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: blog });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const removeBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Blog.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, message: 'Blog deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    if (update.title && !update.slug) {
      update.slug = toSlug(update.title);
    }
    if (update.slug) {
      // ensure unique slug (excluding this blog)
      const exists = await Blog.findOne({ slug: update.slug, _id: { $ne: id } });
      if (exists) return res.status(400).json({ success: false, message: 'Slug already exists for another blog' });
    }
    const blog = await Blog.findByIdAndUpdate(id, update, { new: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: blog });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = {
  createBlog,
  listBlogs,
  getBlogBySlug,
  removeBlog,
  updateBlog,
};