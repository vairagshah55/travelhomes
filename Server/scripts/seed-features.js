/**
 * Seed script — CMS Feature records (categories & features for filters)
 *
 * Populates the Feature collection with category and feature entries
 * for Unique Stay, Camper Van, and Activity.
 *
 * Run: node scripts/seed-features.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Feature = require('../models/Feature');

const FEATURES = [
  // ─── Unique Stay — categories ────────────────────────────
  { name: 'Treehouse',          category: 'Unique Stay', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769594945262-zqszh5.svg' },
  { name: 'Glamping Tent',      category: 'Unique Stay', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769594969128-nljqfj.svg' },
  { name: 'Houseboat',          category: 'Unique Stay', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769594995598-rq3o25.svg' },
  { name: 'Cabin / Log House',  category: 'Unique Stay', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769595007843-xb2kvk.svg' },
  { name: 'Cave House',         category: 'Unique Stay', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769595032732-icx47w.svg' },
  { name: 'Farm Stay',          category: 'Unique Stay', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1769595041350-7e4ho8.svg' },
  { name: 'Campervan',          category: 'Unique Stay', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1772084067502-7utof9.svg' },
  { name: 'Yurt',               category: 'Unique Stay', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1772084144292-od2r9l.svg' },
  { name: 'Dome',               category: 'Unique Stay', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1772084163025-nj86v4.svg' },
  { name: 'Igloo',              category: 'Unique Stay', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1772084210338-xz6mrc.svg' },
  { name: 'Cottage',            category: 'Unique Stay', type: 'category', status: 'enable', description: '', icon: '/uploads/cms-1772084243350-8sldut.svg' },

  // ─── Unique Stay — features ──────────────────────────────
  { name: 'Popular Stays',      category: 'Unique Stay', type: 'feature', status: 'enable', description: '', icon: '/uploads/cms-1769595504711-3u3j73.svg' },
  { name: 'Standard Stay',      category: 'Unique Stay', type: 'feature', status: 'enable', description: '', icon: '/uploads/cms-1769595513926-9bgkmy.png' },
  { name: 'Unique Stay',        category: 'Unique Stay', type: 'feature', status: 'enable', description: '', icon: '/uploads/cms-1769595532826-dw46oi.png' },
  { name: 'Nature Stay',        category: 'Unique Stay', type: 'feature', status: 'enable', description: '', icon: '/uploads/cms-1769595541001-wb1rtd.png' },
];

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/travelhomes';
  console.log(`Connecting to ${uri} ...`);
  await mongoose.connect(uri);

  // Remove existing features that match our seed data names
  const names = FEATURES.map(f => f.name);
  const deleted = await Feature.deleteMany({ name: { $in: names } });
  console.log(`Removed ${deleted.deletedCount} existing feature(s)`);

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
