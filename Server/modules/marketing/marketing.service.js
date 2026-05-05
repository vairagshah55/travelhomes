/**
 * Marketing service.
 *
 * Stores draft marketing-content items in MongoDB. The actual social-media
 * publish call (Instagram / Facebook Graph API) is a placeholder in the
 * legacy controller — preserved here as a fire-and-forget log until the
 * real Graph API integration ships.
 */
const MarketingContent = require("../../models/MarketingContent");
const logger = require("../../shared/logger");
const { NotFoundError } = require("../../shared/errors");

async function list() {
  const data = await MarketingContent.find().sort({ createdAt: -1 });
  return { data };
}

async function create(input) {
  const data = await MarketingContent.create({
    images: Array.isArray(input.images) ? input.images : [],
    additionalCount: input.additionalCount || 0,
    content: input.content || "",
  });
  return { data };
}

async function remove(id) {
  const item = await MarketingContent.findById(id);
  if (!item) throw new NotFoundError("Marketing item", id);
  await item.deleteOne();
  return { success: true };
}

async function postToSocial({ itemId, platform }) {
  const item = await MarketingContent.findById(itemId);
  if (!item) throw new NotFoundError("Marketing item", itemId);

  // Placeholder: real Graph API integration TBD.
  logger.info(
    { itemId, platform, contentLen: item.content?.length, images: item.images?.length },
    "marketing: social post requested (placeholder)",
  );

  return {
    message: `Content is being processed for ${platform}. (Placeholder implementation)`,
  };
}

module.exports = { list, create, remove, postToSocial };
