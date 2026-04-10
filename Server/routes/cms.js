// Cleaned CMS route file: Jobs, FAQs, Features, Testimonials, Roles (Express+Mongo)
// Robust, fully JS, no TS/garbage residue
const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Mongo models (define these models as needed)
const Faq = require('../models/FAQ');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Testimonial = require('../models/Testimonial');
const Booking = require('../models/Booking');
const CMSPage = require('../models/CMSPage');
const ContactInfo = require('../models/ContactInfo');
const HomepageSection = require('../models/HomepageSection');
const Feature = require('../models/Feature');
const Notification = require('../models/Notification');
const { sendJobApplicationStatusEmail } = require('../services/mailer');

// === Multer/config for CV upload (job applications) ===
const cvUploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(cvUploadsDir)) fs.mkdirSync(cvUploadsDir, { recursive: true });
const cvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, cvUploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = path.extname(file.originalname) || ".pdf";
    cb(null, `cv-${unique}${ext}`);
  }
});
const cvUpload = multer({ storage: cvStorage });

// ======= JOBS =======
// List jobs
router.get("/jobs", async (req, res) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active === 'true') filter.isActive = true;
    
    const list = await Job.find(filter).sort({ createdAt: -1 }).lean();
    console.log(`[CMS] Found ${list.length} jobs with filter:`, filter);
    if (list.length > 0) console.log(`[CMS] First job sample:`, list[0]);
    res.json({ success: true, data: list });
  } catch (e) {
    console.error('[CMS] Error fetching jobs:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Create job
router.post("/jobs", async (req, res) => {
  try {
    console.log('[CMS] POST /jobs received body:', req.body);
    const { position, experience, location, jd, isActive, jobTitle, experienceRequired, jobType, jobDescription } = req.body;
    const finalPosition = position || jobTitle;
    const finalExperience = experience || experienceRequired;
    const finalLocation = location || jobType;
    const finalJd = jd || jobDescription;

    console.log('[CMS] Final job data to create:', { position: finalPosition, experience: finalExperience, location: finalLocation, jd: finalJd });

    if (!finalPosition || !finalJd) {
      console.warn('[CMS] Missing required fields for job creation');
      return res.status(400).json({ success: false, message: 'Missing job title or description' });
    }
    const created = await Job.create({
      position: finalPosition,
      experience: finalExperience,
      location: finalLocation,
      jd: finalJd,
      isActive: isActive !== false
    });
    console.log('[CMS] Job created successfully:', created._id);
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    console.error('[CMS] Error creating job:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Update job
router.put("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { position, experience, location, jd, isActive, jobTitle, experienceRequired, jobType, jobDescription } = req.body;
    
    const updateData = {};
    if (position || jobTitle) updateData.position = position || jobTitle;
    if (experience || experienceRequired) updateData.experience = experience || experienceRequired;
    if (location || jobType) updateData.location = location || jobType;
    if (jd || jobDescription) updateData.jd = jd || jobDescription;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await Job.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Activate/deactivate job
router.patch("/jobs/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ success: false, message: 'Not found' });
    job.isActive = !job.isActive;
    await job.save();
    res.json({ success: true, data: job });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Delete job
router.delete("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const r = await Job.findByIdAndDelete(id);
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ======= JOB APPLICATIONS =======
// List job applications
router.get("/jobs/applications", async (req, res) => {
  try {
    const list = await JobApplication.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Job application (submit, with CV)
router.post("/jobs/apply", cvUpload.single('cv'), async (req, res) => {
  try {
    const { jobId, jobTitle, fullName, mobile, email, city, state, experience, linkedin, referral } = req.body;
    if (!fullName || !email) return res.status(400).json({ success: false, message: "Missing name or email" });
    const cvUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const created = await JobApplication.create({
      jobId,
      jobTitle,
      fullName,
      mobile,
      email,
      city,
      state,
      experience,
      linkedin,
      referral,
      cvUrl
    });

    // Create Notification for Admin
    try {
      console.log('[DEBUG] Creating job application notification for admin...');
      const notif = await Notification.create({
        type: 'job_application',
        title: 'New Job Application',
        message: `New application received from ${fullName} for position ${jobTitle || 'N/A'}.`,
        recipientRole: 'admin',
        referenceId: created._id,
        referenceModel: 'JobApplication'
      });
      console.log('[DEBUG] Job application notification created:', notif._id);
    } catch (notifErr) {
      console.error('[CMS] Error creating notification:', notifErr);
    }

    res.status(201).json({ success: true, data: created });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Update Job Application Status
router.put("/jobs/applications/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const application = await JobApplication.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    // Send email notification
    if (application.email) {
      // Don't wait for email to send response, but log error if it fails
      sendJobApplicationStatusEmail(
        application.email,
        application.fullName,
        application.jobTitle,
        status
      ).catch(err => console.error('[CMS] Failed to send status email:', err));
    }

    res.json({ success: true, data: application });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Delete Job Application
router.delete("/jobs/applications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const r = await JobApplication.findByIdAndDelete(id);
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ======= FAQ =======
// List FAQs
router.get("/faqs", async (req, res) => {
  try {
    const list = await Faq.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Create FAQ
router.post("/faqs", async (req, res) => {
  try {
    const { category, question, answer } = req.body;
    if (!category || !question || !answer) return res.status(400).json({ success: false, message: "Missing category, question or answer" });
    const created = await Faq.create({ category, question, answer });
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Delete FAQ
router.delete("/faqs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[CMS] DELETE /faqs/:id request with id:', id);
    const r = await Faq.findByIdAndDelete(id);
    if (!r) {
      console.warn('[CMS] FAQ not found for deletion:', id);
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    console.log('[CMS] FAQ deleted successfully:', id);
    res.status(204).send();
  } catch (e) {
    console.error('[CMS] Error deleting FAQ:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ========= TESTIMONIALS (MongoDB-backed) =========
router.get("/testimonials", async (req, res) => {
  try {
    const isAdmin = req.baseUrl.includes('/admin');
    const filter = isAdmin ? {} : { isActive: true };
    const list = await Testimonial.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/testimonials", async (req, res) => {
  try {
    const { userName, rating, content, avatar, email, isActive } = req.body;
    if (!userName || rating === undefined || rating === null || !content) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
    const created = await Testimonial.create({
      userName,
      rating: Number(rating),
      content,
      avatar,
      email,
      isActive: isActive !== false
    });
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.patch("/testimonials/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const t = await Testimonial.findById(id);
    if (!t) return res.status(404).json({ success: false, message: "Not found" });
    t.isActive = !t.isActive;
    await t.save();
    res.json({ success: true, data: t });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/testimonials/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const r = await Testimonial.findByIdAndDelete(id);
    if (!r) return res.status(404).json({ success: false, message: "Not found" });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ========= FEATURES (MongoDB-backed) =========
router.get("/features", async (req, res) => {
  try {
    const { category, type } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (type) filter.type = type;
    
    const list = await Feature.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/features", async (req, res) => {
  try {
    console.log('[CMS] POST /features body:', req.body);
    const { name, category, icon, type, description } = req.body;
    if (!name || !category) return res.status(400).json({ success: false, message: "Missing name or category" });
    
    const created = await Feature.create({
      name,
      category,
      icon,
      type: type || 'feature',
      description,
      status: "enable"
    });
    console.log('[CMS] Feature created:', created);
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    console.error('[CMS] Error creating feature:', e);
    res.status(500).json({ success: false, message: e.message, errors: e.errors });
  }
});

router.patch("/features/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const ft = await Feature.findById(id);
    if (!ft) return res.status(404).json({ success: false, message: "Not found" });
    
    ft.status = ft.status === "enable" ? "disable" : "enable";
    await ft.save();
    res.json({ success: true, data: ft });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/features/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const r = await Feature.findByIdAndDelete(id);
    if (!r) return res.status(404).json({ success: false, message: "Not found" });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ========= ROLES (In-memory for now) =========
let roles = [
  // { id: "1", name: "Manager", features: ["Dashboard", "Management"] }
];
router.get("/roles", (_req, res) => {
  res.json({ success: true, data: roles });
});
router.post("/roles", (req, res) => {
  const { name, features: fts } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "Missing name" });
  const newRole = { id: makeId(), name, features: fts || [] };
  roles.push(newRole);
  res.status(201).json({ success: true, data: newRole });
});
router.delete("/roles/:id", (req, res) => {
  const { id } = req.params;
  const before = roles.length;
  roles = roles.filter(r => r.id !== id);
  if (roles.length === before) return res.status(404).json({ success: false, message: "Not found" });
  res.status(204).send();
});

// ========= LEGAL PAGES (Terms, Privacy) =========
router.get("/pages/:key", async (req, res) => {
  try {
    const { key } = req.params;
    let page = await CMSPage.findOne({ pageKey: key });
    // If not found, we can return null data or 404. 
    // Let's return null data with success true so frontend can handle "create new" logic easily
    if (!page) {
       return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: page });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/pages/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { title, content, sections, isActive } = req.body;
    
    // Validate key
    if (!['terms-and-conditions', 'privacy-policy', 'vendor-policy'].includes(key)) {
       return res.status(400).json({ success: false, message: "Invalid page key" });
    }

    const updateData = { pageKey: key, title, isActive: isActive !== false };
    if (content !== undefined) updateData.content = content;
    if (sections !== undefined) updateData.sections = sections;

    const page = await CMSPage.findOneAndUpdate(
      { pageKey: key },
      updateData,
      { new: true, upsert: true } // upsert creates it if it doesn't exist
    );
    res.json({ success: true, data: page });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ========= CONTACT INFO (Singleton) =========
router.get("/contact", async (req, res) => {
  try {
    const data = await ContactInfo.findOne({});
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/contact", async (req, res) => {
  try {
    // Basic protection: only allow updates via admin route
    if (!req.baseUrl.includes('/admin')) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const payload = req.body;
    // Update or create the single document
    // We can use findOneAndUpdate with upsert
    // But since it's a singleton without a unique key other than _id, we can just findOne and update, or create if none.
    
    let doc = await ContactInfo.findOne({});
    if (doc) {
      Object.assign(doc, payload);
      await doc.save();
    } else {
      doc = await ContactInfo.create(payload);
    }
    
    res.json({ success: true, data: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ========= HOMEPAGE SECTIONS =========
router.get("/homepage-sections", async (req, res) => {
  try {
    const sections = await HomepageSection.find({}).sort({ sectionKey: 1 });
    // Seed if empty
    if (sections.length === 0) {
      const defaults = [
        { sectionKey: 'camper-van', label: 'Camper Van' },
        { sectionKey: 'unique-stays', label: 'Unique Stays' },
        { sectionKey: 'best-activity', label: 'Best Activity' },
        { sectionKey: 'trending-destinations', label: 'Trending Destinations' },
        { sectionKey: 'testimonials', label: 'Testimonials' },
        { sectionKey: 'top-rated-stays', label: 'Top Rated Stays' },
        { sectionKey: 'faq', label: 'Frequently Asked Questions' }
      ];
      await HomepageSection.insertMany(defaults);
      const newSections = await HomepageSection.find({}).sort({ sectionKey: 1 });
      return res.json({ success: true, data: newSections });
    }
    res.json({ success: true, data: sections });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.patch("/homepage-sections/:key/toggle", async (req, res) => {
  try {
    const { key } = req.params;
    const section = await HomepageSection.findOne({ sectionKey: key });
    
    if (!section) {
       return res.status(404).json({ success: false, message: "Section not found" });
    }

    section.isVisible = !section.isVisible;
    await section.save();
    res.json({ success: true, data: section });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;