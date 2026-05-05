/**
 * CMS service.
 *
 * Catch-all admin/public surface that backs the marketing site's editable
 * content: Jobs, Job Applications, FAQs, Testimonials, Features, Roles,
 * CMS Pages (terms/privacy/vendor-policy), Contact info, Homepage Sections.
 *
 * Roles is the lone in-memory store — that was true in the legacy file too
 * and was clearly meant as a stub. Kept as-is to avoid silently changing
 * behavior; the SPA still wires it up.
 *
 * The "is admin context?" check used to live as
 * `req.baseUrl.includes('/admin')` inside individual handlers. We now
 * surface it as an explicit `isAdminContext` argument from the controller
 * so the policy is visible at the call site.
 */
const Faq = require("../../models/FAQ");
const Job = require("../../models/Job");
const JobApplication = require("../../models/JobApplication");
const Testimonial = require("../../models/Testimonial");
const CMSPage = require("../../models/CMSPage");
const ContactInfo = require("../../models/ContactInfo");
const HomepageSection = require("../../models/HomepageSection");
const Feature = require("../../models/Feature");
const Notification = require("../../models/Notification");
const logger = require("../../shared/logger");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../../shared/errors");
const { sendJobApplicationStatusEmail } = require("../../services/mailer");

// ─── Jobs ───────────────────────────────────────────────────────────────
async function listJobs({ active }) {
  const filter = {};
  if (active === "true") filter.isActive = true;
  return Job.find(filter).sort({ createdAt: -1 }).lean();
}

async function createJob(body) {
  const position = body.position || body.jobTitle;
  const experience = body.experience || body.experienceRequired;
  const location = body.location || body.jobType;
  const jd = body.jd || body.jobDescription;

  return Job.create({
    position,
    experience,
    location,
    jd,
    isActive: body.isActive !== false,
  });
}

async function updateJob(id, body) {
  const update = {};
  if (body.position || body.jobTitle) update.position = body.position || body.jobTitle;
  if (body.experience || body.experienceRequired)
    update.experience = body.experience || body.experienceRequired;
  if (body.location || body.jobType) update.location = body.location || body.jobType;
  if (body.jd || body.jobDescription) update.jd = body.jd || body.jobDescription;
  if (body.isActive !== undefined) update.isActive = body.isActive;

  const updated = await Job.findByIdAndUpdate(id, update, { new: true });
  if (!updated) throw new NotFoundError("Job", id);
  return updated;
}

async function toggleJob(id) {
  const job = await Job.findById(id);
  if (!job) throw new NotFoundError("Job", id);
  job.isActive = !job.isActive;
  await job.save();
  return job;
}

async function removeJob(id) {
  const removed = await Job.findByIdAndDelete(id);
  if (!removed) throw new NotFoundError("Job", id);
}

// ─── Job Applications ───────────────────────────────────────────────────
async function listApplications() {
  return JobApplication.find().sort({ createdAt: -1 }).lean();
}

async function applyToJob(body, file) {
  const cvUrl = file ? `/uploads/${file.filename}` : undefined;
  const created = await JobApplication.create({ ...body, cvUrl });

  try {
    await Notification.create({
      type: "job_application",
      title: "New Job Application",
      message: `New application received from ${body.fullName} for position ${body.jobTitle || "N/A"}.`,
      recipientRole: "admin",
      referenceId: created._id,
      referenceModel: "JobApplication",
    });
  } catch (err) {
    logger.error({ err }, "[CMS] job application notification failed");
  }
  return created;
}

async function setApplicationStatus(id, status) {
  const application = await JobApplication.findByIdAndUpdate(id, { status }, { new: true });
  if (!application) throw new NotFoundError("Application", id);

  // Best-effort — don't block the response on the SMTP roundtrip.
  if (application.email) {
    sendJobApplicationStatusEmail(
      application.email,
      application.fullName,
      application.jobTitle,
      status,
    ).catch((err) => logger.error({ err }, "[CMS] application status email failed"));
  }
  return application;
}

async function removeApplication(id) {
  const removed = await JobApplication.findByIdAndDelete(id);
  if (!removed) throw new NotFoundError("Application", id);
}

// ─── FAQ ────────────────────────────────────────────────────────────────
async function listFaqs() {
  return Faq.find().sort({ createdAt: -1 }).lean();
}

async function createFaq(body) {
  return Faq.create(body);
}

async function removeFaq(id) {
  const removed = await Faq.findByIdAndDelete(id);
  if (!removed) throw new NotFoundError("FAQ", id);
}

// ─── Testimonials ───────────────────────────────────────────────────────
async function listTestimonials({ isAdminContext }) {
  const filter = isAdminContext ? {} : { isActive: true };
  return Testimonial.find(filter).sort({ createdAt: -1 }).lean();
}

async function createTestimonial(body) {
  return Testimonial.create({
    ...body,
    rating: Number(body.rating),
    isActive: body.isActive !== false,
  });
}

async function toggleTestimonial(id) {
  const t = await Testimonial.findById(id);
  if (!t) throw new NotFoundError("Testimonial", id);
  t.isActive = !t.isActive;
  await t.save();
  return t;
}

async function removeTestimonial(id) {
  const removed = await Testimonial.findByIdAndDelete(id);
  if (!removed) throw new NotFoundError("Testimonial", id);
}

// ─── Features ───────────────────────────────────────────────────────────
async function listFeatures({ category, type }) {
  const filter = {};
  if (category) filter.category = category;
  if (type) filter.type = type;
  return Feature.find(filter).sort({ createdAt: -1 });
}

async function createFeature(body) {
  return Feature.create({
    ...body,
    type: body.type || "feature",
    status: "enable",
  });
}

async function toggleFeature(id) {
  const f = await Feature.findById(id);
  if (!f) throw new NotFoundError("Feature", id);
  f.status = f.status === "enable" ? "disable" : "enable";
  await f.save();
  return f;
}

async function removeFeature(id) {
  const removed = await Feature.findByIdAndDelete(id);
  if (!removed) throw new NotFoundError("Feature", id);
}

// ─── Roles (in-memory) ──────────────────────────────────────────────────
let roles = [];
function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function listRoles() {
  return roles;
}

function createRole({ name, features: fts }) {
  const role = { id: makeId(), name, features: fts || [] };
  roles.push(role);
  return role;
}

function removeRole(id) {
  const before = roles.length;
  roles = roles.filter((r) => r.id !== id);
  if (roles.length === before) throw new NotFoundError("Role", id);
}

// ─── CMS Pages ──────────────────────────────────────────────────────────
async function getPage(key) {
  return CMSPage.findOne({ pageKey: key });
}

async function upsertPage(key, body) {
  const updateData = { pageKey: key, isActive: body.isActive !== false };
  if (body.title !== undefined) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content;
  if (body.sections !== undefined) updateData.sections = body.sections;
  return CMSPage.findOneAndUpdate({ pageKey: key }, updateData, { new: true, upsert: true });
}

// ─── Contact (Singleton) ────────────────────────────────────────────────
async function getContact() {
  return ContactInfo.findOne({});
}

async function upsertContact(body, { isAdminContext }) {
  if (!isAdminContext) throw new ForbiddenError("Unauthorized");
  let doc = await ContactInfo.findOne({});
  if (doc) {
    Object.assign(doc, body);
    await doc.save();
  } else {
    doc = await ContactInfo.create(body);
  }
  return doc;
}

// ─── Homepage Sections ──────────────────────────────────────────────────
const HOMEPAGE_DEFAULTS = [
  { sectionKey: "camper-van", label: "Camper Van" },
  { sectionKey: "unique-stays", label: "Unique Stays" },
  { sectionKey: "best-activity", label: "Best Activity" },
  { sectionKey: "trending-destinations", label: "Trending Destinations" },
  { sectionKey: "testimonials", label: "Testimonials" },
  { sectionKey: "top-rated-stays", label: "Top Rated Stays" },
  { sectionKey: "faq", label: "Frequently Asked Questions" },
];

async function listHomepageSections() {
  let sections = await HomepageSection.find({}).sort({ sectionKey: 1 });
  if (sections.length === 0) {
    await HomepageSection.insertMany(HOMEPAGE_DEFAULTS);
    sections = await HomepageSection.find({}).sort({ sectionKey: 1 });
  }
  return sections;
}

async function toggleHomepageSection(key) {
  const section = await HomepageSection.findOne({ sectionKey: key });
  if (!section) throw new NotFoundError("Section", key);
  section.isVisible = !section.isVisible;
  await section.save();
  return section;
}

module.exports = {
  // Jobs
  listJobs,
  createJob,
  updateJob,
  toggleJob,
  removeJob,
  // Applications
  listApplications,
  applyToJob,
  setApplicationStatus,
  removeApplication,
  // FAQ
  listFaqs,
  createFaq,
  removeFaq,
  // Testimonials
  listTestimonials,
  createTestimonial,
  toggleTestimonial,
  removeTestimonial,
  // Features
  listFeatures,
  createFeature,
  toggleFeature,
  removeFeature,
  // Roles
  listRoles,
  createRole,
  removeRole,
  // Pages
  getPage,
  upsertPage,
  // Contact
  getContact,
  upsertContact,
  // Homepage Sections
  listHomepageSections,
  toggleHomepageSection,
  // explicit re-exports
  BadRequestError,
};
