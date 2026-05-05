/**
 * Contact service — public submit + admin-side moderation.
 */
const nodemailer = require("nodemailer");

const ContactMessage = require("../../models/ContactMessage");
const env = require("../../config/env");
const logger = require("../../shared/logger");
const { NotFoundError, AppError, BadRequestError } = require("../../shared/errors");

// Build a nodemailer transporter from env. Returns null when SMTP isn't
// configured — callers should treat that as "feature disabled".
function getTransporter() {
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT ?? 465;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const secure = env.SMTP_SECURE !== false;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

async function submit(input) {
  const doc = await ContactMessage.create({ ...input, status: "unread" });
  return { data: doc };
}

async function list() {
  const items = await ContactMessage.find().sort({ createdAt: -1 }).lean();
  const data = items.map((m) => ({
    id: m._id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    phone: m.phone,
    message: m.message,
    status: m.status,
    createdAt: m.createdAt,
  }));
  return { data };
}

async function markRead(id) {
  const updated = await ContactMessage.findByIdAndUpdate(id, { status: "read" }, { new: true });
  if (!updated) throw new NotFoundError("Contact message", id);
  return { data: updated };
}

async function remove(id) {
  const deleted = await ContactMessage.findByIdAndDelete(id);
  if (!deleted) throw new NotFoundError("Contact message", id);
  return { message: "Deleted", data: deleted };
}

async function reply(id, { subject, body }) {
  const msg = await ContactMessage.findById(id);
  if (!msg) throw new NotFoundError("Contact message", id);
  if (!msg.email) throw new BadRequestError("No recipient email");

  const transporter = getTransporter();
  if (!transporter) {
    throw new AppError("SMTP_NOT_CONFIGURED", 503, "Mail transport unavailable");
  }

  const from = env.SMTP_FROM || env.SMTP_USER;
  try {
    await transporter.sendMail({ from, to: msg.email, subject, text: body });
  } catch (err) {
    logger.error({ err: err.message, to: msg.email }, "contact reply send failed");
    throw new AppError("SMTP_SEND_FAILED", 502, "Failed to send reply email");
  }

  return { message: "Reply sent" };
}

module.exports = { submit, list, markRead, remove, reply };
