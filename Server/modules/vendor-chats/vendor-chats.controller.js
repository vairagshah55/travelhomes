const asyncHandler = require("../../shared/asyncHandler");
const service = require("./vendor-chats.service");

const getChatProfile = asyncHandler(async (req, res) => {
  const data = await service.getChatProfile(req.validated.query);
  res.json({ success: true, data });
});

const createOrGetConversation = asyncHandler(async (req, res) => {
  const data = await service.createOrGetConversation(req.validated.body);
  res.status(201).json({ success: true, data });
});

const sendMessage = asyncHandler(async (req, res) => {
  const data = await service.sendMessage(req.validated.params.conversationId, req.validated.body);
  res.status(201).json({ success: true, data });
});

const getMessages = asyncHandler(async (req, res) => {
  const result = await service.getMessages(
    req.validated.params.conversationId,
    req.validated.query,
  );
  res.json({ success: true, data: result.data, pagination: result.pagination });
});

const listConversations = asyncHandler(async (req, res) => {
  const data = await service.listConversations(req.validated.query);
  res.json({ success: true, data });
});

const markAsRead = asyncHandler(async (req, res) => {
  await service.markAsRead(req.validated.params.conversationId, req.validated.body);
  res.json({ success: true, message: "Marked as read" });
});

const getConversationById = asyncHandler(async (req, res) => {
  const data = await service.getConversationById(req.validated.params.conversationId);
  res.json({ success: true, data });
});

// Multer fills req.files; nothing to validate beyond presence.
const upload = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "No files uploaded" });
  }
  const data = req.files.map((f) => ({
    url: `/uploads/${f.filename}`,
    filename: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
  }));
  res.json({ success: true, data });
});

module.exports = {
  getChatProfile,
  createOrGetConversation,
  sendMessage,
  getMessages,
  listConversations,
  markAsRead,
  getConversationById,
  upload,
};
