const nodemailer = require("nodemailer");

const logger = require("../../shared/logger");

/**
 * One pooled SMTP transport for the process.
 *
 * Both senders below used to call `nodemailer.createTransport()` on every
 * single message, and `sendEmail` additionally ran `transporter.verify()` each
 * time — so one email cost a fresh TCP connection, a TLS handshake, an AUTH
 * exchange and a throwaway NOOP round-trip before the message even started
 * sending. Hoisting it here reuses the connection, which is what
 * services/mailer.js already does.
 *
 * `pool: true` keeps a small set of connections warm; nodemailer queues sends
 * across them rather than opening one per message.
 */
/*
 * SMTP_* first, MAIL_* second — the same cascade services/mailer.js has always
 * used. This file read ONLY `MAIL_*`, and production sets ONLY `SMTP_*`, so on
 * live the auth block resolved to two empty strings and Gmail answered every
 * send with `530 Authentication Required`.
 *
 * It stayed invisible because nothing here logs its config at startup and the
 * senders below swallow failures: `services/mailer.js` (OTP, approval,
 * rejection) reads the cascade and worked, so mail "obviously worked", while
 * every message routed through THIS transport — guest booking confirmations
 * with the invoice attached, the vendor's "your listing is booked", the admin
 * digest, contact-form and helpdesk mail — was dropped silently.
 */
const SMTP_HOST = process.env.SMTP_HOST || process.env.MAIL_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || process.env.MAIL_USERNAME || "";
const SMTP_PASS = process.env.SMTP_PASS || process.env.MAIL_PASSWORD || "";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  // 465 is implicit TLS; 587 is STARTTLS, which nodemailer upgrades into.
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  pool: true,
  maxConnections: 3,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

// Say so at startup rather than one line per dropped message. Credentials
// missing here means every send below fails, and the callers are all
// best-effort — nobody surfaces it.
if (SMTP_USER && SMTP_PASS) {
  logger.info({ host: SMTP_HOST, port: SMTP_PORT, user: SMTP_USER }, "[email-sender] configured");
} else {
  logger.error(
    { host: SMTP_HOST, port: SMTP_PORT, hasUser: !!SMTP_USER, hasPass: !!SMTP_PASS },
    "[email-sender] NO SMTP CREDENTIALS — booking, contact, helpdesk and compliance email will fail",
  );
}

const sendEmail = (body, res, message) => {
  transporter.sendMail(body, (err, info) => {
    if (err) {
      logger.error({ err: err.message }, "failed to send email");
      res.status(500).send({
        success: false,
        message: "Failed to send email.",
        error: err.message,
      });
    } else {
      res.send({
        success: true,
        message: message || "Email sent successfully.",
        info,
      });
    }
  });
};

const sendEmailSilent = async (body) => {
  try {
    const info = await transporter.sendMail(body);
    logger.info({ messageId: info.messageId }, "email sent");
    return { success: true, info };
  } catch (err) {
    logger.error({ err: err.message }, "failed to send email");
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendEmail,
  sendEmailSilent,
};
