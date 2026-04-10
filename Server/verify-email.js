require('dotenv').config();
const nodemailer = require('nodemailer');

async function verifyEmail() {
  console.log('Testing email configuration...');
  console.log('HOST:', process.env.MAIL_HOST);
  console.log('PORT:', process.env.MAIL_PORT);
  console.log('USER:', process.env.MAIL_USERNAME);
  console.log('PASS:', process.env.MAIL_PASSWORD ? '******' : 'MISSING');

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log('Server is ready to take our messages');

    const info = await transporter.sendMail({
      from: 'no-reply@traveldashboard.com', // Try with the problematic sender
      to: 'testing@fovtysolutions.com', // Sending to self for test
      subject: 'Test Email from Verify Script (Invalid Sender)',
      text: 'This is a test email to verify configuration with invalid sender.',
    });

    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

verifyEmail();
