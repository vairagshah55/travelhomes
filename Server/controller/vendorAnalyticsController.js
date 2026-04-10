const CalendarBooking = require('../models/CalendarBooking');
const VendorAnalyticsSnapshot = require('../models/VendorAnalyticsSnapshot');
const AdminAnalyticsMetric = require('../models/AdminAnalyticsMetric');
const Payment = require('../models/Payment');
const Management = require('../models/Management');

// Compute counts from CalendarBooking
async function computeCounts() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const [total, cancelled] = await Promise.all([
      CalendarBooking.countDocuments({}),
      CalendarBooking.countDocuments({ status: 'cancelled' }),
    ]);
    
    const [upcoming, past] = await Promise.all([
      CalendarBooking.countDocuments({
        startDate: { $gte: startOfToday }
      }),
      CalendarBooking.countDocuments({
        endDate: { $lt: startOfToday }
      }),
    ]);
    
    // Aggregated metrics (impressions/clicks)
    const metricsAgg = await AdminAnalyticsMetric.aggregate([
      { 
        $group: {
          _id: null,
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' }
        }
      }
    ]);
    const metrics = metricsAgg?.[0] || { impressions: 0, clicks: 0 };
    
    // Payments summary - Sum of amounts
    const [paymentsReceivedAgg, paymentsPendingAgg] = await Promise.all([
      Payment.aggregate([
        { $match: { status: { $in: ['completed', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
    ]);

    const paymentsReceived = paymentsReceivedAgg[0]?.total || 0;
    const paymentsPending = paymentsPendingAgg[0]?.total || 0;
    
    // Properties summary
    const [propertiesApproved, propertiesPending] = await Promise.all([
      Management.countDocuments({ status: 'approved' }),
      Management.countDocuments({ status: 'pending' }),
    ]);
    
    return {
      total,
      upcoming,
      past,
      cancelled,
      metrics: { 
        impressions: metrics.impressions || 0, 
        clicks: metrics.clicks || 0 
      },
      payments: {
        received: paymentsReceived,
        pending: paymentsPending
      },
      properties: {
        approved: propertiesApproved,
        pending: propertiesPending
      }
    };
  } catch (error) {
    console.error('Error in computeCounts:', error);
    throw error;
  }
}

const getVendorAnalyticsCounts = async (req, res) => {
  try {
    const counts = await computeCounts();
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

    // 2. Aggregation for Visitors (AdminAnalyticsMetric impressions)
    const visitorsAgg = await AdminAnalyticsMetric.aggregate(getPipeline('AdminAnalyticsMetric', 'metricDate', 'impressions'));

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

module.exports = {
  getVendorAnalyticsCounts,
  createVendorAnalyticsSnapshot,
  getLatestVendorAnalyticsSnapshot,
  getVendorAnalyticsGraphs
};