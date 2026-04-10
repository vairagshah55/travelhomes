const { Request, Response } = require('express');
const Management = require('../models/Management');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const AdminAnalyticsMetric = require('../models/AdminAnalyticsMetric');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

// normalize category values across UI/backend
function normalizeCategory(input) {
  if (!input) return undefined;
  const v = input.toLowerCase();
  if (v.includes('camper')) return 'camper-van';
  if (v.includes('unique')) return 'unique-stay';
  if (v.includes('activity')) return 'activity';
  return undefined;
}

function parseAmountToNumber(val) {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

// GET /api/adminAnalytics
const getAdminAnalyticsOverview = async (req, res) => {
  try {
    const categories = ['camper-van', 'unique-stay', 'activity'];
    
    const getStats = async (cat) => {
       // specific logic for regex matching based on category name
       // camper-van -> camper
       // unique-stay -> unique
       // activity -> activity
       let keyword = cat.split('-')[0];
       if (cat === 'unique-stay') keyword = 'unique'; 
       
       const serviceNameRegex = new RegExp(keyword, 'i');
       
       const managementQuery = { serviceName: serviceNameRegex };
       
       const [totalProperties, activeProperties, inactiveProperties] = await Promise.all([
          Management.countDocuments(managementQuery),
          Management.countDocuments({ ...managementQuery, status: 'active' }),
          Management.countDocuments({ ...managementQuery, status: 'inactive' }),
       ]);

        const bookingQuery = { serviceName: serviceNameRegex };
        const totalBookings = await Booking.countDocuments(bookingQuery);

        const paymentQuery = { serviceCategory: cat, status: 'completed' };
        const payments = await Payment.find(paymentQuery).lean();
        const totalRevenue = payments.reduce((sum, p) => sum + parseAmountToNumber(p.amount), 0);
        
        const metricsAgg = await AdminAnalyticsMetric.aggregate([
            { $match: { category: cat } },
            {
                $group: {
                    _id: '$category',
                    impressions: { $sum: '$impressions' },
                    clicks: { $sum: '$clicks' },
                },
            },
        ]);
        const metrics = metricsAgg[0] || { impressions: 0, clicks: 0 };

        return {
            totalProperties,
            activeProperties,
            inactiveProperties,
            totalBookings, 
            totalRevenue,
            impressions: metrics.impressions,
            clicks: metrics.clicks
        };
    };

    const results = {};
    await Promise.all(categories.map(async (cat) => {
        results[cat] = await getStats(cat);
    }));

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Admin analytics overview error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// GET /api/adminAnalyticsReport
// Query=user|vendor|payment|offerings|bookings, search, sortBy, page, limit
const getAdminAnalyticsReport = async (req, res) => {
  try {
    const tab = (req.query.tab) || 'user';
    const search = (req.query.search) || '';
    const sortByRaw = (req.query.sortBy) || 'createdAt';
    const page = Math.max(parseInt((req.query.page) || '1', 10), 1);
    const limit = Math.max(parseInt((req.query.limit) || '20', 10), 1);
    const skip = (page - 1) * limit;
    const filtersParam = (req.query.filters) || '';
    
    const filters = filtersParam
      ? filtersParam.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    // Interpret "Sort By" dropdown filter per UI (camper-van | unique-stay | activity)
    const category = normalizeCategory(sortByRaw);
    const sortField = category ? 'createdAt' : sortByRaw; // fallback to createdAt if it's actually a category

    const buildOrFromFilters = (fields) =>
      filters.length
        ? [{ $or: filters.flatMap((f) => fields.map((fld) => ({ [fld]: new RegExp(f, 'i') }))) }]
        : [];

    if (tab === 'payment') {
      const q = {};
      if (category) q.serviceCategory = category;
      const or = [];
      if (search) {
        or.push(
          { businessName: new RegExp(search, 'i') },
          { personName: new RegExp(search, 'i') },
          { servicesNames: new RegExp(search, 'i') }
        );
      }
      or.push(...buildOrFromFilters(['businessName', 'personName', 'servicesNames']));
      if (or.length) q.$or = or;

      const [items, count] = await Promise.all([
        Payment.find(q).sort({ [sortField]: -1 }).skip(skip).limit(limit).lean(),
        Payment.countDocuments(q),
      ]);

      return res.status(200).json({ 
        success: true, 
        data: { items, count, page, limit } 
      });
    }

    if (tab === 'offerings') {
      const q = {};
      if (category) q.serviceName = new RegExp(category.split('-')[0], 'i'); // loose match
      const or = [];
      if (search) {
        or.push(
          { brandName: new RegExp(search, 'i') },
          { personName: new RegExp(search, 'i') },
          { serviceName: new RegExp(search, 'i') }
        );
      }
      or.push(...buildOrFromFilters(['brandName', 'personName', 'serviceName', 'location']));
      if (or.length) q.$or = or;

      const [items, count] = await Promise.all([
        Management.find(q).sort({ [sortField]: -1 }).skip(skip).limit(limit).lean(),
        Management.countDocuments(q),
      ]);

      return res.status(200).json({ 
        success: true, 
        data: { items, count, page, limit } 
      });
    }

    if (tab === 'bookings') {
      const q = {};
      if (category) q.serviceName = new RegExp(category.split('-')[0], 'i');
      const or = [];
      if (search) {
        or.push(
          { clientName: new RegExp(search, 'i') },
          { serviceName: new RegExp(search, 'i') },
          { bookingId: new RegExp(search, 'i') }
        );
      }
      or.push(...buildOrFromFilters(['clientName', 'serviceName']));
      if (or.length) q.$or = or;

      const [items, count] = await Promise.all([
        Booking.find(q).sort({ [sortField]: -1 }).skip(skip).limit(limit).lean(),
        Booking.countDocuments(q),
      ]);

      return res.status(200).json({ 
        success: true, 
        data: { items, count, page, limit } 
      });
    }

    if (tab === 'vendor') {
      const q = {};
      const or = [];
      if (search) {
        or.push(
          { brandName: new RegExp(search, 'i') },
          { personName: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
          { location: new RegExp(search, 'i') }
        );
      }
      or.push(...buildOrFromFilters(['brandName', 'personName', 'email', 'location']));
      if (or.length) q.$or = or;

      const [itemsRaw, count] = await Promise.all([
        Vendor.find(q).sort({ [sortField]: -1 }).skip(skip).limit(limit).lean(),
        Vendor.countDocuments(q),
      ]);

      const items = itemsRaw.map(v => ({
        ...v,
        userId: v.vendorId,
        name: v.personName || v.brandName,
        // userSince is handled by createdAt in UI if missing
      }));

      return res.status(200).json({ 
        success: true, 
        data: { items, count, page, limit } 
      });
    }

    // default tab: user — use Users model
    const q = {};
    const or = [];
    if (search) {
      or.push(
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') }
      );
    }
    or.push(...buildOrFromFilters(['name', 'email', 'location']));
    if (or.length) q.$or = or;

    const [items, count] = await Promise.all([
      User.find(q).sort({ [sortField]: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(q),
    ]);

    return res.status(200).json({ 
      success: true, 
      data: { items, count, page, limit } 
    });
  } catch (error) {
    console.error('Admin analytics report error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = {
  getAdminAnalyticsOverview,
  getAdminAnalyticsReport,
};