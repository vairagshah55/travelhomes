/**
 * Vehicle compliance-document expiry — the date arithmetic, with no I/O.
 *
 * A rental vehicle carries two dated documents: the insurance policy and the
 * PUC (pollution-under-control) certificate. Either one lapsing makes the
 * vehicle illegal to hand to a guest, so the listing has to come off the
 * catalog the day it happens — not the next time somebody notices.
 *
 * Everything here is pure so the same rules can be applied from the nightly
 * sweep, from the read path (as a belt-and-braces filter, for the window
 * between a document lapsing and the sweep running), and from the tests.
 *
 * Timezone. Expiry dates are collected by an `<input type="date">`, so they
 * arrive as "YYYY-MM-DD" and Mongo stores them at UTC midnight — they are
 * calendar dates, not instants. Comparing them against `new Date()` would
 * expire a policy at 05:30 IST on its own last valid day. So both sides are
 * reduced to a calendar-day index, and "today" is read in the operating
 * timezone (IST by default) rather than UTC. A document is valid through the
 * whole of its stated day and lapses at the following midnight, local time.
 */

/** Minutes east of UTC that "today" is judged in. Asia/Kolkata = +05:30. */
const TZ_OFFSET_MINUTES = Number(process.env.COMPLIANCE_TZ_OFFSET_MINUTES || 330);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * The two dated documents, in the order they are reported to a vendor.
 * `required` marks the one a listing cannot be submitted without; PUC is
 * optional at onboarding but binding the moment a date is supplied.
 */
const COMPLIANCE_DOCS = [
  { key: "insurance", field: "insuranceExpiry", label: "Insurance", required: true },
  { key: "puc", field: "pucExpiry", label: "PUC certificate", required: false },
];

/** Days-before-expiry at which the vendor is warned. Descending. */
const REMINDER_THRESHOLDS = [30, 15, 7, 3, 1];

/** How far ahead a document counts as "expiring soon" in the UI. */
const EXPIRING_SOON_DAYS = REMINDER_THRESHOLDS[0];

/** Calendar-day index of a stored expiry date (which sits at UTC midnight). */
function dayIndexOf(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / MS_PER_DAY);
}

/** Calendar-day index of "now", read in the operating timezone. */
function todayIndex(now = new Date()) {
  const shifted = new Date(now.getTime() + TZ_OFFSET_MINUTES * 60 * 1000);
  return Math.floor(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) / MS_PER_DAY,
  );
}

/**
 * The instant before which a stored expiry counts as lapsed, as a Date usable
 * in a Mongo `$lt`. Everything strictly earlier than the current local day is
 * expired; the current day itself is still valid.
 */
function expiredBefore(now = new Date()) {
  return new Date(todayIndex(now) * MS_PER_DAY);
}

/** Same, for "expires within `days` days" — inclusive of the day itself. */
function expiringBefore(days, now = new Date()) {
  return new Date((todayIndex(now) + days + 1) * MS_PER_DAY);
}

/** Whole days from today until `value`. Negative once it has lapsed. */
function daysUntil(value, now = new Date()) {
  const idx = dayIndexOf(value);
  if (idx === null) return null;
  return idx - todayIndex(now);
}

/** "YYYY-MM-DD" for a stored expiry, or "" — the shape the date inputs want. */
function toDateKey(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** "1 Sep 2026" for email and UI copy. */
function formatExpiry(value) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Assess one listing's documents.
 *
 * Returns, for a doc carrying `insuranceExpiry` / `pucExpiry`:
 *   state      "ok" | "missing" | "expiring" | "expired"
 *   expired    [{ key, label, expiry, days }] — days is negative
 *   expiring   [{ key, label, expiry, days }] — days is 0…30
 *   missing    [{ key, label }] — required date absent
 *   docs       every document with its own verdict, for rendering
 *   soonest    the nearest days-until across the present documents, or null
 *
 * `state` is the worst verdict across both documents, which is what "any one
 * of them expires" means in practice: one lapsed date condemns the listing
 * however healthy the other is.
 */
function evaluateCompliance(source, now = new Date()) {
  const docs = COMPLIANCE_DOCS.map((def) => {
    const expiry = source ? source[def.field] : null;
    const days = daysUntil(expiry, now);

    let state = "ok";
    if (days === null) state = def.required ? "missing" : "absent";
    else if (days < 0) state = "expired";
    else if (days <= EXPIRING_SOON_DAYS) state = "expiring";

    return { ...def, expiry: expiry || null, dateKey: toDateKey(expiry), days, state };
  });

  const expired = docs.filter((d) => d.state === "expired");
  const expiring = docs.filter((d) => d.state === "expiring");
  const missing = docs.filter((d) => d.state === "missing");

  const present = docs.filter((d) => d.days !== null).map((d) => d.days);
  const soonest = present.length ? Math.min(...present) : null;

  let state = "ok";
  if (expired.length) state = "expired";
  else if (missing.length) state = "missing";
  else if (expiring.length) state = "expiring";

  return { state, docs, expired, expiring, missing, soonest };
}

/** "Insurance and PUC certificate" / "Insurance" — for subject lines. */
function listLabels(entries) {
  const labels = entries.map((e) => e.label);
  if (labels.length <= 1) return labels[0] || "";
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/**
 * The largest threshold that `days` has just crossed, or null when the vendor
 * is not due a warning today. Sending at "days <= 30" every sweep would mean a
 * daily email for a month; this collapses that to five, at 30/15/7/3/1.
 */
function reminderThresholdFor(days) {
  if (days === null || days < 0) return null;
  // Thresholds are descending, so the last one still satisfied is the tightest
  // band `days` falls into — 25 days out reports 30, 10 reports 15, 0 reports 1.
  let matched = null;
  for (const t of REMINDER_THRESHOLDS) {
    if (days <= t) matched = t;
  }
  return matched;
}

module.exports = {
  COMPLIANCE_DOCS,
  REMINDER_THRESHOLDS,
  EXPIRING_SOON_DAYS,
  TZ_OFFSET_MINUTES,
  dayIndexOf,
  todayIndex,
  expiredBefore,
  expiringBefore,
  daysUntil,
  toDateKey,
  formatExpiry,
  evaluateCompliance,
  listLabels,
  reminderThresholdFor,
};
