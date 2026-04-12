require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/AdminModel');
const AdminStaff = require('./models/AdminStaff');

async function createAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travelhomes';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = 'admin@travelhomes.com';
    const password = '123456789';
    const passwordHash = await bcrypt.hash(password, 10);

    // ── 1. Seed Admin (superadmin) model ────────────────────────
    let admin = await Admin.findOne({ email });
    if (admin) {
      admin.password = passwordHash;
      await admin.save();
      console.log('[Admin] Password updated');
    } else {
      admin = await Admin.create({
        uid: 100001,
        email,
        password: passwordHash,
        name: 'Super Admin',
        role: 'superadmin',
        isActive: true,
      });
      console.log('[Admin] Created superadmin');
    }

    // ── 2. Seed AdminStaff model ────────────────────────────────
    let staff = await AdminStaff.findOne({ email });
    if (staff) {
      staff.passwordHash = passwordHash;
      await staff.save();
      console.log('[AdminStaff] Password updated');
    } else {
      staff = await AdminStaff.create({
        name: 'Super Admin',
        firstName: 'Super',
        lastName: 'Admin',
        email,
        passwordHash,
        role: 'Admin',
        status: 'Active',
      });
      console.log('[AdminStaff] Created staff admin');
    }

    console.log('\nAdmin seeded successfully!');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
