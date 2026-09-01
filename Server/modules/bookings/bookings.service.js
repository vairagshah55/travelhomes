/**
 * Bookings service.
 *
 * Reads:
 *   listByDate     — by `date` field within a UTC day window
 *   getById        — raw fetch by ObjectId
 *   listForUser    — populates `serviceId` (Management or Offer) with a
 *                    manual fallback for legacy records missing serviceModel
 *   listForAdmin   — tab/serviceType/search/sort filters for admin dashboards
 *
 * Writes:
 *   create         — Booking.create + admin/vendor notifications
 *                    + confirmation workflow (invoice + email) when status
 *                    is created as `confirmed`
 *   update         — Booking.findByIdAndUpdate
 *   remove         — Booking.findByIdAndDelete
 *   setStatus      — also runs confirmation workflow when newly confirmed
 *   setDates       — preserves legacy field names (`date`, `endDate`)
 *   buildInvoice   — non-PDF invoice payload (the legacy controller never
 *                    generated a real PDF here; preserved as-is)
 *
 * Authorisation lives at the controller — the service trusts its caller.
 */
const mongoose = require("mongoose");

const Booking = require("../../models/Booking");
const Management = require("../../models/Management");
const Offer = require("../../models/Offer");
const InvoiceGenerator = require("../../services/invoiceGenerator");
const { sendEmail } = require("../../lib/email-sender/sender");
const { notifyNewBooking } = require("../../shared/bookingNotifications");
const env = require("../../config/env");
const logger = require("../../shared/logger");
const { NotFoundError, BadRequestError } = require("../../shared/errors");
const { evaluateCompliance } = require("../../shared/vehicleCompliance");

// ─── Reads ──────────────────────────────────────────────────────────────────
async function listByDate(date) {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);
  const bookings = await Booking.find({ date: { $gte: start, $lte: end } }).sort({
    createdAt: -1,
  });
  return { bookings };
}

async function getById(id) {
  const booking = await Booking.findById(id);
  if (!booking) throw new NotFoundError("Booking", id);
  return { booking };
}

async function listForUser(userId) {
  const queryId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const bookings = await Booking.find({ userId: queryId })
    .populate("serviceId")
    .sort({ createdAt: -1 })
    .lean();

  // Legacy bookings predate `serviceModel`, so `.populate()` can't resolve them
  // and they need a manual lookup. This used to run 1-2 queries per unresolved
  // booking, in series, on the user's "My Trips" page; now it's two batched
  // queries regardless of how many rows need patching. Offer still wins over
  // Management when an id somehow exists in both, as before.
  const unresolved = bookings.filter(
    (b) => b.serviceId && typeof b.serviceId !== "object" && mongoose.Types.ObjectId.isValid(b.serviceId),
  );

  if (unresolved.length) {
    try {
      const ids = [...new Set(unresolved.map((b) => String(b.serviceId)))];
      const [offers, mgmts] = await Promise.all([
        Offer.find({ _id: { $in: ids } }).lean(),
        Management.find({ _id: { $in: ids } }).lean(),
      ]);
      const offerMap = new Map(offers.map((o) => [String(o._id), o]));
      const mgmtMap = new Map(mgmts.map((m) => [String(m._id), m]));

      for (const booking of unresolved) {
        const key = String(booking.serviceId);
        const offer = offerMap.get(key);
        if (offer) {
          booking.serviceId = offer;
          booking.serviceModel = "Offer";
          continue;
        }
        const mgmt = mgmtMap.get(key);
        if (mgmt) {
          booking.serviceId = mgmt;
          booking.serviceModel = "Management";
        }
      }
    } catch (err) {
      logger.debug({ err: err.message }, "manual serviceId fallback failed");
    }
  }

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

// Maps the public-facing serviceType ("caravan") to the storage value
// ("camper-van"). Kept aligned with the legacy controller's mapping.
const SERVICE_TYPE_MAP = {
  caravan: "camper-van",
  stay: "unique-stay",
  activity: "activity",
  vehicle: "vehicle-rental",
};

async function listForAdmin({ tab, serviceType, search, sortBy, sortDir } = {}) {
  const query = {};
  const now = new Date();

  if (tab === "upcoming-bookings") {
    query.checkInDate = { $gt: now };
    query.bookingStatus = { $nin: ["cancelled"] };
  } else if (tab === "past-booking") {
    query.checkOutDate = { $lt: now };
    query.bookingStatus = { $nin: ["cancelled"] };
  } else if (tab === "cancelled-bookings") {
    query.bookingStatus = "cancelled";
  }
  // "all-bookings" (or unset) → no status filter.

  if (serviceType && SERVICE_TYPE_MAP[serviceType]) {
    query.serviceName = SERVICE_TYPE_MAP[serviceType];
  }

  if (search) {
    // Case-insensitive substring search across the four most useful fields.
    // Note: search is taken from a validated max-200-char string and only used
    // inside RegExp's special-char vacuum — bookingId/clientName/etc. don't
    // accept user-supplied regex meta.
    const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "i");
    query.$or = [{ bookingId: re }, { clientName: re }, { clientEmail: re }, { clientPhone: re }];
  }

  let cursor = Booking.find(query);
  if (sortBy) {
    const dir = sortDir === "desc" ? -1 : 1;
    cursor = cursor.sort({ [sortBy]: dir });
  } else {
    cursor = cursor.sort({ createdAt: -1 });
  }
  const bookings = await cursor.exec();
  return { bookings };
}

// ─── Confirmation workflow (shared between create + setStatus) ──────────────
// Generates a PDF invoice, attaches to a confirmation email, marks the
// booking as confirmation-sent. Never throws — failures are logged and the
// booking save proceeds without the side effects.
async function runConfirmationWorkflow(booking) {
  try {
    const invoiceGen = new InvoiceGenerator();
    const bookingData = {
      booking,
      user: {
        name: booking.clientName,
        email: booking.clientEmail,
        phone: booking.clientPhone,
      },
      service: { name: booking.serviceName, id: booking.serviceId },
      serviceType: booking.serviceName,
    };
    const pdfBuffer = await invoiceGen.generateInvoice(bookingData);
    const filePath = await invoiceGen.saveInvoiceToFile(pdfBuffer, booking.bookingId);
    booking.invoiceGenerated = true;
    booking.invoicePath = filePath;

    const mailBody = {
      from: env.EMAIL_SENDER || "no-reply@traveldashboard.com",
      to: booking.clientEmail,
      subject: `Booking Confirmed: ${booking.bookingId}`,
      text:
        `Dear ${booking.clientName},\n\n` +
        `Your booking (${booking.bookingId}) is confirmed.\n` +
        `Please find your invoice attached.\n\n` +
        `Thank you for booking with Travel Dashboard!`,
      attachments: [{ filename: `Invoice-${booking.bookingId}.pdf`, path: filePath }],
    };

    // sendEmail's signature is (mailBody, res, successMessage). The legacy
    // controller passed a stub `res` to flag completion; we do the same.
    await new Promise((resolve) => {
      sendEmail(
        mailBody,
        {
          status: () => ({}),
          send: () => resolve(),
        },
        "Booking confirmation email sent",
      );
    });

    booking.confirmationSent = true;
    booking.confirmationSentAt = new Date();
    await booking.save();
  } catch (err) {
    logger.error(
      { err: err.message, bookingId: booking?.bookingId },
      "booking confirmation workflow failed",
    );
  }
}

// Best-effort notifications. Failures are logged, never surfaced — the
// booking creation must not depend on the notification side.
//
// `sendGuestEmail: false` because this path runs its own confirmation
// workflow below, which mails the guest and stamps `confirmationSent` on the
// booking. The shared notifier covers everything that workflow doesn't: the
// guest's bell, and both channels for the vendor and admin.
//
// The vendor lookup also moves into the shared notifier, which resolves the
// owner from Offer as well as Management — this used to check Management
// alone, so listings that live in Offer notified nobody.
async function emitNewBookingNotifications(booking) {
  try {
    await notifyNewBooking(booking, { sendGuestEmail: false });
  } catch (err) {
    logger.error({ err: err.message }, "failed to emit new-booking notification");
  }
}

// ─── Writes ─────────────────────────────────────────────────────────────────
/**
 * Conditional requirements for a vehicle-rental booking.
 *
 * The DTO can't express these: `rentalMode` and `drivingLicenceNumber` are
 * optional at the schema level because the three older services never send
 * them, so "required, but only when serviceName is vehicle-rental" has to be
 * checked here. A self-drive handover without a licence number on file is the
 * one that actually matters — the vendor has nothing to verify against at
 * pickup, and the booking would already be paid for by then.
 */
function assertVehicleFields(input) {
  if (input.serviceName !== "vehicle-rental") return;

  if (!input.rentalMode) {
    throw new BadRequestError("rentalMode is required for a vehicle rental booking");
  }
  if (input.rentalMode === "self-drive" && !input.drivingLicenceNumber) {
    throw new BadRequestError("drivingLicenceNumber is required for a self-drive booking");
  }
  if (!input.pickupTime || !input.returnTime) {
    throw new BadRequestError("pickupTime and returnTime are required for a vehicle rental booking");
  }
}

/**
 * Refuse a vehicle whose insurance or PUC certificate has lapsed.
 *
 * The catalog and the detail endpoint already hide those listings, so a guest
 * cannot reach checkout for one. This path is the other one: a vendor or admin
 * creating a booking by hand, from a list they may have had open since before
 * the document expired. Handing over a vehicle with lapsed paperwork is the
 * thing the whole feature exists to prevent, so it is checked at the point of
 * booking too and not only at the point of browsing.
 */
async function assertVehicleCompliance(input) {
  if (input.serviceName !== "vehicle-rental" || !input.serviceId) return;

  const offer = await Offer.findById(input.serviceId)
    .select("name serviceType insuranceExpiry pucExpiry")
    .lean();
  if (!offer || offer.serviceType !== "vehicle-rental") return;

  const { expired } = evaluateCompliance(offer);
  if (!expired.length) return;

  throw new BadRequestError(
    `${expired.map((d) => d.label).join(" and ")} for "${offer.name}" has expired. ` +
      "The vendor must renew the document before this vehicle can be booked.",
  );
}

async function create(input) {
  assertVehicleFields(input);
  await assertVehicleCompliance(input);
  const booking = await Booking.create(input);
  await emitNewBookingNotifications(booking);

  // If the booking was created already in `confirmed` status, fire the
  // confirmation workflow synchronously (matches legacy behavior where
  // failures here didn't block the create response).
  if (booking.bookingStatus === "confirmed") {
    await runConfirmationWorkflow(booking);
  }

  return { booking };
}

async function update(id, patch) {
  const booking = await Booking.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!booking) throw new NotFoundError("Booking", id);
  return { booking };
}

async function remove(id) {
  const booking = await Booking.findByIdAndDelete(id);
  if (!booking) throw new NotFoundError("Booking", id);
  return { message: "Booking deleted" };
}

async function setStatus(id, status) {
  const booking = await Booking.findByIdAndUpdate(id, { bookingStatus: status }, { new: true });
  if (!booking) throw new NotFoundError("Booking", id);

  if (status === "confirmed" && !booking.confirmationSent) {
    await runConfirmationWorkflow(booking);
  }

  return { booking };
}

async function setDates(id, { startDate, endDate, action }) {
  // Preserves the legacy field-name choice (`date` + `endDate`) — the
  // canonical Booking schema uses `checkInDate`/`checkOutDate`, but clients
  // and the calendar UI write to these legacy fields. Phase 4 cleanup will
  // unify the schema once both sides are touched together.
  const update = { lastModified: new Date() };
  if (startDate) update.date = new Date(startDate);
  if (endDate) update.endDate = new Date(endDate);
  if (action) update.dragAction = action;

  const booking = await Booking.findByIdAndUpdate(id, update, { new: true });
  if (!booking) throw new NotFoundError("Booking", id);
  return { booking };
}

// The legacy `generateInvoice` endpoint never produced a real PDF here — it
// computed an in-memory invoice payload and stored a fake file path. Preserved
// verbatim until the invoice flow is rewritten as part of the payments saga.
async function buildInvoice(id) {
  const booking = await Booking.findById(id);
  if (!booking) throw new NotFoundError("Booking", id);

  const totalAmount = Array.isArray(booking.extraItems)
    ? booking.extraItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0) +
      (booking.paymentDetails?.amount || 0)
    : booking.paymentDetails?.amount || 0;

  const invoice = {
    bookingId: booking.bookingId || booking._id,
    guestName: booking.guestName || booking.clientName || "",
    date: booking.date,
    extraItems: booking.extraItems || [],
    paymentDetails: booking.paymentDetails || {},
    notes: booking.notes || "",
    status: booking.status,
    totalAmount,
    company: {
      name: "Travel Homes",
      address: "Your Company Address",
      phone: "Your Phone Number",
      email: "support@travelhomes.com",
    },
  };

  const filePath = `/invoices/${booking.bookingId || booking._id}_${Date.now()}.pdf`;
  booking.invoiceUrl = filePath;
  await booking.save();

  return { invoice: { ...invoice, filePath } };
}

module.exports = {
  listByDate,
  getById,
  listForUser,
  listForAdmin,
  create,
  update,
  remove,
  setStatus,
  setDates,
  buildInvoice,
};
