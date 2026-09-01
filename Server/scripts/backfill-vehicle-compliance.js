/**
 * Backfill — copy insurance / PUC expiry dates onto existing vehicle Offers.
 *
 * The dates have always been collected, but only ever stored on the
 * VehicleOnboarding submission. The expiry sweep reads them from the Offer (so
 * it can ask one question of one collection instead of joining every listing
 * back to its submission), which means listings created before this feature
 * carry no dates at all and are invisible to it — the catalog would keep
 * showing vehicles with paperwork that lapsed months ago, and only new
 * submissions would ever be policed.
 *
 * This copies each vehicle Offer's dates down from its source submission.
 * Offers that already carry a date are left alone: a vendor may have renewed
 * through the new endpoint, which writes the Offer first, and the submission
 * behind it can be the older of the two.
 *
 * It does NOT take anything down. Backfilling and enforcing in one step would
 * mean a script run silently removing listings; the sweep does that on its own
 * schedule afterwards, where it is logged and it emails the vendors. Run this
 * first, read the summary — it counts how many listings the sweep will then
 * pull — and let the monitor do the rest.
 *
 * Dry run by default. Pass --apply to write.
 *
 * Run: node scripts/backfill-vehicle-compliance.js [--apply]
 */

const path = require('path');

// Same env cascade as the server (Server/config/env.js).
const NODE_ENV = process.env.NODE_ENV || 'development';
for (const file of [`.env.${NODE_ENV}`, '.env']) {
  require('dotenv').config({ path: path.join(__dirname, '..', file) });
}

const mongoose = require('mongoose');
const Offer = require('../models/Offer');
const VehicleOnboarding = require('../models/VehicleOnboarding');
const {
  COMPLIANCE_DOCS,
  evaluateCompliance,
  formatExpiry,
} = require('../shared/vehicleCompliance');

const apply = process.argv.slice(2).includes('--apply');

function maskUri(uri) {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)[^@]*@/, '$1***:***@');
}

/**
 * The submission an offer came from. `sourceId` is the reliable link; older
 * rows predate it, so fall back to the vendor's most recent vehicle
 * submission — the same fallback syncSourceStatus uses.
 */
async function findSubmission(offer) {
  if (offer.sourceId) {
    const bySource = await VehicleOnboarding.findById(offer.sourceId).lean();
    if (bySource) return bySource;
  }
  if (offer.vendorId) {
    return VehicleOnboarding.findOne({ vendorId: offer.vendorId })
      .sort({ createdAt: -1 })
      .lean();
  }
  return null;
}

async function main() {
  const uri =
    process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/travelhomes';
  console.log(`NODE_ENV=${NODE_ENV}`);
  console.log(`Connecting to ${maskUri(uri)} ...`);
  console.log(apply ? 'APPLY — writing changes.\n' : 'DRY RUN — pass --apply to write.\n');
  await mongoose.connect(uri);

  const offers = await Offer.find({ serviceType: 'vehicle-rental' });
  console.log(`${offers.length} vehicle listing(s) found.\n`);

  let filled = 0;
  let alreadySet = 0;
  let noSource = 0;
  let noDates = 0;
  const wouldBeHeld = [];

  for (const offer of offers) {
    const label = `${offer.name || 'Untitled'} (${offer._id}, ${offer.status})`;

    if (COMPLIANCE_DOCS.some((d) => offer[d.field])) {
      alreadySet += 1;
      continue;
    }

    const submission = await findSubmission(offer);
    if (!submission) {
      noSource += 1;
      console.log(`  ? no source   ${label} — no submission to copy from`);
      continue;
    }

    const update = {};
    for (const doc of COMPLIANCE_DOCS) {
      if (submission[doc.field]) update[doc.field] = submission[doc.field];
    }

    if (!Object.keys(update).length) {
      noDates += 1;
      console.log(`  ? no dates    ${label} — submission carries neither date`);
      continue;
    }

    const summary = COMPLIANCE_DOCS.filter((d) => update[d.field])
      .map((d) => `${d.label} ${formatExpiry(update[d.field])}`)
      .join(', ');
    console.log(`  ~ backfill    ${label} — ${summary}`);

    if (apply) await Offer.updateOne({ _id: offer._id }, { $set: update });
    filled += 1;

    // What the sweep will do with it on its next pass.
    const verdict = evaluateCompliance({ ...offer.toObject(), ...update });
    if (verdict.expired.length && ['approved', 'pending'].includes(offer.status)) {
      wouldBeHeld.push({ label, documents: verdict.expired.map((d) => d.label).join(' and ') });
    }
  }

  console.log(
    `\n${apply ? 'Backfilled' : 'Would backfill'} ${filled} listing(s).` +
      ` Skipped ${alreadySet} that already carried a date,` +
      ` ${noSource} with no submission and ${noDates} with no dates on file.`,
  );

  if (wouldBeHeld.length) {
    console.log(
      `\n${wouldBeHeld.length} live listing(s) will be taken down by the next sweep, and their` +
        ' vendors emailed:',
    );
    for (const row of wouldBeHeld) console.log(`  ! ${row.label} — ${row.documents} expired`);
    console.log(
      '\nNothing has been taken down by this script. Restart the API (or POST' +
        ' /api/offers/compliance/sweep as an admin) when you are ready for that to happen.',
    );
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
