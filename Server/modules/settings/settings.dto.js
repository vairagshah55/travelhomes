const { z } = require("zod");

// SEO settings are keyed by `page`. Pages are arbitrary strings (Homepage,
// AboutPage, etc.) plus the special "logo" / "favicon" globals.
const pageName = z.string().trim().min(1).max(120);

const seoQuery = z.object({
  page: pageName.optional(),
});

// SeoSetting is an open key/value bag at the model level; the legacy
// controller upserted whatever the client sent (the Admin SPA uses
// metaTitle / metaKeywords / metaDescription / socialTitle /
// socialDescription / faviconUrl / logoUrl / ogImageUrl). Keep this
// permissive (passthrough) so we don't drop fields — page is the only
// required key.
const seoUpsertBody = z
  .object({
    page: pageName,
  })
  .passthrough();

const systemQuery = z.object({
  userType: z.string().trim().min(1).max(40).optional(),
});

const systemUpdateBody = z
  .object({
    userType: z.string().trim().min(1).max(40),
  })
  .passthrough(); // System settings are an open key/value bag — kept permissive

const seoUploadBody = z.object({
  page: pageName,
  type: z.enum(["favicon", "logo", "logo_dark", "og"]),
});

module.exports = {
  seoQuery,
  seoUpsertBody,
  systemQuery,
  systemUpdateBody,
  seoUploadBody,
};
