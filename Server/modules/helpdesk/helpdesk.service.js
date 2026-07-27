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

function isAdmin(user) {
  if (!user) return false;
  return (
    user.userType === "admin" ||
    user.type === "admin" ||
    user.type === "superadmin" ||
    user.role === "admin"
  );
}

function userIdOf(user) {
  return user?.id || user?._id || user?.sub;
}

/**
 * Tickets belonging to one caller.
 *
 * Matched three ways because ownership was recorded inconsistently over time:
 * `userId` is only stamped on tickets raised after this was added, so older
 * rows are reachable solely through the email they were filed under.
 */
function ownerFilter(user) {
  const or = [];
  const id = userIdOf(user);
  if (id) or.push({ userId: id });
  if (user?.email) or.push({ vendorEmail: user.email }, { email: user.email });
  // No identifying field at all — match nothing rather than everything.
  return or.length ? { $or: or } : { _id: null };
}

async function list({ status, search, sortBy, sortDir }, user) {
  const filters = [];
  if (status && status !== "all") filters.push({ status });
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    filters.push({ $or: [{ vendorName: re }, { companyName: re }, { subject: re }] });
  }
  // Anyone who isn't an admin sees only their own tickets. Combined with $and
  // so a search can't widen the owner scope.
  if (!isAdmin(user)) filters.push(ownerFilter(user));

  const query = filters.length ? { $and: filters } : {};
  const sort = sortBy ? { [sortBy]: sortDir === "asc" ? 1 : -1 } : { createdAt: -1 };
  const items = await HelpDesk.find(query).sort(sort);
  return { data: items };
}

async function getById(id, user) {
  const item = await HelpDesk.findById(id);
  if (!item) throw new NotFoundError("Helpdesk ticket", id);
  if (!isAdmin(user)) {
    const owned = await HelpDesk.exists({ $and: [{ _id: id }, ownerFilter(user)] });
    // 404 rather than 403 — don't confirm the id exists to a non-owner.
    if (!owned) throw new NotFoundError("Helpdesk ticket", id);
  }
  return { data: item };
}

async function create(input, user) {
  // Ownership comes from the token, never the request body — otherwise a
  // caller could file a ticket against someone else's account.
  const payload = { ...input, userId: userIdOf(user) };
  if (!payload.email && user?.email) payload.email = user.email;

  const item = await HelpDesk.create(payload);
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
