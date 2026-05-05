const asyncHandler = require("../../shared/asyncHandler");
const service = require("./notifications.service");

const list = asyncHandler(async (req, res) => {
  const { data, totalUnread } = await service.list(req.validated.query, req.user);
  res.json({ success: true, data, totalUnread });
});

const markRead = asyncHandler(async (req, res) => {
  const { data } = await service.markRead(req.validated.params.id, req.user);
  res.json({ success: true, data });
});

const markAllRead = asyncHandler(async (req, res) => {
  const { message } = await service.markAllRead(req.user);
  res.json({ success: true, message });
});

const remove = asyncHandler(async (req, res) => {
  const { message } = await service.remove(req.validated.params.id, req.user);
  res.json({ success: true, message });
});

const bulkDelete = asyncHandler(async (req, res) => {
  const { message } = await service.bulkDelete(req.validated.body.ids, req.user);
  res.json({ success: true, message });
});

module.exports = { list, markRead, markAllRead, remove, bulkDelete };
