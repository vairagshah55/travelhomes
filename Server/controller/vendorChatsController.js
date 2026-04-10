const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const VendorChatConversation = require('../models/VendorChatConversation');
const VendorChatMessage = require('../models/VendorChatMessage');
const Register = require('../models/Register');
const StayOnboarding = require('../models/StayOnboarding');
const ActivityOnboarding = require('../models/ActivityOnboarding');
const CaravanOnboarding = require('../models/CaravanOnboarding');

// Helper to safely parse ObjectId
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// Helper to enrich vendor with onboarding data
const enrichVendor = async (vendor) => {
    if (!vendor) return null;
    const vendorData = vendor.toObject ? vendor.toObject() : vendor;
    const vendorIdStr = vendorData.vendorId;
    if (!vendorIdStr) return vendorData;

    try {
        const [stay, activity, caravan] = await Promise.all([
            StayOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 }),
            ActivityOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 }),
            CaravanOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 })
        ]);

        const source = stay || activity || caravan;
        if (source) {
            vendorData.brandName = source.brandName || source.businessName || vendorData.brandName;
            if (source.firstName || source.lastName) {
                vendorData.personName = `${source.firstName || ""} ${source.lastName || ""}`.trim();
            }
        }
    } catch (err) {
        console.error('Error enriching vendor:', err);
    }
    return vendorData;
};

// Get Chat Profile (User/Vendor ID) based on Email
const getChatProfile = async (req, res) => {
  try {
    const { email, type } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    let profile = null;
    
    // Normalize email
    const emailLower = email.toLowerCase();

    if (type === 'vendor') {
        const doc = await Vendor.findOne({ email: emailLower });
        profile = await enrichVendor(doc);
        // If not found, maybe they are a user but logged in as vendor? Unlikely.
    } else {
        profile = await User.findOne({ email: emailLower });
    }

    if (!profile) {
        // If profile not found, maybe create one? 
        // For now, return 404 so frontend knows.
        return res.status(404).json({ success: false, message: 'Chat profile not found for this email' });
    }

    console.log("profile data", profile);

    res.json({
        success: true,
        data: {
            id: profile._id,
            name: profile.name || profile.brandName || profile.personName,
            photo: profile.photo,
            type: type === 'vendor' ? 'Vendor' : 'User'
        }
    });

  } catch (error) {
    console.error('Error in getChatProfile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create (or get) a conversation between participants
const createOrGetConversation = async (req, res) => {
  try {
    const { vendorId, userId, title } = req.body;

    console.log("vendorId:",vendorId);
    console.log("userId:",userId);
    console.log("title:",title);
    
    if (!vendorId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'vendorId and userId are required' 
      });
    }
    
    // Ensure participants exist
    let [vendor, user] = await Promise.all([
      Vendor.findById(vendorId).then(enrichVendor),
      User.findById(userId),
    ]);
    
    // Fallback: If user not found by ID, it might be a Register ID
    if (!user) {
      const regUser = await Register.findById(userId);
      if (regUser) {
        user = await User.findOne({ email: regUser.email });
      }
    }

    // Fallback: If vendor not found by ID, it might be a Register ID
    if (!vendor) {
      const regVendor = await Register.findById(vendorId);
      if (regVendor) {
        const doc = await Vendor.findOne({ email: regVendor.email });
        vendor = await enrichVendor(doc);
      }
    }
    
    if (!vendor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update IDs to the actual User/Vendor collection IDs if they were found via Register
    const actualVendorId = vendor._id.toString();
    const actualUserId = user._id.toString();
    
    // Try to find existing conversation
    const existing = await VendorChatConversation.findOne({
      isGroup: false,
      $and: [
        { 'participants.kind': 'Vendor', 'participants.refId': toObjectId(actualVendorId) },
        { 'participants.kind': 'User', 'participants.refId': toObjectId(actualUserId) }
      ]
    });
    
    if (existing) {
      return res.json({ success: true, data: existing });
    }
    
    const conv = await VendorChatConversation.create({
      participants: [
        { kind: 'Vendor', refId: toObjectId(actualVendorId) },
        { kind: 'User', refId: toObjectId(actualUserId) }
      ],
      isGroup: false,
      title: title || `${vendor.brandName || vendor.personName} - ${user.name}`,
      unreadCounts: { [actualVendorId]: 0, [actualUserId]: 0 }
    });

    console.log("conv checking:", conv);
    
    res.status(201).json({ success: true, data: conv });
  } catch (error) {
    console.error('Error in createOrGetConversation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send a message in a conversation
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { senderId, senderKind, content, attachments, messageType } = req.body;
    
    // Validate required fields (content OR attachments required)
    if (!senderId || !senderKind) {
      return res.status(400).json({ 
        success: false, 
        message: 'senderId and senderKind are required' 
      });
    }
   
    if (!content && (!attachments || attachments.length === 0)) {
       return res.status(400).json({
          success: false,
          message: 'Message must have content or attachments'
       });
    }
    
    const conversation = await VendorChatConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }
    
    const message = await VendorChatMessage.create({
      conversationId: toObjectId(conversationId),
      senderId: toObjectId(senderId),
      senderKind,
      content: content || (attachments && attachments.length ? `${attachments.length} attachment(s)` : ''),
      messageType: messageType || (attachments && attachments.length ? 'file' : 'text'),
      attachments: attachments || [],
      timestamp: new Date()
    });

    
    // Update last activity and unread counts
    conversation.lastActivity = new Date();
    conversation.lastMessage = content || (attachments && attachments.length ? (attachments[0].type === 'image' ? '📷 Photo' : '📄 File') : 'Attachment');
    
    // Increment unread count for other participants
    conversation.participants.forEach(p => {
      if (p.refId.toString() !== senderId) {
        if (!conversation.unreadCounts) conversation.unreadCounts = {};
        conversation.unreadCounts[p.refId.toString()] = 
          (conversation.unreadCounts[p.refId.toString()] || 0) + 1;
      }
    });
    
    await conversation.save();
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get messages of a conversation (paginated)
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    console.log("check get message:", conversationId);
    console.log("check get message:", req.query);
    
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);
    
    const messages = await VendorChatMessage
      .find({ conversationId: toObjectId(conversationId) })
      .sort({ timestamp: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    console.log("check get message data:", messages)

    
    // Manual population for messages
    for (const msg of messages) {
      if (msg.senderKind === 'User') {
        const u = await User.findById(msg.senderId).select('name photo email').lean();
        if (u) {
          msg.senderId = {
            _id: u._id,
            name: u.name,
            photo: u.photo,
            email: u.email
          };
        }
      } else if (msg.senderKind === 'Vendor') {
        const doc = await Vendor.findById(msg.senderId);
        const v = await enrichVendor(doc);
        if (v) {
          msg.senderId = {
            _id: v._id,
            name: v.brandName || v.personName,
            photo: v.photo,
            email: v.email
          };
        }
      }
    }
    
    const total = await VendorChatMessage.countDocuments({ 
      conversationId: toObjectId(conversationId) 
    });


    
    res.json({
      success: true,
      data: messages.reverse(), // Reverse to get chronological order
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// List conversations for a participant
const listConversations = async (req, res) => {
  try {
    let { participantKind, participantId } = req.query;
    
    if (!participantKind || !participantId) {
      return res.status(400).json({ 
        success: false, 
        message: 'participantKind and participantId are required' 
      });
    }

    // Fallback: if participantId is from Register collection, find the actual User/Vendor ID
    const regDoc = await Register.findById(participantId);
    if (regDoc) {
      if (participantKind === 'User') {
        const u = await User.findOne({ email: regDoc.email });
        if (u) participantId = u._id.toString();
      } else if (participantKind === 'Vendor') {
        const v = await Vendor.findOne({ email: regDoc.email });
        if (v) participantId = v._id.toString();
      }
    }
    
    const conversations = await VendorChatConversation
      .find({
        'participants.kind': participantKind,
        'participants.refId': toObjectId(participantId)
      })
      .sort({ lastActivity: -1 })
      .lean();
    
    // Manual population to ensure reliability
    for (const conv of conversations) {
      for (const p of conv.participants) {
        if (p.kind === 'User') {
          const u = await User.findById(p.refId).select('name photo email').lean();
          if (u) {
            p.refId = {
               _id: u._id,
               name: u.name,
               photo: u.photo,
               email: u.email
            };
          }
        } else if (p.kind === 'Vendor') {
          const doc = await Vendor.findById(p.refId);
          const v = await enrichVendor(doc);
          if (v) {
            p.refId = {
               _id: v._id,
               name: v.brandName || v.personName,
               photo: v.photo,
               email: v.email
            };
          }
        } else if (p.kind === 'Register') {
           const r = await Register.findById(p.refId).select('firstName lastName email').lean();
           if (r) {
             p.refId = {
               _id: r._id,
               name: `${r.firstName} ${r.lastName}`,
               email: r.email
             };
           }
        }
      }
    }
    
    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Error in listConversations:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark messages as read for a participant
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { participantId } = req.body;
    
    if (!participantId) {
      return res.status(400).json({ 
        success: false, 
        message: 'participantId is required' 
      });
    }
    
    const conversation = await VendorChatConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }
    
    // Reset unread count for this participant
    if (!conversation.unreadCounts) conversation.unreadCounts = {};
    conversation.unreadCounts[participantId] = 0;
    
    await conversation.save();
    
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single conversation by ID
const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await VendorChatConversation.findById(conversationId).lean();
    
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Populate participants
    for (const p of conversation.participants) {
      if (p.kind === 'User') {
        const u = await User.findById(p.refId).select('name photo email').lean();
        if (u) {
          p.refId = { _id: u._id, name: u.name, photo: u.photo, email: u.email };
        }
      } else if (p.kind === 'Vendor') {
        const doc = await Vendor.findById(p.refId);
        const v = await enrichVendor(doc);
        if (v) {
          p.refId = { _id: v._id, name: v.brandName || v.personName, photo: v.photo, email: v.email };
        }
      }
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error in getConversationById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrGetConversation,
  sendMessage,
  getMessages,
  listConversations,
  markAsRead,
  getChatProfile,
  getConversationById
};
