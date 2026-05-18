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

// Parse "₹6,000.50" -> 6000.5; safe against any odd Payment.amount shapes.
function parseAmount(val) {
  if (val == null) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

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
    paidPayments,
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
    Payment.find({ status: "completed" }).lean(),
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

  const revenueTotal = paidPayments.reduce((sum, p) => sum + parseAmount(p.amount), 0);

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
