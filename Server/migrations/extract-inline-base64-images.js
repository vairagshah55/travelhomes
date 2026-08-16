/**
 * Moves inline `data:` image payloads out of MongoDB and into /uploads.
 *
 * Caravan onboarding never normalised `idPhotos` (activity and stay both did),
 * so ID-proof images were stored as raw base64 inside the document. The same
 * values were mirrored into Profile by syncUserProfile. Documents reached
 * 2.8 MB each, and GET /api/onboarding/mine returns whole documents — which is
 * what made that endpoint take ~20 seconds.
 *
 * The submit path is fixed (see modules/onboarding/onboarding.service.js); this
 * repairs rows written before that fix.
 *
 * Usage:
 *   node migrations/extract-inline-base64-images.js            # dry run, reports only
 *   node migrations/extract-inline-base64-images.js --apply    # writes files + updates docs
 *
 * Dry run by default on purpose: it rewrites documents and creates files, so
 * inspect the report before letting it touch anything. Safe to re-run — rows
 * with no `data:` values are skipped.
 */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const env = require("./../config/env");

const APPLY = process.argv.includes("--apply");
const uploadsDir = path.join(process.cwd(), "uploads");

/** Collections and the string / string[] fields that may hold a data URL. */
const TARGETS = [
  { collection: "caravanonboardings", prefix: "caravan", fields: ["idPhotos", "photos", "coverImage"] },
  { collection: "activityonboardings", prefix: "activity", fields: ["idPhotos", "photos", "coverImage"] },
  { collection: "stayonboardings", prefix: "stay", fields: ["idPhotos", "photos", "images", "coverImage"] },
  { collection: "profiles", prefix: "profile", fields: ["idPhotos", "photos", "photo"] },
];

const mimeToExt = (mime) => {
  if (!mime) return "bin";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("pdf")) return "pdf";
  return "bin";
};

function parseDataUrl(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;
  try {
    return { buffer: Buffer.from(match[2], "base64"), ext: mimeToExt(match[1]) };
  } catch {
    return null;
  }
}

let filesWritten = 0;

/** Persist one data URL to /uploads and return its public path. */
function extract(value, prefix) {
  const parsed = parseDataUrl(value);
  if (!parsed) return null;
  const filename = `${prefix}-migrated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${parsed.ext}`;
  if (APPLY) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, filename), parsed.buffer);
    filesWritten += 1;
  }
  return { url: `/uploads/${filename}`, bytes: value.length };
}

/** Returns { value, bytesFreed } for a string or array-of-strings field. */
function convertField(value, prefix) {
  if (Array.isArray(value)) {
    let bytesFreed = 0;
    let changed = false;
    const next = value.map((entry) => {
      const res = extract(entry, prefix);
      if (!res) return entry;
      changed = true;
      bytesFreed += res.bytes;
      return res.url;
    });
    return changed ? { value: next, bytesFreed } : null;
  }
  const res = extract(value, prefix);
  return res ? { value: res.url, bytesFreed: res.bytes } : null;
}

async function main() {
  await mongoose.connect(env.MONGO_URI, {
    autoIndex: false,
    ...(env.MONGO_DB_NAME && { dbName: env.MONGO_DB_NAME }),
  });
  console.log(`[migrate] database: ${mongoose.connection.host}/${mongoose.connection.name}`);
  console.log(`[migrate] mode: ${APPLY ? "APPLY (writes)" : "DRY RUN (no changes)"}\n`);

  const db = mongoose.connection.db;
  let totalDocs = 0;
  let totalFreed = 0;

  for (const { collection, prefix, fields } of TARGETS) {
    const coll = db.collection(collection);
    const query = { $or: fields.map((f) => ({ [f]: { $regex: "^data:" } })) };
    // $regex against an array field matches if ANY element matches, so this
    // covers both the string and string[] shapes.
    const docs = await coll.find(query).toArray();
    if (!docs.length) {
      console.log(`  ${collection.padEnd(22)} nothing to migrate`);
      continue;
    }

    let collFreed = 0;
    for (const doc of docs) {
      const update = {};
      let docFreed = 0;
      for (const field of fields) {
        if (doc[field] == null) continue;
        const converted = convertField(doc[field], prefix);
        if (converted) {
          update[field] = converted.value;
          docFreed += converted.bytesFreed;
        }
      }
      if (!Object.keys(update).length) continue;

      if (APPLY) await coll.updateOne({ _id: doc._id }, { $set: update });
      collFreed += docFreed;
      totalDocs += 1;
    }
    totalFreed += collFreed;
    console.log(
      `  ${collection.padEnd(22)} ${String(docs.length).padStart(3)} docs, ` +
        `${(collFreed / 1048576).toFixed(2)} MB of base64 extracted`,
    );
  }

  console.log(
    `\n[migrate] ${totalDocs} documents, ${(totalFreed / 1048576).toFixed(2)} MB moved out of MongoDB` +
      `${APPLY ? `, ${filesWritten} files written to /uploads` : ""}`,
  );
  if (!APPLY) console.log("[migrate] dry run — re-run with --apply to make these changes.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
