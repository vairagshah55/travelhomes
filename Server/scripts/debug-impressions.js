/**
 * Debug helper — mirrors the dashboard's vendor-analytics aggregation so you
 * can see exactly which impression rows a given vendor's dashboard *would*
 * pull, and which rows might be incorrectly attributed.
 *
 * Run:  node scripts/debug-impressions.js --email=<vendor email>
 *       node scripts/debug-impressions.js --user=<user _id>
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const AdminAnalyticsMetric = require("../models/AdminAnalyticsMetric");
const Offer = require("../models/Offer");
const Vendor = require("../models/Vendor");
const User = require("../models/User");

async function main() {
  const emailArg = process.argv.find((a) => a.startsWith("--email="));
  const userArg = process.argv.find((a) => a.startsWith("--user="));
  const email = emailArg ? emailArg.split("=")[1] : null;
  const userId = userArg ? userArg.split("=")[1] : null;

  if (!email && !userId) {
    console.error("Pass --email=<x> or --user=<id>");
    process.exit(1);
  }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(uri);

  // 1) Resolve the same vendorId the dashboard would use
  let user = null;
  if (email) user = await User.findOne({ email }).lean();
  else if (userId) user = await User.findById(userId).lean();
  console.log("User found:", user ? `${user._id} (${user.email})` : "NONE");
  if (!user) {
    await mongoose.disconnect();
    return;
  }

  let resolvedVendorId = null;
  const vendorDoc = await Vendor.findOne({ email: user.email }).lean();
  if (vendorDoc?.vendorId) {
    resolvedVendorId = vendorDoc.vendorId;
    console.log(`Vendor doc found: vendorId="${resolvedVendorId}"`);
  } else {
    resolvedVendorId = String(user._id);
    console.log(`No Vendor doc — falling back to user._id="${resolvedVendorId}"`);
  }

  // 2) Find offers attributed to this vendor (same filter the dashboard uses)
  const vendorOfferFilter = {
    $or: [{ vendorId: resolvedVendorId }, { userId: resolvedVendorId }],
  };
  const vendorOffers = await Offer.find(vendorOfferFilter, {
    name: 1,
    vendorId: 1,
    userId: 1,
  }).lean();
  console.log(`\n── Offers attributed to this vendor (${vendorOffers.length}) ──`);
  vendorOffers.forEach((o) =>
    console.log(`  ${o._id}  · ${o.name}  · vendorId=${o.vendorId}  userId=${o.userId}`),
  );

  const vendorOfferIds = vendorOffers.map((o) => o._id);

  // 3) Impressions that the dashboard WOULD show for this vendor
  const dashRows = await AdminAnalyticsMetric.find({
    serviceId: { $in: vendorOfferIds },
    category: "listing",
  })
    .populate({ path: "serviceId", model: "Offer", select: "name vendorId userId" })
    .lean();
  const dashTotal = dashRows.reduce((sum, r) => sum + (r.impressions || 0), 0);
  console.log(`\n── Dashboard would show ${dashTotal} impression(s) across ${dashRows.length} row(s) ──`);
  dashRows.forEach((r) => {
    const off = r.serviceId || {};
    console.log(
      `  ${String(r.metricDate).slice(0, 10)}  imp=${r.impressions}  · "${off.name || "?"}"  vendorId=${off.vendorId}  userId=${off.userId}`,
    );
  });

  // 4) Sanity check — ALL impression rows in DB and to whom they belong
  const allImp = await AdminAnalyticsMetric.find({ category: "listing" })
    .populate({ path: "serviceId", model: "Offer", select: "name vendorId userId" })
    .lean();
  console.log(`\n── ALL impression rows in DB (${allImp.length}) ──`);
  allImp.forEach((r) => {
    const off = r.serviceId || {};
    const owned = vendorOfferIds.some((id) => String(id) === String(r.serviceId?._id));
    console.log(
      `  ${owned ? "[YOURS]" : "[OTHER]"} imp=${r.impressions}  · "${off.name || "?"}"  vendorId=${off.vendorId}  userId=${off.userId}`,
    );
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("debug failed:", err);
  process.exitCode = 1;
  mongoose.disconnect().catch(() => {});
});
