const CalendarBooking = require('../models/CalendarBooking');
const VendorAnalyticsSnapshot = require('../models/VendorAnalyticsSnapshot');
const AdminAnalyticsMetric = require('../models/AdminAnalyticsMetric');
const Payment = require('../models/Payment');
const Management = require('../models/Management');
const Offer = require('../models/Offer');
const Vendor = require('../models/Vendor');

// Compute counts — optionally scoped to a single vendor
async function computeCounts(vendorId) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // If vendorId is supplied, get the vendor's offer names first so we can
    // filter CalendarBooking by resourceName (bookings reference the offer name).
    let vendorOfferNames = null;
    let vendorOfferIds = null;
    let vendorOfferFilter = null;
    if (vendorId) {
      // Search by vendorId OR userId (offers use one or both)
      vendorOfferFilter = { $or: [{ vendorId }, { userId: vendorId }] };
      const vendorOffers = await Offer.find(
        vendorOfferFilter,
        { name: 1, _id: 1 }
      ).lean();
      vendorOfferNames = vendorOffers.map((o) => o.name);
      vendorOfferIds = vendorOffers.map((o) => o._id);
    }

    // Booking filter
    const bookingFilter = vendorOfferNames
      ? { resourceName: { $in: vendorOfferNames } }
      : {};

    const [total, cancelled] = await Promise.all([
      CalendarBooking.countDocuments(bookingFilter),
      CalendarBooking.countDocuments({ ...bookingFilter, status: 'cancelled' }),
    ]);

    const [upcoming, past] = await Promise.all([
      CalendarBooking.countDocuments({ ...bookingFilter, startDate: { $gte: startOfToday } }),
      CalendarBooking.countDocuments({ ...bookingFilter, endDate: { $lt: startOfToday } }),
    ]);

    // Clicks: per-offer counter on Offer model (1 per user click action — correct as-is)
    const offerMatch = vendorOfferFilter ? { $match: vendorOfferFilter } : null;
    const clickPipeline = [
      ...(offerMatch ? [offerMatch] : []),
      { $group: { _id: null, clicks: { $sum: '$clicks' } } },
    ];

    // Impressions: 1 per page load per vendor (stored in AdminAnalyticsMetric with category='listing')
    const listingFilter = vendorOfferIds
      ? { serviceId: { $in: vendorOfferIds }, category: 'listing' }
      : { category: 'listing' };

    // Visitors: deduplicated per day per offer (stored in AdminAnalyticsMetric for offer-detail views)
    const offerViewFilter = vendorOfferIds
      ? { serviceId: { $in: vendorOfferIds }, category: { $in: ['activity', 'camper-van', 'unique-stay'] } }
      : { category: { $in: ['activity', 'camper-van', 'unique-stay'] } };

    const [clickAgg, impressionAgg, visitorAgg] = await Promise.all([
      Offer.aggregate(clickPipeline),
      AdminAnalyticsMetric.aggregate([
        { $match: listingFilter },
        { $group: { _id: null, total: { $sum: '$impressions' } } },
      ]),
      AdminAnalyticsMetric.aggregate([
        { $match: offerViewFilter },
        { $group: { _id: null, total: { $sum: '$visitors' } } },
      ]),
    ]);

    const metrics = {
      impressions: impressionAgg[0]?.total || 0,
      clicks: clickAgg[0]?.clicks || 0,
      visitors: visitorAgg[0]?.total || 0,
    };

    // Payments summary (global — no vendor link on Payment model yet)
    const [paymentsReceivedAgg, paymentsPendingAgg] = await Promise.all([
      Payment.aggregate([
        { $match: { status: { $in: ['completed', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);
    const paymentsReceived = paymentsReceivedAgg[0]?.total || 0;
    const paymentsPending = paymentsPendingAgg[0]?.total || 0;

    // Listed properties — count from Offer model (vendor-scoped)
    const propFilter = vendorOfferFilter || {};
    const [propertiesApproved, propertiesPending] = await Promise.all([
      Offer.countDocuments({ ...propFilter, status: 'approved' }),
      Offer.countDocuments({ ...propFilter, status: 'pending' }),
    ]);

    return {
      total,
      upcoming,
      past,
      cancelled,
      metrics: {
        impressions: metrics.impressions || 0,
        clicks: metrics.clicks || 0,
        visitors: metrics.visitors || 0,
      },
      payments: {
        received: paymentsReceived,
        pending: paymentsPending,
      },
      properties: {
        approved: propertiesApproved,
        pending: propertiesPending,
      },
    };
  } catch (error) {
    console.error('Error in computeCounts:', error);
    throw error;
  }
}

const getVendorAnalyticsCounts = async (req, res) => {
  try {
    let vendorId = null;

    if (req.user) {
      // The JWT has _id (User doc ID) and email. Offers store Vendor.vendorId
      // (a custom string like "VND-xxx"), OR userId (the User doc _id as string).
      // We need to try both approaches to find the vendor's offers.
      const userDocId = String(req.user._id || req.user.id || '');
      const userEmail = req.user.email;

      // 1. Try to find the Vendor record to get vendorId
      if (userEmail) {
        const vendor = await Vendor.findOne({ email: userEmail }).lean();
        if (vendor?.vendorId) vendorId = vendor.vendorId;
      }

      // 2. If no vendorId from Vendor collection, use the user doc _id
      //    (some offers store userId instead of vendorId)
      if (!vendorId) vendorId = userDocId;
    }

    const counts = await computeCounts(vendorId);
    res.json({ success: true, data: counts });
  } catch (error) {
    console.error('Error in getVendorAnalyticsCounts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createVendorAnalyticsSnapshot = async (req, res) => {
  try {
    const counts = await computeCounts();
    
    const snapshot = new VendorAnalyticsSnapshot({
      ...counts,
      createdAt: new Date()
    });
    
    await snapshot.save();
    res.status(201).json({ success: true, data: snapshot });
  } catch (error) {
    console.error('Error in createVendorAnalyticsSnapshot:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLatestVendorAnalyticsSnapshot = async (req, res) => {
  try {
    const snapshot = await VendorAnalyticsSnapshot
      .findOne()
      .sort({ createdAt: -1 });
    
    if (!snapshot) {
      return res.status(404).json({ 
        success: false, 
        message: 'No analytics snapshot found' 
      });
    }
    
    res.json({ success: true, data: snapshot });
  } catch (error) {
    console.error('Error in getLatestVendorAnalyticsSnapshot:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVendorAnalyticsGraphs = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    const today = new Date();
    let startDate;
    let dateIterator;
    let nextDateStep;
    let formatLabel;
    let matchKey; // To match aggregation result key

    if (period === 'daily') {
      // Last 7 days
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      
      dateIterator = new Date(startDate);
      nextDateStep = (d) => d.setDate(d.getDate() + 1);
      formatLabel = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
      matchKey = (d, item) => 
        item._id.year === d.getFullYear() && 
        item._id.month === d.getMonth() + 1 && 
        item._id.day === d.getDate();
        
    } else if (period === 'yearly') {
      // Last 5 years
      startDate = new Date(today.getFullYear() - 4, 0, 1); // 5 years including current
      
      dateIterator = new Date(startDate);
      nextDateStep = (d) => d.setFullYear(d.getFullYear() + 1);
      formatLabel = (d) => d.getFullYear().toString();
      matchKey = (d, item) => item._id.year === d.getFullYear();

    } else {
      // Monthly (default) - Last 12 months
      startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
      
      dateIterator = new Date(startDate);
      nextDateStep = (d) => d.setMonth(d.getMonth() + 1);
      formatLabel = (d) => d.toLocaleDateString('en-US', { month: 'short' });
      matchKey = (d, item) => 
        item._id.year === d.getFullYear() && 
        item._id.month === d.getMonth() + 1;
    }

    // Prepare Group By for MongoDB
    let mongoGroupBy;
    if (period === 'daily') {
      mongoGroupBy = {
        year: { $year: '$dateField' },
        month: { $month: '$dateField' },
        day: { $dayOfMonth: '$dateField' }
      };
    } else if (period === 'yearly') {
      mongoGroupBy = { year: { $year: '$dateField' } };
    } else {
      mongoGroupBy = {
        year: { $year: '$dateField' },
        month: { $month: '$dateField' }
      };
    }

    // Helper to replace $dateField in aggregation
    const getPipeline = (collection, dateField, amountField) => {
      const groupBy = JSON.parse(JSON.stringify(mongoGroupBy).replace(/"\$dateField"/g, `"$${dateField}"`));
      
      const pipeline = [
        {
          $match: {
            [dateField]: { $gte: startDate }
          }
        }
      ];
      
      if (collection === 'Payment') {
        pipeline[0].$match.status = { $in: ['completed', 'paid'] };
      }
      
      pipeline.push({
        $group: {
          _id: groupBy,
          total: { $sum: `$${amountField}` }
        }
      });
      
      return pipeline;
    };

    // 1. Aggregation for Earnings (Payments)
    const earningsAgg = await Payment.aggregate(getPipeline('Payment', 'paymentDate', 'amount'));

    // 2. Aggregation for Visitors (AdminAnalyticsMetric deduplicated visitors)
    const visitorsAgg = await AdminAnalyticsMetric.aggregate(getPipeline('AdminAnalyticsMetric', 'metricDate', 'visitors'));

    // 3. Format data for frontend
    const data = [];
    const endDate = new Date(today);
    // Adjust end date for daily/monthly loop to cover current time
    if (period === 'daily') endDate.setHours(23, 59, 59, 999);
    if (period === 'monthly') endDate.setMonth(endDate.getMonth() + 1, 0); // End of current month
    if (period === 'yearly') endDate.setFullYear(endDate.getFullYear(), 11, 31);

    while (dateIterator <= endDate) {
      const label = formatLabel(dateIterator);
      
      // Find matching aggregation results
      const earning = earningsAgg.find(item => matchKey(dateIterator, item));
      const visitor = visitorsAgg.find(item => matchKey(dateIterator, item));

      data.push({
        name: label,
        fullDate: new Date(dateIterator).toISOString(),
        earnings: earning ? earning.total : 0,
        visitors: visitor ? visitor.total : 0
      });

      nextDateStep(dateIterator);
    }

    res.json({ success: true, data });

  } catch (error) {
    console.error('Error in getVendorAnalyticsGraphs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset all impression, click, and visitor data
const resetMetrics = async (req, res) => {
  try {
    // 1. Zero out impressions, clicks, visitors on all Offer docs
    await Offer.updateMany({}, { $set: { impressions: 0, clicks: 0, visitors: 0 } });

    // 2. Drop all AdminAnalyticsMetric records (daily tracking data)
    await AdminAnalyticsMetric.deleteMany({});

    res.json({ success: true, message: 'All impressions, clicks, and visitor data have been reset.' });
  } catch (error) {
    console.error('Error in resetMetrics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getVendorAnalyticsCounts,
  createVendorAnalyticsSnapshot,
  getLatestVendorAnalyticsSnapshot,
  getVendorAnalyticsGraphs,
  resetMetrics
};