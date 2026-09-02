/**
 * The parts of an onboarding submission that a listing does not carry.
 *
 * The listing inspector has always rendered "Business details", "Personal
 * details" and the registration-certificate photos, but every one of those
 * fields (`businessDetails`, `brandName`, `idProof`, `rcPhotos`, …) lives on
 * the submission and not on `Offer` — so all three sections were dead on every
 * record. Merging the submission over the listing fixes that, but only for
 * these keys: the submission also has its own `name`, `status`, `photos`,
 * `category`, `description` and `_id`, and letting those win would show the
 * draft's values in a drawer that is meant to describe the live listing.
 */

/** Submission-only fields, safe to merge over a listing. */
export const SUBMISSION_DETAIL_FIELDS = [
  // Business
  "businessDetails",
  "brandName",
  "businessName",
  "companyName",
  "legalCompanyName",
  "gstNumber",
  "businessEmail",
  "businessPhone",
  "businessAddress",
  "businessLocality",
  "businessState",
  "businessCity",
  "businessPincode",
  // Personal / KYC
  "personalDetails",
  "personName",
  "firstName",
  "lastName",
  "dateOfBirth",
  "maritalStatus",
  "idProof",
  "idPhotos",
  "personalCountry",
  "personalState",
  "personalCity",
  "personalPincode",
  // Vehicle paperwork
  "rcPhotos",
  "driverLicencePhotos",
] as const;

/**
 * `submission` picked down to the fields above, with empties dropped so a
 * blank on the submission can't blank a value the listing already had.
 */
export function pickSubmissionDetails(submission: any): Record<string, unknown> {
  if (!submission || typeof submission !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const key of SUBMISSION_DETAIL_FIELDS) {
    const value = (submission as Record<string, unknown>)[key];
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}
