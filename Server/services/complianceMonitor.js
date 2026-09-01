/**
 * Vehicle compliance monitor — keeps the catalog honest about paperwork.
 *
 * A vehicle listing carries two dated documents (insurance, PUC). The rule the
 * business wants is blunt: if EITHER one is out of date the vehicle is not
 * rentable, so the listing comes off the catalog that day and stays off until
 * the vendor supplies a new date. Nobody should have to remember to check.
 *
 * Three things happen on every pass, in this order:
 *
 *   1. take down  documents already expired flip the listing to `deactivated`
 *                 under a `complianceHold`, and tell the vendor and the admin.
 *   2. remind     documents expiring within 30 days warn the vendor at
 *                 30/15/7/3/1 days out — one email per band, not one per day.
 *   3. restore    listings on hold whose dates are all valid again go back to
 *                 whatever status they held before the hold. This is what makes
 *                 an admin editing a date by hand work as well as the vendor's
 *                 own renewal.
 *
 * Everything is best-effort per listing: a dead SMTP host or one malformed
 * document must not stop the other 200 from being swept. The pass is also safe
 * to run concurrently — Passenger may fork several processes — because each
 * take-down claims its listing with a conditional update, and the reminder
 * ladder is stored on the listing rather than in memory.
 */
const Offer = require("../models/Offer");
const VehicleOnboarding = require("../models/VehicleOnboarding");
const Notification = require("../models/Notification");
const { sendEmailSilent } = require("../lib/email-sender/sender");
const { resolveVendor } = require("../shared/bookingNotifications");
const logger = require("../shared/logger");
const {
  COMPLIANCE_DOCS,
  evaluateCompliance,
  expiredBefore,
  expiringBefore,
  EXPIRING_SOON_DAYS,
  formatExpiry,
  listLabels,
  reminderThresholdFor,
} = require("../shared/vehicleCompliance");

const FROM = () =>
  process.env.MAIL_FROM_ADDRESS ||
  process.env.EMAIL_SENDER ||
  process.env.MAIL_USERNAME ||
  process.env.EMAIL_USER ||
  "no-reply@travelhomes.com";

const ADMIN_INBOX = () =>
  process.env.ADMIN_ALERT_EMAIL || process.env.EMAIL_SENDER || process.env.MAIL_USERNAME || null;

/** Where a vendor goes to fix it. */
const VENDOR_OFFERINGS_URL = () => {
  const base = process.env.FRONTEND_URL || process.env.APP_URL || "https://socialpartner.in";
  return `${base.replace(/\/$/, "")}/offering`;
};

/* ── Email bodies ────────────────────────────────────────────────────────── */

/**
 * Same shell as the booking mails, so a vendor gets one recognisable sender.
 * `tone` only paints the header bar: amber for a warning, red for a take-down,
 * teal for the all-clear.
 */
const TONES = { warn: "#b45309", down: "#b42318", ok: "#0f7478" };

const shell = (tone, heading, intro, rows, closing) => `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f6f8fb;padding:28px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:${TONES[tone] || TONES.ok};color:#ffffff;padding:22px 26px;">
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
        <p style="margin:22px 0 0;">
          <a href="${VENDOR_OFFERINGS_URL()}" style="display:inline-block;background:#0f7478;color:#ffffff;text-decoration:none;font-weight:600;padding:11px 20px;border-radius:10px;">Update documents</a>
        </p>
        ${closing ? `<p style="margin:18px 0 0;color:#5f6a82;">${closing}</p>` : ""}
      </div>
    </div>
  </div>`;

/** Every dated document on the listing, as label/value rows. */
const documentRows = (evaluation) =>
  evaluation.docs
    .filter((d) => d.state !== "absent")
    .map((d) => {
      const when = formatExpiry(d.expiry);
      if (d.state === "expired") return [d.label, `${when} — expired`];
      if (d.state === "missing") return [d.label, "not provided"];
      if (d.state === "expiring")
        return [d.label, `${when} — ${d.days} day${d.days === 1 ? "" : "s"} left`];
      return [d.label, when];
    });

const plural = (n) => (n === 1 ? "" : "s");

/* ── Channels ────────────────────────────────────────────────────────────── */

async function mail(to, subject, html) {
  if (!to) return;
  try {
    const result = await sendEmailSilent({ from: FROM(), to, subject, html });
    if (!result || !result.success) {
      logger.error({ to, subject, err: result && result.error }, "[compliance] email failed");
    }
  } catch (err) {
    logger.error({ err: err.message, to, subject }, "[compliance] email threw");
  }
}

/** A bell that fails is logged and forgotten. */
async function bell(fields) {
  try {
    await Notification.create(fields);
  } catch (err) {
    logger.error({ err: err.message, title: fields.title }, "[compliance] bell failed");
  }
}

/* ── Take-down ───────────────────────────────────────────────────────────── */

/**
 * Pull one listing off the catalog.
 *
 * The update is conditional on the hold not already being active, so only the
 * process that actually flips it sends the mail. `previousStatus` remembers
 * what to restore — a vendor who had already paused the listing gets it back
 * paused, not live.
 */
async function takeDownOne(offer, evaluation) {
  const documents = evaluation.expired.map((d) => d.key);
  const since = new Date();

  const claimed = await Offer.findOneAndUpdate(
    { _id: offer._id, "complianceHold.active": { $ne: true } },
    {
      $set: {
        status: "deactivated",
        complianceHold: {
          active: true,
          documents,
          since,
          previousStatus: offer.status,
        },
      },
    },
    { new: true },
  );
  if (!claimed) return false;

  if (offer.sourceId) {
    try {
      await VehicleOnboarding.updateOne(
        { _id: offer.sourceId },
        { $set: { complianceHold: { active: true, documents, since } } },
      );
    } catch (err) {
      logger.error(
        { err: err.message, offerId: String(offer._id) },
        "[compliance] source mirror failed",
      );
    }
  }

  const { email, name } = await resolveVendor(offer._id);
  const labels = listLabels(evaluation.expired);
  const many = evaluation.expired.length > 1;

  await mail(
    email,
    `Listing removed: ${labels} for "${offer.name}" has expired`,
    shell(
      "down",
      "Your listing has been removed from the site",
      `Hi ${name || "there"}, the ${labels.toLowerCase()} on <strong>${offer.name}</strong> ${
        many ? "have" : "has"
      } expired, so the listing is no longer visible to guests and cannot be booked. Bookings already confirmed are unaffected.`,
      [["Listing", offer.name], ...documentRows(evaluation)],
      "Enter the new expiry date from your renewed document and the listing goes back up immediately — it does not need approving again.",
    ),
  );

  await bell({
    type: "system_alert",
    title: "Listing removed — document expired",
    message: `"${offer.name}" was removed from the site because its ${labels.toLowerCase()} expired. Update the document to restore it.`,
    recipientRole: "vendor",
    referenceId: offer._id,
    referenceModel: "Offer",
  });

  await bell({
    type: "system_alert",
    title: "Vehicle listing auto-removed",
    message: `"${offer.name}" (vendor ${offer.vendorId || "—"}) was removed automatically: ${labels.toLowerCase()} expired.`,
    recipientRole: "admin",
    referenceId: offer._id,
    referenceModel: "Offer",
  });

  logger.warn(
    { offerId: String(offer._id), vendorId: offer.vendorId, documents },
    "[compliance] listing taken down for expired documents",
  );
  return true;
}

/* ── Reminder ────────────────────────────────────────────────────────────── */

/**
 * Warn the vendor about documents inside the 30-day window.
 *
 * The ladder is stored per document as `{ expiry, lastThreshold }`. A band is
 * skipped when it has already been sent AGAINST THE SAME DATE — renewing to a
 * later date breaks the match, so the new date starts its own ladder.
 */
async function remindOne(offer, evaluation) {
  const due = [];
  const setFields = {};

  for (const doc of evaluation.docs) {
    if (doc.state !== "expiring") continue;
    const threshold = reminderThresholdFor(doc.days);
    if (threshold === null) continue;

    const sent = (offer.complianceNotified && offer.complianceNotified[doc.key]) || {};
    const sameDate =
      sent.expiry &&
      doc.expiry &&
      new Date(sent.expiry).getTime() === new Date(doc.expiry).getTime();
    if (sameDate && sent.lastThreshold != null && sent.lastThreshold <= threshold) continue;

    due.push(doc);
    setFields[`complianceNotified.${doc.key}.expiry`] = doc.expiry;
    setFields[`complianceNotified.${doc.key}.lastThreshold`] = threshold;
  }

  if (!due.length) return false;

  // Claim the reminder before sending. If a second process is mid-sweep on the
  // same listing, only one of them writes the tighter threshold and mails.
  await Offer.updateOne({ _id: offer._id }, { $set: setFields });

  const { email, name } = await resolveVendor(offer._id);
  const soonest = Math.min(...due.map((d) => d.days));
  const labels = listLabels(due);
  const many = due.length > 1;

  await mail(
    email,
    `Action needed: ${labels} for "${offer.name}" expires in ${soonest} day${plural(soonest)}`,
    shell(
      "warn",
      "Your vehicle documents are about to expire",
      `Hi ${name || "there"}, the ${labels.toLowerCase()} on your listing <strong>${offer.name}</strong> ${
        many ? "expire" : "expires"
      } in ${soonest} day${plural(soonest)}. Once ${
        many ? "either one lapses" : "it lapses"
      } the listing is removed from the site automatically until you enter a current date.`,
      [["Listing", offer.name], ...documentRows(evaluation)],
      "Renewing takes a moment and keeps your listing live — it will not need approving again.",
    ),
  );

  await bell({
    type: "system_alert",
    title: "Vehicle documents expiring",
    message: `${labels} for "${offer.name}" expires in ${soonest} day${plural(soonest)}. Update it to keep the listing live.`,
    recipientRole: "vendor",
    referenceId: offer._id,
    referenceModel: "Offer",
  });

  logger.info(
    { offerId: String(offer._id), documents: due.map((d) => d.key), days: soonest },
    "[compliance] expiry reminder sent",
  );
  return true;
}

/* ── Restore ─────────────────────────────────────────────────────────────── */

/**
 * Put a held listing back. Returns the saved offer, or null when it was not on
 * hold or is still not compliant. Shared with the vendor-facing renewal
 * endpoint so both paths restore identically.
 */
async function restoreOne(offer, { silent = false } = {}) {
  if (!offer.complianceHold || !offer.complianceHold.active) return null;

  const evaluation = evaluateCompliance(offer);
  if (evaluation.expired.length) return null;

  // 'deactivated' is the only status the hold ever writes, so anything else
  // means a human moved the listing while it was held — leave their decision
  // alone and just clear the hold.
  const restoreTo =
    offer.status === "deactivated"
      ? offer.complianceHold.previousStatus || "approved"
      : offer.status;

  const restored = await Offer.findOneAndUpdate(
    { _id: offer._id, "complianceHold.active": true },
    {
      $set: {
        status: restoreTo,
        complianceHold: { active: false, documents: [], since: null, previousStatus: null },
      },
    },
    { new: true },
  );
  if (!restored) return null;

  if (offer.sourceId) {
    try {
      await VehicleOnboarding.updateOne(
        { _id: offer.sourceId },
        { $set: { complianceHold: { active: false, documents: [], since: null } } },
      );
    } catch {
      /* the mirror is advisory — the Offer is the source of truth */
    }
  }

  if (!silent) {
    const { email, name } = await resolveVendor(offer._id);
    await mail(
      email,
      `Back online: "${offer.name}" is live again`,
      shell(
        "ok",
        "Your listing is live again",
        `Hi ${name || "there"}, we have current documents for <strong>${offer.name}</strong> and the listing is back on the site.`,
        [["Listing", offer.name], ["Status", restoreTo], ...documentRows(evaluation)],
        "We will remind you again 30 days before the next renewal is due.",
      ),
    );

    await bell({
      type: "system_alert",
      title: "Listing restored",
      message: `"${offer.name}" is live again — its documents are current.`,
      recipientRole: "vendor",
      referenceId: offer._id,
      referenceModel: "Offer",
    });
  }

  logger.info({ offerId: String(offer._id), restoreTo }, "[compliance] listing restored");
  return restored;
}

/* ── The sweep ───────────────────────────────────────────────────────────── */

/** Best-effort per listing — one bad row must not abort the pass. */
async function forEachSafely(offers, fn, phase) {
  let count = 0;
  for (const offer of offers) {
    try {
      if (await fn(offer)) count += 1;
    } catch (err) {
      logger.error(
        { err: err.message, offerId: String(offer._id), phase },
        "[compliance] row failed",
      );
    }
  }
  return count;
}

/**
 * One full pass. Returns a summary so the admin-triggered run can report what
 * it did, and so the boot log says something useful.
 */
async function runComplianceSweep({ now = new Date() } = {}) {
  const startedAt = Date.now();
  const expiredCutoff = expiredBefore(now);
  const soonCutoff = expiringBefore(EXPIRING_SOON_DAYS, now);
  const dateFields = COMPLIANCE_DOCS.map((d) => d.field);

  // 1. Take down anything live whose paperwork has lapsed. `pending` is included
  //    deliberately: a submission sitting in the review queue past its own
  //    insurance date must not be approvable as-is.
  const expired = await Offer.find({
    serviceType: "vehicle-rental",
    status: { $in: ["approved", "pending"] },
    "complianceHold.active": { $ne: true },
    $or: dateFields.map((f) => ({ [f]: { $lt: expiredCutoff } })),
  });
  const tookDown = await forEachSafely(
    expired,
    (offer) => takeDownOne(offer, evaluateCompliance(offer, now)),
    "takedown",
  );

  // 2. Warn on anything inside the 30-day window that is still live.
  const expiring = await Offer.find({
    serviceType: "vehicle-rental",
    status: "approved",
    "complianceHold.active": { $ne: true },
    $or: dateFields.map((f) => ({ [f]: { $gte: expiredCutoff, $lt: soonCutoff } })),
  });
  const reminded = await forEachSafely(
    expiring,
    (offer) => remindOne(offer, evaluateCompliance(offer, now)),
    "reminder",
  );

  // 3. Release anything on hold that is compliant again — covers a renewal
  //    landing between sweeps as well as an admin editing the date by hand.
  const held = await Offer.find({ "complianceHold.active": true });
  const restored = await forEachSafely(
    held,
    async (offer) => !!(await restoreOne(offer)),
    "restore",
  );

  const summary = {
    scanned: expired.length + expiring.length + held.length,
    tookDown,
    reminded,
    restored,
    ms: Date.now() - startedAt,
  };
  logger.info(summary, "[compliance] sweep complete");

  // One ops digest per pass, only when something actually moved.
  if (tookDown > 0) {
    await mail(
      ADMIN_INBOX(),
      `${tookDown} vehicle listing${plural(tookDown)} removed for expired documents`,
      shell(
        "down",
        "Compliance sweep",
        "Vehicle listings were removed from the catalog automatically because their insurance or PUC certificate had expired. Vendors have been emailed.",
        [
          ["Removed", String(tookDown)],
          ["Reminders sent", String(reminded)],
          ["Restored", String(restored)],
          ["Listings scanned", String(summary.scanned)],
        ],
        "Review them under Management → Listings → Compliance hold.",
      ),
    );
  }

  return summary;
}

/* ── Scheduling ──────────────────────────────────────────────────────────── */

const SWEEP_INTERVAL_MS = Math.max(
  15 * 60 * 1000,
  Number(process.env.COMPLIANCE_SWEEP_INTERVAL_MINUTES || 360) * 60 * 1000,
);
/** Long enough after boot for the Mongo connection to be up. */
const FIRST_RUN_DELAY_MS = 60 * 1000;

let timer = null;

/**
 * In-process scheduling rather than a cron dependency: the API is a single
 * long-lived process and adding a queue/worker for one job a day would be the
 * larger change. Both handles are unref'd so they never hold the process open
 * on shutdown.
 */
function startComplianceMonitor() {
  if (process.env.COMPLIANCE_SWEEP_ENABLED === "false") {
    logger.info("[compliance] sweep disabled by COMPLIANCE_SWEEP_ENABLED=false");
    return null;
  }
  if (timer) return timer;

  const run = () =>
    runComplianceSweep().catch((err) =>
      logger.error({ err: err.message }, "[compliance] sweep failed"),
    );

  const first = setTimeout(run, FIRST_RUN_DELAY_MS);
  if (first.unref) first.unref();

  timer = setInterval(run, SWEEP_INTERVAL_MS);
  if (timer.unref) timer.unref();

  logger.info({ everyMinutes: SWEEP_INTERVAL_MS / 60000 }, "[compliance] monitor started");
  return timer;
}

function stopComplianceMonitor() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = {
  runComplianceSweep,
  startComplianceMonitor,
  stopComplianceMonitor,
  restoreOne,
  takeDownOne,
  remindOne,
};
