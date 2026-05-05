/**
 * Admin CRM service.
 *
 * "Send" persists a CrmMessage row with the recipient count. The actual
 * email/SMS/WhatsApp dispatch is a placeholder in the legacy controller —
 * preserved here as a count-only operation until the real provider
 * integrations ship.
 */
const CrmMessage = require("../../models/CrmMessage");
const Vendor = require("../../models/Vendor");
const User = require("../../models/User");
const AdminStaff = require("../../models/AdminStaff");
const { NotFoundError } = require("../../shared/errors");

// Per the legacy controller, serviceType maps to specific keyword groups in
// the Vendor.servicesOffered field. Kept verbatim.
const VENDOR_SERVICE_REGEX = {
  Caravan: [/^Caravan/i, /^Campervan/i, /^Transport/i],
  Stay: [/^Stay/i, /^Accommodation/i, /^Hotel/i],
  Activity: [/^Activity/i, /^Experience/i],
};

async function send({ targetType, channels, serviceType = "", message }) {
  let recipients = [];
  const query = {};

  if (targetType === "Vendor") {
    if (serviceType && VENDOR_SERVICE_REGEX[serviceType]) {
      query.servicesOffered = { $in: VENDOR_SERVICE_REGEX[serviceType] };
    }
    recipients = await Vendor.find(query).select("email phone brandName personName");
  } else if (targetType === "User") {
    if (serviceType) {
      query.bookedServices = { $regex: serviceType, $options: "i" };
    }
    recipients = await User.find(query).select("email phone name");
  } else {
    // Staff
    if (serviceType) {
      query.department = { $regex: serviceType, $options: "i" };
    }
    recipients = await AdminStaff.find(query).select("email phone name");
  }

  const saved = await CrmMessage.create({
    targetType,
    channels,
    serviceType,
    message,
    status: "sent",
    recipientCount: recipients.length,
  });
  return { data: saved, recipientCount: recipients.length };
}

async function list({ targetType, channels }) {
  const filter = {};
  if (targetType) filter.targetType = targetType;
  if (channels) filter.channels = { $in: [channels] };
  const data = await CrmMessage.find(filter).sort({ createdAt: -1 }).limit(200);
  return { data };
}

async function remove(id) {
  const deleted = await CrmMessage.findByIdAndDelete(id);
  if (!deleted) throw new NotFoundError("CRM message", id);
  return {};
}

module.exports = { send, list, remove };
