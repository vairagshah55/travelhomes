/**
 * Onboarding service.
 *
 * Vendors submit a long wizard for one of three service types — Activity,
 * Caravan, or Stay. Each submit:
 *
 *   1. Ensures a Vendor row exists (creating one in `pending` if not, and
 *      flipping `rejected` → `pending` to allow resubmission).
 *   2. Normalizes any data: URL photos / covers / idPhotos to /uploads.
 *   3. Creates the type-specific onboarding doc with status='pending'.
 *   4. Syncs the user's Profile with personal + business fields from the
 *      submission (best-effort, logged on failure).
 *   5. Cancels prior pending/rejected Offers in the same category so the
 *      admin queue doesn't pile up duplicates.
 *   6. Creates a matching Offer (status='pending') referencing the
 *      onboarding doc via sourceId/sourceModel. On failure, deletes the
 *      onboarding doc so the two stay consistent (a hand-rolled saga).
 *
 * Status promotion to vendor (User.role / Register.userType) happens on
 * admin approval, not here — we only mark User.status='active' so the
 * user can sign in.
 */
const fs = require("fs");
const path = require("path");

const ActivityOnboarding = require("../../models/ActivityOnboarding");
const CaravanOnboarding = require("../../models/CaravanOnboarding");
const StayOnboarding = require("../../models/StayOnboarding");
const Offer = require("../../models/Offer");
const Vendor = require("../../models/Vendor");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const logger = require("../../shared/logger");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../../shared/errors");

const uploadsDir = path.join(process.cwd(), "uploads");
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch {
  /* already exists */
}

// ─── Image helpers ─────────────────────────────────────────────────────
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

// ─── Price helper ──────────────────────────────────────────────────────
const parsePrice = (val) => {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const cleaned = String(val || "").replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

// ─── Vendor + Profile sync ─────────────────────────────────────────────
async function ensureVendor(user) {
  if (!user || !user.email) return null;

  let vendor = await Vendor.findOne({ email: user.email });
  if (!vendor) {
    vendor = await Vendor.create({
      email: user.email,
      brandName: user.firstName ? `${user.firstName}'s Offerings` : "New Vendor",
      personName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
      phone: user.mobile || "",
      location: "Default Location",
      status: "pending",
    });
  } else if (vendor.status === "rejected") {
    // Resubmission after rejection — reopen the queue.
    vendor.status = "pending";
    await vendor.save();
  }

  // The actual role flip (User.role = vendor) happens on admin approval.
  await User.findOneAndUpdate({ email: user.email }, { status: "active" });

  return vendor;
}

async function syncUserProfile(email, data) {
  if (!email || !data) return;
  try {
    const profileData = {};

    if (data.firstName) profileData.firstName = data.firstName;
    if (data.lastName) profileData.lastName = data.lastName;
    if (data.personalState) profileData.state = data.personalState;
    if (data.personalCity) profileData.city = data.personalCity;
    if (data.personalPincode) profileData.personalPincode = data.personalPincode;

    if (data.personalCountry) {
      profileData.country = data.personalCountry;
    } else if (
      data.personalLocality &&
      (data.personalLocality === "India" || data.type === "activity" || data.type === "caravan")
    ) {
      profileData.country = data.personalLocality;
    }

    if (data.personalLocality) profileData.personalLocality = data.personalLocality;
    if (data.dateOfBirth) profileData.dateOfBirth = data.dateOfBirth;
    if (data.maritalStatus) profileData.maritalStatus = data.maritalStatus;
    if (data.idProof) profileData.idProof = data.idProof;
    if (data.idPhotos && data.idPhotos.length > 0) profileData.idPhotos = data.idPhotos;

    const business = {};
    if (data.brandName) business.brandName = data.brandName;
    if (data.legalCompanyName) business.legalCompanyName = data.legalCompanyName;
    if (data.gstNumber) business.gstNumber = data.gstNumber;

    if (data.businessEmailId) business.email = data.businessEmailId;
    if (data.businessEmail) business.email = data.businessEmail;

    if (data.businessPhoneNumber) business.phoneNumber = data.businessPhoneNumber;
    if (data.businessPhone) business.phoneNumber = data.businessPhone;

    if (data.businessAddress) business.address = data.businessAddress;

    if (data.businessLocality) business.locality = data.businessLocality;
    if (data.locality && data.type === "stay") business.locality = data.locality;

    if (data.businessState) business.state = data.businessState;
    if (data.state && data.type === "stay") business.state = data.state;

    if (data.businessCity) business.city = data.businessCity;
    if (data.city && data.type === "stay") business.city = data.city;

    if (data.businessPincode) business.pincode = data.businessPincode;

    if (Object.keys(business).length > 0) profileData.business = business;
    if (Object.keys(profileData).length === 0) return;

    const existing = await Profile.findOne({ email });
    if (existing) {
      if (profileData.business) {
        existing.business = { ...existing.business, ...profileData.business };
        delete profileData.business;
      }
      Object.assign(existing, profileData);
      await existing.save();
    } else {
      await Profile.create({ email, ...profileData });
    }
    logger.info({ email }, "[Onboarding] profile synced");
  } catch (err) {
    logger.error({ err, email }, "[Onboarding] profile sync failed");
  }
}

async function cancelPreviousOffers(userId, categories) {
  try {
    const filter = Array.isArray(categories) ? { $in: categories } : categories;
    await Offer.updateMany(
      { userId, category: filter, status: { $in: ["pending", "rejected"] } },
      { status: "cancelled" },
    );
  } catch (err) {
    logger.warn({ err: err.message }, "[Onboarding] failed to cancel old offers");
  }
}

// Create the offer that mirrors the onboarding doc. On any failure the
// caller MUST delete the onboarding doc so the pair stays consistent.
async function createOfferForOnboarding(offerData, onboardingModel, onboardingId) {
  try {
    await Offer.create(offerData);
  } catch (err) {
    logger.error({ err, onboardingId: String(onboardingId) }, "[Onboarding] offer creation failed");
    await onboardingModel.findByIdAndDelete(onboardingId);
    throw new BadRequestError(`Failed to create Offer: ${err.message}`);
  }
}

// ─── Submit handlers ───────────────────────────────────────────────────
async function submitActivity(body, user) {
  const vendor = await ensureVendor(user);

  const strPhotos = await normalizeImageArray(body.photos || [], "activity-photo");
  let strCoverImage = null;
  if (body.coverImage) {
    const covers = await normalizeImageArray([body.coverImage], "activity-cover");
    strCoverImage = covers[0] || null;
  }
  const strIdPhotos = await normalizeImageArray(body.idPhotos || [], "activity-id-photo");

  const doc = await ActivityOnboarding.create({
    ...body,
    photos: strPhotos,
    coverImage: strCoverImage,
    idPhotos: strIdPhotos,
    userId: user._id,
    vendorId: vendor && vendor.vendorId,
    status: "pending",
  });

  await syncUserProfile(user.email, { ...body, idPhotos: strIdPhotos, type: "activity" });
  await cancelPreviousOffers(user._id, "activity");

  await createOfferForOnboarding(
    {
      name: doc.activityName || "Activity",
      category: "activity",
      description:
        (doc.description && String(doc.description).trim()) ||
        "Auto-created from activity onboarding",
      rules: doc.rules || [],
      features: doc.features || [],
      seatingCapacity: doc.personCapacity,
      sleepingCapacity: 0,
      locality: doc.locality,
      pincode: doc.pincode,
      city: doc.city || "Default City",
      state: doc.state || "Default State",
      regularPrice: parsePrice(doc.regularPrice ?? doc.finalPrice ?? 0),
      priceIncludes: doc.priceIncludes || [],
      priceExcludes: doc.priceExcludes || [],
      personCapacity: doc.personCapacity,
      timeDuration: doc.timeDuration,
      expectations: doc.expectations || [],
      serviceType: "activity",
      photos: { coverUrl: strPhotos[0] || "", galleryUrls: strPhotos.slice(0, 6) },
      status: "pending",
      userId: user._id,
      vendorId: vendor && vendor.vendorId,
      sourceId: doc._id,
      sourceModel: "ActivityOnboarding",
    },
    ActivityOnboarding,
    doc._id,
  );

  return doc;
}

async function submitCaravan(body, user) {
  const vendor = await ensureVendor(user);

  const strPhotos = await normalizeImageArray(body.photos || [], "caravan-photo");
  const rawCover = Array.isArray(body.coverImage)
    ? body.coverImage
    : body.coverImage
      ? [body.coverImage]
      : [];
  const strCoverImage = await normalizeImageArray(rawCover, "caravan-cover");

  const doc = await CaravanOnboarding.create({
    ...body,
    photos: strPhotos,
    coverImage: strCoverImage,
    userId: user._id,
    vendorId: vendor && vendor.vendorId,
    status: "pending",
  });

  await syncUserProfile(user.email, { ...body, type: "caravan" });
  await cancelPreviousOffers(user._id, [
    "caravan",
    "campervan",
    "camper-trailer",
    "motorhome",
    "rv",
  ]);

  await createOfferForOnboarding(
    {
      name: doc.name || "Caravan",
      category: doc.category || "caravan",
      description:
        (doc.description && String(doc.description).trim()) ||
        "Auto-created from caravan onboarding",
      rules: doc.rules || [],
      features: doc.features || [],
      seatingCapacity: doc.seatingCapacity,
      sleepingCapacity: doc.sleepingCapacity,
      locality: doc.locality,
      pincode: doc.pincode,
      city: doc.city || "Default City",
      state: doc.state || "Default State",
      regularPrice: parsePrice(doc.perDayCharge || doc.finalPrice || 0),
      priceIncludes: doc.priceIncludes || [],
      priceExcludes: doc.priceExcludes || [],
      perKmCharge: parsePrice(doc.perKmCharge),
      perDayCharge: parsePrice(doc.perDayCharge),
      perKmIncludes: doc.perKmIncludes || [],
      perKmExcludes: doc.perKmExcludes || [],
      perDayIncludes: doc.perDayIncludes || [],
      perDayExcludes: doc.perDayExcludes || [],
      serviceType: "camper-van",
      photos: { coverUrl: strPhotos[0] || "", galleryUrls: strPhotos.slice(0, 6) },
      status: "pending",
      userId: user._id,
      vendorId: vendor && vendor.vendorId,
      sourceId: doc._id,
      sourceModel: "CaravanOnboarding",
    },
    CaravanOnboarding,
    doc._id,
  );

  return doc;
}

async function submitStay(body, user) {
  const vendor = await ensureVendor(user);

  // Per-room photo normalization comes first so room.photos lands as URLs
  // before we persist the doc.
  if (Array.isArray(body.rooms) && body.rooms.length) {
    body.rooms = await Promise.all(
      body.rooms.map(async (r, idx) => {
        const photos = await normalizeImageArray((r && r.photos) || [], `stay-room${idx}`);
        return { ...r, photos };
      }),
    );
  }

  const strImages = await normalizeImageArray(body.images || [], "stay-image");
  const strIdPhotos = await normalizeImageArray(body.idPhotos || [], "stay-id-photo");

  const doc = await StayOnboarding.create({
    ...body,
    images: strImages,
    idPhotos: strIdPhotos,
    userId: user._id,
    vendorId: vendor && vendor.vendorId,
    status: "pending",
  });

  await syncUserProfile(user.email, { ...body, idPhotos: strIdPhotos, type: "stay" });
  await cancelPreviousOffers(user._id, "stay");

  const firstRoomPhotos =
    (doc.rooms && doc.rooms[0] && Array.isArray(doc.rooms[0].photos) && doc.rooms[0].photos) || [];
  const strPhotos = firstRoomPhotos
    .map((p) => (typeof p === "string" ? p : String(p)))
    .filter((s) => typeof s === "string" && s.length > 0);

  await createOfferForOnboarding(
    {
      name: doc.propertyName || (doc.selectedProperties && doc.selectedProperties[0]) || "Stay",
      category: "stay",
      description:
        (doc.description && String(doc.description).trim()) || "Auto-created from stay onboarding",
      rules: [],
      features: doc.selectedFeatures || [],
      guestCapacity: doc.guestCapacity,
      numberOfBeds: doc.numberOfBeds,
      locality: doc.locality,
      pincode: doc.pincode,
      city: doc.city || "Default City",
      state: doc.state || "Default State",
      regularPrice: parsePrice(doc.regularPrice || doc.finalPrice || 0),
      priceIncludes: [],
      priceExcludes: [],
      numberOfRooms: doc.numberOfRooms,
      numberOfBathrooms: doc.numberOfBathrooms,
      stayType: doc.stayType,
      rooms: doc.rooms,
      entireStayRules: doc.entireStayRules,
      optionalRules: doc.optionalRules,
      serviceType: "unique-stay",
      photos: { coverUrl: strPhotos[0] || "", galleryUrls: strPhotos.slice(0, 6) },
      status: "pending",
      userId: user._id,
      vendorId: vendor && vendor.vendorId,
      sourceId: doc._id,
      sourceModel: "StayOnboarding",
    },
    StayOnboarding,
    doc._id,
  );

  return doc;
}

// ─── Selfie attach (mutates idPhotos / images) ─────────────────────────
async function attachSelfie(Model, prefix, imagesField, id, imageData, user) {
  const doc = await Model.findById(id);
  if (!doc) throw new NotFoundError(Model.modelName.replace("Onboarding", ""), id);
  if (doc.userId && String(doc.userId) !== String(user._id)) {
    throw new ForbiddenError("Not authorized");
  }

  const asUrl =
    typeof imageData === "string" && imageData.startsWith("data:")
      ? await saveDataUrlToUploads(imageData, prefix)
      : typeof imageData === "string"
        ? imageData
        : String(imageData);

  const arr = Array.isArray(doc[imagesField]) ? doc[imagesField].slice() : [];
  arr.push(asUrl || (typeof imageData === "string" ? imageData : String(imageData)));
  doc[imagesField] = arr;
  await doc.save();
  return doc._id;
}

const attachActivitySelfie = (id, imageData, user) =>
  attachSelfie(ActivityOnboarding, "activity-selfie", "idPhotos", id, imageData, user);
const attachCaravanSelfie = (id, imageData, user) =>
  attachSelfie(CaravanOnboarding, "caravan-selfie", "idPhotos", id, imageData, user);
const attachStaySelfie = (id, imageData, user) =>
  attachSelfie(StayOnboarding, "stay-selfie", "images", id, imageData, user);

// ─── Read endpoints ────────────────────────────────────────────────────
async function getMine(user) {
  const userId = user._id;
  const [activity, caravan, stay] = await Promise.all([
    ActivityOnboarding.findOne({ userId }).sort({ createdAt: -1 }),
    CaravanOnboarding.findOne({ userId }).sort({ createdAt: -1 }),
    StayOnboarding.findOne({ userId }).sort({ createdAt: -1 }),
  ]);

  const submissions = [
    { type: "activity", doc: activity },
    { type: "caravan", doc: caravan },
    { type: "stay", doc: stay },
  ].filter((x) => x.doc);

  if (!submissions.length) return null;
  submissions.sort((a, b) => new Date(b.doc.createdAt) - new Date(a.doc.createdAt));
  return submissions[0];
}

const listActivities = () => ActivityOnboarding.find().sort({ createdAt: -1 }).limit(100);
const listCaravans = () => CaravanOnboarding.find().sort({ createdAt: -1 }).limit(100);
const listStays = () => StayOnboarding.find().sort({ createdAt: -1 }).limit(100);

async function getActivity(id) {
  const doc = await ActivityOnboarding.findById(id);
  if (!doc) throw new NotFoundError("Activity", id);
  return doc;
}
async function getCaravan(id) {
  const doc = await CaravanOnboarding.findById(id);
  if (!doc) throw new NotFoundError("Caravan", id);
  return doc;
}
async function getStay(id) {
  const doc = await StayOnboarding.findById(id);
  if (!doc) throw new NotFoundError("Stay", id);
  return doc;
}

async function debugStats() {
  const [activities, caravans, stays] = await Promise.all([
    ActivityOnboarding.countDocuments(),
    CaravanOnboarding.countDocuments(),
    StayOnboarding.countDocuments(),
  ]);
  return { activities, caravans, stays, total: activities + caravans + stays };
}

module.exports = {
  submitActivity,
  submitCaravan,
  submitStay,
  attachActivitySelfie,
  attachCaravanSelfie,
  attachStaySelfie,
  getMine,
  listActivities,
  listCaravans,
  listStays,
  getActivity,
  getCaravan,
  getStay,
  debugStats,
};
