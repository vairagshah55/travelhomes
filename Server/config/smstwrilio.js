const twilio = require('twilio');
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;

let smsStatus = {
  send: false,
  message: 'Otp not sent!',
};

const twiliosms = async (to, message) => {
  try {
    if (!accountSid || !authToken || !accountSid.startsWith('AC')) {
      console.log('Twilio credentials not configured, simulating SMS send');
      smsStatus.send = true;
      smsStatus.message = 'Otp sent successfully (simulated)!';
      return;
    }

    const client = twilio(accountSid, authToken);
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
      to: to
    });

    smsStatus.send = true;
    smsStatus.message = 'Otp sent successfully!';
    console.log('SMS sent successfully:', result.sid); 
  } catch (err) {
    smsStatus.send = false;
    smsStatus.message = `Otp not sent: ${err.message}`;
    console.error('SMS Error:', err);
  }
};

module.exports = {
  twiliosms,
  smsStatus,
};