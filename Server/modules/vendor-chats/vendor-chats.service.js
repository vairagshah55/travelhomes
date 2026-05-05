/**
 * Vendor-chats service.
 *
 * Implements direct (non-group) conversations between a Vendor and a User,
 * plus the message + read-state side of those conversations. Two quirks
 * worth knowing:
 *
 *   1. enrichVendor — Vendor docs themselves don't carry brandName /
 *      personName. Those live on the most recent onboarding row
 *      (StayOnboarding > ActivityOnboarding > CaravanOnboarding, in that
 *      preference order). The legacy controller looked these up inline
 *      everywhere a vendor was returned; we centralize it here.
 *
 *   2. Register fallback — the SPA sometimes hands us a Register id where
 *      a User/Vendor id is expected (the registration flow stores everyone
 *      in `Register` first, then promotes to User/Vendor). When the direct
 *      lookup misses, we resolve via Register.email → User/Vendor.email.
 *      Conversations are always stored under the canonical User/Vendor _id
 *      so we don't fragment threads.
 */
const mongoose = require("mongoose");

const Vendor = require("../../models/Vendor");
const User = require("../../models/User");
const Register = require("../../models/Register");
const StayOnboarding = require("../../models/StayOnboarding");
const ActivityOnboarding = require("../../models/ActivityOnboarding");
const CaravanOnboarding = require("../../models/CaravanOnboarding");
const VendorChatConversation = require("../../models/VendorChatConversation");
const VendorChatMessage = require("../../models/VendorChatMessage");
const { BadRequestError, NotFoundError } = require("../../shared/errors");

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

async function enrichVendor(vendor) {
  if (!vendor) return null;
  const data = vendor.toObject ? vendor.toObject() : { ...vendor };
  const vendorIdStr = data.vendorId;
  if (!vendorIdStr) return data;

  const [stay, activity, caravan] = await Promise.all([
    StayOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 }).lean(),
    ActivityOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 }).lean(),
    CaravanOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 }).lean(),
  ]);

  const source = stay || activity || caravan;
  if (source) {
    data.brandName = source.brandName || source.businessName || data.brandName;
    if (source.firstName || source.lastName) {
      data.personName = `${source.firstName || ""} ${source.lastName || ""}`.trim();
    }
  }
  return data;
}

async function getChatProfile({ email, type }) {
  const emailLower = email.toLowerCase();

  let profile;
  if (type === "vendor") {
    const doc = await Vendor.findOne({ email: emailLower });
    profile = await enrichVendor(doc);
  } else {
    profile = await User.findOne({ email: emailLower }).lean();
  }

  if (!profile) throw new NotFoundError("Chat profile");

  return {
    id: profile._id,
    name: profile.name || profile.brandName || profile.personName,
    photo: profile.photo,
    type: type === "vendor" ? "Vendor" : "User",
  };
}

// Resolve a possibly-Register id to the canonical User/Vendor doc, falling
// back through Register.email if the direct lookup misses. Returns the
// (enriched, for vendors) doc or null.
async function resolveParticipant(kind, id) {
  if (kind === "Vendor") {
    const direct = await Vendor.findById(id);
    if (direct) return enrichVendor(direct);
    const reg = await Register.findById(id);
    if (!reg) return null;
    const indirect = await Vendor.findOne({ email: reg.email });
    return enrichVendor(indirect);
  }
  // User
  const direct = await User.findById(id).lean();
  if (direct) return direct;
  const reg = await Register.findById(id);
  if (!reg) return null;
  return User.findOne({ email: reg.email }).lean();
}

async function createOrGetConversation({ vendorId, userId, title }) {
  const [vendor, user] = await Promise.all([
    resolveParticipant("Vendor", vendorId),
    resolveParticipant("User", userId),
  ]);

  if (!vendor) throw new NotFoundError("Vendor", vendorId);
  if (!user) throw new NotFoundError("User", userId);

  const actualVendorId = vendor._id.toString();
  const actualUserId = user._id.toString();

  const existing = await VendorChatConversation.findOne({
    isGroup: false,
    $and: [
      { "participants.kind": "Vendor", "participants.refId": toObjectId(actualVendorId) },
      { "participants.kind": "User", "participants.refId": toObjectId(actualUserId) },
    ],
  });
  if (existing) return existing;

  return VendorChatConversation.create({
    participants: [
      { kind: "Vendor", refId: toObjectId(actualVendorId) },
      { kind: "User", refId: toObjectId(actualUserId) },
    ],
    isGroup: false,
    title: title || `${vendor.brandName || vendor.personName} - ${user.name}`,
    unreadCounts: { [actualVendorId]: 0, [actualUserId]: 0 },
  });
}

async function sendMessage(
  conversationId,
  { senderId, senderKind, content, attachments, messageType },
) {
  const hasContent = content && content.length > 0;
  const hasAttachments = attachments && attachments.length > 0;
  if (!hasContent && !hasAttachments) {
    throw new BadRequestError("Message must have content or attachments");
  }

  const conversation = await VendorChatConversation.findById(conversationId);
  if (!conversation) throw new NotFoundError("Conversation", conversationId);

  const message = await VendorChatMessage.create({
    conversationId: toObjectId(conversationId),
    senderId: toObjectId(senderId),
    senderKind,
    content: content || (hasAttachments ? `${attachments.length} attachment(s)` : ""),
    messageType: messageType || (hasAttachments ? "file" : "text"),
    attachments: attachments || [],
    timestamp: new Date(),
  });

  conversation.lastActivity = new Date();
  conversation.lastMessage =
    content ||
    (hasAttachments ? (attachments[0].type === "image" ? "📷 Photo" : "📄 File") : "Attachment");

  if (!conversation.unreadCounts) conversation.unreadCounts = {};
  for (const p of conversation.participants) {
    const pid = p.refId.toString();
    if (pid !== senderId) {
      conversation.unreadCounts[pid] = (conversation.unreadCounts[pid] || 0) + 1;
    }
  }
  conversation.markModified("unreadCounts");
  await conversation.save();

  return message;
}

// Manually populate senderId on each message — VendorChatMessage's senderId
// is a polymorphic ref (User|Vendor) that mongoose can't auto-populate, and
// vendors need enrichment from onboarding rows.
async function populateSenders(messages) {
  for (const msg of messages) {
    if (msg.senderKind === "User") {
      const u = await User.findById(msg.senderId).select("name photo email").lean();
      if (u) {
        msg.senderId = { _id: u._id, name: u.name, photo: u.photo, email: u.email };
      }
    } else if (msg.senderKind === "Vendor") {
      const doc = await Vendor.findById(msg.senderId);
      const v = await enrichVendor(doc);
      if (v) {
        msg.senderId = {
          _id: v._id,
          name: v.brandName || v.personName,
          photo: v.photo,
          email: v.email,
        };
      }
    }
  }
}

async function getMessages(conversationId, { page, limit }) {
  const messages = await VendorChatMessage.find({
    conversationId: toObjectId(conversationId),
  })
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  await populateSenders(messages);

  const total = await VendorChatMessage.countDocuments({
    conversationId: toObjectId(conversationId),
  });

  return {
    data: messages.reverse(),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

async function listConversations({ participantKind, participantId }) {
  // Same Register fallback as createOrGetConversation: if the SPA hands us
  // a Register id, walk to the canonical User/Vendor id before querying.
  let resolvedId = participantId;
  const regDoc = await Register.findById(participantId);
  if (regDoc) {
    if (participantKind === "User") {
      const u = await User.findOne({ email: regDoc.email });
      if (u) resolvedId = u._id.toString();
    } else if (participantKind === "Vendor") {
      const v = await Vendor.findOne({ email: regDoc.email });
      if (v) resolvedId = v._id.toString();
    }
  }

  const conversations = await VendorChatConversation.find({
    "participants.kind": participantKind,
    "participants.refId": toObjectId(resolvedId),
  })
    .sort({ lastActivity: -1 })
    .lean();

  for (const conv of conversations) {
    for (const p of conv.participants) {
      if (p.kind === "User") {
        const u = await User.findById(p.refId).select("name photo email").lean();
        if (u) p.refId = { _id: u._id, name: u.name, photo: u.photo, email: u.email };
      } else if (p.kind === "Vendor") {
        const doc = await Vendor.findById(p.refId);
        const v = await enrichVendor(doc);
        if (v) {
          p.refId = {
            _id: v._id,
            name: v.brandName || v.personName,
            photo: v.photo,
            email: v.email,
          };
        }
      } else if (p.kind === "Register") {
        const r = await Register.findById(p.refId).select("firstName lastName email").lean();
        if (r) {
          p.refId = {
            _id: r._id,
            name: `${r.firstName} ${r.lastName}`.trim(),
            email: r.email,
          };
        }
      }
    }
  }

  return conversations;
}

async function markAsRead(conversationId, { participantId }) {
  const conversation = await VendorChatConversation.findById(conversationId);
  if (!conversation) throw new NotFoundError("Conversation", conversationId);

  if (!conversation.unreadCounts) conversation.unreadCounts = {};
  conversation.unreadCounts[participantId] = 0;
  conversation.markModified("unreadCounts");
  await conversation.save();
}

async function getConversationById(conversationId) {
  const conversation = await VendorChatConversation.findById(conversationId).lean();
  if (!conversation) throw new NotFoundError("Conversation", conversationId);

  for (const p of conversation.participants) {
    if (p.kind === "User") {
      const u = await User.findById(p.refId).select("name photo email").lean();
      if (u) p.refId = { _id: u._id, name: u.name, photo: u.photo, email: u.email };
    } else if (p.kind === "Vendor") {
      const doc = await Vendor.findById(p.refId);
      const v = await enrichVendor(doc);
      if (v) {
        p.refId = {
          _id: v._id,
          name: v.brandName || v.personName,
          photo: v.photo,
          email: v.email,
        };
      }
    }
  }

  return conversation;
}

module.exports = {
  getChatProfile,
  createOrGetConversation,
  sendMessage,
  getMessages,
  listConversations,
  markAsRead,
  getConversationById,
};
