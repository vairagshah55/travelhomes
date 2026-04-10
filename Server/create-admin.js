require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AdminStaff = require('./models/AdminStaff');

async function createAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel_admin';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = 'admin@travelapp.com';
    const password = 'admin123';
    
    let admin = await AdminStaff.findOne({ email });
    if (admin) {
      console.log('Admin already exists. Updating password...');
      const passwordHash = await bcrypt.hash(password, 10);
      admin.passwordHash = passwordHash;
      await admin.save();
      console.log('Admin password updated successfully');
    } else {
      console.log('Creating new admin...');
      const passwordHash = await bcrypt.hash(password, 10);
      admin = new AdminStaff({
        name: 'Super Admin',
        email,
        passwordHash,
        role: 'Admin',
        status: 'Active'
      });
      await admin.save();
      console.log('Admin created successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
