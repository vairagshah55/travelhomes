/**
 * Vendors service.
 *
 * Reads enrich the Vendor row with:
 *   - listedServices: count across Activity / CamperVan / Stay / Offer /
 *     Management plus their onboarding cousins.
 *   - merged-from-onboarding details (brandName, location, kyc, etc.) —
 *     onboarding rows take priority over what's on the Vendor doc itself.
 *
 * Auth-side guarantees match the legacy contract: status-filter aliases
 * map to model statuses, vendor lookup falls back from _id to custom
 * vendorId, etc.
 */
const mongoose = require("mongoose");

const Vendor = require("../../models/Vendor");
const Activity = require("../../models/Activity");
const ActivityOnboarding = require("../../models/ActivityOnboarding");
const CamperVan = require("../../models/CamperVan");
const Stay = require("../../models/Stay");
const StayOnboarding = require("../../models/StayOnboarding");
const CaravanOnboarding = require("../../models/CaravanOnboarding");
const Offer = require("../../models/Offer");
const Management = require("../../models/Management");
const logger = require("../../shared/logger");
const { NotFoundError } = require("../../shared/errors");

// Map SPA-side status aliases to model values.
function mapStatusFilter(status) {
  if (!status || status === "all-vendors") return null;
  if (status === "pending-vendors") return "pending";
  return status;
}

async function countVendorServices({ vendorIdObj, vendorIdStr }) {
  const [
    activityCount,
    camperCount,
    stayCount,
    offerCount,
    managementCount,
    stayOnboardingCount,
    activityOnboardingCount,
    caravanOnboardingCount,
  ] = await Promise.all([
    Activity.countDocuments({ vendorId: vendorIdObj }),
    CamperVan.countDocuments({ vendorId: vendorIdStr }),
    Stay.countDocuments({ vendorId: vendorIdObj }),
    Offer.countDocuments({ vendorId: vendorIdStr }),
    Management.countDocuments({ vendorId: vendorIdObj }),
    StayOnboarding.countDocuments({ vendorId: vendorIdStr }),
    ActivityOnboarding.countDocuments({ vendorId: vendorIdStr }),
    CaravanOnboarding.countDocuments({ vendorId: vendorIdStr }),
  ]);
  return (
    activityCount +
    camperCount +
    stayCount +
    offerCount +
    managementCount +
    stayOnboardingCount +
    activityOnboardingCount +
    caravanOnboardingCount
  );
}

async function fetchOnboardings(vendorIdStr) {
  return Promise.all([
    StayOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 }),
    ActivityOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 }),
    CaravanOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 }),
  ]);
}

// ─── List ───────────────────────────────────────────────────────────────────
async function list({ status, page = 1, limit = 10 }) {
  const mapped = mapStatusFilter(status);
  const query = mapped ? { status: mapped } : {};
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Math.max(Number(limit), 1), 100);

  const vendorsList = await Vendor.find(query)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const data = await Promise.all(
    vendorsList.map(async (vendor) => {
      try {
        vendor.listedServices = await countVendorServices({
          vendorIdObj: vendor._id,
          vendorIdStr: vendor.vendorId,
        });

        const [stayOnboarding, activityOnboarding, caravanOnboarding] = await fetchOnboardings(
          vendor.vendorId,
        );
        const source = stayOnboarding || activityOnboarding || caravanOnboarding;

        if (source) {
          vendor.brandName = source.brandName || source.businessName || vendor.brandName;
          if (source.firstName || source.lastName) {
            vendor.personName = `${source.firstName || ""} ${source.lastName || ""}`.trim();
          }
          if (source.city || source.state || source.locality || source.businessLocality) {
            const city = source.city || source.businessCity;
            const state = source.state || source.businessState;
            vendor.location = [city, state].filter(Boolean).join(", ");
          }
        }

        return vendor;
      } catch (err) {
        logger.error({ err: err.message, vendorId: vendor._id }, "vendor enrich failed");
        return vendor;
      }
    }),
  );

  return { data };
}

// ─── Get by id ──────────────────────────────────────────────────────────────
// Falls back from _id lookup to custom vendorId lookup; same as legacy.
async function getById(id) {
  let vendor = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    vendor = await Vendor.findById(id);
  }
  if (!vendor) vendor = await Vendor.findOne({ vendorId: id });
  if (!vendor) throw new NotFoundError("Vendor", id);

  const vendorData = vendor.toObject ? vendor.toObject() : vendor;
  const vendorIdStr = vendorData.vendorId;

  const [stayOnboarding, activityOnboarding, caravanOnboarding] =
    await fetchOnboardings(vendorIdStr);

  // Merge onboarding details into vendorData. Priority: Stay > Activity >
  // Caravan (we apply in reverse so Stay wins on conflict). Fields are only
  // overwritten if they were missing on the Vendor doc itself.
  const mergeDetails = (source) => {
    if (!source) return;
    vendorData.brandName = source.brandName || source.businessName || vendorData.brandName;
    if (source.firstName || source.lastName) {
      vendorData.personName = `${source.firstName || ""} ${source.lastName || ""}`.trim();
    }
    if (!vendorData.legalCompanyName)
      vendorData.legalCompanyName =
        source.legalCompanyName || source.companyName || source.businessName;
    if (!vendorData.gstNumber) vendorData.gstNumber = source.gstNumber;
    if (!vendorData.businessEmail) vendorData.businessEmail = source.businessEmail;
    if (!vendorData.businessPhone) vendorData.businessPhone = source.businessPhone;
    if (!vendorData.businessLocality)
      vendorData.businessLocality = source.businessLocality || source.locality;
    if (!vendorData.businessCity) vendorData.businessCity = source.businessCity || source.city;
    if (!vendorData.businessState) vendorData.businessState = source.businessState || source.state;
    if (!vendorData.businessPincode)
      vendorData.businessPincode = source.businessPincode || source.pincode;

    if (!vendorData.firstName) vendorData.firstName = source.firstName;
    if (!vendorData.lastName) vendorData.lastName = source.lastName;
    if (!vendorData.dateOfBirth && source.dateOfBirth) {
      vendorData.dateOfBirth =
        source.dateOfBirth instanceof Date
          ? source.dateOfBirth.toISOString().split("T")[0]
          : source.dateOfBirth;
    }
    if (!vendorData.maritalStatus) vendorData.maritalStatus = source.maritalStatus;
    if (!vendorData.idProof) vendorData.idProof = source.idProof;
    if (!vendorData.idPhotos) vendorData.idPhotos = source.idPhotos;
    if (!vendorData.personalLocality)
      vendorData.personalLocality = source.personalLocality || source.personalAddress;
    if (!vendorData.personalCity) vendorData.personalCity = source.personalCity;
    if (!vendorData.personalState) vendorData.personalState = source.personalState;
    if (!vendorData.personalPincode) vendorData.personalPincode = source.personalPincode;
  };

  if (caravanOnboarding) mergeDetails(caravanOnboarding);
  if (activityOnboarding) mergeDetails(activityOnboarding);
  if (stayOnboarding) mergeDetails(stayOnboarding);

  vendorData.listedServices = await countVendorServices({
    vendorIdObj: vendor._id,
    vendorIdStr,
  });

  return { data: vendorData };
}

// ─── Create / Update / Delete ───────────────────────────────────────────────
async function create(input) {
  const data = await Vendor.create(input);
  return { data };
}

async function update(id, patch) {
  const data = await Vendor.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!data) throw new NotFoundError("Vendor", id);
  return { data };
}

async function remove(id) {
  const vendor = await Vendor.findById(id);
  if (!vendor) throw new NotFoundError("Vendor", id);
  await vendor.deleteOne();
  return { message: "Vendor deleted successfully" };
}

async function setStatus(id, status) {
  const data = await Vendor.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  if (!data) throw new NotFoundError("Vendor", id);
  return { data, message: `Vendor status updated to ${status}` };
}

// ─── checkVendorStatus (req.user.email lookup) ──────────────────────────────
async function checkByEmail(email) {
  const vendor = await Vendor.findOne({ email });
  return { isVendor: !!vendor, vendor: vendor || null };
}

module.exports = { list, getById, create, update, remove, setStatus, checkByEmail };
