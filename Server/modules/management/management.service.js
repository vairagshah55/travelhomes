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

async function loadFeatureMap() {
  const features = await Feature.find({});
  const map = {};
  for (const f of features) {
    map[f._id.toString()] = f.name;
    if (f.name) map[f.name.toLowerCase()] = f.name;
  }
  return map;
}

// Resolve onboarding doc + extract business / personal details. The
// category hint picks the preferred onboarding model, and we fall back
// to the other two if it's missing. Vendor / User docs fill in any gaps.
async function getOnboardingDetails(vendorId, userId, categoryName) {
  let businessDetails = {};
  let personalDetails = {};
  let onboardingDoc = null;
  let serviceType = "Caravan";

  const catLower = (categoryName || "").toLowerCase();
  if (catLower === "activity") {
    onboardingDoc = await ActivityOnboarding.findOne({ vendorId }).sort({ createdAt: -1 });
    if (onboardingDoc) serviceType = "Activity";
  } else if (catLower === "stay") {
    onboardingDoc = await StayOnboarding.findOne({ vendorId }).sort({ createdAt: -1 });
    if (onboardingDoc) serviceType = "Stay";
  } else {
    onboardingDoc = await CaravanOnboarding.findOne({ vendorId }).sort({ createdAt: -1 });
    if (onboardingDoc) serviceType = "Caravan";
  }

  if (!onboardingDoc) {
    if (catLower !== "activity") {
      onboardingDoc = await ActivityOnboarding.findOne({ vendorId }).sort({ createdAt: -1 });
      if (onboardingDoc) serviceType = "Activity";
    }
    if (!onboardingDoc && catLower !== "stay") {
      onboardingDoc = await StayOnboarding.findOne({ vendorId }).sort({ createdAt: -1 });
      if (onboardingDoc) serviceType = "Stay";
    }
    if (!onboardingDoc && catLower !== "caravan") {
      onboardingDoc = await CaravanOnboarding.findOne({ vendorId }).sort({ createdAt: -1 });
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
      const vendor = await Vendor.findOne({ vendorId });
      if (vendor) {
        if (!businessDetails.name) businessDetails.name = vendor.brandName;
        if (!businessDetails.email) businessDetails.email = vendor.email;
        if (!businessDetails.phone) businessDetails.phone = vendor.phone;
        if (!personalDetails.name) personalDetails.name = vendor.personName;
      }
    }

    if (userId && (!personalDetails.name || !businessDetails.email)) {
      let user = null;
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
      }
      if (!user) user = await User.findOne({ userId });

      if (user) {
        if (!personalDetails.name) personalDetails.name = user.name;
        if (!businessDetails.email) businessDetails.email = user.email;
        if (!businessDetails.phone) businessDetails.phone = user.phone;
      }
    }
  }

  return { businessDetails, personalDetails, serviceType, onboardingDoc };
}

async function list({ status }) {
  const query = status ? { status } : {};
  const offers = await Offer.find(query).sort({ createdAt: -1 });
  const featureMap = await loadFeatureMap();

  return Promise.all(
    offers.map(async (o) => {
      const categoryName = resolveCategoryName(o.category, featureMap);
      const { businessDetails, personalDetails, serviceType } = await getOnboardingDetails(
        o.vendorId,
        o.userId,
        categoryName,
      );
      return {
        _id: o._id,
        vendorId: o.vendorId,
        brandName: o.name,
        personName: personalDetails.name || "Vendor",
        serviceName: serviceType,
        location: `${o.city || ""}, ${o.state || ""}`,
        price: o.regularPrice,
        status: o.status,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        ...o.toObject(),
        category: categoryName,
        businessDetails,
        personalDetails,
      };
    }),
  );
}

async function getById(id) {
  const offer = await Offer.findById(id);
  if (offer) {
    const featureMap = await loadFeatureMap();
    const categoryName = resolveCategoryName(offer.category, featureMap);
    const { businessDetails, personalDetails, serviceType } = await getOnboardingDetails(
      offer.vendorId,
      offer.userId,
      categoryName,
    );
    return {
      ...offer.toObject(),
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
