/**
 * Bookings service — read flows.
 *
 * Migrated from the legacy bookingController.js, preserving behavior:
 *   - listByDate: lookup by `date` field within a UTC day window
 *   - getById:    raw fetch by ObjectId
 *   - listForUser: populate `serviceId` (Management or Offer), with a manual
 *                  fallback when serviceModel is missing/incorrect (legacy
 *                  records). Returns the same `serviceDetails` shape clients
 *                  rely on (cover + gallery photos).
 *
 * Authorisation lives at the controller (caller must be the same user as
 * `:userId`) — the service trusts its caller.
 */
const mongoose = require("mongoose");

const Booking = require("../../models/Booking");
const Management = require("../../models/Management");
const Offer = require("../../models/Offer");
const logger = require("../../shared/logger");
const { NotFoundError } = require("../../shared/errors");

// ─── List bookings whose `date` field falls inside a UTC day ────────────────
async function listByDate(date) {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);
  const bookings = await Booking.find({ date: { $gte: start, $lte: end } }).sort({
    createdAt: -1,
  });
  return { bookings };
}

// ─── Get one booking by id ──────────────────────────────────────────────────
async function getById(id) {
  const booking = await Booking.findById(id);
  if (!booking) throw new NotFoundError("Booking", id);
  return { booking };
}

// ─── List bookings for a user with serviceId populated ─────────────────────
async function listForUser(userId) {
  const queryId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const bookings = await Booking.find({ userId: queryId })
    .populate("serviceId")
    .sort({ createdAt: -1 })
    .lean();

  // Manual fallback: some legacy bookings were saved without `serviceModel`
  // or with the wrong refPath, so populate left `serviceId` as a raw ObjectId.
  // Try resolving against Offer first, then Management.
  for (const booking of bookings) {
    if (!booking.serviceId || typeof booking.serviceId !== "object") {
      try {
        const offer = await Offer.findById(booking.serviceId).lean();
        if (offer) {
          booking.serviceId = offer;
          booking.serviceModel = "Offer";
        } else {
          const mgmt = await Management.findById(booking.serviceId).lean();
          if (mgmt) {
            booking.serviceId = mgmt;
            booking.serviceModel = "Management";
          }
        }
      } catch (err) {
        // Lookup failures here are fine — the booking just won't have a
        // populated service. Log so we can audit how often this happens.
        logger.debug(
          { err: err.message, bookingId: booking._id },
          "manual serviceId fallback failed",
        );
      }
    }
  }

  // Build the legacy `serviceDetails` shape — a normalised view of cover +
  // gallery photos that clients can render without knowing the underlying
  // model. Offer stores photos under `photos.coverUrl/galleryUrls`; Management
  // stores them as a flat `images` array.
  return {
    bookings: bookings.map((booking) => {
      const service = booking.serviceId;
      let serviceDetails = null;
      if (service && typeof service === "object") {
        let coverUrl = "";
        let galleryUrls = [];
        if (booking.serviceModel === "Offer") {
          coverUrl = service.photos?.coverUrl || "";
          galleryUrls = service.photos?.galleryUrls || [];
        } else {
          coverUrl = service.images?.[0] || "";
          galleryUrls = service.images || [];
        }
        serviceDetails = { ...service, photos: { coverUrl, galleryUrls } };
      }
      return {
        ...booking,
        serviceId: service?._id ? service._id.toString() : booking.serviceId,
        serviceDetails,
      };
    }),
  };
}

module.exports = {
  listByDate,
  getById,
  listForUser,
};
