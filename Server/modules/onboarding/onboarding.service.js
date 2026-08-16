/**
 * Onboarding service.
 *
 * Vendors submit a long wizard for one of three service types — Activity,
 * Caravan, or Stay. Each submit:
 *
 *   1. Ensures a Vendor row exists (creating one in `pending` if not, and
 *      flipping `rejected` → `pending` to allow resubmission).
 *   2. Normalizes any data: URL photos / covers / idPhotos to /uploads.
 *   3. Upserts the type-specific onboarding doc with status='pending' —
 *      re-submitting while the previous one is pending/draft/rejected EDITS
 *      that doc rather than adding another (see upsertOnboardingDoc).
 *   4. Syncs the user's Profile with personal + business fields from the
 *      submission (best-effort, logged on failure).
 *   5. Cancels the vendor's other pending/rejected Offers for the same
 *      serviceType so the admin queue doesn't pile up duplicates.
 *   6. Syncs the matching Offer (status='pending') referencing the onboarding
 *      doc via sourceId/sourceModel — updating the linked offer in place on an
 *      edit, creating one only when none exists. On failure it deletes the
 *      onboarding doc, but only one this request created, so an edit can't
 *      destroy an existing submission (a hand-rolled saga).
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
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require("../../shared/errors");

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

const TYPE_LABELS = { activity: "activity", caravan: "caravan", stay: "unique stay" };

// A vendor may only have one submission in flight at a time — resubmitting
// the SAME type (editing a pending draft) is allowed and replaces it via
// supersedePreviousSubmissions below, but starting a DIFFERENT type while one is
// still awaiting admin action is blocked here so it can't be bypassed by
// navigating straight to another /onboarding/<type> URL.
async function findPendingSubmission(userId, excludingType) {
  const [activity, caravan, stay] = await Promise.all([
    excludingType === "activity" ? null : ActivityOnboarding.findOne({ userId, status: "pending" }),
    excludingType === "caravan" ? null : CaravanOnboarding.findOne({ userId, status: "pending" }),
    excludingType === "stay" ? null : StayOnboarding.findOne({ userId, status: "pending" }),
  ]);
  if (activity) return { type: "activity", doc: activity };
  if (caravan) return { type: "caravan", doc: caravan };
  if (stay) return { type: "stay", doc: stay };
  return null;
}

async function assertNoOtherPendingSubmission(userId, type) {
  const pending = await findPendingSubmission(userId, type);
  if (pending) {
    throw new ConflictError(
      `You already have a ${TYPE_LABELS[pending.type]} listing pending review. ` +
        `Please wait for admin approval or rejection before adding another service.`,
      { pendingType: pending.type, pendingId: String(pending.doc._id) },
    );
  }
}

// Statuses that mean "this submission is still the vendor's current draft".
// Re-submitting while in one of these states is an EDIT of that submission,
// which is exactly how the wizard presents it — see loadCaravanDraft, which
// hydrates the form from a pending/draft/rejected doc but wipes it and starts
// fresh once the doc is approved (an approved listing stays untouched, and the
// next submit becomes an additional listing).
const EDITABLE_STATUSES = ["pending", "draft", "rejected"];

/**
 * Reuse the vendor's in-flight submission for this service type, or start a new
 * one if there isn't one.
 *
 * Every submit handler used to call `Model.create()` unconditionally, so a
 * vendor who hit "Edit Details" on a pending submission and re-submitted got a
 * SECOND pending document — and the admin review queue (which is a plain
 * `find()`) listed the same caravan twice.
 *
 * Returns `{ doc, isNew }`; `isNew` matters because the offer-sync rollback may
 * only delete a document this call created. Deleting a pre-existing one would
 * throw away the vendor's submission.
 */
async function upsertOnboardingDoc(Model, user, vendor, fields) {
  const existing = await Model.findOne({
    userId: user._id,
    status: { $in: EDITABLE_STATUSES },
  }).sort({ createdAt: -1 });

  if (!existing) {
    const doc = await Model.create({
      ...fields,
      userId: user._id,
      vendorId: vendor && vendor.vendorId,
      status: "pending",
    });
    return { doc, isNew: true };
  }

  Object.assign(existing, fields);
  existing.vendorId = (vendor && vendor.vendorId) || existing.vendorId;
  existing.status = "pending";
  // A resubmission is a fresh request for review; the old reason no longer
  // applies and the wizard would otherwise keep showing it.
  existing.rejectionReason = "";
  await existing.save();
  logger.info(
    { model: Model.modelName, onboardingId: String(existing._id), userId: String(user._id) },
    "[Onboarding] updated existing submission instead of creating a duplicate",
  );
  return { doc: existing, isNew: false };
}

// The onboarding collection behind each offer `serviceType`. Keyed on the
// serviceType strings this module stamps on offers, not on the /onboarding/<x>
// URL segment — they differ ("camper-van" vs "caravan").
const ONBOARDING_MODEL_BY_SERVICE_TYPE = {
  activity: ActivityOnboarding,
  "camper-van": CaravanOnboarding,
  "unique-stay": StayOnboarding,
};

/**
 * Retire the vendor's other in-flight submissions for this service type —
 * both the offer (what the admin review queue lists) and the onboarding doc
 * (what gates the vendor from starting another service type).
 *
 * The offer filter used to key on `category`, comparing against hardcoded slugs
 * (["caravan", "campervan", "camper-trailer", …]). For activities and stays the
 * offer's category is a constant that happened to match, but a caravan offer
 * stores the van type the vendor picked — "Camper Trailer", "Cargo Van", or
 * free text — so the filter never matched and the previous pending offer was
 * left pending. That is what put a duplicate caravan in the admin Pending tab.
 * `serviceType` is set by this module rather than by the vendor, so it is a
 * reliable key.
 *
 * Cancelling only the offer left the pair inconsistent, and stranded the
 * vendor: the superseded onboarding doc stayed "pending", so
 * findPendingSubmission kept refusing every other service type, while the admin
 * queue — which reads offers — had nothing left to approve or reject. There was
 * no way out of that state from either side. Both halves are retired here so
 * "pending" means the same thing in both collections.
 *
 * The submission identified by `exceptSourceId` (an onboarding doc _id) is left
 * alone: it's the one the caller is submitting right now.
 */
async function supersedePreviousSubmissions(userId, serviceType, exceptSourceId) {
  try {
    const filter = {
      userId,
      serviceType,
      status: { $in: ["pending", "rejected"] },
    };
    if (exceptSourceId) filter.sourceId = { $ne: exceptSourceId };
    await Offer.updateMany(filter, { status: "cancelled" });
  } catch (err) {
    logger.warn({ err: err.message }, "[Onboarding] failed to cancel old offers");
  }

  try {
    const Model = ONBOARDING_MODEL_BY_SERVICE_TYPE[serviceType];
    if (!Model) return;
    const filter = { userId, status: "pending" };
    if (exceptSourceId) filter._id = { $ne: exceptSourceId };
    const res = await Model.updateMany(filter, { status: "cancelled" });
    if (res.modifiedCount) {
      logger.info(
        { model: Model.modelName, userId: String(userId), count: res.modifiedCount },
        "[Onboarding] superseded older pending submission(s)",
      );
    }
  } catch (err) {
    logger.warn({ err: err.message }, "[Onboarding] failed to supersede old submissions");
  }
}

/**
 * Point the onboarding doc's offer at the latest submitted values.
 *
 * Updates the offer already linked to this submission (sourceId + sourceModel)
 * so an edit keeps one offer, and creates one only when none exists yet. On
 * failure the onboarding doc is deleted to keep the pair consistent — but only
 * when this request created it (`isNew`).
 */
async function syncOfferForOnboarding(offerData, onboardingModel, doc, isNew) {
  try {
    const existing = await Offer.findOne({
      sourceId: doc._id,
      sourceModel: onboardingModel.modelName,
    });
    if (existing) {
      Object.assign(existing, offerData);
      await existing.save();
      return;
    }
    await Offer.create(offerData);
  } catch (err) {
    logger.error({ err, onboardingId: String(doc._id), isNew }, "[Onboarding] offer sync failed");
    if (isNew) await onboardingModel.findByIdAndDelete(doc._id);
    throw new BadRequestError(`Failed to create Offer: ${err.message}`);
  }
}

// ─── Submit handlers ───────────────────────────────────────────────────
async function submitActivity(body, user) {
  await assertNoOtherPendingSubmission(user._id, "activity");
  const vendor = await ensureVendor(user);

  const strPhotos = await normalizeImageArray(body.photos || [], "activity-photo");
  let strCoverImage = null;
  if (body.coverImage) {
    const covers = await normalizeImageArray([body.coverImage], "activity-cover");
    strCoverImage = covers[0] || null;
  }
  const strIdPhotos = await normalizeImageArray(body.idPhotos || [], "activity-id-photo");

  const { doc, isNew } = await upsertOnboardingDoc(ActivityOnboarding, user, vendor, {
    ...body,
    photos: strPhotos,
    coverImage: strCoverImage,
    idPhotos: strIdPhotos,
  });

  await syncUserProfile(user.email, { ...body, idPhotos: strIdPhotos, type: "activity" });
  await supersedePreviousSubmissions(user._id, "activity", doc._id);

  await syncOfferForOnboarding(
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
    doc,
    isNew,
  );

  return doc;
}

async function submitCaravan(body, user) {
  await assertNoOtherPendingSubmission(user._id, "caravan");
  const vendor = await ensureVendor(user);

  const strPhotos = await normalizeImageArray(body.photos || [], "caravan-photo");
  const rawCover = Array.isArray(body.coverImage)
    ? body.coverImage
    : body.coverImage
      ? [body.coverImage]
      : [];
  const strCoverImage = await normalizeImageArray(rawCover, "caravan-cover");
  /**
   * ID photos have to be normalised like every other image.
   *
   * This line was missing — `photos` and `coverImage` were written to /uploads
   * but `idPhotos` fell through the `...body` spread below as raw
   * `data:image/...;base64,...` strings and was stored inline in MongoDB.
   * Caravan onboarding documents reached 2.8 MB each (activity, which does
   * normalise, averages 0.05 MB), and GET /api/onboarding/mine returns the
   * whole document — which is why that endpoint took ~20s.
   */
  const strIdPhotos = await normalizeImageArray(body.idPhotos || [], "caravan-id-photo");

  const { doc, isNew } = await upsertOnboardingDoc(CaravanOnboarding, user, vendor, {
    ...body,
    photos: strPhotos,
    coverImage: strCoverImage,
    idPhotos: strIdPhotos,
  });

  await syncUserProfile(user.email, { ...body, idPhotos: strIdPhotos, type: "caravan" });
  await supersedePreviousSubmissions(user._id, "camper-van", doc._id);

  await syncOfferForOnboarding(
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
    doc,
    isNew,
  );

  return doc;
}

async function submitStay(body, user) {
  await assertNoOtherPendingSubmission(user._id, "stay");
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

  // The cover was the one image this flow never normalised (submitActivity and
  // submitCaravan both do), so every stay doc stored a multi-megabyte base64
  // string that then rode along on every /onboarding/mine and admin fetch.
  const [strCoverImage] = await normalizeImageArray(
    body.coverImage ? [body.coverImage] : [],
    "stay-cover",
  );

  const { doc, isNew } = await upsertOnboardingDoc(StayOnboarding, user, vendor, {
    ...body,
    images: strImages,
    idPhotos: strIdPhotos,
    ...(strCoverImage ? { coverImage: strCoverImage } : {}),
  });

  await syncUserProfile(user.email, { ...body, idPhotos: strIdPhotos, type: "stay" });
  await supersedePreviousSubmissions(user._id, "unique-stay", doc._id);

  const firstRoomPhotos =
    (doc.rooms && doc.rooms[0] && Array.isArray(doc.rooms[0].photos) && doc.rooms[0].photos) || [];
  const strPhotos = firstRoomPhotos
    .map((p) => (typeof p === "string" ? p : String(p)))
    .filter((s) => typeof s === "string" && s.length > 0);

  await syncOfferForOnboarding(
    {
      name: doc.propertyName || (doc.selectedProperties && doc.selectedProperties[0]) || "Stay",
      category: "stay",
      description:
        (doc.description && String(doc.description).trim()) || "Auto-created from stay onboarding",
      // The house rules the vendor typed. This passed `[]` and then a phantom
      // `entireStayRules` key below — a field neither Offer nor StayOnboarding
      // declares, so strict mode dropped it and no listing ever showed rules.
      rules: doc.rules || [],
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
    doc,
    isNew,
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
/**
 * The submission of one type that the wizard should act on: a pending one if
 * there is any, otherwise the most recent doc.
 *
 * The pending query is deliberately separate from "newest doc". Asking only for
 * the newest hid an older pending submission behind a newer approved one, e.g.
 *
 *   caravan  approved  created 18:15   ← what findOne().sort() returned
 *   caravan  pending   created 17:50   ← what the submit guard found
 *
 * so `getMine` reported "caravan approved", ServiceSelection left the other
 * services unlocked, the stay wizard rendered all eight steps — and only the
 * final submit failed, with `assertNoOtherPendingSubmission` reporting the
 * pending caravan the vendor was never shown. The gates and the guard have to
 * agree on what counts as in-flight, and `findPendingSubmission` is the
 * definition: any doc with status "pending".
 *
 * Exported for tests: `Model` only needs a `findOne(filter).sort(spec)` chain.
 */
async function findCurrentSubmission(Model, userId) {
  const pending = await Model.findOne({ userId, status: "pending" }).sort({ createdAt: -1 });
  if (pending) return pending;
  return Model.findOne({ userId }).sort({ createdAt: -1 });
}

async function getMine(user) {
  const userId = user._id;
  const [activity, caravan, stay] = await Promise.all([
    findCurrentSubmission(ActivityOnboarding, userId),
    findCurrentSubmission(CaravanOnboarding, userId),
    findCurrentSubmission(StayOnboarding, userId),
  ]);

  const submissions = [
    { type: "activity", doc: activity },
    { type: "caravan", doc: caravan },
    { type: "stay", doc: stay },
  ].filter((x) => x.doc);

  if (!submissions.length) return null;

  // A still-pending submission always wins, even if a different type's latest
  // doc is more recent — otherwise a newer approved/rejected doc in another
  // category would hide an older pending one from the "one at a time" gate.
  const pending = submissions.find((x) => x.doc.status === "pending");

  submissions.sort((a, b) => new Date(b.doc.createdAt) - new Date(a.doc.createdAt));
  const current = pending || submissions[0];

  /**
   * `byType` alongside the winning submission.
   *
   * The single `{ type, doc }` answer is what drives the "one service at a time"
   * gate, so it must stay. But each wizard also needs ITS OWN latest doc, and
   * with only the winner it can't get one: a vendor whose caravan was approved
   * today and whose stay was approved two days ago asks the stay wizard to load,
   * and is told the current submission is a caravan. The stay page then can't
   * tell "you have an approved stay, start a fresh one" from "you have no stay
   * at all" — and a REJECTED stay hidden behind a newer caravan could never be
   * opened for editing either.
   *
   * Additive on purpose: `type` and `doc` are unchanged, so the cross-type
   * pending block and the caravan/activity loaders keep working as they are.
   */
  return {
    ...(current || {}),
    byType: {
      activity: activity || null,
      caravan: caravan || null,
      stay: stay || null,
    },
  };
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
  findCurrentSubmission, // exported for tests
  listActivities,
  listCaravans,
  listStays,
  getActivity,
  getCaravan,
  getStay,
  debugStats,
};
