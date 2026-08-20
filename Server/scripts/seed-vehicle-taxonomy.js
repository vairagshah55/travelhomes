/**
 * Seed / reconcile script — Vehicle Rental categories and amenities.
 *
 * These are what the vehicle onboarding wizard reads in steps 1 and 2
 * (VehicleClassStep's category cards, SpecsFeaturesStep's amenity grid), and
 * what Add/Edit Offering reads for the same fields. They live in the Feature
 * collection as `{ category: 'Vehicle Rental', type: 'category' | 'feature' }`
 * and are managed in admin under CMS → Features → Vehicle Rental.
 *
 * Without this the wizard's category step falls back to the caravan list, which
 * offers a vendor listing a sedan the choice between "Motorhome" and "Travel
 * Trailer" — so a fresh database needs one run of this before the feature is
 * usable.
 *
 * Categories carry a `vehicleClass` hint in their description rather than a
 * separate field: the Feature model is shared across all four services and
 * adding a vehicle-only column to it would be paid for by every other one. The
 * wizard shows every enabled category regardless of the class picked, which is
 * the forgiving behaviour — the classes overlap in the real world (a large MPV
 * is sold as both a car and a van).
 *
 * Default behaviour is additive and idempotent — inserts what's missing, leaves
 * every existing row untouched, so an icon an admin uploaded or a name they
 * reworded survives a re-run. Same contract as seed-caravan-categories.js.
 *
 * Flags:
 *   --disable-others     status = 'disable' on Vehicle Rental rows NOT in the
 *                        lists below. They vanish from the vendor-facing steps
 *                        but stay in the admin table, so it's one toggle click
 *                        to undo. Nothing is ever deleted.
 *   --set-descriptions   Overwrite the canonical rows' descriptions with the
 *                        copy below. Icons are never touched.
 *   --dry-run            Print the plan, write nothing.
 *
 * Run: node scripts/seed-vehicle-taxonomy.js [flags]
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

const CATEGORY = 'Vehicle Rental';

// Order matters: each row's index becomes its `sortOrder`, which is what the
// vendor-facing steps sort by. Grouped car → van → bus.
const CATEGORIES = [
  { name: 'Hatchback', description: 'Compact city car, comfortable for up to 4 people.' },
  { name: 'Sedan', description: 'Saloon car with a separate boot — 4 passengers and luggage.' },
  { name: 'SUV', description: 'Higher ground clearance, suited to hills and rough roads.' },
  { name: 'MUV / MPV', description: 'Seven-seat people carrier for families and small groups.' },
  { name: 'Luxury Car', description: 'Premium sedan or SUV for weddings, events and corporate travel.' },
  { name: 'Electric Car', description: 'Battery-electric vehicle — quiet, and cheaper per kilometre.' },
  { name: 'Tempo Traveller', description: 'Nine to seventeen seats, the standard group-travel van.' },
  { name: 'Cargo Van', description: 'Van configured for goods rather than passengers.' },
  { name: 'Mini Bus', description: 'Eighteen to twenty-six seats for large groups and tours.' },
  { name: 'Coach Bus', description: 'Full-size coach for long-distance group travel.' },
];

// The amenity grid in step 2. Fuel type, transmission and air conditioning are
// deliberately absent — those are structured fields on the offer because the
// search page filters on them, so listing them here too would let a vendor set
// the same fact in two places that could then disagree.
const FEATURES = [
  { name: 'Air Conditioning', description: 'Working AC for all passengers.' },
  { name: 'Music System', description: 'In-car audio.' },
  { name: 'Bluetooth', description: 'Pair a phone for calls and audio.' },
  { name: 'USB Charging', description: 'Charging ports for passengers.' },
  { name: 'GPS Navigation', description: 'Built-in navigation.' },
  { name: 'Reverse Camera', description: 'Rear camera for parking.' },
  { name: 'Parking Sensors', description: 'Proximity sensors front and/or rear.' },
  { name: 'Airbags', description: 'Driver and passenger airbags.' },
  { name: 'First Aid Kit', description: 'Kit on board.' },
  { name: 'Fire Extinguisher', description: 'Extinguisher on board.' },
  { name: 'Spare Tyre', description: 'Spare wheel and tools.' },
  { name: 'Roof Carrier', description: 'Roof rack for extra luggage.' },
  { name: 'Child Seat', description: 'Child safety seat available.' },
  { name: 'Wheelchair Accessible', description: 'Ramp or lift for wheelchair access.' },
  { name: 'Push Back Seats', description: 'Reclining seats — worth noting on longer trips.' },
  { name: 'Curtains', description: 'Window curtains or blinds.' },
  { name: 'Reading Lights', description: 'Individual passenger lights.' },
  { name: 'Charging Sockets', description: '12V or AC sockets on board.' },
];

const flags = new Set(process.argv.slice(2));
const disableOthers = flags.has('--disable-others');
const setDescriptions = flags.has('--set-descriptions');
const dryRun = flags.has('--dry-run');

function maskUri(uri) {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)[^@]*@/, '$1***:***@');
}

/**
 * Reconcile one list (categories or features) against the collection.
 * Returns the counts so the caller can print a single summary.
 */
async function reconcile(rows, type) {
  const targetNames = rows.map((r) => r.name);
  let inserted = 0;
  let described = 0;

  console.log(`\n${type === 'category' ? 'Categories' : 'Amenities'}:`);

  for (const [index, row] of rows.entries()) {
    const filter = { name: row.name, category: CATEGORY, type };
    const existing = await Feature.findOne(filter);

    if (!existing) {
      console.log(`  + insert  ${row.name}`);
      if (!dryRun) {
        await Feature.create({
          ...filter,
          status: 'enable',
          description: row.description,
          icon: '', // admins upload one in CMS → Features → Vehicle Rental
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
    if (setDescriptions && existing.description !== row.description) {
      update.description = row.description;
      notes.push('description set');
      described += 1;
    }

    if (Object.keys(update).length) {
      console.log(`  ~ update  ${row.name} (${notes.join(', ')})`);
      if (!dryRun) await Feature.updateOne({ _id: existing._id }, { $set: update });
    } else {
      console.log(`  = keep    ${row.name}`);
    }
  }

  let disabled = 0;
  if (disableOthers) {
    const others = await Feature.find({
      category: CATEGORY,
      type,
      name: { $nin: targetNames },
      status: 'enable',
    });
    for (const other of others) {
      console.log(`  - disable ${other.name} (kept in admin, hidden from vendors)`);
      if (!dryRun) await Feature.updateOne({ _id: other._id }, { $set: { status: 'disable' } });
      disabled += 1;
    }
  }

  return { inserted, described, disabled };
}

async function main() {
  const uri =
    process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/travelhomes';
  console.log(`NODE_ENV=${NODE_ENV}`);
  console.log(`Connecting to ${maskUri(uri)} ...`);
  if (dryRun) console.log('DRY RUN — no writes.');
  await mongoose.connect(uri);

  const cats = await reconcile(CATEGORIES, 'category');
  const feats = await reconcile(FEATURES, 'feature');

  console.log(
    `\nInserted ${cats.inserted + feats.inserted}, ` +
      `descriptions set ${cats.described + feats.described}, ` +
      `disabled ${cats.disabled + feats.disabled}.` +
      (dryRun ? ' (dry run — nothing written)' : ''),
  );

  const final = await Feature.find({ category: CATEGORY }).sort({ type: 1, sortOrder: 1 });
  console.log('\nVehicle Rental taxonomy now:');
  for (const f of final) {
    const shown = f.status === 'enable' ? 'shown' : 'hidden';
    console.log(`  [${shown}] ${f.type.padEnd(8)} ${f.name}${f.icon ? '' : '  (no icon)'}`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
