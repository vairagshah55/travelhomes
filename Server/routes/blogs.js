const express = require('express');
const {
  createBlog,
  listBlogs,
  getBlogBySlug,
  removeBlog,
  updateBlog,
} = require('../controller/blogController');
const { requireJwt } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', listBlogs); // GET /api/blogs?status=published&limit=4
router.get('/:slug', getBlogBySlug); // GET /api/blogs/:slug

// Admin routes for CMS (protected)
router.post('/', requireJwt({ adminOnly: true }), createBlog); // POST /api/blogs
router.put('/:id', requireJwt({ adminOnly: true }), updateBlog); // PUT /api/blogs/:id
router.delete('/:id', requireJwt({ adminOnly: true }), removeBlog); // DELETE /api/blogs/:id

module.exports = router;