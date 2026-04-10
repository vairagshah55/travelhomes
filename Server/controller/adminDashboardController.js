const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Management = require('../models/Management');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const HelpDesk = require('../models/HelpDesk');

/**
 * Helper to parse currency-like strings (e.g., "₹6,000", "$5,000.50") to number 6000 or 5000.50
 */
function parseAmountToNumber(val) {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.\-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

/**
 * GET /api/admin/dashboard
 * Returns summary stats for admin dashboard
 */
const getAdminDashboard = async (_req, res) => {
  try {
    // Query totals in parallel for performance
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
      monthlyBookings
    ] = await Promise.all([
      // Users
      User.countDocuments({}),
      User.countDocuments({ status: 'active' }),
      // Vendors
      Vendor.countDocuments({}),
      Vendor.countDocuments({ status: 'active' }),
      Vendor.countDocuments({ status: 'pending_kyc' }),
      // Listings
      Management.countDocuments({}),
      Management.countDocuments({ status: { $in: ['pending', 'inactive'] } }),
      // Bookings
      Booking.countDocuments({}),
      Booking.countDocuments({ bookingStatus: 'confirmed' }),
      Booking.countDocuments({ bookingStatus: 'completed' }),
      Booking.countDocuments({ bookingStatus: 'cancelled' }),
      // Revenue (all completed payments)
      Payment.find({ status: 'completed' }).lean(),
      // Recent Helpdesk tickets
      HelpDesk.find({}, { _id: 1, vendorName: 1, vendorEmail: 1, email: 1, subject: 1, status: 1, description: 1, name: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // Monthly Revenue (last 6 months)
      Payment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
        {
          $group: {
            _id: { $month: "$createdAt" },
            total: { $sum: { $toDouble: "$amount" } } // Assuming amount is stored as string or number
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      // Monthly Users (last 6 months)
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
        {
          $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      // Monthly Vendors (last 6 months)
      Vendor.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
        {
          $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      // Monthly Bookings (last 6 months)
      Booking.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
        {
          $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ])
    ]);

    const revenueTotal = paidPayments.reduce((sum, p) => sum + parseAmountToNumber(p.amount), 0);

    // Helper to format monthly data
    const formatMonthlyData = (data, labelKey = 'count') => {
       const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
       // Initialize last 6 months
       const result = [];
       const today = new Date();
       for (let i = 5; i >= 0; i--) {
         const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
         const monthIndex = d.getMonth() + 1; // 1-12
         const monthName = months[d.getMonth()];
         const found = data.find(item => item._id === monthIndex);
         result.push({
           name: monthName,
           [labelKey]: found ? (labelKey === 'total' ? found.total : found.count) : 0
         });
       }
       return result;
    };

    const graphs = {
      revenue: formatMonthlyData(monthlyRevenue, 'total'),
      users: formatMonthlyData(monthlyUsers, 'count'),
      vendors: formatMonthlyData(monthlyVendors, 'count'),
      bookings: formatMonthlyData(monthlyBookings, 'count')
    };

    return res.status(200).json({
      success: true,
      data: {
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
        revenueTotal,
        latestTickets,
        graphs
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAdminDashboard
};