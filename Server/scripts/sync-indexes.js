/**
 * Builds every index declared on every Mongoose model, then reports what each
 * collection ended up with.
 *
 * `config/db.js` sets `autoIndex: false` in production, so this is how a
 * production database gets its indexes. Run it once per deploy that changes an
 * index definition:
 *
 *   npm run sync-indexes            (from Server/)
 *
 * `syncIndexes()` creates what's missing AND drops indexes the schema no longer
 * declares, so it converges the database on the code rather than only adding.
 * It skips the `_id` index and anything created outside Mongoose.
 *
 * On a large collection an index build takes time and I/O. MongoDB 4.2+ builds
 * indexes with only a brief exclusive lock at start and finish, but on a busy
 * production cluster prefer a low-traffic window — or use Atlas rolling index
 * builds and skip this script for that deploy.
 */
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const env = require("../config/env");

async function main() {
  const uri = env.MONGO_URI;
  if (!uri) {
    console.error("[sync-indexes] MONGO_URI is not set");
    process.exit(1);
  }

  await mongoose.connect(uri, {
    autoIndex: false,
    ...(env.MONGO_DB_NAME && { dbName: env.MONGO_DB_NAME }),
  });
  console.log(`[sync-indexes] database: ${mongoose.connection.host}/${mongoose.connection.name}`);

  // Registering a model file is what puts it on mongoose.models.
  const modelsDir = path.join(__dirname, "..", "models");
  for (const file of fs.readdirSync(modelsDir)) {
    if (file.endsWith(".js")) require(path.join(modelsDir, file));
  }

  const names = Object.keys(mongoose.models).sort();
  console.log(`[sync-indexes] ${names.length} models registered\n`);

  let created = 0;
  let dropped = 0;
  let failed = 0;

  for (const name of names) {
    const Model = mongoose.models[name];
    try {
      // Returns the list of index names it removed.
      const removed = await Model.syncIndexes();
      const indexes = await Model.collection.indexes();
      const listed = indexes
        .filter((i) => i.name !== "_id_")
        .map((i) => i.name)
        .join(", ");

      if (removed && removed.length) dropped += removed.length;
      created += indexes.length - 1;

      console.log(`  ${name.padEnd(28)} ${listed || "(none beyond _id)"}`);
      if (removed && removed.length) {
        console.log(`  ${"".padEnd(28)} dropped: ${removed.join(", ")}`);
      }
    } catch (err) {
      failed += 1;
      // A failure here is nearly always a duplicate-key conflict on a unique
      // index — report it and keep going so one bad model doesn't block the rest.
      console.error(`  ${name.padEnd(28)} FAILED: ${err.message}`);
    }
  }

  console.log(
    `\n[sync-indexes] ${created} indexes present, ${dropped} dropped, ${failed} model(s) failed`,
  );

  await mongoose.disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("[sync-indexes] fatal:", err);
  process.exit(1);
});
