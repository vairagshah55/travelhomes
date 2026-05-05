const { z } = require("zod");

// vendorId is the legacy custom string identifier (`VND123`) — not a
// MongoDB ObjectId. Accept any non-empty short string.
const vendorIdParam = z.string().trim().min(1).max(60);
const section = z.enum(["general", "account", "preferences"]);

const params = z.object({ vendorId: vendorIdParam });

const sectionParams = z.object({
  vendorId: vendorIdParam,
  section,
});

// VendorSetting is a deep nested document (general.*, account.*,
// preferences.*). The legacy controller accepts arbitrary shapes here, so
// we keep the body schema permissive but require vendorId on POST.
const createBody = z
  .object({
    vendorId: vendorIdParam,
  })
  .passthrough();

const upsertBody = z.object({}).passthrough();

const sectionPatchBody = z
  .record(z.string(), z.any())
  .refine((d) => Object.keys(d).length > 0, { message: "At least one field must be provided" });

module.exports = { params, sectionParams, createBody, upsertBody, sectionPatchBody };
