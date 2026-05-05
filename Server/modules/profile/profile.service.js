/**
 * Profile service.
 *
 * `getByEmail` does a case-insensitive lookup against Profile, then falls
 * back to syncing from the Register record if no Profile exists. The
 * response is augmented with the matching Vendor's status and the
 * Register's userType.
 */
const path = require("path");

const Profile = require("../../models/Profile");
const Register = require("../../models/Register");
const Vendor = require("../../models/Vendor");
const Offer = require("../../models/Offer");
const { BadRequestError, NotFoundError } = require("../../shared/errors");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getByEmail(emailParam) {
  if (!emailParam) throw new BadRequestError("Email is required");
  const emailRegex = new RegExp(`^${escapeRegex(emailParam)}$`, "i");

  let profile = await Profile.findOne({ email: emailRegex });

  // Sync from Register on first read.
  if (!profile) {
    const registration = await Register.findOne({ email: emailRegex });
    if (registration) {
      profile = await Profile.create({
        email: registration.email,
        firstName: registration.firstName,
        lastName: registration.lastName,
        phoneNumber: registration.mobile,
        dateOfBirth: registration.dateOfBirth,
        country: registration.country,
        state: registration.state,
        city: registration.city,
      });
    }
  }
  if (!profile) throw new NotFoundError("Profile");

  const lowerEmail = (profile.email || emailParam).toLowerCase();
  const [vendorDoc, userDoc] = await Promise.all([
    Vendor.findOne({ email: lowerEmail }),
    Register.findOne({ email: emailRegex }),
  ]);

  let vendorStatus = vendorDoc?.status;

  // Safety fallback: missing vendor record but the user has at least one
  // approved offer → treat as approved so the UI doesn't get stuck.
  if (!vendorStatus && userDoc) {
    const hasApproved = await Offer.exists({ userId: userDoc._id, status: "approved" });
    if (hasApproved) vendorStatus = "approved";
  }

  return {
    data: {
      ...profile.toObject(),
      vendorStatus,
      vendorDetails: vendorDoc,
      userType: userDoc?.userType,
    },
  };
}

async function upsert(input) {
  const data = await Profile.findOneAndUpdate(
    { email: input.email },
    { $set: input },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return { data };
}

async function uploadPhoto({ email, file }) {
  if (!email) throw new BadRequestError("Email is required");
  if (!file) throw new BadRequestError("Photo file is required");

  const photoUrl = `/uploads/${path.basename(file.path)}`;
  const data = await Profile.findOneAndUpdate(
    { email },
    { $set: { photo: photoUrl } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return { data, url: photoUrl };
}

module.exports = { getByEmail, upsert, uploadPhoto };
