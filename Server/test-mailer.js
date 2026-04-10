require('dotenv').config();
const nodemailer = require('nodemailer');

async function testMailerConfig() {
  console.log('Testing MAILER configuration...');
  
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : (process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 587);
  const user = process.env.SMTP_USER || process.env.MAIL_USERNAME;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASSWORD;
  const secureEnv = process.env.SMTP_SECURE || process.env.MAIL_ENCRYPTION; 

  console.log(`Host: ${host}, Port: ${port}, User: ${user}, SecureEnv: ${secureEnv}`);

  const secure = secureEnv === 'true' || secureEnv === 'ssl' || port === 465;
  const config = {
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 60000, 
    greetingTimeout: 60000,
    socketTimeout: 60000
  };
  
  if (secureEnv === 'tls' && port === 587) {
    config.requireTLS = true;
    console.log('Setting requireTLS = true');
  }

  const transporter = nodemailer.createTransport(config);

  try {
    await transporter.verify();
    console.log('Server is ready (Verification Success)');

    const info = await transporter.sendMail({
      from: user,
      to: 'testing@fovtysolutions.com',
      subject: 'Test Email from Mailer Config',
      text: 'Testing with requireTLS setting.',
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

testMailerConfig();
