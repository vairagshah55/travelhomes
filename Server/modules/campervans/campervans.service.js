/**
 * Campervans service. Owns CamperVan rows directly.
 *
 * setStatus auto-promotes a still-pending Vendor to 'approved' when the
 * status flips to 'approved' (same convenience the legacy file had).
 */
const CamperVan = require("../../models/CamperVan");
const Vendor = require("../../models/Vendor");
const Notification = require("../../models/Notification");
const logger = require("../../shared/logger");
const { NotFoundError } = require("../../shared/errors");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function list(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.city) filter.city = q.city;
  if (q.state) filter.state = q.state;
  if (q.q) filter.name = { $regex: escapeRegex(q.q), $options: "i" };

  const skip = (q.page - 1) * q.limit;
  const [data, total] = await Promise.all([
    CamperVan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit),
    CamperVan.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.ceil(total / q.limit),
      hasNext: q.page * q.limit < total,
    },
  };
}

async function create(payload) {
  const saved = await new CamperVan(payload).save();
  try {
    await Notification.create({
      type: "service_approval",
      title: "New Campervan for Approval",
      message: `New campervan "${saved.name}" submitted for approval.`,
      recipientRole: "admin",
      referenceId: saved._id,
      referenceModel: "CamperVan",
    });
  } catch (err) {
    logger.error({ err }, "[Campervan] admin notification failed");
  }
  return saved;
}

async function getById(id) {
  const doc = await CamperVan.findById(id);
  if (!doc) throw new NotFoundError("Campervan", id);
  return doc;
}

async function update(id, payload) {
  const doc = await CamperVan.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!doc) throw new NotFoundError("Campervan", id);
  return doc;
}

async function remove(id) {
  const doc = await CamperVan.findByIdAndDelete(id);
  if (!doc) throw new NotFoundError("Campervan", id);
  return doc;
}

async function setStatus(id, status) {
  const doc = await CamperVan.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  if (!doc) throw new NotFoundError("Campervan", id);

  if (status === "approved" && doc.vendorId) {
    try {
      // doc.vendorId is the custom vendor string (e.g. "VD1234"), not _id.
      const vendor = await Vendor.findOne({ vendorId: doc.vendorId });
      if (vendor && (vendor.status === "pending" || vendor.status === "kyc-unverified")) {
        vendor.status = "approved";
        await vendor.save();
        logger.info(
          { vendorId: doc.vendorId },
          "[Campervan] auto-approved vendor on service approval",
        );
      }
    } catch (err) {
      logger.error({ err }, "[Campervan] vendor auto-approval failed");
    }
  }
  return doc;
}

module.exports = { list, create, getById, update, remove, setStatus };
