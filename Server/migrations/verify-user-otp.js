/**
 * Migration: Mark vairagshah55@gmail.com as OTP-verified
 * Run: node migrations/verify-user-otp.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Register = require('../models/Register');

async function run() {
  await connectDB();

  const email = 'vairagshah55@gmail.com';

  const result = await Register.updateMany(
    { email },
    { $set: { otpVerified: true, otp: '123456' } }
  );

  console.log(`Updated ${result.modifiedCount} record(s) for ${email}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
