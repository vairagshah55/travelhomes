const express = require('express');
const { listMarketingContent, createMarketingContent, deleteMarketingContent, postToSocialMedia } = require('../controller/marketingController');
const router = express.Router();

// GET /api/admin/marketing/content
router.get('/content', listMarketingContent);
// POST /api/admin/marketing/content
router.post('/content', createMarketingContent);
// DELETE /api/admin/marketing/content/:id
router.delete('/content/:id', deleteMarketingContent);
// POST /api/admin/marketing/post
router.post('/post', postToSocialMedia);

module.exports = router;