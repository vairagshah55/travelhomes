const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createOrGetConversation, sendMessage, getMessages, listConversations, markAsRead, getChatProfile, getConversationById } = require('../controller/vendorChatsController');
const router = express.Router();

// Configure Uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `chat-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Upload Endpoint
router.post('/upload', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const files = req.files.map(f => ({
      url: `/uploads/${f.filename}`,
      filename: f.originalname,
      mimetype: f.mimetype,
      size: f.size
    }));
    res.json({ success: true, data: files });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get chat profile ID based on auth email
router.get('/profile', getChatProfile);

// Create or get a direct conversation between a vendor and a user
router.post('/conversations', createOrGetConversation);
// List conversations for a participant (vendor or user)
// GET /api/vendorchats/conversations?participantKind=Vendor|User&participantId=
router.get('/conversations', listConversations);
// Get single conversation
router.get('/conversations/:conversationId', getConversationById);
// Get messages of a conversation (paginated)
router.get('/conversations/:conversationId/messages', getMessages);
// Send a message in a conversation
router.post('/conversations/:conversationId/messages', sendMessage);
// Mark as read for a participant
router.post('/conversations/:conversationId/mark-read', markAsRead);
module.exports = router;