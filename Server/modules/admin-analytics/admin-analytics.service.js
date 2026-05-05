/**
 * Admin analytics service.
 *
 * Two endpoints:
 *   - overview: per-category property/booking/revenue/impressions/clicks counts
 *   - report:   tabbed paginated table view (users / vendors / payments /
 *               offerings / bookings) with optional search + sortBy
 */
const Management = require("../../models/Management");
const Booking = require("../../models/Booking");
const Payment = require("../../models/Payment");
const AdminAnalyticsMetric = require("../../models/AdminAnalyticsMetric");
const User = require("../../models/User");
const Vendor = require("../../models/Vendor");

const CATEGORIES = ["camper-van", "unique-stay", "activity"];

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCategory(input) {
  if (!input) return undefined;
  const v = String(input).toLowerCase();
  if (v.includes("camper")) return "camper-van";
  if (v.includes("unique")) return "unique-stay";
  if (v.includes("activity")) return "activity";
  return undefined;
}

function parseAmount(val) {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

async function getStatsForCategory(cat) {
  const keyword = cat === "unique-stay" ? "unique" : cat.split("-")[0];
  const serviceNameRegex = new RegExp(escapeRegex(keyword), "i");
  const managementQuery = { serviceName: serviceNameRegex };

  const [
    totalProperties,
    activeProperties,
    inactiveProperties,
    totalBookings,
    payments,
    metricsAgg,
  ] = await Promise.all([
    Management.countDocuments(managementQuery),
    Management.countDocuments({ ...managementQuery, status: "active" }),
    Management.countDocuments({ ...managementQuery, status: "inactive" }),
    Booking.countDocuments({ serviceName: serviceNameRegex }),
    Payment.find({ serviceCategory: cat, status: "completed" }).lean(),
    AdminAnalyticsMetric.aggregate([
      { $match: { category: cat } },
      {
        $group: {
          _id: "$category",
          impressions: { $sum: "$impressions" },
          clicks: { $sum: "$clicks" },
        },
      },
    ]),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + parseAmount(p.amount), 0);
  const metrics = metricsAgg[0] || { impressions: 0, clicks: 0 };

  return {
    totalProperties,
    activeProperties,
    inactiveProperties,
    totalBookings,
    totalRevenue,
    impressions: metrics.impressions,
    clicks: metrics.clicks,
  };
}

async function getOverview() {
  const results = {};
  await Promise.all(
    CATEGORIES.map(async (cat) => {
      results[cat] = await getStatsForCategory(cat);
    }),
  );
  return { data: results };
}

async function getReport({
  tab = "user",
  search,
  sortBy = "createdAt",
  page = 1,
  limit = 20,
  filters,
}) {
  const skip = (Number(page) - 1) * Number(limit);
  const filtersList = filters
    ? String(filters)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // sortBy may be a category alias rather than a field name — interpret it.
  const category = normalizeCategory(sortBy);
  const sortField = category ? "createdAt" : sortBy;

  const buildOrFromFilters = (fields) => {
    if (filtersList.length === 0) return [];
    return [
      {
        $or: filtersList.flatMap((f) =>
          fields.map((fld) => ({ [fld]: new RegExp(escapeRegex(f), "i") })),
        ),
      },
    ];
  };

  const buildSearchOr = (search, fields) => {
    if (!search) return [];
    const re = new RegExp(escapeRegex(search), "i");
    return fields.map((f) => ({ [f]: re }));
  };

  let model;
  let query = {};
  let mapItems = (items) => items;

  if (tab === "payment") {
    model = Payment;
    if (category) query.serviceCategory = category;
    const or = [
      ...buildSearchOr(search, ["businessName", "personName", "servicesNames"]),
      ...buildOrFromFilters(["businessName", "personName", "servicesNames"]),
    ];
    if (or.length) query.$or = or;
  } else if (tab === "offerings") {
    model = Management;
    if (category) {
      query.serviceName = new RegExp(escapeRegex(category.split("-")[0]), "i");
    }
    const or = [
      ...buildSearchOr(search, ["brandName", "personName", "serviceName"]),
      ...buildOrFromFilters(["brandName", "personName", "serviceName", "location"]),
    ];
    if (or.length) query.$or = or;
  } else if (tab === "bookings") {
    model = Booking;
    if (category) {
      query.serviceName = new RegExp(escapeRegex(category.split("-")[0]), "i");
    }
    const or = [
      ...buildSearchOr(search, ["clientName", "serviceName", "bookingId"]),
      ...buildOrFromFilters(["clientName", "serviceName"]),
    ];
    if (or.length) query.$or = or;
  } else if (tab === "vendor") {
    model = Vendor;
    const or = [
      ...buildSearchOr(search, ["brandName", "personName", "email", "location"]),
      ...buildOrFromFilters(["brandName", "personName", "email", "location"]),
    ];
    if (or.length) query.$or = or;
    mapItems = (items) =>
      items.map((v) => ({
        ...v,
        userId: v.vendorId,
        name: v.personName || v.brandName,
      }));
  } else {
    model = User;
    const or = [
      ...buildSearchOr(search, ["name", "email", "location"]),
      ...buildOrFromFilters(["name", "email", "location"]),
    ];
    if (or.length) query.$or = or;
  }

  const [itemsRaw, count] = await Promise.all([
    model
      .find(query)
      .sort({ [sortField]: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    model.countDocuments(query),
  ]);

  return {
    data: { items: mapItems(itemsRaw), count, page: Number(page), limit: Number(limit) },
  };
}

module.exports = { getOverview, getReport };
