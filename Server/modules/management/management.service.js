/**
 * Management service.
 *
 * "Management" listings are admin-facing rows that surface every Offer
 * along with its onboarding context (business + personal details from
 * StayOnboarding / ActivityOnboarding / CaravanOnboarding) and a status
 * field that the admin can flip through approve / reject / etc.
 *
 * The legacy controller had a 600-line file with three separate places
 * that did "look up the right onboarding doc by category, fall back to
 * the other two if not found". This module pulls that into
 * `getOnboardingDetails` and uses it from `list` and `getById`.
 *
 * `setStatus` is the only mutating endpoint with real business logic —
 * approving an Offer cascades to:
 *   - Vendor.status = "approved"
 *   - User.status = "active", User.role = "vendor"
 *   - Register.userType = "vendor"
 *   - Notification + email to vendor's business email (or user's email)
 * Rejecting cascades to Vendor.status = "rejected" + email + notification.
 *
 * Notification + email failures are logged but don't fail the request —
 * status flip is the source of truth.
 */
const mongoose = require("mongoose");

const Management = require("../../models/Management");
const Offer = require("../../models/Offer");
const Vendor = require("../../models/Vendor");
const User = require("../../models/User");
const Register = require("../../models/Register");
const ActivityOnboarding = require("../../models/ActivityOnboarding");
const StayOnboarding = require("../../models/StayOnboarding");
const CaravanOnboarding = require("../../models/CaravanOnboarding");
const Feature = require("../../models/Feature");
const Notification = require("../../models/Notification");
const logger = require("../../shared/logger");
const { NotFoundError } = require("../../shared/errors");
const { sendRejectionEmail, sendApprovalEmail } = require("../../services/mailer");

function resolveCategoryName(category, featureMap) {
  if (!category) return "";
  if (featureMap[category]) return featureMap[category];
  return category;
}

/**
 * Feature id/name lookup, cached in-process.
 *
 * `list` and `getById` both need it, and it reads the entire Feature
 * collection. Features are CMS-managed reference data that changes when an
 * admin edits a category — a minute of staleness is invisible, and it takes
 * this off the per-request path.
 */
const FEATURE_MAP_TTL_MS = 60_000;
let featureMapCache = { at: 0, map: null };

async function loadFeatureMap() {
  const now = Date.now();
  if (featureMapCache.map && now - featureMapCache.at < FEATURE_MAP_TTL_MS) {
    return featureMapCache.map;
  }
  const features = await Feature.find({}).select("name").lean();
  const map = {};
  for (const f of features) {
    map[f._id.toString()] = f.name;
    if (f.name) map[f.name.toLowerCase()] = f.name;
  }
  featureMapCache = { at: now, map };
  return map;
}

/**
 * Batched lookup context for a set of offers.
 *
 * `getOnboardingDetails` used to issue its own queries per offer — 1 onboarding
 * lookup, up to 2 more for the fallback, a Vendor lookup and up to 2 User
 * lookups. `list` called it once per Offer with no pagination, so a few hundred
 * listings turned one admin request into well over a thousand queries fired
 * concurrently at a 10-connection pool, which starved every other request.
 *
 * This resolves the same data for ALL offers in a fixed 6 queries, then the
 * per-offer logic below runs against in-memory maps. Semantics are unchanged.
 */
async function loadLookupContext(offers) {
  const vendorIds = [...new Set(offers.map((o) => o.vendorId).filter(Boolean))];
  const rawUserIds = [...new Set(offers.map((o) => o.userId).filter(Boolean))];
  const objectIdUserIds = rawUserIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  // `.sort({ createdAt: -1 })` + "first write wins" reproduces the original
  // `findOne(...).sort({ createdAt: -1 })` — the most recent doc per vendor.
  const byVendor = (docs) => {
    const map = new Map();
    for (const d of docs) if (!map.has(d.vendorId)) map.set(d.vendorId, d);
    return map;
  };

  const onboardingQuery = (Model) =>
    vendorIds.length
      ? Model.find({ vendorId: { $in: vendorIds } })
          .sort({ createdAt: -1 })
          .lean()
      : Promise.resolve([]);

  const [activityDocs, stayDocs, caravanDocs, vendors, usersById, usersByUserId] =
    await Promise.all([
      onboardingQuery(ActivityOnboarding),
      onboardingQuery(StayOnboarding),
      onboardingQuery(CaravanOnboarding),
      vendorIds.length ? Vendor.find({ vendorId: { $in: vendorIds } }).lean() : [],
      objectIdUserIds.length ? User.find({ _id: { $in: objectIdUserIds } }).lean() : [],
      rawUserIds.length ? User.find({ userId: { $in: rawUserIds } }).lean() : [],
    ]);

  return {
    activity: byVendor(activityDocs),
    stay: byVendor(stayDocs),
    caravan: byVendor(caravanDocs),
    vendors: new Map(vendors.map((v) => [v.vendorId, v])),
    usersById: new Map(usersById.map((u) => [String(u._id), u])),
    usersByUserId: new Map(usersByUserId.map((u) => [u.userId, u])),
  };
}

// Resolve onboarding doc + extract business / personal details from the
// pre-loaded context. The category hint picks the preferred onboarding model,
// and we fall back to the other two if it's missing. Vendor / User docs fill in
// any gaps. Pure — no I/O; see loadLookupContext.
function getOnboardingDetails(vendorId, userId, categoryName, ctx) {
  let businessDetails = {};
  let personalDetails = {};
  let onboardingDoc = null;
  let serviceType = "Caravan";

  const catLower = (categoryName || "").toLowerCase();
  const pick = (kind) => (vendorId ? ctx[kind].get(vendorId) || null : null);

  if (catLower === "activity") {
    onboardingDoc = pick("activity");
    if (onboardingDoc) serviceType = "Activity";
  } else if (catLower === "stay") {
    onboardingDoc = pick("stay");
    if (onboardingDoc) serviceType = "Stay";
  } else {
    onboardingDoc = pick("caravan");
    if (onboardingDoc) serviceType = "Caravan";
  }

  if (!onboardingDoc) {
    if (catLower !== "activity") {
      onboardingDoc = pick("activity");
      if (onboardingDoc) serviceType = "Activity";
    }
    if (!onboardingDoc && catLower !== "stay") {
      onboardingDoc = pick("stay");
      if (onboardingDoc) serviceType = "Stay";
    }
    if (!onboardingDoc && catLower !== "caravan") {
      onboardingDoc = pick("caravan");
      if (onboardingDoc) serviceType = "Caravan";
    }
  }

  if (onboardingDoc) {
    if (onboardingDoc.businessName || onboardingDoc.brandName || onboardingDoc.companyName) {
      businessDetails = {
        name: onboardingDoc.businessName || onboardingDoc.brandName || onboardingDoc.companyName,
        email: onboardingDoc.businessEmail,
        phone: onboardingDoc.businessPhone,
        gst: onboardingDoc.gstNumber,
        address: [
          onboardingDoc.businessLocality || onboardingDoc.locality,
          onboardingDoc.businessCity || onboardingDoc.city,
          onboardingDoc.businessState || onboardingDoc.state,
          onboardingDoc.businessPincode || onboardingDoc.pincode,
        ]
          .filter(Boolean)
          .join(", "),
      };
    }

    if (onboardingDoc.firstName || onboardingDoc.lastName) {
      personalDetails = {
        name: `${onboardingDoc.firstName || ""} ${onboardingDoc.lastName || ""}`.trim(),
        dob: onboardingDoc.dateOfBirth,
        maritalStatus: onboardingDoc.maritalStatus,
        idProof: onboardingDoc.idProof,
        address: [
          onboardingDoc.personalLocality || onboardingDoc.locality,
          onboardingDoc.personalCity || onboardingDoc.city,
          onboardingDoc.personalState || onboardingDoc.state,
          onboardingDoc.personalPincode || onboardingDoc.pincode,
          onboardingDoc.personalCountry,
        ]
          .filter(Boolean)
          .join(", "),
      };
    }
  }

  if (!businessDetails.name || !personalDetails.name) {
    if (vendorId) {
      const vendor = ctx.vendors.get(vendorId);
      if (vendor) {
        if (!businessDetails.name) businessDetails.name = vendor.brandName;
        if (!businessDetails.email) businessDetails.email = vendor.email;
        if (!businessDetails.phone) businessDetails.phone = vendor.phone;
        if (!personalDetails.name) personalDetails.name = vendor.personName;
      }
    }

    if (userId && (!personalDetails.name || !businessDetails.email)) {
      // Same precedence as before: _id first, then the custom `userId` field.
      const user =
        (mongoose.Types.ObjectId.isValid(userId) ? ctx.usersById.get(String(userId)) : null) ||
        ctx.usersByUserId.get(userId) ||
        null;

      if (user) {
        if (!personalDetails.name) personalDetails.name = user.name;
        if (!businessDetails.email) businessDetails.email = user.email;
        if (!businessDetails.phone) businessDetails.phone = user.phone;
      }
    }
  }

  return { businessDetails, personalDetails, serviceType, onboardingDoc };
}

// Shape one Offer into the admin-facing listing row.
function toListingRow(offer, featureMap, ctx) {
  const categoryName = resolveCategoryName(offer.category, featureMap);
  const { businessDetails, personalDetails, serviceType } = getOnboardingDetails(
    offer.vendorId,
    offer.userId,
    categoryName,
    ctx,
  );
  return {
    _id: offer._id,
    vendorId: offer.vendorId,
    brandName: offer.name,
    personName: personalDetails.name || "Vendor",
    serviceName: serviceType,
    location: `${offer.city || ""}, ${offer.state || ""}`,
    price: offer.regularPrice,
    status: offer.status,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
    // Spread last, exactly as before: the raw offer fields win over the
    // convenience aliases above wherever the names collide.
    ...offer,
    category: categoryName,
    businessDetails,
    personalDetails,
  };
}

async function list({ status }) {
  const query = status ? { status } : {};
  // `.lean()` — these documents are read, reshaped and serialised; nothing calls
  // a document method on them. Hydrating full Mongoose documents (and then
  // calling `.toObject()` on every one) was pure overhead on the largest read
  // in the admin panel.
  const [offers, featureMap] = await Promise.all([
    Offer.find(query).sort({ createdAt: -1 }).lean(),
    loadFeatureMap(),
  ]);

  const ctx = await loadLookupContext(offers);
  return offers.map((o) => toListingRow(o, featureMap, ctx));
}

async function getById(id) {
  const offer = await Offer.findById(id).lean();
  if (offer) {
    // Same batched loader as `list`, over a single-element set — one code path
    // for both, and still a fixed number of queries.
    const [featureMap, ctx] = await Promise.all([loadFeatureMap(), loadLookupContext([offer])]);
    const categoryName = resolveCategoryName(offer.category, featureMap);
    const { businessDetails, personalDetails, serviceType } = getOnboardingDetails(
      offer.vendorId,
      offer.userId,
      categoryName,
      ctx,
    );
    return {
      ...offer,
      category: categoryName,
      serviceName: serviceType,
      businessDetails,
      personalDetails,
    };
  }

  const legacy = await Management.findById(id);
  if (!legacy) throw new NotFoundError("Listing", id);
  return legacy;
}

async function create(body) {
  return Management.create(body);
}

async function update(id, body) {
  const listing = await Management.findByIdAndUpdate(id, body, { new: true });
  if (!listing) throw new NotFoundError("Listing", id);
  return listing;
}

async function remove(id) {
  const listing = await Management.findById(id);
  if (!listing) throw new NotFoundError("Listing", id);
  await listing.deleteOne();
}

function pickOnboardingModel(listing) {
  if (listing.sourceModel === "ActivityOnboarding") return ActivityOnboarding;
  if (listing.sourceModel === "StayOnboarding") return StayOnboarding;
  if (listing.sourceModel === "CaravanOnboarding") return CaravanOnboarding;
  const cat = (listing.category || "").toLowerCase();
  if (cat === "activity") return ActivityOnboarding;
  if (cat === "stay") return StayOnboarding;
  return CaravanOnboarding;
}

async function resolveTargetEmail(listing, onboardingDoc) {
  if (onboardingDoc && onboardingDoc.businessEmail) return onboardingDoc.businessEmail;
  if (!listing.userId) return null;

  let user = null;
  if (mongoose.Types.ObjectId.isValid(listing.userId)) {
    user = await User.findById(listing.userId);
  }
  if (!user) user = await User.findOne({ userId: listing.userId });
  return user && user.email ? user.email : null;
}

async function applyApproval(listing, targetEmail) {
  if (listing.vendorId) {
    await Vendor.findOneAndUpdate({ vendorId: listing.vendorId }, { status: "approved" });
  }

  if (listing.userId) {
    let user = null;
    if (mongoose.Types.ObjectId.isValid(listing.userId)) {
      user = await User.findById(listing.userId);
    }
    if (!user) user = await User.findOne({ userId: listing.userId });
    if (user && user.email) {
      await User.findByIdAndUpdate(user._id, { status: "active", role: "vendor" });
      await Register.findOneAndUpdate({ email: user.email }, { userType: "vendor" });
    }
  }

  if (targetEmail) {
    try {
      await sendApprovalEmail(targetEmail, listing.name, listing.category || "Service");
    } catch (err) {
      logger.error({ err, email: targetEmail }, "[Management] approval email failed");
    }
  }

  try {
    await Notification.create({
      type: "service_approval",
      title: "Service Approved",
      message: `Your service "${listing.name}" has been approved.`,
      recipientRole: "vendor",
      recipientId: listing.vendorId,
      referenceId: listing._id,
      referenceModel: "Offer",
    });
  } catch (err) {
    logger.error({ err }, "[Management] approval notification failed");
  }
}

async function applyRejection(listing, rejectionReason, targetEmail) {
  if (listing.vendorId) {
    await Vendor.findOneAndUpdate({ vendorId: listing.vendorId }, { status: "rejected" });
  }

  if (targetEmail) {
    try {
      await sendRejectionEmail(targetEmail, listing.name, rejectionReason || "No reason provided");
    } catch (err) {
      logger.error({ err, email: targetEmail }, "[Management] rejection email failed");
    }
  }

  try {
    await Notification.create({
      type: "service_rejection",
      title: "Service Rejected",
      message: `Your service "${listing.name}" was rejected. Reason: ${rejectionReason || "No reason provided"}.`,
      recipientRole: "vendor",
      recipientId: listing.vendorId,
      referenceId: listing._id,
      referenceModel: "Offer",
    });
  } catch (err) {
    logger.error({ err }, "[Management] rejection notification failed");
  }
}

async function setStatus(id, { status, rejectionReason }) {
  const updateData = { status };
  if (status === "rejected" && rejectionReason) updateData.rejectionReason = rejectionReason;

  let listing = await Offer.findByIdAndUpdate(id, updateData, { new: true });

  if (listing) {
    const onboardingModel = pickOnboardingModel(listing);
    let onboardingDoc = null;
    const updateFields = { status };
    if (status === "rejected" && rejectionReason) updateFields.rejectionReason = rejectionReason;

    if (listing.sourceId) {
      onboardingDoc = await onboardingModel.findByIdAndUpdate(listing.sourceId, updateFields, {
        new: true,
      });
    } else if (listing.vendorId) {
      onboardingDoc = await onboardingModel.findOneAndUpdate(
        { vendorId: listing.vendorId },
        updateFields,
        { sort: { createdAt: -1 }, new: true },
      );
    }

    const targetEmail = await resolveTargetEmail(listing, onboardingDoc);
    logger.info({ service: listing.name, status, targetEmail }, "[Management] status updated");

    if (status === "approved") await applyApproval(listing, targetEmail);
    if (status === "rejected") await applyRejection(listing, rejectionReason, targetEmail);
  } else {
    listing = await Management.findByIdAndUpdate(id, { status }, { new: true });
  }

  if (!listing) throw new NotFoundError("Listing", id);
  return listing;
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  setStatus,
};
