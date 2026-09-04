const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

const offerStatus = z.enum([
  "pending",
  "approved",
  "cancelled",
  "deactivated",
  "blocked",
  "rejected",
]);

const sortOrder = z.enum(["rating", "price_desc", "price_asc", "latest"]);

const listQuery = z.object({
  status: offerStatus.optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  q: z.string().trim().max(200).optional(),
  vendorId: z.string().trim().max(120).optional(),
  // `mine` is a boolean-ish flag. The SPA passes it as the literal string "true".
  mine: z.union([z.literal("true"), z.literal("false"), z.boolean()]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: sortOrder.optional(),

  // ─── Service + vehicle-rental facets ────────────────────────────────
  // `serviceType` is what the offer carries (set server-side on submit), as
  // opposed to `category`, which is vendor-entered free text. Without it the
  // search page had to pull limit=100 and re-bucket every row client-side
  // through getNormCategory's fuzzy string matching.
  serviceType: z.enum(["camper-van", "unique-stay", "activity", "vehicle-rental"]).optional(),

  // Requested stay/rental window. Both must be present to filter on
  // availability; one alone describes nothing bookable.
  checkin: z.coerce.date().optional(),
  checkout: z.coerce.date().optional(),

  vehicleClass: z.enum(["car", "van", "bus"]).optional(),
  fuelType: z.enum(["Petrol", "Diesel", "CNG", "Electric", "Hybrid"]).optional(),
  transmission: z.enum(["Manual", "Automatic"]).optional(),
  airConditioned: z.union([z.literal("true"), z.literal("false"), z.boolean()]).optional(),
  rentalMode: z.enum(["self-drive", "with-driver"]).optional(),
  brand: z.string().trim().max(120).optional(),
  minSeats: z.coerce.number().int().positive().max(100).optional(),
  maxSeats: z.coerce.number().int().positive().max(100).optional(),

  /* Compliance-document facet (vehicle rental only).
       hold      taken off the catalog by the expiry sweep
       expired   a date already in the past, swept or not
       expiring  a date inside the 30-day warning window */
  compliance: z.enum(["hold", "expired", "expiring"]).optional(),
});

/**
 * A renewal carries dates and nothing else. Both are optional so a vendor can
 * renew one document without restating the other, and both accept null so a
 * mistyped PUC date can be cleared — clearing insurance is refused in the
 * service, since a vehicle with no policy on file is not rentable either.
 */
// `z.null()` FIRST: zod unions try branches in order and `z.coerce.date()`
// happily coerces null to the epoch, which would clear a date to 1 Jan 1970
// rather than to nothing.
const expiryDate = z.union([z.null(), z.coerce.date()]).optional();

const complianceBody = z
  .object({
    insuranceExpiry: expiryDate,
    pucExpiry: expiryDate,
  })
  .refine((v) => v.insuranceExpiry !== undefined || v.pucExpiry !== undefined, {
    message: "Provide at least one expiry date",
  });

const idParams = z.object({ id: objectIdString });

// Offer is a sprawling content schema — keep .passthrough() so we don't
// drop any legacy fields. The model is the schema-of-record.
/* Derived from `Offer.schema` — see offerBody.js for why this is not a
   hand-written schema, and for the two live incidents that a passthrough body
   made invisible. */
const { upsertBody } = require("./offerBody");

const rateBody = z.object({
  rating: z.coerce.number().min(1).max(5),
});

const updateStatusBody = z.object({
  status: offerStatus,
  reason: z.string().trim().max(2000).optional(),
});

module.exports = {
  listQuery,
  idParams,
  upsertBody,
  rateBody,
  updateStatusBody,
  complianceBody,
};
