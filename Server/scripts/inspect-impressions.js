/**
 * Snapshot the impression + visitor metric rows currently in the DB.
 * Useful for verifying that an API call did/didn't write what you expected.
 *
 * Run:  node scripts/inspect-impressions.js
 *       node scripts/inspect-impressions.js --vendor=<id>
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const AdminAnalyticsMetric = require("../models/AdminAnalyticsMetric");
const Offer = require("../models/Offer");

async function main() {
  const vendorArg = process.argv.find((a) => a.startsWith("--vendor="));
  const vendorId = vendorArg ? vendorArg.split("=")[1] : null;

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(uri);

  let scope = null;
  if (vendorId) {
    scope = await Offer.find({ $or: [{ vendorId }, { userId: vendorId }] })
      .distinct("_id");
    console.log(`Scoping to ${scope.length} offer(s) for vendor ${vendorId}\n`);
  }

  const matchAny = scope ? { serviceId: { $in: scope } } : {};

  const impressions = await AdminAnalyticsMetric.find({ ...matchAny, category: "listing" })
    .populate({ path: "serviceId", model: "Offer", select: "name vendorId" })
    .lean();
  console.log(`── Impression rows (${impressions.length}) ──`);
  impressions.forEach((r) => {
    const name = r.serviceId?.name || `<missing offer ${r.serviceId}>`;
    const vid = r.serviceId?.vendorId || "—";
    console.log(
      `  ${String(r.metricDate).slice(0, 10)}  imp=${r.impressions}  unique=${(r.visitorIds || []).length}  · ${name}  (vendor ${vid})`,
    );
  });

  const visitors = await AdminAnalyticsMetric.find({
    ...matchAny,
    category: { $in: ["activity", "camper-van", "unique-stay"] },
  })
    .populate({ path: "serviceId", model: "Offer", select: "name vendorId" })
    .lean();
  console.log(`\n── Visitor rows (${visitors.length}) ──`);
  visitors.forEach((r) => {
    const name = r.serviceId?.name || `<missing>`;
    const vid = r.serviceId?.vendorId || "—";
    console.log(
      `  ${String(r.metricDate).slice(0, 10)}  vis=${r.visitors}  unique=${(r.visitorIds || []).length}  [${r.category}]  · ${name}  (vendor ${vid})`,
    );
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("inspect-impressions failed:", err);
  process.exitCode = 1;
  mongoose.disconnect().catch(() => {});
});
