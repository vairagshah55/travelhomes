/**
 * Migration — move inline base64 images out of onboarding documents onto disk.
 *
 * Some legacy submissions store whole images as `data:image/...;base64,...`
 * strings inside MongoDB instead of a `/uploads/...` path. The submit handlers
 * normalise properly now (`normalizeImageArray`), and `attachSelfie` stopped
 * falling back to storing the raw payload, so nothing new lands this way — but
 * the rows already written are expensive in three places:
 *
 *   - `GET /api/onboarding/mine` returns whole documents to the wizard, and a
 *     single 2.8 MB caravan doc is why that endpoint used to take ~20 s;
 *   - the admin approval drawer now attaches the submission to the listing
 *     detail, so one legacy row inflates that response too;
 *   - Mongo is a poor blob store — the same bytes cost more to keep, index
 *     around and ship than a file behind the static handler.
 *
 * What it does: walks every onboarding document, finds every `data:` string
 * wherever it sits (top-level fields, arrays, and nested paths like
 * `rooms[].photos`), writes each one into `uploads/` with the same naming
 * scheme the live code uses, and replaces the string with its URL. Files are
 * written BEFORE the document is updated, so a crash leaves an orphan file
 * rather than a document pointing at nothing.
 *
 * Idempotent: a string already starting with `/uploads/` or `http` is skipped,
 * so a second run reports zero.
 *
 * Dry run by default. Pass --apply to write.
 *
 * Run: node scripts/normalize-inline-images.js [--apply]
 */

const path = require('path');
const fs = require('fs');

// Same env cascade as the server (Server/config/env.js).
const NODE_ENV = process.env.NODE_ENV || 'development';
for (const file of [`.env.${NODE_ENV}`, '.env']) {
  require('dotenv').config({ path: path.join(__dirname, '..', file) });
}

const mongoose = require('mongoose');
const ActivityOnboarding = require('../models/ActivityOnboarding');
const CaravanOnboarding = require('../models/CaravanOnboarding');
const StayOnboarding = require('../models/StayOnboarding');
const VehicleOnboarding = require('../models/VehicleOnboarding');

const MODELS = [
  ['activity', ActivityOnboarding],
  ['caravan', CaravanOnboarding],
  ['stay', StayOnboarding],
  ['vehicle', VehicleOnboarding],
];

const apply = process.argv.slice(2).includes('--apply');
const uploadsDir = path.join(process.cwd(), 'uploads');

function maskUri(uri) {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)[^@]*@/, '$1***:***@');
}

const mimeToExt = (mime) => {
  if (!mime) return 'bin';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('pdf')) return 'pdf';
  return 'bin';
};

/** Mirrors saveDataUrlToUploads in the services, including the filename shape. */
function writeDataUrl(dataUrl, prefix) {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) return null;
  let buffer;
  try {
    buffer = Buffer.from(match[2], 'base64');
  } catch {
    return null;
  }
  if (!buffer.length) return null;

  const name = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${mimeToExt(match[1])}`;
  if (apply) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, name), buffer);
  }
  return { url: `/uploads/${name}`, bytes: buffer.length };
}

const isDataUrl = (v) => typeof v === 'string' && v.startsWith('data:');

/**
 * Rewrite every `data:` string inside `node`, in place, and report what it did.
 * Recurses through arrays and plain objects so `rooms[].photos` is covered
 * without naming it — a field added to a wizard is handled for free.
 */
function normalizeNode(node, prefix, stats) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) {
      if (isDataUrl(node[i])) {
        const saved = writeDataUrl(node[i], prefix);
        if (saved) {
          stats.count += 1;
          stats.bytes += saved.bytes;
          node[i] = saved.url;
        } else {
          stats.unreadable += 1;
        }
      } else {
        normalizeNode(node[i], prefix, stats);
      }
    }
    return node;
  }

  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (isDataUrl(value)) {
        const saved = writeDataUrl(value, `${prefix}-${key}`);
        if (saved) {
          stats.count += 1;
          stats.bytes += saved.bytes;
          node[key] = saved.url;
        } else {
          stats.unreadable += 1;
        }
      } else {
        normalizeNode(value, prefix, stats);
      }
    }
  }

  return node;
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

async function main() {
  const uri =
    process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/travelhomes';
  console.log(`NODE_ENV=${NODE_ENV}`);
  console.log(`Connecting to ${maskUri(uri)} ...`);
  console.log(`uploads dir: ${uploadsDir}`);
  console.log(apply ? 'APPLY — writing files and documents.\n' : 'DRY RUN — pass --apply to write.\n');
  await mongoose.connect(uri);

  let docsTouched = 0;
  let imagesTotal = 0;
  let bytesTotal = 0;
  let unreadableTotal = 0;

  for (const [label, Model] of MODELS) {
    const docs = await Model.find({}).lean();
    let modelDocs = 0;

    for (const doc of docs) {
      const stats = { count: 0, bytes: 0, unreadable: 0 };
      // `_id` and timestamps are never image-bearing; skip them so a stray
      // Date object is not walked.
      const { _id, createdAt, updatedAt, __v, ...rest } = doc;
      const rewritten = normalizeNode(rest, `${label}-migrated`, stats);

      if (!stats.count && !stats.unreadable) continue;

      console.log(
        `  ~ ${label} ${_id} — ${stats.count} image(s), ${mb(stats.bytes)}` +
          (stats.unreadable ? `, ${stats.unreadable} unreadable (left as-is)` : ''),
      );

      if (apply && stats.count) {
        await Model.updateOne({ _id }, { $set: rewritten });
      }

      modelDocs += 1;
      imagesTotal += stats.count;
      bytesTotal += stats.bytes;
      unreadableTotal += stats.unreadable;
    }

    console.log(`${label}: ${modelDocs} of ${docs.length} document(s) carry inline images`);
    docsTouched += modelDocs;
  }

  console.log(
    `\n${apply ? 'Moved' : 'Would move'} ${imagesTotal} image(s) out of ${docsTouched} document(s), ` +
      `${mb(bytesTotal)} of base64 out of MongoDB.`,
  );
  if (unreadableTotal) {
    console.log(
      `${unreadableTotal} data URL(s) could not be decoded and were left untouched — ` +
        'they are truncated or not base64, and deleting them would lose whatever is there.',
    );
  }
  if (!apply && imagesTotal) {
    console.log('\nRe-run with --apply to write. Files are created before documents are updated.');
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
