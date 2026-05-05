/**
 * Vendor analytics service.
 *
 * `computeCounts` is the workhorse — when scoped by vendorId it filters
 * CalendarBookings by the vendor's offer names, and AdminAnalyticsMetric
 * by the vendor's offer ids. When unscoped (admin call), it returns
 * platform-wide totals.
 */
const CalendarBooking = require("../../models/CalendarBooking");
const VendorAnalyticsSnapshot = require("../../models/VendorAnalyticsSnapshot");
const AdminAnalyticsMetric = require("../../models/AdminAnalyticsMetric");
const Payment = require("../../models/Payment");
const Offer = require("../../models/Offer");
const Vendor = require("../../models/Vendor");
const { NotFoundError } = require("../../shared/errors");

async function computeCounts(vendorId) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let vendorOfferNames = null;
  let vendorOfferIds = null;
  let vendorOfferFilter = null;
  if (vendorId) {
    vendorOfferFilter = { $or: [{ vendorId }, { userId: vendorId }] };
    const vendorOffers = await Offer.find(vendorOfferFilter, { name: 1, _id: 1 }).lean();
    vendorOfferNames = vendorOffers.map((o) => o.name);
    vendorOfferIds = vendorOffers.map((o) => o._id);
  }

  const bookingFilter = vendorOfferNames ? { resourceName: { $in: vendorOfferNames } } : {};

  const [total, cancelled, upcoming, past] = await Promise.all([
    CalendarBooking.countDocuments(bookingFilter),
    CalendarBooking.countDocuments({ ...bookingFilter, status: "cancelled" }),
    CalendarBooking.countDocuments({ ...bookingFilter, startDate: { $gte: startOfToday } }),
    CalendarBooking.countDocuments({ ...bookingFilter, endDate: { $lt: startOfToday } }),
  ]);

  const offerMatch = vendorOfferFilter ? { $match: vendorOfferFilter } : null;
  const clickPipeline = [
    ...(offerMatch ? [offerMatch] : []),
    { $group: { _id: null, clicks: { $sum: "$clicks" } } },
  ];

  const listingFilter = vendorOfferIds
    ? { serviceId: { $in: vendorOfferIds }, category: "listing" }
    : { category: "listing" };
  const offerViewFilter = vendorOfferIds
    ? {
        serviceId: { $in: vendorOfferIds },
        category: { $in: ["activity", "camper-van", "unique-stay"] },
      }
    : { category: { $in: ["activity", "camper-van", "unique-stay"] } };

  const [clickAgg, impressionAgg, visitorAgg] = await Promise.all([
    Offer.aggregate(clickPipeline),
    AdminAnalyticsMetric.aggregate([
      { $match: listingFilter },
      { $group: { _id: null, total: { $sum: "$impressions" } } },
    ]),
    AdminAnalyticsMetric.aggregate([
      { $match: offerViewFilter },
      { $group: { _id: null, total: { $sum: "$visitors" } } },
    ]),
  ]);

  const [paymentsReceivedAgg, paymentsPendingAgg] = await Promise.all([
    Payment.aggregate([
      { $match: { status: { $in: ["completed", "paid"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const propFilter = vendorOfferFilter || {};
  const [propertiesApproved, propertiesPending] = await Promise.all([
    Offer.countDocuments({ ...propFilter, status: "approved" }),
    Offer.countDocuments({ ...propFilter, status: "pending" }),
  ]);

  return {
    total,
    upcoming,
    past,
    cancelled,
    metrics: {
      impressions: impressionAgg[0]?.total || 0,
      clicks: clickAgg[0]?.clicks || 0,
      visitors: visitorAgg[0]?.total || 0,
    },
    payments: {
      received: paymentsReceivedAgg[0]?.total || 0,
      pending: paymentsPendingAgg[0]?.total || 0,
    },
    properties: {
      approved: propertiesApproved,
      pending: propertiesPending,
    },
  };
}

// Resolve the vendorId to use as a scoping key, given an authenticated
// `req.user`. Tries Vendor.email first; falls back to user._id since some
// Offers store userId.
async function resolveVendorIdFromUser(user) {
  if (!user) return null;
  const userDocId = String(user._id || user.id || "");
  if (user.email) {
    const vendor = await Vendor.findOne({ email: user.email }).lean();
    if (vendor?.vendorId) return vendor.vendorId;
  }
  return userDocId || null;
}

async function getCounts(user) {
  const vendorId = await resolveVendorIdFromUser(user);
  const data = await computeCounts(vendorId);
  return { data };
}

async function createSnapshot() {
  const counts = await computeCounts();
  const snapshot = new VendorAnalyticsSnapshot({ ...counts, createdAt: new Date() });
  await snapshot.save();
  return { data: snapshot };
}

async function getLatestSnapshot() {
  const snapshot = await VendorAnalyticsSnapshot.findOne().sort({ createdAt: -1 });
  if (!snapshot) throw new NotFoundError("Analytics snapshot");
  return { data: snapshot };
}

// ─── Graphs (daily/monthly/yearly time series) ──────────────────────────────
function getDateBounds(period) {
  const today = new Date();
  let startDate;
  let dateIterator;
  let nextDateStep;
  let formatLabel;
  let matchKey;
  let mongoGroupBy;

  if (period === "daily") {
    startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    dateIterator = new Date(startDate);
    nextDateStep = (d) => d.setDate(d.getDate() + 1);
    formatLabel = (d) => d.toLocaleDateString("en-US", { weekday: "short" });
    matchKey = (d, item) =>
      item._id.year === d.getFullYear() &&
      item._id.month === d.getMonth() + 1 &&
      item._id.day === d.getDate();
    mongoGroupBy = {
      year: { $year: "$dateField" },
      month: { $month: "$dateField" },
      day: { $dayOfMonth: "$dateField" },
    };
  } else if (period === "yearly") {
    startDate = new Date(today.getFullYear() - 4, 0, 1);
    dateIterator = new Date(startDate);
    nextDateStep = (d) => d.setFullYear(d.getFullYear() + 1);
    formatLabel = (d) => d.getFullYear().toString();
    matchKey = (d, item) => item._id.year === d.getFullYear();
    mongoGroupBy = { year: { $year: "$dateField" } };
  } else {
    startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    dateIterator = new Date(startDate);
    nextDateStep = (d) => d.setMonth(d.getMonth() + 1);
    formatLabel = (d) => d.toLocaleDateString("en-US", { month: "short" });
    matchKey = (d, item) =>
      item._id.year === d.getFullYear() && item._id.month === d.getMonth() + 1;
    mongoGroupBy = {
      year: { $year: "$dateField" },
      month: { $month: "$dateField" },
    };
  }

  return { startDate, dateIterator, nextDateStep, formatLabel, matchKey, mongoGroupBy };
}

async function getGraphs({ period = "monthly" } = {}) {
  const { startDate, dateIterator, nextDateStep, formatLabel, matchKey, mongoGroupBy } =
    getDateBounds(period);

  const buildPipeline = (collection, dateField, amountField) => {
    // Cheap-and-cheerful $-replace JSON trick mirrors legacy controller.
    const groupBy = JSON.parse(
      JSON.stringify(mongoGroupBy).replace(/"\$dateField"/g, `"$${dateField}"`),
    );

    const match = { [dateField]: { $gte: startDate } };
    if (collection === "Payment") match.status = { $in: ["completed", "paid"] };

    return [{ $match: match }, { $group: { _id: groupBy, total: { $sum: `$${amountField}` } } }];
  };

  const [earningsAgg, visitorsAgg] = await Promise.all([
    Payment.aggregate(buildPipeline("Payment", "paymentDate", "amount")),
    AdminAnalyticsMetric.aggregate(buildPipeline("AdminAnalyticsMetric", "metricDate", "visitors")),
  ]);

  const data = [];
  const today = new Date();
  const endDate = new Date(today);
  if (period === "daily") endDate.setHours(23, 59, 59, 999);
  if (period === "monthly") endDate.setMonth(endDate.getMonth() + 1, 0);
  if (period === "yearly") endDate.setFullYear(endDate.getFullYear(), 11, 31);

  while (dateIterator <= endDate) {
    const earning = earningsAgg.find((item) => matchKey(dateIterator, item));
    const visitor = visitorsAgg.find((item) => matchKey(dateIterator, item));
    data.push({
      name: formatLabel(dateIterator),
      fullDate: new Date(dateIterator).toISOString(),
      earnings: earning ? earning.total : 0,
      visitors: visitor ? visitor.total : 0,
    });
    nextDateStep(dateIterator);
  }

  return { data };
}

async function resetMetrics() {
  await Promise.all([
    Offer.updateMany({}, { $set: { impressions: 0, clicks: 0, visitors: 0 } }),
    AdminAnalyticsMetric.deleteMany({}),
  ]);
  return { message: "All impressions, clicks, and visitor data have been reset." };
}

module.exports = {
  getCounts,
  createSnapshot,
  getLatestSnapshot,
  getGraphs,
  resetMetrics,
};
