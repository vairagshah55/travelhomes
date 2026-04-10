const MarketingContent = require('../models/MarketingContent');

// List all marketing content (DB)
const listMarketingContent = async (_req, res) => {
  try {
    // Fixed sort syntax: return newest first
    const items = await MarketingContent.find().sort({ createdAt: -1 });
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Create new marketing content (DB)
const createMarketingContent = async (req, res) => {
  try {
    const { images, additionalCount, content } = req.body;

    // Check if we have at least images OR content
    const hasImages = Array.isArray(images) && images.length > 0;
    const hasContent = content && content.trim().length > 0;

    if (!hasImages && !hasContent) {
      return res.status(400).json({ success: false, message: 'Must provide either images or content.' });
    }

    const created = await MarketingContent.create({
      images: Array.isArray(images) ? images : [],
      additionalCount: additionalCount || 0,
      content: content || ''
    });
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Delete marketing content by id (DB)
const deleteMarketingContent = async (req, res) => {
  try {
    const { id } = req.params;

    const found = await MarketingContent.findById(id);
    if (!found) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }
    await found.deleteOne();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Post marketing content to social media (Instagram/Facebook)
const postToSocialMedia = async (req, res) => {
  try {
    const { itemId, platform } = req.body;

    const item = await MarketingContent.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    // In a real implementation, you would use the Facebook/Instagram Graph API here.
    // This requires:
    // 1. A Facebook App
    // 2. User/Page Access Tokens stored in your .env or database
    // 3. Using axios to call the Graph API endpoints

    console.log(`Posting item ${itemId} to ${platform}`);
    console.log(`Content: ${item.content}`);
    console.log(`Images: ${item.images.join(', ')}`);

    // Placeholder for API logic
    /*
    const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;
    if (platform === 'facebook') {
      await axios.post(`https://graph.facebook.com/v19.0/me/feed`, {
        message: item.content,
        link: item.images[0], // Example
        access_token: accessToken
      });
    } else if (platform === 'instagram') {
      // Instagram requires more steps: 
      // 1. Create container (POST /me/media)
      // 2. Publish container (POST /me/media_publish)
    }
    */

    return res.status(200).json({ 
      success: true, 
      message: `Content is being processed for ${platform}. (Placeholder implementation)` 
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  listMarketingContent,
  createMarketingContent,
  deleteMarketingContent,
  postToSocialMedia
};
