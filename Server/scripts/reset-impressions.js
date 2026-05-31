/**
 * Reset impression + visitor data so you can test analytics tracking from a
 * clean slate. Two stores:
 *
 *   1. AdminAnalyticsMetric — daily rows partitioned by `category`:
 *        - "listing" → impression rows (from offers.service.list)
 *        - "activity" | "camper-van" | "unique-stay" → visitor rows
 *          (from offers.service.getById / trackVisitor)
 *   2. Offer.visitors — running per-offer visitor counter (also from
 *      trackVisitor).
 *
 * Clicks on Offer.clicks are NOT touched — re-run vendor-analytics
 * resetMetrics() if you also want those zeroed.
 *
 * Run:  node scripts/reset-impressions.js
 *       node scripts/reset-impressions.js --dry          (count only, no writes)
 *       node scripts/reset-impressions.js --vendor=<id>  (only that vendor's offers)
 *       node scripts/reset-impressions.js --impressions  (skip visitor reset)
 *       node scripts/reset-impressions.js --visitors     (skip impression reset)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const AdminAnalyticsMetric = require("../models/AdminAnalyticsMetric");
const Offer = require("../models/Offer");

const VISITOR_CATEGORIES = ["activity", "camper-van", "unique-stay"];

async function main() {
  const argv = process.argv.slice(2);
  const dry = argv.includes("--dry");
  const onlyImpressions = argv.includes("--impressions");
  const onlyVisitors = argv.includes("--visitors");
  const vendorArg = argv.find((a) => a.startsWith("--vendor="));
  const vendorId = vendorArg ? vendorArg.split("=")[1] : null;

  // Default to both unless one of the --impressions / --visitors flags is set.
  const doImpressions = !onlyVisitors;
  const doVisitors = !onlyImpressions;

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGO_URI / MONGODB_URI not set in .env");

  await mongoose.connect(uri);
  console.log(`Connected → ${mongoose.connection.name}`);

  // Resolve scope (single vendor's offer ids, or all offers if no --vendor).
  let scopedOfferIds = null;
  if (vendorId) {
    scopedOfferIds = await Offer.find({
      $or: [{ vendorId }, { userId: vendorId }],
    }).distinct("_id");
    console.log(`Scoping to ${scopedOfferIds.length} offer(s) for vendor ${vendorId}`);
  }

  // ── Impressions (AdminAnalyticsMetric, category="listing") ───────────────
  if (doImpressions) {
    const impFilter = { category: "listing" };
    if (scopedOfferIds) impFilter.serviceId = { $in: scopedOfferIds };
    const impCount = await AdminAnalyticsMetric.countDocuments(impFilter);
    console.log(`Impression rows: ${impCount}`);
    if (impCount > 0 && !dry) {
      const r = await AdminAnalyticsMetric.deleteMany(impFilter);
      console.log(`  → deleted ${r.deletedCount} impression row(s)`);
    }
  }

  // ── Visitors: detail-page rows + Offer.visitors counter ──────────────────
  if (doVisitors) {
    const visFilter = { category: { $in: VISITOR_CATEGORIES } };
    if (scopedOfferIds) visFilter.serviceId = { $in: scopedOfferIds };
    const visCount = await AdminAnalyticsMetric.countDocuments(visFilter);
    console.log(`Visitor-tracking rows: ${visCount}`);

    const offerFilter = scopedOfferIds ? { _id: { $in: scopedOfferIds } } : {};
    const offerCount = await Offer.countDocuments({
      ...offerFilter,
      visitors: { $gt: 0 },
    });
    console.log(`Offers with a non-zero visitors counter: ${offerCount}`);

    if (!dry) {
      if (visCount > 0) {
        const r = await AdminAnalyticsMetric.deleteMany(visFilter);
        console.log(`  → deleted ${r.deletedCount} visitor row(s)`);
      }
      if (offerCount > 0) {
        const r = await Offer.updateMany(offerFilter, { $set: { visitors: 0 } });
        console.log(`  → zeroed visitors on ${r.modifiedCount} offer(s)`);
      }
    }
  }

  if (dry) console.log("[--dry] no changes written.");
  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error("reset-impressions failed:", err);
  process.exitCode = 1;
  mongoose.disconnect().catch(() => {});
});
