/**
 * Repair script — onboarding submissions stranded in "pending".
 *
 * A submission has two halves: the onboarding doc (which gates the vendor from
 * starting another service type) and the Offer (which is what the admin review
 * queue at /admin/management/listing lists). When a vendor resubmitted, the old
 * code cancelled the superseded Offer but left its onboarding doc "pending",
 * so the pair disagreed:
 *
 *   - admin saw nothing to approve or reject (no pending Offer)
 *   - the vendor was refused every other service type ("You already have a
 *     caravan listing pending review…") with no way to clear it
 *
 * onboarding.service.js now retires both halves together
 * (supersedePreviousSubmissions), so no new strandings occur. This script fixes
 * the ones already in the database: a pending onboarding doc whose linked Offer
 * is missing or no longer pending gets status "cancelled" — the status the
 * current code would have given it. Nothing is deleted, and a mistake is undone
 * by setting the doc back to "pending".
 *
 * Docs whose Offer IS pending are left alone: those are live review items.
 *
 * Dry run by default. Pass --apply to write.
 *
 * Run: node scripts/fix-stranded-onboarding.js [--apply]
 */

const path = require('path');

// Same env cascade as the server (Server/config/env.js).
const NODE_ENV = process.env.NODE_ENV || 'development';
for (const file of [`.env.${NODE_ENV}`, '.env']) {
  require('dotenv').config({ path: path.join(__dirname, '..', file) });
}

const mongoose = require('mongoose');
const ActivityOnboarding = require('../models/ActivityOnboarding');
const CaravanOnboarding = require('../models/CaravanOnboarding');
const StayOnboarding = require('../models/StayOnboarding');
const Offer = require('../models/Offer');

const MODELS = [
  ['activity', ActivityOnboarding],
  ['caravan', CaravanOnboarding],
  ['stay', StayOnboarding],
];

const apply = process.argv.slice(2).includes('--apply');

function maskUri(uri) {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)[^@]*@/, '$1***:***@');
}

async function main() {
  const uri =
    process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/travelhomes';
  console.log(`NODE_ENV=${NODE_ENV}`);
  console.log(`Connecting to ${maskUri(uri)} ...`);
  console.log(apply ? 'APPLY — writing changes.\n' : 'DRY RUN — pass --apply to write.\n');
  await mongoose.connect(uri);

  let stranded = 0;
  let live = 0;

  for (const [label, Model] of MODELS) {
    const pendingDocs = await Model.find({ status: 'pending' });
    for (const doc of pendingDocs) {
      // The offer created for this exact submission. sourceId is stored as a
      // string by syncOffer, so compare as one.
      const offers = await Offer.find({ sourceId: String(doc._id) }, 'status').lean();
      const hasLiveOffer = offers.some((o) => o.status === 'pending');

      if (hasLiveOffer) {
        live += 1;
        console.log(`  = keep     ${label} ${doc._id} — offer still pending (admin can act on it)`);
        continue;
      }

      const why = offers.length
        ? `offer status ${offers.map((o) => o.status).join(',')}`
        : 'no offer row';
      console.log(`  ~ cancel   ${label} ${doc._id} — ${why}, vendor ${doc.vendorId || '?'}`);
      if (apply) {
        doc.status = 'cancelled';
        await doc.save();
      }
      stranded += 1;
    }
  }

  console.log(
    `\n${apply ? 'Cancelled' : 'Would cancel'} ${stranded} stranded submission(s); left ${live} live review item(s) untouched.`,
  );

  const pendingOffers = await Offer.countDocuments({ status: 'pending' });
  console.log(`Offers still pending (the admin queue): ${pendingOffers}`);

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
