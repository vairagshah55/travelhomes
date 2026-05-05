/**
 * Offers service.
 *
 * The Offer collection is the central catalog every browse / filter / detail
 * surface reads from. Three things make this module bigger than typical:
 *
 *   1. Image normalization — the legacy contract accepts `data:` URLs as
 *      well as already-uploaded paths in `photos.coverUrl` and
 *      `photos.galleryUrls`. We persist data-URL payloads to /uploads and
 *      replace them with the resulting URLs before save.
 *
 *   2. Analytics tracking on read — listOffers fires impressions (one per
 *      vendor per page-load, not one per offer), getOffer fires unique
 *      visitor counts (deduped per (visitor, offer, day) tuple), and
 *      trackClick fires click counts. All best-effort, never block the
 *      response.
 *
 *   3. setStatus cascading — admins approving an offer ripple status to
 *      Vendor, User, Register, the source onboarding doc, and trigger
 *      email + Notification side-effects. Vendor flow can also create a
 *      Vendor row from a Profile if one doesn't exist (the registration
 *      flow may have stopped at User without promoting to Vendor).
 *
 * Authorization policy (setStatus / update / remove):
 *   - Admins: unrestricted
 *   - Owners (offer.userId === current user id): can update/delete and
 *     can flip status only between approved↔deactivated, or pending→cancelled
 *   - Anyone else: 403
 */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Offer = require("../../models/Offer");
const Vendor = require("../../models/Vendor");
const User = require("../../models/User");
const Register = require("../../models/Register");
const Profile = require("../../models/Profile");
const ActivityOnboarding = require("../../models/ActivityOnboarding");
const CaravanOnboarding = require("../../models/CaravanOnboarding");
const StayOnboarding = require("../../models/StayOnboarding");
const Notification = require("../../models/Notification");
const AdminAnalyticsMetric = require("../../models/AdminAnalyticsMetric");
const logger = require("../../shared/logger");
const { ForbiddenError, NotFoundError, UnauthorizedError } = require("../../shared/errors");
const { sendApprovalEmail, sendRejectionEmail } = require("../../services/mailer");

const uploadsDir = path.join(process.cwd(), "uploads");
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch {
  /* already exists */
}

// Escape characters that have special meaning in a JS RegExp literal so
// caller-supplied filter values can't smuggle in `.*` / anchors / etc.
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAdmin(user) {
  if (!user) return false;
  return (
    user.userType === "admin" ||
    user.type === "admin" ||
    user.type === "superadmin" ||
    user.role === "admin"
  );
}

function userIdOf(user) {
  return user && (user._id || user.id);
}

function getToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMetricCategory(offer) {
  const cat = (offer.serviceType || offer.category || "unique-stay").toLowerCase();
  const valid = ["activity", "camper-van", "unique-stay"];
  return valid.includes(cat) ? cat : "unique-stay";
}

const mimeToExt = (mime) => {
  if (!mime) return "bin";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("pdf")) return "pdf";
  return "bin";
};

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;
  try {
    return { mime: match[1], buffer: Buffer.from(match[2], "base64"), ext: mimeToExt(match[1]) };
  } catch {
    return null;
  }
}

async function saveDataUrlToUploads(dataUrl, prefix = "file") {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;
  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${parsed.ext}`;
  await fs.promises.writeFile(path.join(uploadsDir, filename), parsed.buffer);
  return `/uploads/${filename}`;
}

async function normalizeImageArray(input, prefix = "image") {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const p of input) {
    let s = "";
    if (typeof p === "string") s = p;
    else if (p && typeof p === "object") s = p.url || p.dataUrl || p.src || p.path || "";
    if (!s) continue;
    if (s.startsWith("data:")) {
      const url = await saveDataUrlToUploads(s, prefix);
      if (url) out.push(url);
    } else {
      out.push(s);
    }
  }
  return out;
}

async function normalizePhotos(payload) {
  if (!payload.photos) return;
  if (payload.photos.coverUrl) {
    const covers = await normalizeImageArray([payload.photos.coverUrl], "offer-cover");
    if (covers.length) payload.photos.coverUrl = covers[0];
  }
  if (payload.photos.galleryUrls) {
    payload.photos.galleryUrls = await normalizeImageArray(
      payload.photos.galleryUrls,
      "offer-gallery",
    );
  }
}

async function create(payload, user) {
  await normalizePhotos(payload);

  let vendorId = payload.vendorId;
  if (!vendorId && user) {
    const v = await Vendor.findOne({ email: user.email });
    if (v) vendorId = v.vendorId;
  }

  const offer = await Offer.create({
    ...payload,
    photos: {
      coverUrl: payload.photos?.coverUrl || "",
      galleryUrls: payload.photos?.galleryUrls || [],
    },
    status: "pending",
    userId: userIdOf(user),
    vendorId,
  });

  try {
    await Notification.create({
      type: "service_approval",
      title: "New Service for Approval",
      message: `New service "${offer.name}" submitted for approval by ${user.name || "Vendor"}.`,
      recipientRole: "admin",
      referenceId: offer._id,
      referenceModel: "Offer",
    });
  } catch (err) {
    logger.error({ err }, "[Offer] admin notification failed");
  }

  return offer;
}

function buildListFilter(q, user) {
  const query = {};
  const adminViewer = isAdmin(user);
  const ownerView = q.mine === "true" || q.mine === true;

  if (user) {
    if (adminViewer) {
      if (q.vendorId) query.vendorId = q.vendorId;
    } else if (ownerView) {
      // Vendor seeing their own offers — match either by userId or by their
      // (custom-string) vendorId.
      // Caller supplies user; we'll patch in the vendorId branch from the service.
      query.__ownerOnly = true;
    } else {
      query.status = "approved";
    }
  } else {
    if (ownerView) throw new UnauthorizedError("Authentication required to view your offers");
    query.status = "approved";
  }

  if (q.status) query.status = q.status;

  const or = [];
  if (q.city) or.push({ city: { $regex: escapeRegex(q.city), $options: "i" } });
  if (q.state) or.push({ state: { $regex: escapeRegex(q.state), $options: "i" } });
  if (q.category) query.category = { $regex: escapeRegex(q.category), $options: "i" };
  if (q.q)
    or.push(
      { name: { $regex: escapeRegex(q.q), $options: "i" } },
      { description: { $regex: escapeRegex(q.q), $options: "i" } },
    );
  if (or.length) query.__searchOr = or;

  return query;
}

async function applyOwnerFilter(query, user) {
  if (!query.__ownerOnly) return query;
  delete query.__ownerOnly;
  const v = await Vendor.findOne({ email: user.email });
  const currentUserId = userIdOf(user);
  if (v && v.vendorId) {
    query.$or = [{ userId: currentUserId }, { vendorId: v.vendorId }];
  } else {
    query.userId = currentUserId;
  }
  return query;
}

function applySearchFilter(query) {
  if (!query.__searchOr) return query;
  const search = query.__searchOr;
  delete query.__searchOr;
  if (query.$or) {
    query.$and = [{ $or: query.$or }, { $or: search }];
    delete query.$or;
  } else {
    query.$or = search;
  }
  return query;
}

function pickSort(sort) {
  if (sort === "rating") return { averageRating: -1, ratingsCount: -1, createdAt: -1 };
  if (sort === "price_desc") return { regularPrice: -1 };
  if (sort === "price_asc") return { regularPrice: 1 };
  return { createdAt: -1 };
}

async function trackImpressions(data) {
  if (!data.length) return;
  try {
    const today = getToday();
    // One impression per vendor per page-load, not one per offer — so a
    // vendor with 5 listings doesn't get artificially inflated.
    const vendorFirstOffer = {};
    for (const o of data) {
      const vid = String(o.vendorId || o.userId || o._id);
      if (!vendorFirstOffer[vid]) vendorFirstOffer[vid] = o;
    }
    const ops = Object.values(vendorFirstOffer).map((o) => ({
      updateOne: {
        filter: { serviceId: o._id, metricDate: today, category: "listing" },
        update: { $inc: { impressions: 1 } },
        upsert: true,
      },
    }));
    if (ops.length) AdminAnalyticsMetric.bulkWrite(ops).catch(() => {});
  } catch (err) {
    logger.error({ err: err.message }, "Impression tracking error");
  }
}

async function list(q, user) {
  let query = buildListFilter(q, user);
  query = await applyOwnerFilter(query, user);
  query = applySearchFilter(query);

  const skip = (q.page - 1) * q.limit;
  const sortObj = pickSort(q.sort);

  const [data, total] = await Promise.all([
    Offer.find(query).sort(sortObj).skip(skip).limit(q.limit),
    Offer.countDocuments(query),
  ]);

  // Public users only — owners and admins shouldn't pollute their own metrics.
  const ownerView = q.mine === "true" || q.mine === true;
  if (!ownerView && !isAdmin(user)) await trackImpressions(data);

  return {
    data,
    pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) },
  };
}

async function trackVisitor(offer, visitorId) {
  try {
    const today = getToday();
    const category = getMetricCategory(offer);

    // Bump visitors only if this visitor isn't already in today's set.
    const existing = await AdminAnalyticsMetric.findOneAndUpdate(
      { serviceId: offer._id, metricDate: today, category, visitorIds: { $ne: visitorId } },
      { $inc: { visitors: 1 }, $push: { visitorIds: visitorId } },
      { upsert: false, new: true },
    );

    if (!existing) {
      await AdminAnalyticsMetric.findOneAndUpdate(
        { serviceId: offer._id, metricDate: today, category },
        { $inc: { visitors: 1 }, $addToSet: { visitorIds: visitorId } },
        { upsert: true },
      );
    }

    Offer.updateOne({ _id: offer._id }, { $inc: { visitors: 1 } }).exec();
  } catch (err) {
    logger.error({ err: err.message }, "Visitor tracking error");
  }
}

async function getById(id, user, visitorId) {
  const offer = await Offer.findById(id);
  if (!offer) throw new NotFoundError("Offer", id);

  const userId = user ? String(userIdOf(user) || "") : "";
  const isOwner = !!userId && (offer.vendorId === userId || offer.userId === userId);
  let isOwnerByEmail = false;
  if (user && user.email && !isOwner) {
    const v = await Vendor.findOne({ email: user.email }).lean();
    if (v && v.vendorId && offer.vendorId === v.vendorId) isOwnerByEmail = true;
  }

  if (!isOwner && !isOwnerByEmail && !isAdmin(user) && visitorId) {
    await trackVisitor(offer, visitorId);
  }

  return offer;
}

async function update(id, payload, user) {
  const offer = await Offer.findById(id);
  if (!offer) throw new NotFoundError("Offer", id);

  const isOwner = offer.userId === userIdOf(user);
  if (!isAdmin(user) && !isOwner) throw new ForbiddenError("Access denied");

  await normalizePhotos(payload);
  return Offer.findByIdAndUpdate(id, payload, { new: true });
}

async function remove(id, user) {
  const offer = await Offer.findById(id);
  if (!offer) throw new NotFoundError("Offer", id);

  const isOwner = offer.userId === userIdOf(user);
  if (!isAdmin(user) && !isOwner) throw new ForbiddenError("Access denied");

  await offer.deleteOne();
}

async function rate(id, rating) {
  const offer = await Offer.findById(id);
  if (!offer) throw new NotFoundError("Offer", id);
  const r = Math.max(1, Math.min(5, Number(rating)));

  offer.ratingsCount = (offer.ratingsCount || 0) + 1;
  offer.ratingsSum = (offer.ratingsSum || 0) + r;
  offer.averageRating = Number((offer.ratingsSum / offer.ratingsCount).toFixed(2));
  await offer.save();
  return offer;
}

function pickOnboardingModel(sourceModel) {
  if (sourceModel === "ActivityOnboarding") return ActivityOnboarding;
  if (sourceModel === "CaravanOnboarding") return CaravanOnboarding;
  if (sourceModel === "StayOnboarding") return StayOnboarding;
  return null;
}

async function syncSourceStatus(offer, status, reason) {
  if (!offer.sourceId || !offer.sourceModel) return;
  const Model = pickOnboardingModel(offer.sourceModel);
  if (!Model) return;

  // Onboarding allowed values: draft, pending, approved, rejected.
  let sourceStatus = status;
  if (["cancelled", "deactivated", "blocked"].includes(status)) sourceStatus = "rejected";

  const updateFields = { status: sourceStatus };
  if (status === "rejected" && reason) updateFields.rejectionReason = reason;

  try {
    await Model.findByIdAndUpdate(offer.sourceId, updateFields);
    logger.info(
      { sourceModel: offer.sourceModel, sourceId: String(offer.sourceId), sourceStatus },
      "[Offer] source status synced",
    );
  } catch (err) {
    logger.error({ err }, "[Offer] source status sync failed");
  }
}

// Resolve the user (and email) we should notify on an admin status change.
// The legacy code did three rounds of fallback: User by id → Vendor by
// vendorId → Onboarding doc.businessEmail or Onboarding doc.userId.
async function resolveAdminTarget(offer) {
  let user = null;
  let targetEmail = null;

  if (offer.userId) {
    if (mongoose.Types.ObjectId.isValid(offer.userId)) user = await User.findById(offer.userId);
    if (!user) user = await User.findOne({ userId: offer.userId });
  }

  if (!user && offer.vendorId) {
    const vendor = await Vendor.findOne({ vendorId: offer.vendorId });
    if (vendor && vendor.email) {
      user = { email: vendor.email, name: vendor.personName || vendor.brandName };
      targetEmail = vendor.email;
    }
  }

  if (!user && !targetEmail && offer.sourceId && offer.sourceModel) {
    const Model = pickOnboardingModel(offer.sourceModel);
    if (Model) {
      const doc = await Model.findById(offer.sourceId);
      if (doc) {
        if (doc.businessEmail) targetEmail = doc.businessEmail;
        else if (doc.userId) {
          if (mongoose.Types.ObjectId.isValid(doc.userId)) user = await User.findById(doc.userId);
          if (!user) user = await User.findOne({ userId: doc.userId });
        }
      }
    }
  }

  if (user && user.email) targetEmail = user.email;
  return { user, targetEmail };
}

async function ensureVendorRecord(offer, user) {
  if (offer.vendorId) {
    await Vendor.findOneAndUpdate({ vendorId: offer.vendorId }, { status: "approved" });
    return;
  }
  if (!user || !user.email) return;
  const normalizedEmail = user.email.toLowerCase();
  const existing = await Vendor.findOne({ email: normalizedEmail });
  if (existing) {
    existing.status = "approved";
    await existing.save();
    return;
  }

  // The registration flow may have stopped at User without promoting to
  // Vendor. Build one from the Profile + User we have.
  try {
    const profile = await Profile.findOne({
      email: new RegExp(`^${escapeRegex(user.email)}$`, "i"),
    });
    const name =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.name || "New Vendor";
    const loc =
      profile && profile.city && profile.state
        ? `${profile.city}, ${profile.state}`
        : user.city || "Unknown Location";
    await new Vendor({
      brandName: (profile && profile.business && profile.business.brandName) || name,
      personName: name,
      location: loc,
      email: normalizedEmail,
      status: "approved",
      servicesOffered: [offer.category || "Service"],
    }).save();
    logger.info({ email: normalizedEmail }, "[Offer] created vendor on approval");
  } catch (err) {
    logger.error({ err }, "[Offer] vendor creation on approval failed");
  }
}

async function applyApprovalCascade(offer) {
  const { user, targetEmail } = await resolveAdminTarget(offer);
  await ensureVendorRecord(offer, user);

  if (user && user._id) {
    await User.findByIdAndUpdate(user._id, { status: "active", role: "vendor" });
    await Register.findOneAndUpdate({ email: user.email }, { userType: "vendor" });
  }

  if (targetEmail) {
    try {
      await sendApprovalEmail(targetEmail, offer.name, offer.category || "Service");
    } catch (err) {
      logger.error({ err }, "[Offer] approval email failed");
    }
  }

  try {
    await Notification.create({
      type: "service_approval",
      title: "Service Approved",
      message: `Your service "${offer.name}" has been approved.`,
      recipientRole: "vendor",
      recipientId: offer.vendorId,
      referenceId: offer._id,
      referenceModel: "Offer",
    });
  } catch (err) {
    logger.error({ err }, "[Offer] approval notification failed");
  }
}

async function applyRejectionCascade(offer, status, reason) {
  const { targetEmail } = await resolveAdminTarget(offer);

  let mailReason = reason;
  if (!mailReason) {
    if (status === "cancelled") mailReason = "Service cancelled by admin";
    else if (status === "blocked") mailReason = "Service blocked by admin";
    else mailReason = "No reason provided";
  }

  if (targetEmail) {
    try {
      await sendRejectionEmail(targetEmail, offer.name, mailReason);
    } catch (err) {
      logger.error({ err }, "[Offer] rejection email failed");
    }
  }

  try {
    await Notification.create({
      type: status === "rejected" ? "service_rejection" : "system_alert",
      title: `Service ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your service "${offer.name}" has been ${status}.${reason ? ` Reason: ${reason}` : ""}`,
      recipientRole: "vendor",
      recipientId: offer.vendorId,
      referenceId: offer._id,
      referenceModel: "Offer",
    });
  } catch (err) {
    logger.error({ err }, "[Offer] rejection notification failed");
  }
}

function checkStatusPermission(offer, user, status) {
  if (isAdmin(user)) return;
  const isOwner = offer.userId === userIdOf(user);
  if (!isOwner) throw new ForbiddenError("Access denied");

  // Owners can only:
  //   - deactivate an approved offer
  //   - reactivate (approve) a deactivated offer
  //   - cancel a pending offer
  const allowed =
    (status === "deactivated" && offer.status === "approved") ||
    (status === "approved" && offer.status === "deactivated") ||
    (status === "cancelled" && offer.status === "pending");
  if (!allowed) {
    throw new ForbiddenError("You can only deactivate approved services or cancel pending ones");
  }
}

async function setStatus(id, { status, reason }, user) {
  const offer = await Offer.findById(id);
  if (!offer) throw new NotFoundError("Offer", id);

  checkStatusPermission(offer, user, status);

  offer.status = status;
  if (status === "rejected" && reason) offer.rejectionReason = reason;
  await offer.save();

  await syncSourceStatus(offer, status, reason);

  if (isAdmin(user)) {
    if (status === "approved") await applyApprovalCascade(offer);
    if (["rejected", "cancelled", "blocked"].includes(status)) {
      await applyRejectionCascade(offer, status, reason);
    }
  }

  return offer;
}

async function trackClick(id) {
  const offer = await Offer.findById(id);
  if (!offer) throw new NotFoundError("Offer", id);

  await Offer.updateOne({ _id: offer._id }, { $inc: { clicks: 1 } });

  const today = getToday();
  const category = getMetricCategory(offer);
  await AdminAnalyticsMetric.findOneAndUpdate(
    { serviceId: offer._id, metricDate: today, category },
    { $inc: { clicks: 1 } },
    { upsert: true, new: true },
  );
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  rate,
  setStatus,
  trackClick,
  // exposed for tests
  _internal: { escapeRegex, isAdmin, pickSort, mimeToExt, parseDataUrl },
};
