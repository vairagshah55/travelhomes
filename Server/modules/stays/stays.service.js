/**
 * Stays service. Owns Stay rows directly (separate from Offer).
 *
 * city / state filters are stored under address.city / address.state — that
 * differs from activities and campervans, where they live at the top level.
 */
const Stay = require("../../models/Stay");
const Notification = require("../../models/Notification");
const logger = require("../../shared/logger");
const { NotFoundError } = require("../../shared/errors");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function list(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.city) filter["address.city"] = q.city;
  if (q.state) filter["address.state"] = q.state;
  if (q.q) filter.title = { $regex: escapeRegex(q.q), $options: "i" };

  const skip = (q.page - 1) * q.limit;
  const [data, total] = await Promise.all([
    Stay.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit),
    Stay.countDocuments(filter),
  ]);
  return {
    data,
    pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) },
  };
}

async function create(payload) {
  const doc = await Stay.create(payload);
  try {
    await Notification.create({
      type: "service_approval",
      title: "New Stay for Approval",
      message: `New stay "${doc.title}" submitted for approval.`,
      recipientRole: "admin",
      referenceId: doc._id,
      referenceModel: "Stay",
    });
  } catch (err) {
    logger.error({ err }, "[Stay] admin notification failed");
  }
  return doc;
}

async function getById(id) {
  const doc = await Stay.findById(id);
  if (!doc) throw new NotFoundError("Stay", id);
  return doc;
}

async function update(id, payload) {
  const doc = await Stay.findByIdAndUpdate(id, payload, { new: true });
  if (!doc) throw new NotFoundError("Stay", id);
  return doc;
}

async function remove(id) {
  const doc = await Stay.findById(id);
  if (!doc) throw new NotFoundError("Stay", id);
  await doc.deleteOne();
}

module.exports = { list, create, getById, update, remove };
