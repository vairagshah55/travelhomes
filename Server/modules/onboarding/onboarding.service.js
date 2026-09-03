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
const VehicleOnboarding = require("../../models/VehicleOnboarding");
const Offer = require("../../models/Offer");
const Vendor = require("../../models/Vendor");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const logger = require("../../shared/logger");
const { evaluateCompliance } = require("../../shared/vehicleCompliance");
const { restoreOne: restoreCompliance } = require("../../services/complianceMonitor");
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

/**
 * Split a data URL into its mime and bytes, or null when it isn't one.
 *
 * Parsed by hand rather than with `/^data:([^;]+);base64,(.*)$/`, which
 * required `;base64` to sit immediately after the mime and so rejected any URL
 * carrying a media-type parameter — `data:image/jpeg;charset=utf-8;base64,…`
 * is well-formed and that pattern did not match it. A rejection here is not
 * inert: callers treat "not a data URL" as "leave the string alone", which is
 * how multi-megabyte base64 ended up stored in Mongo (see attachSelfie).
 *
 * Returns null for a non-base64 payload (`data:image/svg+xml,<svg…>`) on
 * purpose — that is text to percent-decode, not bytes to write, and nothing
 * here uploads one. `Buffer.from(…, "base64")` never throws; it drops invalid
 * characters silently, so an empty buffer is the real signal of a bad payload.
 */
function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return null;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;

  const params = dataUrl.slice(5, comma).split(";");
  if (!params.some((p) => p.trim().toLowerCase() === "base64")) return null;

  const mime = (params[0] || "").trim().toLowerCase();
  const buffer = Buffer.from(dataUrl.slice(comma + 1), "base64");
  if (!buffer.length) return null;
  return { mime, buffer, ext: mimeToExt(mime) };
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

/**
 * The listing's hero photo, for the Offer's `photos.coverUrl`.
 *
 * Every wizard asks the vendor for a cover SEPARATELY from the gallery, and
 * each onboarding model stores it in `coverImage` — a String for activity and
 * stay, an array for caravan and vehicle. Three of the four submit handlers
 * then built the Offer with `coverUrl: gallery[0]` and never read it, so the
 * one photo the vendor explicitly chose as the hero was the one photo no
 * surface ever showed: cards, search results, the detail page, the admin table
 * and the trip screens all read `Offer.photos.coverUrl`.
 *
 * Reads the cover off the PERSISTED doc rather than the request. A vendor
 * editing a pending submission without re-picking the cover sends back the
 * existing `/uploads/...` string (loadStayDraft and friends hydrate the field
 * from the doc), and in submitStay's case a failed normalisation leaves the
 * previous value in place — the doc is the state that actually survived either
 * way.
 *
 * Falls back to the first gallery photo, which is what the three broken
 * handlers did unconditionally: a listing with no cover on file is better off
 * showing a photo than a broken image.
 */
function coverUrlFor(doc, gallery = []) {
  const raw = doc && doc.coverImage;
  const cover = Array.isArray(raw) ? raw.find((c) => typeof c === "string" && c.trim()) : raw;
  if (typeof cover === "string" && cover.trim()) return cover;
  return gallery[0] || "";
}

// ─── Price helper ──────────────────────────────────────────────────────
const parsePrice = (val) => {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const cleaned = String(val || "").replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

// ─── Onboarding → Offer field normalisers ──────────────────────────────
/**
 * The four onboarding schemas each named their discount fields differently
 * (caravan/vehicle: `festivalOffersValue`, activity: `festivalDiscountAmount`,
 * stay: a single `discountPercentage` for all of them), and none of them was
 * ever copied onto `Offer.discounts`. The vendor's own edit wizard reads that
 * sub-doc, so every discount a vendor configured during onboarding came back
 * as "off" the first time they opened Edit — and re-saving then wrote those
 * empty toggles back over the submission's values.
 *
 * This maps all three shapes onto the one canonical sub-doc.
 */
function discountsFromOnboarding(doc) {
  const str = (v) => (v === undefined || v === null ? "" : String(v));
  const kind = (v) => (String(v || "").toLowerCase() === "fixed" ? "fixed" : "percentage");

  /** First non-empty of the candidate field names. */
  const pick = (...keys) => {
    for (const k of keys) {
      const v = doc[k];
      if (v !== undefined && v !== null && String(v) !== "") return v;
    }
    return "";
  };

  /**
   * Each list is [...slot-specific keys, shared key]. The shared keys —
   * stay onboarding's single `discountType` / `discountPercentage` / `finalPrice`
   * for all four offers — are only consulted for a slot the vendor actually
   * switched on, so a disabled slot doesn't come back pre-filled with another
   * offer's number.
   */
  const slot = (enabled, specific, shared) => ({
    enabled,
    type: kind(pick(...specific.type, ...(enabled ? shared.type : []))),
    value: str(pick(...specific.value, ...(enabled ? shared.value : []))),
    finalPrice: str(pick(...specific.finalPrice, ...(enabled ? shared.finalPrice : []))),
  });

  const SHARED = {
    type: ["discountType"],
    value: ["discountPercentage"],
    finalPrice: ["finalPrice"],
  };

  return {
    firstUser: slot(
      !!doc.firstUserDiscount,
      {
        type: ["firstUserDiscountType"],
        value: ["firstUserDiscountValue", "discountAmount"],
        finalPrice: ["firstUserDiscountFinalPrice"],
      },
      SHARED,
    ),
    festival: slot(
      !!doc.festivalOffers,
      {
        type: ["festivalOffersType", "festivalDiscountType"],
        value: ["festivalOffersValue", "festivalDiscountAmount"],
        finalPrice: ["festivalOffersFinalPrice", "festivalFinalPrice"],
      },
      SHARED,
    ),
    // Caravan and vehicle call it weeklyMonthlyOffers; stay and activity
    // weeklyOffers. Either enables the same slot.
    weekly: slot(
      !!(doc.weeklyMonthlyOffers || doc.weeklyOffers),
      {
        type: ["weeklyMonthlyOffersType", "weeklyDiscountType"],
        value: ["weeklyMonthlyOffersValue", "weeklyDiscountAmount"],
        finalPrice: ["weeklyMonthlyOffersFinalPrice", "weeklyFinalPrice"],
      },
      SHARED,
    ),
    special: slot(
      !!doc.specialOffers,
      {
        type: ["specialOffersType", "specialDiscountType"],
        value: ["specialOffersValue", "specialDiscountAmount"],
        finalPrice: ["specialOffersFinalPrice", "specialFinalPrice"],
      },
      SHARED,
    ),
  };
}

/**
 * The listing's category, as a name the CMS category list actually contains.
 *
 * Stay and activity used to hard-code the literals "stay" and "activity" here,
 * which are service types, not categories — so a villa listing was stored with
 * `category: "stay"`, no tile in the wizard's category grid matched it, and the
 * vendor was shown an apparently unselected required step. The real choice was
 * sitting in `selectedProperties` / `selectedActivities` all along.
 */
function categoryFromOnboarding(doc, serviceType) {
  /*
   * Values that are a service type or a UI default rather than a category the
   * vendor chose.
   *
   * "default" earns its place here from real data: two live stay submissions
   * carry `selectedCategories: ["default"]` — the wizard's own placeholder —
   * while the property type the vendor actually picked sits one candidate later
   * in `selectedProperties` ("villa", "cave house"). Without this the backfill
   * writes the literal string "default" into a required field, which is worse
   * than the "stay" it replaces.
   */
  const placeholders = new Set([
    "stay",
    "activity",
    "caravan",
    "camper-van",
    "vehicle-rental",
    "default",
    "none",
    "other",
  ]);
  const candidates = [
    doc.category,
    Array.isArray(doc.selectedCategories) && doc.selectedCategories[0],
    Array.isArray(doc.selectedProperties) && doc.selectedProperties[0],
    Array.isArray(doc.selectedActivities) && doc.selectedActivities[0],
  ];
  for (const c of candidates) {
    const name = typeof c === "string" ? c.trim() : "";
    if (name && !placeholders.has(name.toLowerCase())) return name;
  }
  // Nothing usable — fall back to the service type so the required field is
  // still populated, exactly as before.
  return serviceType;
}

/**
 * House rules, whichever field the flow put them in.
 *
 * Stay, caravan and vehicle write `rules`; activity writes only
 * `rulesAndRegulations`. Reading just the first name silently dropped every
 * activity's rules.
 */
function rulesFromOnboarding(doc) {
  const pickList = (v) =>
    (Array.isArray(v) ? v : []).map((r) => String(r || "").trim()).filter(Boolean);
  const primary = pickList(doc.rules);
  return primary.length ? primary : pickList(doc.rulesAndRegulations);
}

/**
 * Street address. Every onboarding flow collects one, and not one of them was
 * copied onto the Offer — which is why the edit wizard's address field opened
 * blank and its embedded map pointed at just the city.
 */
function addressFromOnboarding(doc) {
  const raw = doc.address || doc.businessAddress || "";
  return typeof raw === "string" ? raw.trim() : "";
}

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

const TYPE_LABELS = {
  activity: "activity",
  caravan: "caravan",
  stay: "unique stay",
  vehicle: "vehicle rental",
};

/**
 * The offer statuses an admin reaches by deciding a submission, mapped to the
 * onboarding status that decision means. `cancelled`/`deactivated`/`blocked`
 * are admin actions too (offers.service maps them to "rejected"), so they are
 * listed here rather than being treated as "no decision yet".
 */
const OFFER_STATUS_TO_ONBOARDING = {
  approved: "approved",
  rejected: "rejected",
  cancelled: "cancelled",
  deactivated: "rejected",
  blocked: "rejected",
};

/**
 * Bring a "pending" onboarding doc back in line with the Offer the admin
 * actually acts on, and report whether it is still in flight.
 *
 * The doc's status is a denormalised copy of a decision that is made on the
 * Offer: the admin approves a row in /admin/management/listing, and the server
 * mirrors that onto the onboarding doc. Every mirror written so far has leaked
 * at least once — offers.service skipped vehicles because its sourceModel
 * lookup predated them, management.service wrote the decision onto a caravan,
 * and supersedePreviousSubmissions used to retire the offer alone. Each leak
 * produced the same stuck state, and it is unrecoverable from the UI: the
 * offer is already approved, so the admin's Approve action is hidden and the
 * sync can never be re-run. The vendor sits on "under review" forever with
 * every other service locked — the state the vehicle-rental approvals left
 * their vendors in before the sourceModel map was fixed.
 *
 * So the gate stops trusting the copy. When the doc says "pending" we ask its
 * Offer, and if the Offer has already been decided the doc is corrected — the
 * Offer is the record the admin acted on, so it wins. This heals docs stranded
 * by past bugs on the next read, and contains any future mirror that leaks.
 *
 * A doc with no Offer row at all is left pending: that pairing is what
 * scripts/fix-stranded-onboarding.js resolves with a human looking, and a read
 * path shouldn't cancel a submission on the strength of a missing row (an
 * offer-sync failure mid-submit looks identical).
 *
 * Never throws: a reconciliation failure must not take down /onboarding/mine.
 * `OfferModel` is injectable for tests.
 */
async function reconcileWithOffer(doc, OfferModel = Offer) {
  if (!doc || doc.status !== "pending" || !doc._id) return doc;

  try {
    const offers = await OfferModel.find({ sourceId: doc._id }, "status rejectionReason").lean();
    if (!offers.length) return doc;
    if (offers.some((o) => o.status === "pending")) return doc;

    const decided = offers.find((o) => OFFER_STATUS_TO_ONBOARDING[o.status]);
    if (!decided) return doc;

    const next = OFFER_STATUS_TO_ONBOARDING[decided.status];
    doc.status = next;
    if (next === "rejected" && decided.rejectionReason) {
      doc.rejectionReason = decided.rejectionReason;
    }
    await doc.save();
    logger.warn(
      {
        model: doc.constructor && doc.constructor.modelName,
        onboardingId: String(doc._id),
        offerStatus: decided.status,
        next,
      },
      "[Onboarding] pending submission disagreed with its offer — corrected from the offer",
    );
  } catch (err) {
    logger.error(
      { err: err.message, onboardingId: String(doc._id) },
      "[Onboarding] offer reconciliation failed — leaving submission as-is",
    );
  }
  return doc;
}

/**
 * The vendor's genuinely in-flight submission of one type, or null.
 *
 * One definition of "in flight" for both gates — the read gate behind
 * GET /onboarding/mine and the write gate in assertNoOtherPendingSubmission.
 * They have drifted apart before, and when they do the wizard renders every
 * step and only the final submit fails.
 *
 * The loop exists because reconcileWithOffer can retire the doc it was handed:
 * each pass either returns a still-pending doc or removes one from the pending
 * set, so it terminates. Bounded anyway, so a save that silently no-ops can't
 * spin.
 */
async function findLivePendingSubmission(Model, userId, OfferModel = Offer) {
  for (let i = 0; i < 5; i += 1) {
    const pending = await Model.findOne({ userId, status: "pending" }).sort({ createdAt: -1 });
    if (!pending) return null;
    const reconciled = await reconcileWithOffer(pending, OfferModel);
    if (reconciled.status === "pending") return reconciled;
  }
  return null;
}

// A vendor may only have one submission in flight at a time — resubmitting
// the SAME type (editing a pending draft) is allowed and replaces it via
// supersedePreviousSubmissions below, but starting a DIFFERENT type while one is
// still awaiting admin action is blocked here so it can't be bypassed by
// navigating straight to another /onboarding/<type> URL.
async function findPendingSubmission(userId, excludingType) {
  const [activity, caravan, stay, vehicle] = await Promise.all([
    excludingType === "activity" ? null : findLivePendingSubmission(ActivityOnboarding, userId),
    excludingType === "caravan" ? null : findLivePendingSubmission(CaravanOnboarding, userId),
    excludingType === "stay" ? null : findLivePendingSubmission(StayOnboarding, userId),
    excludingType === "vehicle" ? null : findLivePendingSubmission(VehicleOnboarding, userId),
  ]);
  if (activity) return { type: "activity", doc: activity };
  if (caravan) return { type: "caravan", doc: caravan };
  if (stay) return { type: "stay", doc: stay };
  if (vehicle) return { type: "vehicle", doc: vehicle };
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
  "vehicle-rental": VehicleOnboarding,
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
      category: categoryFromOnboarding(doc, "activity"),
      description:
        (doc.description && String(doc.description).trim()) ||
        "Auto-created from activity onboarding",
      /* The activity wizard collects house rules under `rulesAndRegulations` and
         has no `rules` field at all, so `doc.rules` is always empty and every
         activity listing reached the catalog — and the vendor's own edit
         wizard — with no rules on it. */
      rules: rulesFromOnboarding(doc),
      features: doc.features || [],
      seatingCapacity: doc.personCapacity,
      sleepingCapacity: 0,
      address: addressFromOnboarding(doc),
      discounts: discountsFromOnboarding(doc),
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
      photos: { coverUrl: coverUrlFor(doc, strPhotos), galleryUrls: strPhotos.slice(0, 6) },
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
      category: categoryFromOnboarding(doc, "camper-van"),
      description:
        (doc.description && String(doc.description).trim()) ||
        "Auto-created from caravan onboarding",
      rules: doc.rules || [],
      features: doc.features || [],
      seatingCapacity: doc.seatingCapacity,
      sleepingCapacity: doc.sleepingCapacity,
      address: addressFromOnboarding(doc),
      discounts: discountsFromOnboarding(doc),
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
      photos: { coverUrl: coverUrlFor(doc, strPhotos), galleryUrls: strPhotos.slice(0, 6) },
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

async function submitVehicle(body, user) {
  await assertNoOtherPendingSubmission(user._id, "vehicle");

  /* The wizard blocks a past date at step 4, but the wizard is not the only
     caller — a draft can be resumed days later and submitted with a date that
     has since lapsed, and the API is reachable directly. Refusing here is
     cheaper than accepting a listing the sweep will pull the same night. */
  const submitted = evaluateCompliance(body);
  if (submitted.expired.length) {
    const labels = submitted.expired.map((d) => d.label).join(" and ");
    throw new BadRequestError(
      `${labels} has expired. Renew the document and enter the new date before submitting.`,
    );
  }
  const vendor = await ensureVendor(user);

  const strPhotos = await normalizeImageArray(body.photos || [], "vehicle-photo");
  const rawCover = Array.isArray(body.coverImage)
    ? body.coverImage
    : body.coverImage
      ? [body.coverImage]
      : [];
  const strCoverImage = await normalizeImageArray(rawCover, "vehicle-cover");
  const strIdPhotos = await normalizeImageArray(body.idPhotos || [], "vehicle-id-photo");
  // Compliance and driver documents go through the same normaliser as every
  // other image. Skipping it is what bloated caravan documents to ~2.8 MB
  // each (see the note in submitCaravan) — these arrays are the same shape.
  const strRcPhotos = await normalizeImageArray(body.rcPhotos || [], "vehicle-rc-photo");
  const strDriverLicencePhotos = await normalizeImageArray(
    body.driverLicencePhotos || [],
    "vehicle-driver-licence",
  );

  const { doc, isNew } = await upsertOnboardingDoc(VehicleOnboarding, user, vendor, {
    ...body,
    photos: strPhotos,
    coverImage: strCoverImage,
    idPhotos: strIdPhotos,
    rcPhotos: strRcPhotos,
    driverLicencePhotos: strDriverLicencePhotos,
  });

  await syncUserProfile(user.email, { ...body, idPhotos: strIdPhotos, type: "vehicle" });
  await supersedePreviousSubmissions(user._id, "vehicle-rental", doc._id);

  // The headline price guests see. Self-drive is checked first because it's the
  // cheaper of the two when a vendor offers both (no driver allowance), so the
  // card shows the "from" rate rather than the higher chauffeur rate.
  // Self-drive is quoted per day, chauffeur work per KILOMETRE — the chauffeur
  // per-day rate is no longer collected. Falling through to it left a
  // with-driver-only listing with a headline of 0, i.e. a card advertising ₹0.
  // `withDriverPerDay` stays in the chain for listings created before that.
  const headlinePrice =
    parsePrice(doc.selfDriveEnabled ? doc.selfDrivePerDay : 0) ||
    parsePrice(doc.withDriverEnabled ? doc.withDriverPerKm : 0) ||
    parsePrice(doc.withDriverEnabled ? doc.withDriverPerDay : 0) ||
    parsePrice(doc.finalPrice || 0);

  await syncOfferForOnboarding(
    {
      name: doc.name || "Vehicle",
      category: categoryFromOnboarding(doc, "vehicle-rental"),
      description:
        (doc.description && String(doc.description).trim()) ||
        "Auto-created from vehicle rental onboarding",
      rules: doc.rules || [],
      features: doc.features || [],
      seatingCapacity: doc.seatingCapacity,
      luggageCapacity: doc.luggageCapacity,
      address: addressFromOnboarding(doc),
      discounts: discountsFromOnboarding(doc),
      locality: doc.locality,
      pincode: doc.pincode,
      city: doc.city || "Default City",
      state: doc.state || "Default State",
      regularPrice: headlinePrice,

      vehicleClass: doc.vehicleClass,
      brand: doc.brand,
      model: doc.model,
      manufactureYear: doc.manufactureYear,
      registrationNumber: doc.registrationNumber,
      fuelType: doc.fuelType,
      transmission: doc.transmission,
      airConditioned: !!doc.airConditioned,
      pickupPoints: doc.pickupPoints || [],

      selfDriveEnabled: !!doc.selfDriveEnabled,
      selfDrivePerDay: parsePrice(doc.selfDrivePerDay),
      selfDrivePerKm: parsePrice(doc.selfDrivePerKm),
      freeKmPerDay: parsePrice(doc.freeKmPerDay),
      extraKmCharge: parsePrice(doc.extraKmCharge),
      securityDeposit: parsePrice(doc.securityDeposit),
      minRentalHours: parsePrice(doc.minRentalHours),
      selfDriveIncludes: doc.selfDriveIncludes || [],
      selfDriveExcludes: doc.selfDriveExcludes || [],

      withDriverEnabled: !!doc.withDriverEnabled,
      withDriverPerDay: parsePrice(doc.withDriverPerDay),
      withDriverPerKm: parsePrice(doc.withDriverPerKm),
      withDriverOneWay: doc.withDriverOneWay !== false,
      withDriverTwoWay: doc.withDriverTwoWay !== false,
      driverAllowancePerDay: parsePrice(doc.driverAllowancePerDay),
      nightChargeAfter: parsePrice(doc.nightChargeAfter),
      outstationPerKm: parsePrice(doc.outstationPerKm),
      withDriverIncludes: doc.withDriverIncludes || [],
      withDriverExcludes: doc.withDriverExcludes || [],

      fuelPolicy: doc.fuelPolicy,
      tollsAndParking: doc.tollsAndParking,
      cancellationWindowHours: parsePrice(doc.cancellationWindowHours),

      // Mirrored onto the offer so the expiry sweep and every listing surface
      // read one document instead of joining back to the submission.
      insuranceExpiry: doc.insuranceExpiry || null,
      pucExpiry: doc.pucExpiry || null,

      // Kept for the shared includes/excludes renderer on the details page,
      // which reads priceIncludes/priceExcludes for every service type.
      priceIncludes: doc.selfDriveEnabled
        ? doc.selfDriveIncludes || []
        : doc.withDriverIncludes || [],
      priceExcludes: doc.selfDriveEnabled
        ? doc.selfDriveExcludes || []
        : doc.withDriverExcludes || [],

      serviceType: "vehicle-rental",
      photos: {
        coverUrl: coverUrlFor(doc, strPhotos),
        galleryUrls: strPhotos.slice(0, 6),
      },
      status: "pending",
      userId: user._id,
      vendorId: vendor && vendor.vendorId,
      sourceId: doc._id,
      sourceModel: "VehicleOnboarding",
    },
    VehicleOnboarding,
    doc,
    isNew,
  );

  /* Re-submitting the whole wizard is the other way a vendor can renew. The
     offer has just been rewritten with the new dates, so lift any hold it was
     under — silently, because the vendor is looking at the confirmation screen
     that caused it. */
  const synced = await Offer.findOne({ sourceId: doc._id, sourceModel: "VehicleOnboarding" });
  if (synced) await restoreCompliance(synced, { silent: true });

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
      /* Was the literal "stay" — a service type, not a category. The property
         type the vendor picked (Villas, Farm Stay, …) lives in
         selectedProperties / selectedCategories; see categoryFromOnboarding. */
      category: categoryFromOnboarding(doc, "unique-stay"),
      description:
        (doc.description && String(doc.description).trim()) || "Auto-created from stay onboarding",
      // The house rules the vendor typed. This passed `[]` and then a phantom
      // `entireStayRules` key below — a field neither Offer nor StayOnboarding
      // declares, so strict mode dropped it and no listing ever showed rules.
      rules: doc.rules || [],
      features: doc.selectedFeatures || [],
      guestCapacity: doc.guestCapacity,
      numberOfBeds: doc.numberOfBeds,
      address: addressFromOnboarding(doc),
      discounts: discountsFromOnboarding(doc),
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
      checkInTime: doc.checkInTime || "",
      checkOutTime: doc.checkOutTime || "",
      rooms: doc.rooms,
      // Declared on Offer now — it used to be dropped by strict mode, so the
      // edit wizard reloaded an empty optional-rules list every time.
      optionalRules: doc.optionalRules || [],
      serviceType: "unique-stay",
      /* `strPhotos` here is rooms[0].photos — the gallery. Taking coverUrl from
         it is what made a stay show its first room photo as the hero while the
         vendor's own cover sat unused on the submission. */
      photos: { coverUrl: coverUrlFor(doc, strPhotos), galleryUrls: strPhotos.slice(0, 6) },
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

  /**
   * A failed save must NOT fall back to storing the data URL itself.
   *
   * That fallback (`asUrl || imageData`) is how caravan and activity documents
   * ended up holding raw base64 — one is 2.8 MB. The cost is not just disk:
   * GET /onboarding/mine returns the whole document to the SPA on every visit,
   * so a single bad selfie makes the vendor's own onboarding screens crawl.
   * normalizeImageArray, the other entry point for the same kind of data,
   * already drops on failure rather than storing it; these two disagreed.
   *
   * Failing loudly is the better of the two remaining options: the vendor
   * retakes one photo, instead of silently owning a listing whose ID photo is
   * a megabyte of text nothing can render as a file.
   */
  let asUrl;
  if (typeof imageData === "string" && imageData.startsWith("data:")) {
    asUrl = await saveDataUrlToUploads(imageData, prefix);
    if (!asUrl) throw new BadRequestError("That photo could not be read — please retake it.");
  } else {
    asUrl = typeof imageData === "string" ? imageData : String(imageData);
  }

  const arr = Array.isArray(doc[imagesField]) ? doc[imagesField].slice() : [];
  arr.push(asUrl);
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
const attachVehicleSelfie = (id, imageData, user) =>
  attachSelfie(VehicleOnboarding, "vehicle-selfie", "idPhotos", id, imageData, user);

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
 * agree on what counts as in-flight, so both now go through
 * `findLivePendingSubmission` — "pending, and its offer has not already been
 * decided" — rather than reading the doc's status twice from two places.
 *
 * Exported for tests: `Model` only needs a `findOne(filter).sort(spec)` chain,
 * and `OfferModel` is injectable so the reconciliation can be exercised without
 * a database.
 */
async function findCurrentSubmission(Model, userId, OfferModel = Offer) {
  const pending = await findLivePendingSubmission(Model, userId, OfferModel);
  if (pending) return pending;
  return Model.findOne({ userId }).sort({ createdAt: -1 });
}

async function getMine(user) {
  const userId = user._id;
  const [activity, caravan, stay, vehicle] = await Promise.all([
    findCurrentSubmission(ActivityOnboarding, userId),
    findCurrentSubmission(CaravanOnboarding, userId),
    findCurrentSubmission(StayOnboarding, userId),
    findCurrentSubmission(VehicleOnboarding, userId),
  ]);

  const submissions = [
    { type: "activity", doc: activity },
    { type: "caravan", doc: caravan },
    { type: "stay", doc: stay },
    { type: "vehicle", doc: vehicle },
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
      vehicle: vehicle || null,
    },
  };
}

const listActivities = () => ActivityOnboarding.find().sort({ createdAt: -1 }).limit(100);
const listCaravans = () => CaravanOnboarding.find().sort({ createdAt: -1 }).limit(100);
const listStays = () => StayOnboarding.find().sort({ createdAt: -1 }).limit(100);
const listVehicles = () => VehicleOnboarding.find().sort({ createdAt: -1 }).limit(100);

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
async function getVehicle(id) {
  const doc = await VehicleOnboarding.findById(id);
  if (!doc) throw new NotFoundError("Vehicle", id);
  return doc;
}

async function debugStats() {
  const [activities, caravans, stays, vehicles] = await Promise.all([
    ActivityOnboarding.countDocuments(),
    CaravanOnboarding.countDocuments(),
    StayOnboarding.countDocuments(),
    VehicleOnboarding.countDocuments(),
  ]);
  return {
    activities,
    caravans,
    stays,
    vehicles,
    total: activities + caravans + stays + vehicles,
  };
}

module.exports = {
  submitActivity,
  submitCaravan,
  submitStay,
  submitVehicle,
  attachActivitySelfie,
  attachCaravanSelfie,
  attachStaySelfie,
  attachVehicleSelfie,
  getMine,
  findCurrentSubmission, // exported for tests
  parseDataUrl, // exported for tests
  coverUrlFor, // exported for tests
  // Exported for tests and for scripts/backfill-offer-structure.js, which
  // repairs listings created before these mappings existed.
  categoryFromOnboarding,
  addressFromOnboarding,
  discountsFromOnboarding,
  rulesFromOnboarding,
  findLivePendingSubmission, // exported for tests
  reconcileWithOffer, // exported for tests
  listActivities,
  listCaravans,
  listStays,
  listVehicles,
  getActivity,
  getCaravan,
  getStay,
  getVehicle,
  debugStats,
};
