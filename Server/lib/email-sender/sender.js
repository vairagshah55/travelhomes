const nodemailer = require("nodemailer");

const sendEmail = (body, res, message) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME || '',
      pass: process.env.MAIL_PASSWORD || '',
    },
  });

  transporter.verify(function (err, success) {
    if (err) {
      console.error("Email server verification failed:", err.message);
    } else {
      console.log("Email server is ready to take our messages");
    }
  });

  transporter.sendMail(body, (err, info) => {
    if (err) {
      console.error("Error sending email:", err);
      res.status(500).send({
        success: false,
        message: "Failed to send email.",
        error: err.message,
      });
    } else {
      res.send({
        success: true,
        message: "Email sent successfully.",
        info
      });
    }
  });
};
const sendEmailSilent = async (body) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME || '',
      pass: process.env.MAIL_PASSWORD || '',
    },
  });

  try {
    const info = await transporter.sendMail(body);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, info };
  } catch (err) {
    console.error("Error sending email:", err);
    return { success: false, error: err.message };
  }
};

//limit email verification and forget password
module.exports = {
  sendEmail,
  sendEmailSilent
};
