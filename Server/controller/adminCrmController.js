const CrmMessage = require('../models/CrmMessage');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const AdminStaff = require('../models/AdminStaff');

// POST /api/admin/crm/send
const sendMessage = async (req, res) => {
  try {
    // channels is expected to be an array. serviceType replaces vendorType.
    const { targetType, channels, serviceType = '', message } = req.body;
    
    if (!targetType || !channels || channels.length === 0 || !message) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    let recipients = [];
    let query = {};

    // Build query based on targetType and serviceType
    if (targetType === 'Vendor') {
      if (serviceType) {
        // Map serviceType to servicesOffered logic
        // "Caravan", "Stay", "Activity"
        // Adjust regex or logic as per actual data storage
        if (serviceType === 'Caravan') {
           query.servicesOffered = { $in: [/^Caravan/i, /^Campervan/i, /^Transport/i] };
        } else if (serviceType === 'Stay') {
           query.servicesOffered = { $in: [/^Stay/i, /^Accommodation/i, /^Hotel/i] };
        } else if (serviceType === 'Activity') {
           query.servicesOffered = { $in: [/^Activity/i, /^Experience/i] };
        }
      }
      recipients = await Vendor.find(query).select('email phone brandName personName');
    } else if (targetType === 'User') {
      if (serviceType) {
        // Map serviceType to bookedServices or interest
        // Assuming bookedServices contains the string
        query.bookedServices = { $regex: serviceType, $options: 'i' };
      }
      recipients = await User.find(query).select('email phone name');
    } else if (targetType === 'Staff') {
      if (serviceType) {
        query.department = { $regex: serviceType, $options: 'i' };
      }
      recipients = await AdminStaff.find(query).select('email phone name');
    }

    // Mock Sending
    // In a real implementation, we would loop through recipients and use email/sms/whatsapp providers.
    // console.log(`Sending to ${recipients.length} recipients via ${channels.join(', ')}`);
    // recipients.forEach(r => {
    //    if (channels.includes('Email') && r.email) sendEmail(r.email, message);
    //    if (channels.includes('Whatsapp') && r.phone) sendWhatsapp(r.phone, message);
    //    ...
    // });

    const status = "sent";
    const toSave = { 
      targetType, 
      channels, 
      serviceType, 
      message, 
      status,
      recipientCount: recipients.length
    };
    
    const saved = await CrmMessage.create(toSave);
    return res.status(201).json({ success: true, data: saved, recipientCount: recipients.length });
  } catch (err) {
    console.error('CRM send error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/admin/crm/messages
const listMessages = async (req, res) => {
  try {
    const { targetType, channels } = req.query;
    const filter = {};
    if (targetType) filter.targetType = targetType;
    if (channels) filter.channels = { $in: [channels] }; // Simple filter if querying single channel
    
    const items = await CrmMessage.find(filter).sort({ createdAt: -1 }).limit(200);
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error('CRM list error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/admin/crm/messages/:id
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "Missing id param" });
    
    const deleted = await CrmMessage.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, error: "Not found" });
    return res.status(204).send();
  } catch (err) {
    console.error('CRM delete error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  sendMessage,
  listMessages,
  deleteMessage,
};
