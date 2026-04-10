// CMS Media Routes: upload, list, delete (Express + Multer + Mongoose)
// Robust, production-safe, JS-only (no TS residue)

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CMSMedia = require('../models/CMSMedia'); // must exist as a valid Mongoose model

const router = express.Router();

console.log('[CMS MEDIA ROUTES] Router initialized');

// Ensure uploads dir exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
console.log('[CMS MEDIA ROUTES] Uploads directory:', uploadsDir);

// Multer storage config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `cms-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Debug: all requests
router.use((req, res, next) => {
  console.log('[CMS MEDIA ROUTES] Incoming request:', { method: req.method, path: req.path, query: req.query });
  next();
});

// List all media (admin & public)
router.get('/', async (req, res) => {
  try {
    const { page, section } = req.query;
    const filter = {};
    if (page) filter.page = page;
    if (section) filter.section = section;

    console.log('[CMS MEDIA GET] Request with filter:', filter);
    
    if (!CMSMedia) {
      throw new Error('CMSMedia model is not defined');
    }

    const items = await CMSMedia.find(filter).sort({ position: 1 }).lean();
    console.log('[CMS MEDIA GET] Found', items.length, 'items:', items.map(i => ({ page: i.page, section: i.section, position: i.position, url: i.url })));
    res.json({ success: true, data: items });
  } catch (e) {
    console.error('[CMS MEDIA GET] Error listing media:', e);
    res.status(500).json({ success: false, message: e.message || 'Internal server error' });
  }
});

// Upload single media file (with metadata: page, section, position)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { page, section } = req.body;
    const position = Number(req.body.position ?? 0);
    
    console.log('[CMS MEDIA UPLOAD] Request received:', { page, section, position, filename: req.file?.filename });
    
    if (!page || !section) {
      console.error('[CMS MEDIA UPLOAD] Missing page or section');
      return res.status(400).json({ success: false, message: "Missing page or section" });
    }
    if (!req.file) {
      console.error('[CMS MEDIA UPLOAD] No file uploaded');
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const url = `/uploads/${req.file.filename}`;

    console.log('[CMS MEDIA UPLOAD] Upserting document:', { page, section, position, url });

    // Upsert by (page, section, position)
    const doc = await CMSMedia.findOneAndUpdate(
      { page, section, position },
      {
        $set: {
          page,
          section,
          position,
          filename: req.file.filename,
          url,
          originalName: req.file.originalname,
          uploadedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    console.log('[CMS MEDIA UPLOAD] Success. Saved document:', { id: doc._id, url: doc.url, page: doc.page, position: doc.position });
    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    console.error('[CMS MEDIA UPLOAD] Error uploading media:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Delete media by ID (also removes file)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await CMSMedia.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    if (doc.filename) {
      const filePath = path.join(uploadsDir, doc.filename);
      fs.promises.unlink(filePath).catch(() => {});
    }
    res.json({ success: true, message: "Deleted", data: doc });
  } catch (e) {
    console.error('Error deleting media:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;