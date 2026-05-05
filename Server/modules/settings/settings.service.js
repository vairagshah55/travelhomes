/**
 * Settings service — SEO and System settings.
 *
 * `getSeoSetting` falls back to the global `logo` / `favicon` documents
 * when a per-page setting doesn't have its own logoUrl / faviconUrl set.
 * That blending logic is preserved verbatim.
 */
const SeoSetting = require("../../models/SeoSetting");
const SystemSetting = require("../../models/SystemSetting");
const { BadRequestError } = require("../../shared/errors");

async function getSeo(page = "Homepage") {
  let setting = await SeoSetting.findOne({ page });
  if (!setting) setting = await SeoSetting.create({ page });

  const [logoSetting, faviconSetting] = await Promise.all([
    SeoSetting.findOne({ page: "logo" }),
    SeoSetting.findOne({ page: "favicon" }),
  ]);

  const obj = setting.toObject();
  if (!obj.logoUrl && logoSetting?.logoUrl) obj.logoUrl = logoSetting.logoUrl;
  if (!obj.logoDarkUrl && logoSetting?.logoDarkUrl) obj.logoDarkUrl = logoSetting.logoDarkUrl;
  if (!obj.faviconUrl && faviconSetting?.faviconUrl) obj.faviconUrl = faviconSetting.faviconUrl;

  return { data: obj };
}

async function upsertSeo({ page, ...data }) {
  const setting = await SeoSetting.findOneAndUpdate(
    { page },
    { $set: data },
    { new: true, upsert: true },
  );
  return { data: setting };
}

async function getSystem(userType = "Vendor") {
  let setting = await SystemSetting.findOne({ userType });
  if (!setting) setting = await SystemSetting.create({ userType });
  return { data: setting };
}

async function updateSystem({ userType, ...data }) {
  const setting = await SystemSetting.findOneAndUpdate(
    { userType },
    { $set: data },
    { new: true, upsert: true },
  );
  return { data: setting };
}

async function uploadSeoAsset({ page, type, file }) {
  if (!file) throw new BadRequestError("No file uploaded");

  const url = `/uploads/${file.filename}`;
  const update = {};
  if (type === "favicon") update.faviconUrl = url;
  if (type === "logo") update.logoUrl = url;
  if (type === "logo_dark") update.logoDarkUrl = url;
  if (type === "og") update.ogImageUrl = url;

  const updated = await SeoSetting.findOneAndUpdate(
    { page },
    { $set: update },
    { new: true, upsert: true },
  );
  return { data: updated };
}

module.exports = { getSeo, upsertSeo, getSystem, updateSystem, uploadSeoAsset };
