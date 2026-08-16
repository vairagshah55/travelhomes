/**
 * Seeds the Unique Stay taxonomy: property types + categories.
 *
 *   Property types  ->  Feature { category: "Unique Stay", type: "category" }
 *                       Step 1 of the stay wizard ("Property Types").
 *   Categories      ->  Feature { category: "Unique Stay", type: "subcategory" }
 *                       Step 2 ("Categories").
 *
 * Why categories are seeded FLAT rather than under each property type:
 * the existing model nests subcategories beneath a parent type
 * (`category: <parentFeatureId>`), which is right for genuinely type-specific
 * options. These 31 are orthogonal to property type — a "Beach Stay" or a
 * "Pet-Friendly Stay" can be a villa or a cottage — so nesting them would mean
 * 20 x 31 = 620 rows and 20 edits every time an admin changes one word. They're
 * stored once against "Unique Stay" and the wizard unions them with any
 * type-specific subcategories an admin has already created.
 *
 * NON-DESTRUCTIVE. Upsert by (name, category, type); nothing is renamed or
 * deleted. That matters because StayOnboarding.selectedProperties stores
 * `name.toLowerCase()` and Offer.category stores the name — renaming
 * "Cottage" to "Cottages" would orphan existing drafts and listings. Types
 * already in the database that aren't in this list are left alone; disable
 * them from the admin CMS if they shouldn't be offered.
 *
 * Usage:
 *   node scripts/seed-stay-taxonomy.js                            # dry run
 *   node scripts/seed-stay-taxonomy.js --apply                    # writes
 *   node scripts/seed-stay-taxonomy.js --apply --disable-legacy   # + hide old types
 *
 * `--disable-legacy` sets status=disable on any "Unique Stay" property type not
 * in PROPERTY_TYPES, so the picker shows exactly this list. It disables rather
 * than deletes: existing drafts and Offers reference these by name, and a
 * disabled Feature still resolves for them — it just stops being offered for
 * new listings. Reversible from Admin -> CMS -> Features.
 */
const mongoose = require("mongoose");

const env = require("../config/env");
const Feature = require("../models/Feature");

const APPLY = process.argv.includes("--apply");
const DISABLE_LEGACY = process.argv.includes("--disable-legacy");

/** Step 1 — "Select the property types you'd like to list." */
const PROPERTY_TYPES = [
  "Resorts",
  "Villas",
  "Holiday Homes",
  "Cottages",
  "Farm Stays",
  "Homestays",
  "Guest Houses",
  "Hostels",
  "A Frame",
  "Boutique Stays",
  "Luxury Stays",
  "Heritage Stays",
  "Palaces",
  "Havelis",
  "Treehouses",
  "Glamping",
  "Camping Sites",
  "Cabins",
  "Houseboats",
  "Tents",
];

/** Step 2 — "Select the categories that best describe your property." */
const CATEGORIES = [
  "Eco Stays",
  "Jungle Stays",
  "Beach Stays",
  "Mountain Stays",
  "Lakefront Stays",
  "Desert Stays",
  "Wellness Retreats",
  "Farmhouses",
  "Private Estates",
  "Unique Stays",
  "Studios",
  "Bungalows",
  "Mansions",
  "Pool Villas",
  "Beach Villas",
  "Hill Villas",
  "Forest Villas",
  "Island Stays",
  "Riverside Stays",
  "Waterfront Stays",
  "Vineyard",
  "Wildlife Lodges",
  "Safari Camps",
  "Nature Retreats",
  "Family Stays",
  "Pet-Friendly Stays",
  "Long-Stay Properties",
  "Workation Stays",
  "Theme Resorts",
  "Party Houses",
  "Private Retreats",
];

const STAY = "Unique Stay";

async function seedGroup(label, names, type) {
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const existing = await Feature.findOne({ name, category: STAY, type });

    if (!existing) {
      if (APPLY) {
        await Feature.create({
          name,
          category: STAY,
          type,
          status: "enable",
          description: "",
          icon: "",
          sortOrder: i,
        });
      }
      created += 1;
      continue;
    }

    // Only ever fix ordering and re-enable. Icons and descriptions an admin has
    // set are never overwritten.
    const patch = {};
    if (existing.sortOrder !== i) patch.sortOrder = i;
    if (existing.status !== "enable") patch.status = "enable";

    if (Object.keys(patch).length) {
      if (APPLY) await Feature.updateOne({ _id: existing._id }, { $set: patch });
      updated += 1;
    } else {
      unchanged += 1;
    }
  }

  console.log(
    `  ${label.padEnd(16)} ${String(names.length).padStart(3)} defined  ->  ` +
      `${created} new, ${updated} updated, ${unchanged} already correct`,
  );
}

async function main() {
  await mongoose.connect(env.MONGO_URI, {
    autoIndex: false,
    ...(env.MONGO_DB_NAME && { dbName: env.MONGO_DB_NAME }),
  });
  console.log(`[stay-taxonomy] database: ${mongoose.connection.host}/${mongoose.connection.name}`);
  console.log(`[stay-taxonomy] mode: ${APPLY ? "APPLY (writes)" : "DRY RUN (no changes)"}\n`);

  await seedGroup("Property types", PROPERTY_TYPES, "category");
  await seedGroup("Categories", CATEGORIES, "subcategory");

  // Surface pre-existing rows this script doesn't own, so nothing is silently
  // left enabled in the picker.
  const strays = await Feature.find({
    category: STAY,
    type: "category",
    name: { $nin: PROPERTY_TYPES },
  })
    .select("name status")
    .lean();

  if (strays.length) {
    if (DISABLE_LEGACY) {
      const toDisable = strays.filter((s) => s.status !== "disable");
      if (APPLY && toDisable.length) {
        await Feature.updateMany(
          { _id: { $in: toDisable.map((s) => s._id) } },
          { $set: { status: "disable" } },
        );
      }
      console.log(
        `\n[stay-taxonomy] ${toDisable.length} legacy property type(s) disabled (hidden from the picker, not deleted):`,
      );
      toDisable.forEach((s) => console.log(`    ${s.name}`));
      if (!toDisable.length) console.log("    (all already disabled)");
    } else {
      console.log(
        `\n[stay-taxonomy] ${strays.length} existing property type(s) are NOT in this list and were left enabled:`,
      );
      strays.forEach((s) => console.log(`    ${s.name}  (status=${s.status})`));
      console.log("    Re-run with --disable-legacy to hide them from the picker.");
    }
  }

  if (!APPLY) console.log("\n[stay-taxonomy] dry run — re-run with --apply to write.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[stay-taxonomy] failed:", err);
  process.exit(1);
});
