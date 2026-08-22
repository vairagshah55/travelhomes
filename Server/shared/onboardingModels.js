/**
 * One `Offer.sourceModel` → onboarding model map, for every caller that needs it.
 *
 * There were three independent copies of this lookup — offers.service,
 * management.service and scripts/fix-stranded-onboarding — and adding vehicle
 * rental updated none of them. The Offer model's `sourceModel` enum gained
 * "VehicleOnboarding", so vehicles saved and listed fine, but approving one hit
 * a lookup that had never heard of it: offers.service returned null and skipped
 * the sync, management.service fell through to its caravan default. Either way
 * the VehicleOnboarding doc stayed "pending" after the admin approved it — the
 * vendor kept seeing "under review" for a live listing, and
 * assertNoOtherPendingSubmission went on blocking every other service type.
 *
 * Keeping the map here means the next service type is one edit, and
 * `__tests__/onboardingModels.test.mjs` fails if the enum grows past it.
 */
const ActivityOnboarding = require("../models/ActivityOnboarding");
const CaravanOnboarding = require("../models/CaravanOnboarding");
const StayOnboarding = require("../models/StayOnboarding");
const VehicleOnboarding = require("../models/VehicleOnboarding");

const ONBOARDING_MODELS = {
  ActivityOnboarding,
  CaravanOnboarding,
  StayOnboarding,
  VehicleOnboarding,
};

/** The model for a `sourceModel` value, or null when it isn't one we know. */
function onboardingModelFor(sourceModel) {
  return ONBOARDING_MODELS[sourceModel] || null;
}

module.exports = { ONBOARDING_MODELS, onboardingModelFor };
