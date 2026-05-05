/**
 * Activities service. Manages Activity rows directly (separate from the
 * unified Offer catalog). Owner = the user whose id matches activity.vendorId.
 *
 * Status flow: vendors submit → status='pending'; admins approve/reject;
 * approval also flips a still-pending Vendor row to 'approved' as a
 * convenience (so the first activity getting approved auto-approves the
 * vendor).
 */
const Activity = require("../../models/Activity");
const Vendor = require("../../models/Vendor");
const Notification = require("../../models/Notification");
const logger = require("../../shared/logger");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../../shared/errors");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAdmin(user) {
  if (!user) return false;
  return user.type === "admin" || user.role === "admin";
}

function vendorIdOf(user) {
  return user && (user.id || user._id || user.vendorId);
}

async function list(q) {
  const filter = { status: "approved" };
  if (q.city) filter.city = q.city;
  if (q.state) filter.state = q.state;

  const or = [];
  if (q.q) {
    or.push(
      { name: { $regex: escapeRegex(q.q), $options: "i" } },
      { description: { $regex: escapeRegex(q.q), $options: "i" } },
    );
  }
  if (q.category) or.push({ name: { $regex: escapeRegex(q.category), $options: "i" } });
  if (or.length) filter.$or = or;

  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    filter.regularPrice = {
      ...(q.minPrice !== undefined ? { $gte: q.minPrice } : {}),
      ...(q.maxPrice !== undefined ? { $lte: q.maxPrice } : {}),
    };
  }

  const skip = (q.page - 1) * q.limit;
  const [data, total] = await Promise.all([
    Activity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit),
    Activity.countDocuments(filter),
  ]);
  return {
    data,
    pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) },
  };
}

async function getById(id) {
  const doc = await Activity.findById(id);
  if (!doc) throw new NotFoundError("Activity", id);
  return doc;
}

async function listMine(user) {
  const vendorId = vendorIdOf(user);
  if (!vendorId) throw new BadRequestError("Vendor ID not found");
  return Activity.find({ vendorId }).sort({ createdAt: -1 });
}

async function create(payload, user) {
  const vendorId = vendorIdOf(user) || payload.vendorId;
  if (!vendorId) throw new BadRequestError("Vendor ID is required");

  const doc = await Activity.create({ ...payload, vendorId });
  try {
    await Notification.create({
      type: "service_approval",
      title: "New Activity for Approval",
      message: `New activity "${doc.title || doc.name}" submitted for approval by vendor ${vendorId}.`,
      recipientRole: "admin",
      referenceId: doc._id,
      referenceModel: "Activity",
    });
  } catch (err) {
    logger.error({ err }, "[Activity] admin notification failed");
  }
  return doc;
}

async function update(id, payload, user) {
  const doc = await Activity.findById(id);
  if (!doc) throw new NotFoundError("Activity", id);
  const vendorId = vendorIdOf(user);
  if (vendorId && String(doc.vendorId) !== String(vendorId)) {
    throw new ForbiddenError("Not authorized to update this activity");
  }
  Object.assign(doc, payload);
  await doc.save();
  return doc;
}

async function setStatus(id, status, user) {
  const doc = await Activity.findById(id);
  if (!doc) throw new NotFoundError("Activity", id);

  const admin = isAdmin(user);
  const vendorId = vendorIdOf(user);
  if (!admin && vendorId && String(doc.vendorId) !== String(vendorId)) {
    throw new ForbiddenError("Not authorized to update this activity status");
  }

  doc.status = status;
  await doc.save();

  // Admin approval auto-promotes a still-pending vendor.
  if (admin && status === "approved") {
    try {
      const vendor = await Vendor.findById(doc.vendorId);
      if (vendor && (vendor.status === "pending" || vendor.status === "kyc-unverified")) {
        vendor.status = "approved";
        await vendor.save();
        logger.info(
          { vendorId: String(doc.vendorId) },
          "[Activity] auto-approved vendor on service approval",
        );
      }
    } catch (err) {
      logger.error({ err }, "[Activity] vendor auto-approval failed");
    }
  }

  if (admin && (status === "approved" || status === "rejected")) {
    try {
      await Notification.create({
        type: status === "approved" ? "service_approval" : "service_rejection",
        title: `Service ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your activity "${doc.title || doc.name}" has been ${status} by admin.`,
        recipientRole: "vendor",
        recipientId: doc.vendorId,
        referenceId: doc._id,
        referenceModel: "Activity",
      });
    } catch (err) {
      logger.error({ err }, "[Activity] status notification failed");
    }
  }

  return doc;
}

async function remove(id, user) {
  const doc = await Activity.findById(id);
  if (!doc) throw new NotFoundError("Activity", id);

  const admin = isAdmin(user);
  const vendorId = vendorIdOf(user);
  if (!admin && vendorId && String(doc.vendorId) !== String(vendorId)) {
    throw new ForbiddenError("Not authorized to delete this activity");
  }
  await Activity.findByIdAndDelete(id);
}

module.exports = { list, getById, listMine, create, update, setStatus, remove };
