/**
 * Seed / reconcile script — Camper Van categories (the "Vehicle Type" step of
 * caravan onboarding, and the Category step of Add/Edit Offering).
 *
 * These live in the Feature collection as `{ category: 'Camper Van', type:
 * 'category' }` and are managed in admin under CMS → Features → Camper Van →
 * Categories. This script exists so a fresh database (or one still carrying the
 * pre-CMS vehicle taxonomy) can be brought to the canonical list in one step.
 *
 * Default behaviour is additive and idempotent: it inserts the types that are
 * missing via $setOnInsert and leaves every existing row exactly as-is, so a
 * description an admin has reworded or an icon they uploaded survives a re-run.
 *
 * Flags, for reconciling a database that predates the canonical list:
 *   --disable-others     status = 'disable' on Camper Van categories NOT in
 *                        VEHICLE_TYPES. They disappear from the vendor-facing
 *                        step but stay in the admin table, so this is undone
 *                        with one toggle click. Nothing is ever deleted.
 *   --set-descriptions   Overwrite the descriptions of the canonical rows with
 *                        the copy below. Icons are never touched.
 *   --dry-run            Print the plan, write nothing.
 *
 * Unlike seed-features.js this touches nothing outside `category: 'Camper Van'`.
 *
 * Run: node scripts/seed-caravan-categories.js [flags]
 *      npm run seed:caravan-categories -- --disable-others --set-descriptions
 */

const path = require('path');

// Same env cascade the server uses (see Server/config/env.js): `.env.<NODE_ENV>`
// wins, plain `.env` fills the gaps. Loading only `.env` would point this script
// at a localhost Mongo while the running API talks to the Atlas cluster — i.e.
// it would "succeed" against a database nothing reads.
const NODE_ENV = process.env.NODE_ENV || 'development';
for (const file of [`.env.${NODE_ENV}`, '.env']) {
  require('dotenv').config({ path: path.join(__dirname, '..', file) });
}

const mongoose = require('mongoose');
const Feature = require('../models/Feature');

const CATEGORY = 'Camper Van';

// Order matters: each row's index becomes its `sortOrder`, which is what the
// vendor-facing step sorts by.
const VEHICLE_TYPES = [
  {
    name: 'Motorhome',
    description:
      'A large vehicle with everything you need to travel, sleep, cook, and relax inside.',
  },
  {
    name: 'Campervan / Caravan',
    description:
      'A compact travel vehicle with basic facilities for sleeping, sitting, and enjoying road trips.',
  },
  {
    name: 'Travel Trailer',
    description:
      'A caravan without an engine that is attached to another vehicle and towed during travel.',
  },
  {
    name: 'Off Road Caravan',
    description:
      'A strong and durable caravan designed for travelling on rough roads and adventurous destinations.',
  },
  {
    name: 'Mini Caravan',
    description:
      'A small and easy-to-handle caravan, perfect for couples or small families and short trips.',
  },
];

const flags = new Set(process.argv.slice(2));
const disableOthers = flags.has('--disable-others');
const setDescriptions = flags.has('--set-descriptions');
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

  const targetNames = VEHICLE_TYPES.map((t) => t.name);
  let inserted = 0;
  let described = 0;

  for (const [index, type] of VEHICLE_TYPES.entries()) {
    const filter = { name: type.name, category: CATEGORY, type: 'category' };
    const existing = await Feature.findOne(filter);

    if (!existing) {
      console.log(`  + insert  ${type.name}`);
      if (!dryRun) {
        await Feature.create({
          ...filter,
          status: 'enable',
          description: type.description,
          icon: '', // admins upload one in CMS → Features → Categories
          sortOrder: index,
        });
      }
      inserted += 1;
      continue;
    }

    const notes = [];
    const update = {};
    if (existing.status !== 'enable') {
      update.status = 'enable';
      notes.push('re-enabled');
    }
    // Positional metadata with no admin UI — always kept in step with the list.
    if (existing.sortOrder !== index) {
      update.sortOrder = index;
      notes.push('order set');
    }
    if (setDescriptions && existing.description !== type.description) {
      update.description = type.description;
      notes.push('description set');
      described += 1;
    }

    if (Object.keys(update).length) {
      console.log(`  ~ update  ${type.name} (${notes.join(', ')})`);
      if (!dryRun) await Feature.updateOne({ _id: existing._id }, { $set: update });
    } else {
      console.log(`  = keep    ${type.name}`);
    }
  }

  let disabled = 0;
  if (disableOthers) {
    const others = await Feature.find({
      category: CATEGORY,
      type: 'category',
      name: { $nin: targetNames },
      status: 'enable',
    });
    for (const row of others) {
      console.log(`  - disable ${row.name} (kept in admin, hidden from vendors)`);
      if (!dryRun) await Feature.updateOne({ _id: row._id }, { $set: { status: 'disable' } });
      disabled += 1;
    }
  }

  console.log(
    `\nInserted ${inserted}, descriptions set ${described}, disabled ${disabled}.` +
      (dryRun ? ' (dry run — nothing written)' : ''),
  );

  const final = await Feature.find({ category: CATEGORY, type: 'category' }).sort({ createdAt: 1 });
  console.log('\nCamper Van categories now:');
  for (const f of final) {
    const shown = f.status === 'enable' ? 'shown' : 'hidden';
    console.log(`  [${shown}] ${f.name}${f.icon ? '' : '  (no icon)'}`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
