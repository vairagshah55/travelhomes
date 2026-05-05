/**
 * Helpdesk service.
 *
 * Status transitions to Read or Resolved trigger an email notification to
 * the vendor (best-effort, never fails the request).
 */
const HelpDesk = require("../../models/HelpDesk");
const Notification = require("../../models/Notification");
const env = require("../../config/env");
const logger = require("../../shared/logger");
const { sendEmailSilent } = require("../../lib/email-sender/sender");
const { sendTicketStatusUpdate } = require("../../lib/email-sender/templates/ticket-status-update");
const { NotFoundError } = require("../../shared/errors");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function list({ status, search, sortBy, sortDir }) {
  const query = {};
  if (status && status !== "all") query.status = status;
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    query.$or = [{ vendorName: re }, { companyName: re }, { subject: re }];
  }
  const sort = sortBy ? { [sortBy]: sortDir === "asc" ? 1 : -1 } : { createdAt: -1 };
  const items = await HelpDesk.find(query).sort(sort);
  return { data: items };
}

async function getById(id) {
  const item = await HelpDesk.findById(id);
  if (!item) throw new NotFoundError("Helpdesk ticket", id);
  return { data: item };
}

async function create(input) {
  const item = await HelpDesk.create(input);
  // Best-effort admin notification.
  Notification.create({
    type: "helpdesk_ticket",
    title: "New Helpdesk Ticket",
    message: `New ticket created: ${item.subject}`,
    recipientRole: "admin",
    referenceId: item._id,
    referenceModel: "HelpDesk",
  }).catch((err) => logger.error({ err: err.message }, "helpdesk: notification create failed"));
  return { data: item };
}

async function update(id, patch) {
  const item = await HelpDesk.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!item) throw new NotFoundError("Helpdesk ticket", id);
  return { data: item };
}

async function remove(id) {
  const item = await HelpDesk.findById(id);
  if (!item) throw new NotFoundError("Helpdesk ticket", id);
  await item.deleteOne();
  return { message: "Deleted" };
}

async function setStatus(id, status) {
  const item = await HelpDesk.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  if (!item) throw new NotFoundError("Helpdesk ticket", id);

  // Email the vendor when a ticket is read/resolved. Best-effort; failures
  // do not roll back the status change.
  if (status === "Read" || status === "Resolved") {
    const targetEmail = item.vendorEmail || item.email;
    const targetName = item.vendorName || item.name || "Vendor";
    if (targetEmail) {
      const html = sendTicketStatusUpdate({
        name: targetName,
        status,
        ticketId: item._id,
        subject: item.subject,
      });
      sendEmailSilent({
        from: env.MAIL_FROM_ADDRESS || env.MAIL_USERNAME,
        to: targetEmail,
        subject: `[Ticket Update] Your ticket status is now ${status}`,
        html,
      }).catch((err) =>
        logger.error({ err: err.message, to: targetEmail }, "helpdesk: status email failed"),
      );
    }
  }

  return { data: item };
}

module.exports = { list, getById, create, update, remove, setStatus };
