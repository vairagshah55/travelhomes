const nodemailer = require('nodemailer');

/**
 * Create a Nodemailer transporter using environment variables.
 * Supports connection by URL, service/auth, or host/port/auth.
 */
function createTransport() {
  const url = process.env.SMTP_URL;
  const service = process.env.SMTP_SERVICE;
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : (process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 587);
  const user = process.env.SMTP_USER || process.env.MAIL_USERNAME;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASSWORD;
  const secureEnv = process.env.SMTP_SECURE || process.env.MAIL_ENCRYPTION; // 'true' or 'false'

  if (url) {
    return nodemailer.createTransport(url);
  }
  if (service && user && pass) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass },
    });
  }
  if (host && port && user && pass) {
    const secure = secureEnv === 'true' || secureEnv === 'ssl' || port === 465;
    const config = {
      host,
      port,
      secure,
      auth: { user, pass },
      // Increased timeouts significantly
      connectionTimeout: 60000, 
      greetingTimeout: 60000,
      socketTimeout: 60000
    };
    if (secureEnv === 'tls' && port === 587) {
      config.requireTLS = true;
    }
    console.log(`[MAILER] Configured with Host: ${host}, Port: ${port}, User: ${user}`);
    return nodemailer.createTransport(config);
  }
  console.warn('[MAILER] No email configuration found. OTP emails will not be sent.');
  return {
    async sendMail({ to, subject, text, html }) {
      console.warn('===========================================================');
      console.warn('[MAILER MOCK] Email Service Not Configured. Email Simulation:');
      console.warn(`[MAILER MOCK] To: ${to}`);
      console.warn(`[MAILER MOCK] Subject: ${subject}`);
      console.warn('[MAILER MOCK] Body Preview:', text || html);
      console.warn('===========================================================');
      return { messageId: `mock-${Date.now()}` };
    },
  };
}

const transporter = createTransport();

/**
 * Send an OTP email for registration/verification
 * @param {string} to - recipient email address
 * @param {string} otp - otp code to include
 */
async function sendOtpEmail(to, otp) {
  const from =
    process.env.SMTP_FROM ||
    process.env.MAIL_FROM_ADDRESS ||
    process.env.SMTP_USER ||
    process.env.MAIL_USERNAME ||
    'no-reply@travel-homes.local';
  const subject = 'Your OTP Code - Travel Homes Registration';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Travel Homes Verification</h2>
        <p style="color: #666; font-size: 16px;">Hello,</p>
        <p style="color: #666; font-size: 16px;">Thank you for registering with Travel Homes. Please use the following one-time password (OTP) to verify your email address:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 2.5em; font-weight: bold; color: #007bff; letter-spacing: 5px; background-color: #f0f0f0; padding: 15px; border-radius: 8px; font-family: monospace;">
            ${otp}
          </div>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          <strong>Important:</strong> This OTP will expire in 5 minutes. Do not share this code with anyone.
        </p>
        
        <p style="color: #999; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          If you did not request this code, please ignore this email or contact our support team immediately.
        </p>
        
        <p style="color: #999; font-size: 12px;">
          Travel Homes Team<br>
          © 2024 Travel Homes. All rights reserved.
        </p>
      </div>
    </div>
  `;
  const text = `Your OTP code is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`;
  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    if (info && 'messageId' in info) {
      console.log(`[MAILER] OTP Email sent successfully to ${to} (messageId: ${info.messageId})`);
    }
    return info;
  } catch (err) {
    console.error('[MAILER] Failed to send OTP email to', to, ':', err.message);
    throw err;
  }
}

async function sendRejectionEmail(to, serviceName, reason) {
  const from =
    process.env.SMTP_FROM ||
    process.env.MAIL_FROM_ADDRESS ||
    process.env.SMTP_USER ||
    process.env.MAIL_USERNAME ||
    'no-reply@travel-homes.local';
  const subject = `Action Required: Your service "${serviceName}" was rejected`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Service Rejection Notice</h2>
        <p style="color: #666; font-size: 16px;">Hello,</p>
        <p style="color: #666; font-size: 16px;">We reviewed your service listing <strong>${serviceName}</strong>.</p>
        <p style="color: #666; font-size: 16px;">Unfortunately, it was rejected for the following reason:</p>
        
        <div style="background-color: #fff3f3; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
          <p style="color: #dc3545; margin: 0; font-weight: 500;">${reason}</p>
        </div>
        
        <p style="color: #666; font-size: 16px;">
          You can edit your service to address these issues and resubmit it for approval.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          Travel Homes Team<br>
          © 2024 Travel Homes. All rights reserved.
        </p>
      </div>
    </div>
  `;
  const text = `Your service "${serviceName}" was rejected. Reason: ${reason}. Please edit and resubmit.`;
  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    if (info && 'messageId' in info) {
      console.log(`[MAILER] Rejection Email sent successfully to ${to} (messageId: ${info.messageId})`);
    }
    return info;
  } catch (err) {
    console.error('[MAILER] Failed to send Rejection email to', to, ':', err.message);
    // Don't throw, just log, so we don't block the controller response if mail fails
    return null;
  }
}

async function sendApprovalEmail(to, serviceName) {
  const from =
    process.env.SMTP_FROM ||
    process.env.MAIL_FROM_ADDRESS ||
    process.env.SMTP_USER ||
    process.env.MAIL_USERNAME ||
    'no-reply@travel-homes.local';
  const subject = `Congratulations: Your service "${serviceName}" is Live!`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Service Approved</h2>
        <p style="color: #666; font-size: 16px;">Hello,</p>
        <p style="color: #666; font-size: 16px;">Great news! Your service listing <strong>${serviceName}</strong> has been approved and is now live on Travel Homes.</p>
        
        <div style="background-color: #e6fffa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
          <p style="color: #28a745; margin: 0; font-weight: 500;">Status: Active</p>
        </div>
        
        <p style="color: #666; font-size: 16px;">
          Users can now view and book your service.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          Travel Homes Team<br>
          © 2024 Travel Homes. All rights reserved.
        </p>
      </div>
    </div>
  `;
  const text = `Your service "${serviceName}" has been approved and is now live.`;
  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    if (info && 'messageId' in info) {
      console.log(`[MAILER] Approval Email sent successfully to ${to} (messageId: ${info.messageId})`);
    }
    return info;
  } catch (err) {
    console.error('[MAILER] Failed to send Approval email to', to, ':', err.message);
    return null;
  }
}

async function sendJobApplicationStatusEmail(to, applicantName, jobTitle, status) {
  const from =
    process.env.SMTP_FROM ||
    process.env.MAIL_FROM_ADDRESS ||
    process.env.SMTP_USER ||
    process.env.MAIL_USERNAME ||
    'no-reply@travel-homes.local';

  let subject = `Update on your application for ${jobTitle}`;
  let messageBody = '';

  switch (status) {
    case 'Rejected':
      subject = `Update on your application for ${jobTitle}`;
      messageBody = `
        <p>Dear ${applicantName},</p>
        <p>Thank you for giving us the opportunity to consider your application for the <strong>${jobTitle}</strong> position.</p>
        <p>We have reviewed your application and, unfortunately, we have decided not to move forward with your candidacy at this time.</p>
        <p>We appreciate your interest in Travel Homes and wish you the best in your job search.</p>
      `;
      break;
    case 'Interview Scheduled':
      subject = `Interview Invitation: ${jobTitle} at Travel Homes`;
      messageBody = `
        <p>Dear ${applicantName},</p>
        <p>We were impressed by your application for the <strong>${jobTitle}</strong> position and would like to invite you for an interview.</p>
        <p>Our team will be in touch shortly to coordinate a suitable time.</p>
        <p>We look forward to speaking with you!</p>
      `;
      break;
    case 'Interviewed':
      subject = `Thank you for interviewing for ${jobTitle}`;
      messageBody = `
        <p>Dear ${applicantName},</p>
        <p>Thank you for taking the time to interview with us for the <strong>${jobTitle}</strong> position.</p>
        <p>It was a pleasure to meet you. We will be completing our interviews soon and will be in touch regarding next steps.</p>
      `;
      break;
    case 'Accepted':
      subject = `Offer of Employment: ${jobTitle} at Travel Homes`;
      messageBody = `
        <p>Dear ${applicantName},</p>
        <p>We are delighted to offer you the position of <strong>${jobTitle}</strong> at Travel Homes!</p>
        <p>We were very impressed with your background and skills, and we believe you will be a great addition to our team.</p>
        <p>We will be sending a formal offer letter shortly with more details.</p>
      `;
      break;
    case 'Under Review':
      subject = `Application Update: ${jobTitle}`;
      messageBody = `
        <p>Dear ${applicantName},</p>
        <p>We are writing to let you know that your application for the <strong>${jobTitle}</strong> position is currently under review by our hiring team.</p>
        <p>We appreciate your patience and will update you as soon as we have more information.</p>
      `;
      break;
    default:
      messageBody = `<p>Dear ${applicantName},</p><p>Your application status for <strong>${jobTitle}</strong> has been updated to: <strong>${status}</strong>.</p>`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Application Status Update</h2>
        ${messageBody}
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          Travel Homes Team<br>
          © 2024 Travel Homes. All rights reserved.
        </p>
      </div>
    </div>
  `;

  const text = `Dear ${applicantName}, your application status for ${jobTitle} has been updated to: ${status}.`;

  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    if (info && 'messageId' in info) {
      console.log(`[MAILER] Job Application Status Email sent successfully to ${to} (messageId: ${info.messageId})`);
    }
    return info;
  } catch (err) {
    console.error('[MAILER] Failed to send Job Application Status email to', to, ':', err.message);
    return null;
  }
}

module.exports = {
  sendOtpEmail,
  sendRejectionEmail,
  sendApprovalEmail,
  sendJobApplicationStatusEmail
};