const asyncHandler = require("../../shared/asyncHandler");
const service = require("./offers.service");

// Resolve a stable visitor id for unique-visitor counting. Authenticated
// requests use the user id; anonymous requests use a hashable IP+UA combo.
function getVisitorId(req) {
  if (req.user && (req.user._id || req.user.id)) return String(req.user._id || req.user.id);
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.ip ||
    (req.connection && req.connection.remoteAddress) ||
    "unknown";
  const ua = String(req.headers["user-agent"] || "").slice(0, 50);
  return `${ip}:${ua}`;
}

const create = asyncHandler(async (req, res) => {
  const offer = await service.create(req.validated.body, req.user);
  res.status(201).json({ success: true, data: offer });
});

const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await service.list(req.validated.query, req.user);
  res.json({ success: true, data, pagination });
});

const getById = asyncHandler(async (req, res) => {
  const visitorId = getVisitorId(req);
  const offer = await service.getById(req.validated.params.id, req.user, visitorId);
  res.json({ success: true, data: offer });
});

const update = asyncHandler(async (req, res) => {
  const offer = await service.update(req.validated.params.id, req.validated.body, req.user);
  res.json({ success: true, data: offer });
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.validated.params.id, req.user);
  res.json({ success: true, message: "Offer deleted successfully" });
});

const rate = asyncHandler(async (req, res) => {
  const offer = await service.rate(req.validated.params.id, req.validated.body.rating);
  res.json({ success: true, data: offer });
});

const setStatus = asyncHandler(async (req, res) => {
  const offer = await service.setStatus(req.validated.params.id, req.validated.body, req.user);
  res.json({ success: true, data: offer });
});

const trackClick = asyncHandler(async (req, res) => {
  await service.trackClick(req.validated.params.id);
  res.json({ success: true });
});

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  rate,
  setStatus,
  trackClick,
};
