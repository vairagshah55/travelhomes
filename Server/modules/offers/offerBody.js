/**
 * The request body for `POST /api/offers` and `PUT /api/offers/:id`.
 *
 * Built FROM `Offer.schema` at load time rather than hand-written beside it.
 *
 * Before this, the body was `z.object({}).passthrough()` — no validation at
 * all. Combined with Mongoose strict mode, which drops keys it doesn't know,
 * that made a whole class of bug invisible: a save returned 200 and wrote
 * nothing. It has happened twice for real —
 *
 *   - 2026-09-03: the check-in / check-out card shipped ~48 minutes before the
 *     schema paths did, and a live `houseboat` submission lost both values with
 *     no error anywhere.
 *   - The vendor create payload has been sending twelve flat discount keys
 *     (`firstUserDiscount`, `festivalOffersType`, …) since the structured
 *     `discounts` sub-document replaced them. None has ever had a schema path,
 *     so none has ever been stored — while a comment on the payload claimed
 *     they were "kept for backwards-compat with any consumer still reading
 *     them". Nothing could read them.
 *
 * Deriving the schema from the model means a field the model cannot store is a
 * 400 that names the field, on the first request, instead of silence.
 */
const { z } = require("zod");
const Offer = require("../../models/Offer");

/**
 * Keys the SPA sends under a different name than the model stores.
 *
 * `finalPrice` is what all four form surfaces call the discounted rate; the
 * model's path is `discountPrice`. The frontend already mirrors one onto the
 * other — accepting it here makes the mapping server-side truth, so a client
 * that forgets to mirror still saves correctly.
 */
const ALIASES = { finalPrice: "discountPrice" };

/**
 * Accepted and discarded, rather than rejected.
 *
 * These are the twelve dead discount keys described above. Rejecting them would
 * 400 a vendor mid-submit over keys that have never done anything; they are
 * dropped here and removed from the client payload separately.
 */
const IGNORED = new Set(
  ["firstUserDiscount", "festivalOffers", "weeklyMonthlyOffers", "specialOffers"].flatMap((k) => [
    k,
    `${k}Type`,
    `${k}Value`,
  ]),
);

/** A validator for one leaf path, from its SchemaType. */
function leafFor(schemaType) {
  const enumValues = schemaType.enumValues?.length ? schemaType.enumValues : null;
  switch (schemaType.instance) {
    case "String":
      /* An enum path is the one place a wrong value is worse than a missing
         one: Mongoose rejects the WHOLE update, so a single bad `fuelPolicy`
         loses every other edit in the same save. Caught here instead, named. */
      return enumValues ? z.enum(enumValues) : z.string();
    case "Number":
      // Forms hold numbers as strings; coerce rather than 400 on "2500".
      return z.coerce.number();
    case "Boolean":
      return z.coerce.boolean();
    case "Date":
      return z.coerce.date();
    default:
      // Arrays, Mixed, ObjectId, and the sub-documents inside `rooms`.
      return z.any();
  }
}

/**
 * Turn the model's dotted paths into a nested shape.
 *
 * Every level is optional — this validates a PARTIAL update — and nullable,
 * because clearing a field is sent as an explicit null (see
 * `serializeOfferingValues` on the client). Nested objects are plain
 * `z.object`, so an unknown key inside `photos` or `discounts` is stripped
 * rather than rejected; only the top level is strict, which is where every
 * mistake has actually been made.
 */
function buildShape() {
  const tree = {};
  for (const [path, type] of Object.entries(Offer.schema.paths)) {
    if (path === "_id" || path === "__v") continue;
    const parts = path.split(".");
    let node = tree;
    parts.slice(0, -1).forEach((p) => {
      node[p] = node[p] || {};
      node = node[p];
    });
    node[parts[parts.length - 1]] = leafFor(type);
  }

  const wrap = (v) => (v instanceof z.ZodType ? v : toZod(v)).nullable().optional();
  const toZod = (node) =>
    z.object(Object.fromEntries(Object.entries(node).map(([k, v]) => [k, wrap(v)])));

  const shape = {};
  for (const [k, v] of Object.entries(tree)) shape[k] = wrap(v);

  // Accepted at the top level; folded into its real path by the transform.
  Object.keys(ALIASES).forEach((alias) => {
    shape[alias] = z.any().optional();
  });
  IGNORED.forEach((k) => {
    shape[k] = z.any().optional();
  });
  return shape;
}

const upsertBody = z
  .object(buildShape())
  .strict()
  .transform((body) => {
    const out = { ...body };
    for (const [alias, real] of Object.entries(ALIASES)) {
      if (!(alias in out)) continue;
      /* The real path wins when a client sends both: it is what the model
         stores, so a disagreement means the client's mirror is stale. */
      if (out[real] === undefined || out[real] === null) out[real] = out[alias];
      delete out[alias];
    }
    IGNORED.forEach((k) => delete out[k]);
    /* `undefined` means "in the shape, but not sent" — not "clear this".
       Mongoose ignores it either way; dropping it keeps the body honest in
       logs and in the service's own reasoning about what changed. */
    Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
    return out;
  });

module.exports = { upsertBody, ALIASES, IGNORED };
