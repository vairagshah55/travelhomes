const asyncHandler = require("../../shared/asyncHandler");
const service = require("./contact.service");

const submit = asyncHandler(async (req, res) => {
  const { data } = await service.submit(req.validated.body);
  res.status(201).json({ success: true, data });
});

const list = asyncHandler(async (_req, res) => {
  const { data } = await service.list();
  res.json({ success: true, data });
});

const markRead = asyncHandler(async (req, res) => {
  const { data } = await service.markRead(req.validated.params.id);
  res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
  const { message, data } = await service.remove(req.validated.params.id);
  res.json({ success: true, message, data });
});

const reply = asyncHandler(async (req, res) => {
  const { message } = await service.reply(req.validated.params.id, req.validated.body);
  res.json({ success: true, message });
});

module.exports = { submit, list, markRead, remove, reply };
