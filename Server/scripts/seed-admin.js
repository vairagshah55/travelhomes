/**
 * Seed a SuperAdmin AdminStaff account.
 *
 * Run:  node scripts/seed-admin.js
 *       node scripts/seed-admin.js <email> <password>
 *
 * If the email already exists, the password is reset (not duplicated).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AdminStaff = require('../models/AdminStaff');
const AdminRole = require('../models/AdminRole');

const BCRYPT_ROUNDS = 10;

async function main() {
  const email = (process.argv[2] || 'admin@travelhomes.com').toLowerCase();
  const password = process.argv[3] || 'Admin@123';
  const roleName = 'SuperAdmin';

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI / MONGODB_URI not set in .env');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const roleDoc = await AdminRole.findOne({ name: roleName });
  if (!roleDoc) {
    console.log(`Note: AdminRole "${roleName}" not found — staff will be created without roleId.`);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const existing = await AdminStaff.findOne({ email });
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.status = 'Active';
    existing.role = roleName;
    if (roleDoc) existing.roleId = roleDoc._id;
    await existing.save();
    console.log(`Updated existing admin: ${email}`);
  } else {
    await AdminStaff.create({
      firstName: 'Super',
      lastName: 'Admin',
      name: 'Super Admin',
      email,
      passwordHash,
      role: roleName,
      roleId: roleDoc?._id,
      status: 'Active',
      joinDate: new Date(),
    });
    console.log(`Created new admin: ${email}`);
  }

  console.log('---');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log('---');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
