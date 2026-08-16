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
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 587,
  secure: false,
  pool: true,
  maxConnections: 3,
  auth: {
    user: process.env.MAIL_USERNAME || "",
    pass: process.env.MAIL_PASSWORD || "",
  },
});

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
