const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

const listQuery = z.object({
  q: z.string().trim().max(200).optional(),
});

const createBody = z.object({
  vendorName: z.string().trim().min(1).max(120),
  enabled: z.boolean().optional(),
  description: z.string().trim().max(2000).optional(),
  licenseKey: z.string().trim().max(200).optional(),
});

const updateBody = z
  .object({
    vendorName: z.string().trim().min(1).max(120).optional(),
    enabled: z.boolean().optional(),
    description: z.string().trim().max(2000).optional(),
    licenseKey: z.string().trim().max(200).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

const setLicenseBody = z.object({
  licenseKey: z.string().trim().max(200),
});

const idParams = z.object({ id: objectIdString });

module.exports = { listQuery, createBody, updateBody, setLicenseBody, idParams };
