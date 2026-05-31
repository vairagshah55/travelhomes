/**
 * Remove duplicate Offer rows that share the same vendor + same name. Useful
 * after multiple test-submits leave the same listing 4-5 times in the catalog
 * (e.g. four "Test 1" offers for vendor VD8178).
 *
 * Keep policy: oldest doc (by _id) wins. Newer dupes are removed.
 *
 * Run:  node scripts/dedupe-offers.js                  (dry by default, no writes)
 *       node scripts/dedupe-offers.js --apply          (actually delete dupes)
 *       node scripts/dedupe-offers.js --vendor=<id>    (scope to one vendor)
 *       node scripts/dedupe-offers.js --apply --vendor=VD8178
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const Offer = require("../models/Offer");

async function main() {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const vendorArg = argv.find((a) => a.startsWith("--vendor="));
  const vendorId = vendorArg ? vendorArg.split("=")[1] : null;

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log(`Connected → ${mongoose.connection.name}`);

  const filter = vendorId ? { $or: [{ vendorId }, { userId: vendorId }] } : {};
  const offers = await Offer.find(filter, {
    name: 1,
    vendorId: 1,
    userId: 1,
    createdAt: 1,
  })
    .sort({ _id: 1 }) // oldest first → first occurrence is the keeper
    .lean();

  // Group by (vendorKey, name). vendorKey prefers vendorId, falls back to userId.
  const groups = new Map();
  for (const o of offers) {
    const vendorKey = o.vendorId || o.userId || "<orphan>";
    const key = `${vendorKey}::${(o.name || "").trim()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  }

  const toDelete = [];
  for (const [key, list] of groups.entries()) {
    if (list.length <= 1) continue;
    const [keeper, ...dupes] = list;
    console.log(
      `\n[${list.length}×]  "${list[0].name}"  vendor=${list[0].vendorId || list[0].userId}`,
    );
    console.log(`  keeper:  ${keeper._id}  (${keeper.createdAt || "no createdAt"})`);
    for (const d of dupes) {
      console.log(`  dupe:    ${d._id}  (${d.createdAt || "no createdAt"})`);
      toDelete.push(d._id);
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`Groups inspected: ${groups.size}`);
  console.log(`Duplicate rows to remove: ${toDelete.length}`);

  if (toDelete.length === 0) {
    console.log("Nothing to do.");
  } else if (!apply) {
    console.log("[dry] Re-run with --apply to actually delete.");
  } else {
    const res = await Offer.deleteMany({ _id: { $in: toDelete } });
    console.log(`Deleted ${res.deletedCount} duplicate offer(s).`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error("dedupe-offers failed:", err);
  process.exitCode = 1;
  mongoose.disconnect().catch(() => {});
});
