const asyncHandler = require("../../shared/asyncHandler");
const service = require("./cms.service");

// "Admin context" was determined in the legacy code by sniffing the
// mounted base path. Routers will set req.isAdminContext explicitly on
// the admin-mounted instance — fall back to checking baseUrl so the same
// router still works on /api/cms.
function isAdminContext(req) {
  return req.isAdminContext === true || (req.baseUrl || "").includes("/admin");
}

// ─── Jobs ───────────────────────────────────────────────────────────────
const listJobs = asyncHandler(async (req, res) => {
  const data = await service.listJobs(req.validated.query);
  res.json({ success: true, data });
});

const createJob = asyncHandler(async (req, res) => {
  const data = await service.createJob(req.validated.body);
  res.status(201).json({ success: true, data });
});

const updateJob = asyncHandler(async (req, res) => {
  const data = await service.updateJob(req.validated.params.id, req.validated.body);
  res.json({ success: true, data });
});

const toggleJob = asyncHandler(async (req, res) => {
  const data = await service.toggleJob(req.validated.params.id);
  res.json({ success: true, data });
});

const removeJob = asyncHandler(async (req, res) => {
  await service.removeJob(req.validated.params.id);
  res.status(204).send();
});

// ─── Applications ───────────────────────────────────────────────────────
const listApplications = asyncHandler(async (_req, res) => {
  const data = await service.listApplications();
  res.json({ success: true, data });
});

// File upload — multer fills req.file before validate() runs against
// req.body. The DTO covers the form fields; the file is passed through.
const applyToJob = asyncHandler(async (req, res) => {
  const data = await service.applyToJob(req.validated.body, req.file);
  res.status(201).json({ success: true, data });
});

const setApplicationStatus = asyncHandler(async (req, res) => {
  const data = await service.setApplicationStatus(
    req.validated.params.id,
    req.validated.body.status,
  );
  res.json({ success: true, data });
});

const removeApplication = asyncHandler(async (req, res) => {
  await service.removeApplication(req.validated.params.id);
  res.status(204).send();
});

// ─── FAQ ────────────────────────────────────────────────────────────────
const listFaqs = asyncHandler(async (_req, res) => {
  const data = await service.listFaqs();
  res.json({ success: true, data });
});

const createFaq = asyncHandler(async (req, res) => {
  const data = await service.createFaq(req.validated.body);
  res.status(201).json({ success: true, data });
});

const removeFaq = asyncHandler(async (req, res) => {
  await service.removeFaq(req.validated.params.id);
  res.status(204).send();
});

// ─── Testimonials ───────────────────────────────────────────────────────
const listTestimonials = asyncHandler(async (req, res) => {
  const data = await service.listTestimonials({ isAdminContext: isAdminContext(req) });
  res.json({ success: true, data });
});

const createTestimonial = asyncHandler(async (req, res) => {
  const data = await service.createTestimonial(req.validated.body);
  res.status(201).json({ success: true, data });
});

const toggleTestimonial = asyncHandler(async (req, res) => {
  const data = await service.toggleTestimonial(req.validated.params.id);
  res.json({ success: true, data });
});

const removeTestimonial = asyncHandler(async (req, res) => {
  await service.removeTestimonial(req.validated.params.id);
  res.status(204).send();
});

// ─── Features ───────────────────────────────────────────────────────────
const listFeatures = asyncHandler(async (req, res) => {
  const data = await service.listFeatures(req.validated.query);
  res.json({ success: true, data });
});

const createFeature = asyncHandler(async (req, res) => {
  const data = await service.createFeature(req.validated.body);
  res.status(201).json({ success: true, data });
});

const toggleFeature = asyncHandler(async (req, res) => {
  const data = await service.toggleFeature(req.validated.params.id);
  res.json({ success: true, data });
});

const removeFeature = asyncHandler(async (req, res) => {
  await service.removeFeature(req.validated.params.id);
  res.status(204).send();
});

// ─── Roles ──────────────────────────────────────────────────────────────
const listRoles = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: service.listRoles() });
});

const createRole = asyncHandler(async (req, res) => {
  const data = service.createRole(req.validated.body);
  res.status(201).json({ success: true, data });
});

const removeRole = asyncHandler(async (req, res) => {
  service.removeRole(req.validated.params.id);
  res.status(204).send();
});

// ─── Pages ──────────────────────────────────────────────────────────────
const getPage = asyncHandler(async (req, res) => {
  const data = await service.getPage(req.validated.params.key);
  res.json({ success: true, data: data || null });
});

const upsertPage = asyncHandler(async (req, res) => {
  const data = await service.upsertPage(req.validated.params.key, req.validated.body);
  res.json({ success: true, data });
});

// ─── Contact ────────────────────────────────────────────────────────────
const getContact = asyncHandler(async (_req, res) => {
  const data = await service.getContact();
  res.json({ success: true, data });
});

const upsertContact = asyncHandler(async (req, res) => {
  const data = await service.upsertContact(req.validated.body, {
    isAdminContext: isAdminContext(req),
  });
  res.json({ success: true, data });
});

// ─── Homepage Sections ──────────────────────────────────────────────────
const listHomepageSections = asyncHandler(async (_req, res) => {
  const data = await service.listHomepageSections();
  res.json({ success: true, data });
});

const toggleHomepageSection = asyncHandler(async (req, res) => {
  const data = await service.toggleHomepageSection(req.validated.params.key);
  res.json({ success: true, data });
});

module.exports = {
  listJobs,
  createJob,
  updateJob,
  toggleJob,
  removeJob,
  listApplications,
  applyToJob,
  setApplicationStatus,
  removeApplication,
  listFaqs,
  createFaq,
  removeFaq,
  listTestimonials,
  createTestimonial,
  toggleTestimonial,
  removeTestimonial,
  listFeatures,
  createFeature,
  toggleFeature,
  removeFeature,
  listRoles,
  createRole,
  removeRole,
  getPage,
  upsertPage,
  getContact,
  upsertContact,
  listHomepageSections,
  toggleHomepageSection,
};
