const asyncHandler = require("../../shared/asyncHandler");
const service = require("./admin-crm.service");

const send = asyncHandler(async (req, res) => {
  const { data, recipientCount } = await service.send(req.validated.body);
  res.status(201).json({ success: true, data, recipientCount });
});

const list = asyncHandler(async (req, res) => {
  const { data } = await service.list(req.validated.query);
  res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.validated.params.id);
  res.status(204).send();
});

module.exports = { send, list, remove };
