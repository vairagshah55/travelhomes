const asyncHandler = require("../../shared/asyncHandler");
const service = require("./onboarding.service");

const submitActivity = asyncHandler(async (req, res) => {
  const doc = await service.submitActivity(req.validated.body, req.user);
  res.status(201).json({ success: true, id: doc._id, data: doc });
});

const submitCaravan = asyncHandler(async (req, res) => {
  const doc = await service.submitCaravan(req.validated.body, req.user);
  res.status(201).json({ success: true, id: doc._id, data: doc });
});

const submitStay = asyncHandler(async (req, res) => {
  const doc = await service.submitStay(req.validated.body, req.user);
  res.status(201).json({ success: true, id: doc._id, data: doc });
});

const submitVehicle = asyncHandler(async (req, res) => {
  const doc = await service.submitVehicle(req.validated.body, req.user);
  res.status(201).json({ success: true, id: doc._id, data: doc });
});

const attachActivitySelfie = asyncHandler(async (req, res) => {
  const id = await service.attachActivitySelfie(
    req.validated.body.id,
    req.validated.body.imageData,
    req.user,
  );
  res.status(200).json({ success: true, id });
});

const attachCaravanSelfie = asyncHandler(async (req, res) => {
  const id = await service.attachCaravanSelfie(
    req.validated.body.id,
    req.validated.body.imageData,
    req.user,
  );
  res.status(200).json({ success: true, id });
});

const attachStaySelfie = asyncHandler(async (req, res) => {
  const id = await service.attachStaySelfie(
    req.validated.body.id,
    req.validated.body.imageData,
    req.user,
  );
  res.status(200).json({ success: true, id });
});

const attachVehicleSelfie = asyncHandler(async (req, res) => {
  const id = await service.attachVehicleSelfie(
    req.validated.body.id,
    req.validated.body.imageData,
    req.user,
  );
  res.status(200).json({ success: true, id });
});

const getMine = asyncHandler(async (req, res) => {
  const data = await service.getMine(req.user);
  res.json({ success: true, data });
});

const listActivities = asyncHandler(async (_req, res) => {
  const data = await service.listActivities();
  res.json({ success: true, data });
});

const listCaravans = asyncHandler(async (_req, res) => {
  const data = await service.listCaravans();
  res.json({ success: true, data });
});

const listStays = asyncHandler(async (_req, res) => {
  const data = await service.listStays();
  res.json({ success: true, data });
});

const listVehicles = asyncHandler(async (_req, res) => {
  const data = await service.listVehicles();
  res.json({ success: true, data });
});

const getActivity = asyncHandler(async (req, res) => {
  const data = await service.getActivity(req.validated.params.id);
  res.json({ success: true, data });
});

const getCaravan = asyncHandler(async (req, res) => {
  const data = await service.getCaravan(req.validated.params.id);
  res.json({ success: true, data });
});

const getStay = asyncHandler(async (req, res) => {
  const data = await service.getStay(req.validated.params.id);
  res.json({ success: true, data });
});

const getVehicle = asyncHandler(async (req, res) => {
  const data = await service.getVehicle(req.validated.params.id);
  res.json({ success: true, data });
});

const debugStats = asyncHandler(async (_req, res) => {
  const stats = await service.debugStats();
  res.json({ success: true, mockData: false, stats });
});

module.exports = {
  submitActivity,
  submitCaravan,
  submitStay,
  submitVehicle,
  attachActivitySelfie,
  attachCaravanSelfie,
  attachStaySelfie,
  attachVehicleSelfie,
  getMine,
  listActivities,
  listCaravans,
  listStays,
  listVehicles,
  getActivity,
  getCaravan,
  getStay,
  getVehicle,
  debugStats,
};
