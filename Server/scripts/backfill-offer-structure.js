/**
 * Backfill — repair the structured fields that onboarding never copied onto
 * existing Offers.
 *
 * Every listing created through a vendor onboarding wizard is missing data the
 * vendor actually entered, because the submission → Offer mapping in
 * modules/onboarding/onboarding.service.js left five things out:
 *
 *   category       stay and activity stored the literal "stay" / "activity" —
 *                  a service type, not a category. The property / activity type
 *                  the vendor picked sat unused in selectedProperties /
 *                  selectedActivities, so the edit wizard's category grid had
 *                  nothing to highlight and showed a required step as unset.
 *   address        collected by all four flows, mapped by none — the edit form's
 *                  address field opened blank and its map pointed at the city.
 *   discounts      each flow named these fields differently and none of them
 *                  reached Offer.discounts, so the edit wizard showed every
 *                  discount as off and re-saving wrote that back.
 *   rules          the activity flow stores house rules under
 *                  `rulesAndRegulations` and the mapping read `rules`, so no
 *                  activity listing ever carried the rules its vendor typed.
 *   optionalRules  sent by stay onboarding but undeclared on Offer, so Mongoose
 *                  strict mode dropped it.
 *
 * The service now maps all five for new submissions. This copies them down for
 * listings that already exist. Only empty / placeholder values are touched: a
 * vendor who has since fixed a category or address by hand keeps their edit.
 *
 * Dry run by default. Pass --apply to write.
 *
 * Run: node scripts/backfill-offer-structure.js [--apply]
 */

const path = require('path');

// Same env cascade as the server (Server/config/env.js).
const NODE_ENV = process.env.NODE_ENV || 'development';
for (const file of [`.env.${NODE_ENV}`, '.env']) {
  require('dotenv').config({ path: path.join(__dirname, '..', file) });
}

const mongoose = require('mongoose');
const Offer = require('../models/Offer');
const StayOnboarding = require('../models/StayOnboarding');
const ActivityOnboarding = require('../models/ActivityOnboarding');
const CaravanOnboarding = require('../models/CaravanOnboarding');
const VehicleOnboarding = require('../models/VehicleOnboarding');
const {
  categoryFromOnboarding,
  addressFromOnboarding,
  discountsFromOnboarding,
  rulesFromOnboarding,
} = require('../modules/onboarding/onboarding.service');

const apply = process.argv.slice(2).includes('--apply');

const MODELS = {
  StayOnboarding,
  ActivityOnboarding,
  CaravanOnboarding,
  VehicleOnboarding,
};

/** serviceType per source model — the fallback categoryFromOnboarding needs. */
const SERVICE_TYPE = {
  StayOnboarding: 'unique-stay',
  ActivityOnboarding: 'activity',
  CaravanOnboarding: 'camper-van',
  VehicleOnboarding: 'vehicle-rental',
};

/** Category values that carry no information — safe to overwrite. */
const PLACEHOLDER_CATEGORIES = new Set([
  '',
  'stay',
  'activity',
  'caravan',
  'camper-van',
  'unique-stay',
  'vehicle-rental',
]);

function maskUri(uri) {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)[^@]*@/, '$1***:***@');
}

/** True when no slot on the sub-doc is enabled or carries a value. */
function discountsAreEmpty(d) {
  if (!d) return true;
  return ['firstUser', 'festival', 'weekly', 'special'].every((k) => {
    const slot = d[k];
    return !slot || (!slot.enabled && !String(slot.value || '') && !String(slot.finalPrice || ''));
  });
}

async function main() {
  const uri =
    process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/travelhomes';
  console.log(`NODE_ENV=${NODE_ENV}`);
  console.log(`Connecting to ${maskUri(uri)} ...`);
  console.log(apply ? 'APPLY — writing changes.\n' : 'DRY RUN — pass --apply to write.\n');
  await mongoose.connect(uri);

  // Only onboarding-created listings have a submission to copy from. Offers
  // added through /offering/add were entered field-by-field and are complete.
  const offers = await Offer.find({ sourceId: { $ne: null }, sourceModel: { $ne: null } });
  console.log(`${offers.length} onboarding-created listing(s) found.\n`);

  const counts = { category: 0, rules: 0, address: 0, discounts: 0, optionalRules: 0 };
  let touched = 0;
  let noSource = 0;
  let alreadyComplete = 0;

  for (const offer of offers) {
    const label = `${offer.name || 'Untitled'} (${offer._id}, ${offer.serviceType || '?'})`;
    const Model = MODELS[offer.sourceModel];
    if (!Model) {
      noSource += 1;
      console.log(`  ? unknown src ${label} — sourceModel "${offer.sourceModel}"`);
      continue;
    }

    const doc = await Model.findById(offer.sourceId).lean();
    if (!doc) {
      noSource += 1;
      console.log(`  ? no source   ${label} — submission ${offer.sourceId} is gone`);
      continue;
    }

    const serviceType = offer.serviceType || SERVICE_TYPE[offer.sourceModel];
    const update = {};
    const notes = [];

    // ─── Category ─────────────────────────────────────────────────────
    if (PLACEHOLDER_CATEGORIES.has(String(offer.category || '').toLowerCase())) {
      const category = categoryFromOnboarding(doc, serviceType);
      if (category && category !== offer.category) {
        update.category = category;
        counts.category += 1;
        notes.push(`category "${offer.category || ''}" → "${category}"`);
      }
    }

    // ─── House rules ──────────────────────────────────────────────────
    if (!(offer.rules || []).length) {
      const rules = rulesFromOnboarding(doc);
      if (rules.length) {
        update.rules = rules;
        counts.rules += 1;
        notes.push(`${rules.length} rule(s)`);
      }
    }

    // ─── Address ──────────────────────────────────────────────────────
    if (!String(offer.address || '').trim()) {
      const address = addressFromOnboarding(doc);
      if (address) {
        update.address = address;
        counts.address += 1;
        notes.push(`address "${address}"`);
      }
    }

    // ─── Discounts ────────────────────────────────────────────────────
    if (discountsAreEmpty(offer.discounts)) {
      const discounts = discountsFromOnboarding(doc);
      if (!discountsAreEmpty(discounts)) {
        update.discounts = discounts;
        counts.discounts += 1;
        const on = ['firstUser', 'festival', 'weekly', 'special'].filter(
          (k) => discounts[k].enabled,
        );
        notes.push(`discounts (${on.length ? on.join(', ') : 'values only'})`);
      }
    }

    // ─── Optional rules (stay only) ───────────────────────────────────
    if (!(offer.optionalRules || []).length && Array.isArray(doc.optionalRules)) {
      const rules = doc.optionalRules.filter((r) => String(r || '').trim());
      if (rules.length) {
        update.optionalRules = rules;
        counts.optionalRules += 1;
        notes.push(`${rules.length} optional rule(s)`);
      }
    }

    if (!Object.keys(update).length) {
      alreadyComplete += 1;
      continue;
    }

    console.log(`  ~ repair      ${label} — ${notes.join('; ')}`);
    if (apply) await Offer.updateOne({ _id: offer._id }, { $set: update });
    touched += 1;
  }

  console.log(
    `\n${apply ? 'Repaired' : 'Would repair'} ${touched} listing(s):` +
      ` ${counts.category} category, ${counts.rules} rule list(s),` +
      ` ${counts.address} address, ${counts.discounts} discounts,` +
      ` ${counts.optionalRules} optional-rule list(s).`,
  );
  console.log(
    `Skipped ${alreadyComplete} already-complete listing(s)` +
      ` and ${noSource} with no readable submission.`,
  );

  if (!apply && touched) {
    console.log('\nNothing was written. Re-run with --apply once the list above looks right.');
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
