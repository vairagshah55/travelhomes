/**
 * Tells everyone who needs to know that a booking happened.
 *
 * This exists because the checkout path had a hole in it. A booking made
 * through `POST /api/bookings` (vendor or admin creating one by hand) sent the
 * guest an email and pinged the vendor. A booking made by a paying customer on
 * the website did neither — the payment saga builds its Booking document
 * directly, bypassing `bookings.service.create()`, and every notification and
 * email lived inside that function. Customers paid and heard nothing back.
 *
 * Three audiences, two channels:
 *
 *   guest    bell + confirmation email with the invoice attached
 *   vendor   bell + "your listing is booked" email
 *   admin    bell + digest email, if an alert address is configured
 *
 * Everything here is best-effort and nothing throws. By the time this runs the
 * money has moved and the booking is committed, so a dead SMTP host must not
 * turn a successful payment into a failed request. Channels are also
 * independent: the vendor's email failing must not cost the guest theirs.
 */
const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const Management = require("../models/Management");
const Offer = require("../models/Offer");
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const { onboardingModelFor } = require("./onboardingModels");
const InvoiceGenerator = require("../services/invoiceGenerator");
const { sendEmailSilent } = require("../lib/email-sender/sender");
const env = require("../config/env");
const logger = require("./logger");

// MAIL_FROM_ADDRESS first: it carries a display name ("Travelhomes <…>"), so
// the mail lands with a sender people recognise rather than a bare address.
const FROM = () =>
  env.MAIL_FROM_ADDRESS ||
  env.EMAIL_SENDER ||
  env.MAIL_USERNAME ||
  env.EMAIL_USER ||
  "no-reply@travelhomes.com";

/** Where the ops copy goes. Falls back to the mailbox we're sending from. */
const ADMIN_INBOX = () => env.ADMIN_ALERT_EMAIL || env.EMAIL_SENDER || env.MAIL_USERNAME || null;

const asObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;

const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

/** Keyed on the `serviceType` the submit handlers stamp — never on `category`. */
const SOURCE_MODEL_BY_SERVICE_TYPE = {
  activity: "ActivityOnboarding",
  "camper-van": "CaravanOnboarding",
  "unique-stay": "StayOnboarding",
  "vehicle-rental": "VehicleOnboarding",
};

const onDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

/* ── Who is the vendor? ──────────────────────────────────────────────────── */

/**
 * Choose who to notify from the records we managed to find.
 *
 * Pure, and exported, because this precedence IS the bug that was fixed: the
 * old code returned from the `userId` branch the moment it was entered — which
 * it almost always is, since `offer.userId` is a well-formed ObjectId — and so
 * a User row that does not exist ended the search with `{ email: null }`,
 * never reaching the Vendor record that had the real address. Measured on
 * production: 7 of 7 offers resolved to no email, which killed the vendor half
 * of every notification.
 *
 * Rules:
 *   - the owning User's address wins when it has one;
 *   - otherwise the Vendor account's;
 *   - otherwise the business email typed into the onboarding wizard;
 *   - and a route only wins if it actually produced an address.
 * The user id is kept independently of the address, because the in-app bell is
 * addressed by id and would otherwise be lost along with the email.
 */
function pickVendorIdentity({ ownerId, owner, vendor, vendorUser, submissionEmail, offerName }) {
  const userId = ownerId || vendorUser?._id || null;
  const fallbackName = owner?.name || vendor?.personName || vendor?.brandName || vendorUser?.name;
  const name = fallbackName || offerName || "there";

  const email = owner?.email || vendor?.email || submissionEmail || null;
  if (!email && !userId) return { userId: null, email: null, name: "" };

  return { userId, email, name };
}

/**
 * The business email on the onboarding submission behind a listing.
 *
 * Every wizard collects one and it is the address the vendor actually reads.
 * `resolveAdminTarget` in offers.service has always used this as its own last
 * resort; this brings the notification path in line rather than leaving the two
 * to disagree about who owns a listing.
 */
async function businessEmailFromSubmission(serviceId) {
  try {
    const offer = await Offer.findById(serviceId)
      .select("sourceModel sourceId serviceType vendorId")
      .lean();
    if (!offer) return null;

    const modelName =
      offer.sourceModel || SOURCE_MODEL_BY_SERVICE_TYPE[String(offer.serviceType || "").toLowerCase()];
    const Model = modelName ? onboardingModelFor(modelName) : null;
    if (!Model) return null;

    let doc = null;
    if (offer.sourceId) doc = await Model.findById(offer.sourceId).select("businessEmail").lean();
    if (!doc && offer.vendorId) {
      doc = await Model.findOne({ vendorId: offer.vendorId })
        .sort({ createdAt: -1 })
        .select("businessEmail")
        .lean();
    }
    return doc?.businessEmail || null;
  } catch (err) {
    logger.warn({ err: err.message, serviceId }, "[booking-notify] submission email lookup failed");
    return null;
  }
}

/**
 * Resolve the listing's owner to something we can both notify and email.
 *
 * The two listing collections disagree about what a "vendor id" is, which is
 * the trap here:
 *   Management.vendorId  ObjectId ref to User — directly usable
 *   Offer.userId         User _id as a *string* — castable
 *   Offer.vendorId       a business code like "VD1234" — NOT an ObjectId, and
 *                        assigning it to Notification.recipientId throws a
 *                        CastError. It has to go through the Vendor collection
 *                        and out via the matching User's email.
 *
 * Returns `{ userId, email, name }`, any of which may be null.
 */
async function resolveVendor(serviceId) {
  const empty = { userId: null, email: null, name: "" };
  if (!serviceId) return empty;

  try {
    const management = await Management.findById(serviceId)
      .select("vendorId brandName serviceName vendor")
      .lean();

    if (management?.vendorId) {
      const owner = await User.findById(management.vendorId).select("name email").lean();
      return {
        userId: management.vendorId,
        email: owner?.email || management.vendor?.email || null,
        name: owner?.name || management.brandName || "there",
      };
    }

    const offer = await Offer.findById(serviceId).select("userId vendorId name").lean();
    if (!offer) return empty;

    /*
     * Two routes to the owner, tried in order — and the ORDER IS NOT THE POINT,
     * the fall-through is.
     *
     * This used to `return` from the userId branch as soon as it was entered,
     * which it almost always is: `offer.userId` is a well-formed ObjectId, so
     * `asObjectId` succeeds. But the User row it names frequently does not
     * exist, and the branch returned `{ email: null }` without ever trying the
     * vendorId route — which would have worked, because Vendor carries a real
     * email. Live measurement: 7 of 7 offers resolved to no email.
     *
     * The cost was the entire vendor half of every notification. No vendor
     * booking email, no vendor "your listing was removed for expired documents"
     * email, and `bell()` skipped too where recipientId was needed. It read as
     * "email is broken" and was actually "the lookup gave up early".
     *
     * So each route now only wins if it produced something to send to.
     */
    /* Gather every candidate, THEN decide. Collecting first is the fix: the old
       code decided inside the userId branch and returned from it, so a dangling
       userId ended the search before the Vendor record was ever consulted. */
    const ownerId = asObjectId(offer.userId);
    const owner = ownerId ? await User.findById(ownerId).select("name email").lean() : null;

    const vendor = offer.vendorId
      ? await Vendor.findOne({ vendorId: offer.vendorId }).select("email personName brandName").lean()
      : null;

    // Only worth a third query when the first two produced no address.
    const needSubmission = !owner?.email && !vendor?.email && (offer.vendorId || offer.userId);
    const submissionEmail = needSubmission ? await businessEmailFromSubmission(serviceId) : null;

    const vendorUser =
      vendor?.email && !ownerId
        ? await User.findOne({ email: vendor.email }).select("_id name").lean()
        : null;

    return pickVendorIdentity({
      ownerId,
      owner,
      vendor,
      vendorUser,
      submissionEmail,
      offerName: offer.name,
    });
  } catch (err) {
    logger.warn({ err: err.message, serviceId }, "[booking-notify] vendor lookup failed");
  }

  return empty;
}

/* ── Email bodies ────────────────────────────────────────────────────────── */

const shell = (heading, intro, rows, closing) => `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f6f8fb;padding:28px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:#0f7478;color:#ffffff;padding:22px 26px;">
        <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.8;">TravelHomes</div>
        <div style="font-size:21px;font-weight:600;margin-top:6px;">${heading}</div>
      </div>
      <div style="padding:24px 26px;color:#1f2a44;font-size:14px;line-height:1.6;">
        <p style="margin:0 0 18px;">${intro}</p>
        <table style="width:100%;border-collapse:collapse;">
          ${rows
            .map(
              ([label, value]) => `
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid #eef1f6;color:#5f6a82;">${label}</td>
              <td style="padding:9px 0;border-bottom:1px solid #eef1f6;text-align:right;font-weight:600;color:#0a1c1c;">${value}</td>
            </tr>`,
            )
            .join("")}
        </table>
        ${closing ? `<p style="margin:20px 0 0;color:#5f6a82;">${closing}</p>` : ""}
      </div>
    </div>
  </div>`;

const bookingRows = (booking) => [
  ["Booking ID", `#${booking.bookingId}`],
  ["Check in", onDate(booking.checkInDate)],
  ["Check out", onDate(booking.checkOutDate)],
  ["Guests", booking.numberOfGuests || 1],
  ["Total", money(booking.totalAmount)],
];

/* ── Channels ────────────────────────────────────────────────────────────── */

/** Never rejects — a bell that fails is logged and forgotten. */
async function bell(fields) {
  try {
    await Notification.create(fields);
  } catch (err) {
    logger.error({ err: err.message, title: fields.title }, "[booking-notify] bell failed");
  }
}

async function mail(to, subject, html, attachments) {
  if (!to) return;
  try {
    const result = await sendEmailSilent({ from: FROM(), to, subject, html, attachments });
    if (!result?.success) {
      logger.error({ to, subject, err: result?.error }, "[booking-notify] email failed");
    }
  } catch (err) {
    logger.error({ err: err.message, to, subject }, "[booking-notify] email threw");
  }
}

/**
 * Build the guest's invoice PDF. Returns a nodemailer attachment list, or an
 * empty one — an invoice we couldn't render is not a reason to withhold the
 * confirmation email itself.
 */
async function invoiceAttachment(booking) {
  try {
    const generator = new InvoiceGenerator();
    // InvoiceGenerator predates the Booking schema and reads a different set
    // of names — bookingNumber/startDate/endDate/guests/status. Handing it a
    // raw Booking makes it render "undefined" throughout and then throw on
    // `booking.status.toUpperCase()`. Translate rather than let it fail.
    const pdf = await generator.generateInvoice({
      booking: {
        bookingNumber: booking.bookingId,
        startDate: booking.checkInDate,
        endDate: booking.checkOutDate,
        guests: booking.numberOfGuests || 1,
        status: booking.bookingStatus || "confirmed",
        paymentMethod: booking.paymentDetails?.paymentMethod || "Online",
        totalAmount: booking.totalAmount,
        specialRequests: booking.notes || "",
      },
      user: { name: booking.clientName, email: booking.clientEmail, phone: booking.clientPhone },
      service: { name: booking.propertyName || booking.serviceName, id: booking.serviceId },
      serviceType: booking.serviceName,
    });
    const path = await generator.saveInvoiceToFile(pdf, booking.bookingId);
    return [{ filename: `Invoice-${booking.bookingId}.pdf`, path }];
  } catch (err) {
    logger.error(
      { err: err.message, bookingId: booking.bookingId },
      "[booking-notify] invoice generation failed, sending email without it",
    );
    return [];
  }
}

/* ── Entry point ─────────────────────────────────────────────────────────── */

/**
 * @param {object} booking          the committed Booking document
 * @param {object} [options]
 * @param {string} [options.gateway]        names the gateway in the admin copy
 * @param {boolean} [options.sendGuestEmail] false when the caller already sent
 *        one (bookings.service runs its own confirmation workflow)
 */
async function notifyNewBooking(booking, { gateway, sendGuestEmail = true } = {}) {
  if (!booking) return;

  const listing = booking.propertyName || booking.serviceName || "your booking";
  const vendor = await resolveVendor(booking.serviceId);

  // ── Guest ──────────────────────────────────────────────────────────────
  const guestId = asObjectId(booking.userId);
  const guestBell = bell({
    type: "new_booking",
    title: "Booking confirmed",
    message: `Your booking ${booking.bookingId} for ${listing} is confirmed.`,
    recipientRole: "user",
    recipientId: guestId || undefined,
    referenceId: booking._id,
    referenceModel: "Booking",
  });

  const guestMail = sendGuestEmail
    ? invoiceAttachment(booking).then((attachments) =>
        mail(
          booking.clientEmail,
          `Booking confirmed — ${booking.bookingId}`,
          shell(
            "Your trip is booked",
            `Hi ${booking.clientName || "there"}, your booking for <strong>${listing}</strong> is confirmed. Your invoice is attached.`,
            bookingRows(booking),
            "See it any time under Trips in your account.",
          ),
          attachments,
        ),
      )
    : Promise.resolve();

  // ── Vendor ─────────────────────────────────────────────────────────────
  const vendorBell = vendor.userId
    ? bell({
        type: "new_booking",
        title: "New booking for your listing",
        message: `${booking.clientName} booked ${listing} for ${onDate(booking.checkInDate)}.`,
        recipientRole: "vendor",
        recipientId: vendor.userId,
        referenceId: booking._id,
        referenceModel: "Booking",
      })
    : Promise.resolve();

  const vendorMail = mail(
    vendor.email,
    `New booking — ${listing} (${booking.bookingId})`,
    shell(
      "You have a new booking",
      `Hi ${vendor.name || "there"}, <strong>${booking.clientName}</strong> just booked <strong>${listing}</strong>.`,
      [
        ...bookingRows(booking),
        ["Guest email", booking.clientEmail || "—"],
        ["Guest phone", booking.clientPhone || "—"],
      ],
      "Open your dashboard to review the booking and message the guest.",
    ),
  );

  // ── Admin ──────────────────────────────────────────────────────────────
  const adminBell = bell({
    type: "new_booking",
    title: "New Booking Received",
    message: `New booking ${booking.bookingId} created by ${booking.clientName}.`,
    recipientRole: "admin",
    referenceId: booking._id,
    referenceModel: "Booking",
  });

  const adminMail = mail(
    ADMIN_INBOX(),
    `New booking — ${booking.bookingId}`,
    shell(
      "New booking",
      `<strong>${booking.clientName}</strong> booked <strong>${listing}</strong>${
        gateway ? ` via ${gateway}` : ""
      }.`,
      [...bookingRows(booking), ["Vendor", vendor.name || "unresolved"]],
      null,
    ),
  );

  // Run every channel to completion regardless of which ones fail. Each helper
  // already swallows its own errors, so allSettled is belt-and-braces.
  await Promise.allSettled([guestBell, guestMail, vendorBell, vendorMail, adminBell, adminMail]);
}

/** Payment landed. Separate from the booking bell so admins can see both. */
async function notifyPaymentReceived(payment, { gateway } = {}) {
  if (!payment) return;
  await bell({
    type: "payment_received",
    title: "Payment Received",
    message: `Payment of ${money(payment.amount)} received from ${payment.personName}${
      gateway ? ` via ${gateway}` : ""
    }.`,
    recipientRole: "admin",
    referenceId: payment._id,
    referenceModel: "Payment",
  });
}

module.exports = {
  notifyNewBooking,
  notifyPaymentReceived,
  resolveVendor,
  // exported for tests
  pickVendorIdentity,
};
