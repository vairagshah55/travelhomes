// HelpDesk Controller - robust JS/Express, no TS residue
const Notification = require('../models/Notification');
const HelpDesk = require('../models/HelpDesk');
const { sendEmailSilent } = require('../lib/email-sender/sender');
const { sendTicketStatusUpdate } = require('../lib/email-sender/templates/ticket-status-update');

// GET /api/helpdesk - List tickets
const getHelpDeskItems = async (req, res) => {
  try {
    const { status, search, sortBy, sortDir } = req.query;
    let items;
    
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { vendorName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    const sort = {};
    if (sortBy) {
      const dir = sortDir === 'asc' ? 1 : -1;
      sort[sortBy] = dir;
    } else {
      sort.createdAt = -1;
    }
    items = await HelpDesk.find(query).sort(sort);
    
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/helpdesk/:id - Get ticket by ID
const getHelpDeskItem = async (req, res) => {
  try {
    const { id } = req.params;
    let item;
    
    item = await HelpDesk.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/helpdesk - Create
const createHelpDeskItem = async (req, res) => {
  try {
    let item;
    
    item = await HelpDesk.create(req.body);
    
    // Create Notification
    try {
      console.log('[DEBUG] Creating helpdesk notification for admin...');
      const notif = await Notification.create({
        type: 'helpdesk_ticket',
        title: 'New Helpdesk Ticket',
        message: `New ticket created: ${item.subject}`,
        recipientRole: 'admin',
        referenceId: item._id,
        referenceModel: 'HelpDesk'
      });
      console.log('[DEBUG] Helpdesk notification created:', notif._id);
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      res.status(400).json({ success: false, message: messages.join('; ') });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// PUT /api/helpdesk/:id - Update
const updateHelpDeskItem = async (req, res) => {
  try {
    const { id } = req.params;
    let item;
    
    item = await HelpDesk.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      res.status(400).json({ success: false, message: messages.join('; ') });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// DELETE /api/helpdesk/:id
const deleteHelpDeskItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await HelpDesk.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    await item.deleteOne();
    res.json({ success: true, message: "Deleted" });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/helpdesk/:id/status - Update status only
const updateHelpDeskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Pending', 'Resolved', 'Read'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Bad status" });
    }
    let item;
    
    item = await HelpDesk.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });

    // Send email notification on Read or Resolved status
    if (status === 'Read' || status === 'Resolved') {
      const targetEmail = item.vendorEmail || item.email;
      const targetName = item.vendorName || item.name || 'Vendor';

      if (targetEmail) {
        const emailHtml = sendTicketStatusUpdate({
          name: targetName,
          status: status,
          ticketId: item._id,
          subject: item.subject
        });

        await sendEmailSilent({
          from: process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME,
          to: targetEmail,
          subject: `[Ticket Update] Your ticket status is now ${status}`,
          html: emailHtml
        });
      }
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getHelpDeskItems,
  getHelpDeskItem,
  createHelpDeskItem,
  updateHelpDeskItem,
  deleteHelpDeskItem,
  updateHelpDeskStatus
};
