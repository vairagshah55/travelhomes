/**
 * Seed script — CMS Feature records (categories & features for Activity)
 *
 * Populates the Feature collection with category and feature entries
 * for Activity.
 *
 * Run: node scripts/seed-activity-features.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Feature = require('../models/Feature');

const FEATURES = [
  // ─── Activity — categories ───────────────────────────────
  { name: 'Trekking / Hiking',    category: 'Activity', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769595875851-jgkl7s.svg' },
  { name: 'Cycling',              category: 'Activity', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769595891992-xh13sf.svg' },
  { name: 'Bonfire',              category: 'Activity', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769595903396-iuom87.svg' },
  { name: 'Fishing',              category: 'Activity', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769595912487-mjdts2.svg' },
  { name: 'Water Activities',     category: 'Activity', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769595919754-hdec1a.svg' },
  { name: 'Yoga & Meditation',    category: 'Activity', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769595929304-wmpajb.svg' },
  { name: 'Art & Craft',          category: 'Activity', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769595936388-q6t6rk.svg' },
  { name: 'Cooking Experience',   category: 'Activity', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769595944233-0ww1qq.svg' },
  { name: 'Photography',          category: 'Activity', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769595950860-p2yk3c.svg' },

  // ─── Activity — features ─────────────────────────────────
  { name: 'Expert Guide',         category: 'Activity', type: 'feature', status: 'enable', description: '', icon: '/uploads/cms-1769596061744-uuc9i4.svg' },
  { name: 'equipments',           category: 'Activity', type: 'feature', status: 'enable', description: '', icon: '/uploads/cms-1773639069723-ekw1fv.jpg' },
];

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/travelhomes';
  console.log(`Connecting to ${uri} ...`);
  await mongoose.connect(uri);

  // Remove existing Activity features that match our seed data names
  const names = FEATURES.map(f => f.name);
  const deleted = await Feature.deleteMany({ category: 'Activity', name: { $in: names } });
  console.log(`Removed ${deleted.deletedCount} existing Activity feature(s)`);

  // Insert fresh
  const docs = await Feature.insertMany(FEATURES);
  console.log(`Inserted ${docs.length} feature(s):`);
  docs.forEach(d => console.log(`  [${d.type}] ${d.category} — ${d.name}`));

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
