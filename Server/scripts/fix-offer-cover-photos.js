/**
 * Repair script — listings showing a gallery photo as their cover.
 *
 * Every onboarding wizard asks the vendor for a cover photo separately from the
 * gallery, and stores it on the submission as `coverImage`. But submitActivity,
 * submitCaravan and submitStay all built the Offer with
 * `photos.coverUrl = gallery[0]` and never read it, so the hero image on every
 * card, search result, detail page, admin row and trip screen was the first
 * gallery photo. The vendor's actual choice was uploaded, stored, and silently
 * discarded. (submitVehicle was the one that got it right.)
 *
 * onboarding.service.js now resolves the cover through `coverUrlFor`, so no new
 * listing lands wrong. This fixes the ones already in the database: for each
 * Offer whose source submission holds a cover that disagrees with
 * `photos.coverUrl`, the Offer takes the submission's cover.
 *
 * Only `photos.coverUrl` is touched. `galleryUrls` is left exactly as it is —
 * the cover was never a member of the gallery, so nothing needs removing, and
 * a listing whose gallery an admin has since curated by hand keeps it.
 *
 * Offers with no cover on their submission are skipped rather than blanked:
 * anything submitted before the cover was collected legitimately has only
 * gallery photos, and `coverUrl: ""` would render a broken image.
 *
 * Dry run by default. Pass --apply to write.
 *
 * Run: node scripts/fix-offer-cover-photos.js [--apply]
 */

const path = require('path');

// Same env cascade as the server (Server/config/env.js).
const NODE_ENV = process.env.NODE_ENV || 'development';
for (const file of [`.env.${NODE_ENV}`, '.env']) {
  require('dotenv').config({ path: path.join(__dirname, '..', file) });
}

const mongoose = require('mongoose');
const Offer = require('../models/Offer');
const ActivityOnboarding = require('../models/ActivityOnboarding');
const CaravanOnboarding = require('../models/CaravanOnboarding');
const StayOnboarding = require('../models/StayOnboarding');
const VehicleOnboarding = require('../models/VehicleOnboarding');
const { coverUrlFor } = require('../modules/onboarding/onboarding.service');

// Keyed on the `serviceType` the submit handlers stamp on offers — not on
// `category`, which for a vehicle holds its class ("Sedan", "MUV / MPV").
const MODEL_BY_SERVICE_TYPE = {
  activity: ActivityOnboarding,
  'camper-van': CaravanOnboarding,
  'unique-stay': StayOnboarding,
  'vehicle-rental': VehicleOnboarding,
};

const apply = process.argv.slice(2).includes('--apply');

function maskUri(uri) {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)[^@]*@/, '$1***:***@');
}

/**
 * The submission an offer was built from. `sourceId` is the reliable link;
 * older rows predate it, so fall back to the vendor's most recent submission of
 * the same type — the same fallback syncSourceStatus uses.
 */
async function findSubmission(offer, Model) {
  if (offer.sourceId) {
    const bySource = await Model.findById(offer.sourceId).lean();
    if (bySource) return bySource;
  }
  if (offer.vendorId) {
    return Model.findOne({ vendorId: offer.vendorId }).sort({ createdAt: -1 }).lean();
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

  let fixed = 0;
  let alreadyRight = 0;
  let noCover = 0;
  let noSource = 0;

  for (const [serviceType, Model] of Object.entries(MODEL_BY_SERVICE_TYPE)) {
    const offers = await Offer.find({ serviceType });
    console.log(`${serviceType} — ${offers.length} listing(s)`);

    for (const offer of offers) {
      const label = `${offer.name || 'Untitled'} (${offer._id})`;
      const submission = await findSubmission(offer, Model);

      if (!submission) {
        noSource += 1;
        console.log(`  ? no source   ${label}`);
        continue;
      }

      // Passing no gallery on purpose: the fallback is what the offer already
      // has, so an empty answer means "this submission carries no cover" rather
      // than "the cover happens to equal the first gallery photo".
      const cover = coverUrlFor(submission);
      if (!cover) {
        noCover += 1;
        continue;
      }

      const current = (offer.photos && offer.photos.coverUrl) || '';
      if (current === cover) {
        alreadyRight += 1;
        continue;
      }

      console.log(`  ~ fix cover   ${label}`);
      console.log(`      was: ${current || '(empty)'}`);
      console.log(`      now: ${cover}`);

      if (apply) {
        await Offer.updateOne({ _id: offer._id }, { $set: { 'photos.coverUrl': cover } });
      }
      fixed += 1;
    }
  }

  console.log(
    `\n${apply ? 'Fixed' : 'Would fix'} ${fixed} listing(s).` +
      ` Left alone: ${alreadyRight} already correct,` +
      ` ${noCover} with no cover on the submission, ${noSource} with no submission.`,
  );

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
