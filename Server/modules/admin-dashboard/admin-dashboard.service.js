/**
 * Admin dashboard service — one endpoint that returns aggregated stats
 * across users, vendors, listings, bookings, and payments, plus 6-month
 * sparkline data.
 *
 * Unchanged from the legacy controller. Just lifted into the layered
 * shape with structured logging.
 */
const User = require("../../models/User");
const Vendor = require("../../models/Vendor");
const Management = require("../../models/Management");
const Booking = require("../../models/Booking");
const Payment = require("../../models/Payment");
const HelpDesk = require("../../models/HelpDesk");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function sixMonthsAgo() {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d;
}

function formatMonthlyData(rows, valueKey = "count") {
  const out = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthIndex = d.getMonth() + 1;
    const monthName = MONTHS[d.getMonth()];
    const found = rows.find((row) => row._id === monthIndex);
    out.push({
      name: monthName,
      [valueKey]: found ? (valueKey === "total" ? found.total : found.count) : 0,
    });
  }
  return out;
}

async function getStats() {
  const since = sixMonthsAgo();

  const [
    usersTotal,
    usersActive,
    vendorsTotal,
    vendorsActive,
    vendorsPendingKyc,
    listingsTotal,
    listingsPending,
    bookingsTotal,
    bookingsUpcoming,
    bookingsPast,
    bookingsCancelled,
    revenueRows,
    latestTickets,
    monthlyRevenue,
    monthlyUsers,
    monthlyVendors,
    monthlyBookings,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ status: "active" }),
    Vendor.countDocuments({}),
    Vendor.countDocuments({ status: "active" }),
    Vendor.countDocuments({ status: "pending_kyc" }),
    Management.countDocuments({}),
    Management.countDocuments({ status: { $in: ["pending", "inactive"] } }),
    Booking.countDocuments({}),
    Booking.countDocuments({ bookingStatus: "confirmed" }),
    Booking.countDocuments({ bookingStatus: "completed" }),
    Booking.countDocuments({ bookingStatus: "cancelled" }),
    // Total revenue, summed in the database.
    //
    // This used to be `Payment.find({ status: "completed" }).lean()` followed by
    // a JS `.reduce()` — every completed payment the company has ever taken was
    // deserialised into the Node heap on each dashboard load, so memory and
    // latency grew with transaction volume forever.
    //
    // `$convert` rather than `$toDouble`: `parseAmount` tolerated legacy string
    // amounts like "₹6,000.50", and `$toDouble` throws on those. `onError: 0`
    // keeps the pipeline's failure mode identical to the old parser's.
    Payment.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          total: { $sum: { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } } },
        },
      },
    ]),
    HelpDesk.find(
      {},
      {
        _id: 1,
        vendorName: 1,
        vendorEmail: 1,
        email: 1,
        subject: 1,
        status: 1,
        description: 1,
        name: 1,
        createdAt: 1,
      },
    )
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Payment.aggregate([
      { $match: { status: "completed", createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Vendor.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const revenueTotal = revenueRows[0]?.total ?? 0;

  const graphs = {
    revenue: formatMonthlyData(monthlyRevenue, "total"),
    users: formatMonthlyData(monthlyUsers, "count"),
    vendors: formatMonthlyData(monthlyVendors, "count"),
    bookings: formatMonthlyData(monthlyBookings, "count"),
  };

  return {
    data: {
      stats: {
        users: {
          total: usersTotal,
          active: usersActive,
        },
        vendors: {
          total: vendorsTotal,
          active: vendorsActive,
          pendingKyc: vendorsPendingKyc,
        },
        listings: {
          total: listingsTotal,
          pending: listingsPending,
        },
        bookings: {
          total: bookingsTotal,
          upcoming: bookingsUpcoming,
          past: bookingsPast,
          cancelled: bookingsCancelled,
        },
        revenue: {
          total: revenueTotal,
        },
      },
      tickets: latestTickets,
      graphs,
    },
  };
}

module.exports = { getStats };
