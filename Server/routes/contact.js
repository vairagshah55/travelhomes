// Contact Routes - Cleaned JS, no TS/no migration junk
const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const nodemailer = require('nodemailer');
const router = express.Router();

// Utility: create transporter from env
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || 'true') === 'true';
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
}

// ----- Public: Submit contact message -----
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body || {};
    if (!firstName || !email || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const doc = await ContactMessage.create({ firstName, lastName, email, phone, message, status: 'unread' });
    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    console.error('POST /api/contact failed:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ----- Admin: List messages -----
router.get('/', async (req, res) => {
  try {
    const items = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    const data = items.map((m) => ({
      id: m._id,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      phone: m.phone,
      message: m.message,
      status: m.status,
      createdAt: m.createdAt,
    }));
    res.json({ success: true, data });
  } catch (e) {
    console.error('GET /api/admin/contact failed:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ----- Admin: mark as read -----
router.patch('/read/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await ContactMessage.findByIdAndUpdate(id, { status: 'read' }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (e) {
    console.error('PATCH /api/admin/contact/read/:id failed:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ----- Admin: delete message -----
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const del = await ContactMessage.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted', data: del });
  } catch (e) {
    console.error('DELETE /api/admin/contact/:id failed:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ----- Admin: reply by email -----
router.post('/reply/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body } = req.body || {};
    if (!subject || !body) return res.status(400).json({ success: false, message: "Missing subject or body" });

    const msg = await ContactMessage.findById(id);
    if (!msg) return res.status(404).json({ success: false, message: 'Not found' });
    if (!msg.email) return res.status(400).json({ success: false, message: "No recipient email" });

    const transporter = getTransporter();
    if (!transporter) return res.status(500).json({ success: false, message: "Mail transport unavailable" });
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await transporter.sendMail({
      from,
      to: msg.email,
      subject,
      text: body
    });
    res.json({ success: true, message: 'Reply sent' });
  } catch (e) {
    console.error('POST /api/admin/contact/reply/:id failed:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;