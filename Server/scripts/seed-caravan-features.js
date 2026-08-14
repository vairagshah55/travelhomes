/**
 * Seed / reconcile script — Camper Van features, i.e. the "Amenities" step of
 * caravan onboarding and the Features step of Add/Edit Offering.
 *
 * These live in the Feature collection as `{ category: 'Camper Van', type:
 * 'feature' }` and are managed in admin under CMS → Features → Camper Van →
 * Features. Same contract as scripts/seed-caravan-categories.js:
 *
 * Default behaviour is additive and idempotent — inserts what's missing, leaves
 * every existing row untouched, so an icon an admin uploaded or a name they
 * reworded survives a re-run.
 *
 * Flags:
 *   --disable-others   status = 'disable' on Camper Van features NOT in the
 *                      list below (legacy taxonomy, test rows). They vanish
 *                      from the vendor-facing step but stay in the admin table,
 *                      so it's one toggle click to undo. Nothing is deleted.
 *   --dry-run          Print the plan, write nothing.
 *
 * `sortOrder` is always written (position in the list below) — it's positional
 * metadata with no admin UI, and it's what the vendor-facing grid sorts by, so
 * a row that already existed can't float to the front on account of an older
 * createdAt.
 *
 * Note the vendor-facing step keeps an amenity that a *listing* already has
 * selected visible even when it isn't in this list, so disabling a row never
 * silently drops it from existing listings.
 *
 * "Other (can add manually)" is not seeded — that's the step's built-in
 * "Others" button, which lets a vendor type an amenity of their own.
 *
 * Run: node scripts/seed-caravan-features.js [flags]
 *      npm run seed:caravan-features -- --disable-others
 */

const path = require('path');

// Same env cascade the server uses (see Server/config/env.js): `.env.<NODE_ENV>`
// wins, plain `.env` fills the gaps. Loading only `.env` would point this script
// at a localhost Mongo while the running API talks to the Atlas cluster.
const NODE_ENV = process.env.NODE_ENV || 'development';
for (const file of [`.env.${NODE_ENV}`, '.env']) {
  require('dotenv').config({ path: path.join(__dirname, '..', file) });
}

const mongoose = require('mongoose');
const Feature = require('../models/Feature');

const CATEGORY = 'Camper Van';

// Order matters: the vendor-facing step sorts by createdAt ascending and rows
// are inserted in this order, so the grid reads in these groups — climate,
// seating, sleeping, kitchen, bathroom, entertainment, power, safety, outdoor,
// accessibility.
const FEATURES = [
  'Air Conditioning',
  'Heating',
  'Sofa / Lounge Seating',
  'Recliner Seats',
  'Storage Cabinets',
  'Double Bed',
  'Single Beds',
  'Bunk Beds',
  'Sofa Cum Bed',
  'Pillows',
  'Blankets',
  'Induction Stove / Gas Stove',
  'Microwave',
  'Refrigerator',
  'Basic Kitchen Utensils',
  'Bathroom',
  'Toilet',
  'Hot Water / Geyser',
  'Wash Basin',
  'Mirror',
  'Toiletries',
  'TV',
  'Wi-Fi',
  'Speaker',
  'Charging Points',
  'Generator',
  'Power Backup',
  'Exterior Lights',
  'Drinking Water Facility',
  'Fire Extinguisher',
  'First Aid Kit',
  'CCTV',
  'GPS Tracking',
  'Awning',
  'Outdoor Kitchen',
  'BBQ',
  'Rooftop Terrace',
  'Camping Chairs',
  'Camping Table',
  'Wheelchair Accessible',
];

const flags = new Set(process.argv.slice(2));
const disableOthers = flags.has('--disable-others');
const dryRun = flags.has('--dry-run');

function maskUri(uri) {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)[^@]*@/, '$1***:***@');
}

async function main() {
  const uri =
    process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/travelhomes';
  console.log(`NODE_ENV=${NODE_ENV}`);
  console.log(`Connecting to ${maskUri(uri)} ...`);
  if (dryRun) console.log('DRY RUN — no writes.\n');
  await mongoose.connect(uri);

  let inserted = 0;
  let reEnabled = 0;
  let kept = 0;
  let reordered = 0;

  for (const [index, name] of FEATURES.entries()) {
    // Legacy rows can lack `type`, so match on name + category and then make
    // sure the type is right — otherwise a typeless duplicate gets created.
    const existing = await Feature.findOne({
      name,
      category: CATEGORY,
      type: { $in: ['feature', null] },
    });

    if (!existing) {
      console.log(`  + insert     ${name}`);
      if (!dryRun) {
        await Feature.create({
          name,
          category: CATEGORY,
          type: 'feature',
          status: 'enable',
          description: '',
          icon: '', // admins upload one in CMS → Features → Features
          sortOrder: index,
        });
      }
      inserted += 1;
      continue;
    }

    const update = {};
    if (existing.status !== 'enable') update.status = 'enable';
    if (existing.type !== 'feature') update.type = 'feature';
    if (existing.sortOrder !== index) {
      update.sortOrder = index;
      reordered += 1;
    }

    if (Object.keys(update).length) {
      console.log(`  ~ update     ${name} (${Object.keys(update).join(', ')})`);
      if (!dryRun) await Feature.updateOne({ _id: existing._id }, { $set: update });
      if (update.status || update.type) reEnabled += 1;
    } else {
      console.log(`  = keep       ${name}`);
      kept += 1;
    }
  }

  let disabled = 0;
  if (disableOthers) {
    const others = await Feature.find({
      category: CATEGORY,
      type: { $nin: ['category', 'subcategory'] },
      name: { $nin: FEATURES },
      status: 'enable',
    });
    for (const row of others) {
      console.log(`  - disable    ${row.name} (kept in admin, hidden from vendors)`);
      if (!dryRun) await Feature.updateOne({ _id: row._id }, { $set: { status: 'disable' } });
      disabled += 1;
    }
  }

  console.log(
    `\nInserted ${inserted}, updated ${reEnabled}, kept ${kept}, disabled ${disabled}, ` +
      `reordered ${reordered}.` +
      (dryRun ? ' (dry run — nothing written)' : ''),
  );

  const shown = await Feature.countDocuments({
    category: CATEGORY,
    type: { $nin: ['category', 'subcategory'] },
    status: 'enable',
  });
  console.log(`Camper Van amenities now shown to vendors: ${shown}`);

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
