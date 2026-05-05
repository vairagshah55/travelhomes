/**
 * CMS Media service. Backs the page/section/position-keyed media bag the
 * CMS uses to bind hero images / banners / etc. to specific pages.
 */
const fs = require("fs");
const path = require("path");

const CMSMedia = require("../../models/CMSMedia");
const logger = require("../../shared/logger");
const { NotFoundError } = require("../../shared/errors");

const uploadsDir = path.join(process.cwd(), "uploads");

async function list({ page, section }) {
  const filter = {};
  if (page) filter.page = page;
  if (section) filter.section = section;
  return CMSMedia.find(filter).sort({ position: 1 }).lean();
}

async function upsert({ page, section, position }, file) {
  const url = `/uploads/${file.filename}`;
  return CMSMedia.findOneAndUpdate(
    { page, section, position },
    {
      $set: {
        page,
        section,
        position,
        filename: file.filename,
        url,
        originalName: file.originalname,
        uploadedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );
}

async function remove(id) {
  const doc = await CMSMedia.findByIdAndDelete(id);
  if (!doc) throw new NotFoundError("Media", id);
  if (doc.filename) {
    const filePath = path.join(uploadsDir, doc.filename);
    fs.promises.unlink(filePath).catch((err) => {
      logger.warn({ err, filePath }, "[CMSMedia] orphan file unlink failed");
    });
  }
  return doc;
}

module.exports = { list, upsert, remove };
