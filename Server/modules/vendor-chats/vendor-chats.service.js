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

/**
 * Enrich a batch of Vendor docs with brandName / personName from their most
 * recent onboarding row.
 *
 * The single-doc version fired 3 queries per vendor, and every caller ran it in
 * a loop — a 50-message page from one vendor cost 50 × (1 + 3) = 200 sequential
 * round trips. This resolves any number of vendors in 3 queries total.
 *
 * Preference order (stay > activity > caravan) and field precedence are
 * unchanged.
 */
async function enrichVendors(vendors) {
  const list = vendors.filter(Boolean).map((v) => (v.toObject ? v.toObject() : { ...v }));
  const vendorIds = [...new Set(list.map((v) => v.vendorId).filter(Boolean))];
  if (!vendorIds.length) return list;

  // Sorted newest-first with "first write wins" per vendor, reproducing the
  // original `findOne(...).sort({ createdAt: -1 })`.
  const mostRecentByVendor = (docs) => {
    const map = new Map();
    for (const d of docs) if (!map.has(d.vendorId)) map.set(d.vendorId, d);
    return map;
  };
  const load = (Model) =>
    Model.find({ vendorId: { $in: vendorIds } })
      .sort({ createdAt: -1 })
      .lean();

  const [stays, activities, caravans] = await Promise.all([
    load(StayOnboarding),
    load(ActivityOnboarding),
    load(CaravanOnboarding),
  ]);
  const stayMap = mostRecentByVendor(stays);
  const activityMap = mostRecentByVendor(activities);
  const caravanMap = mostRecentByVendor(caravans);

  for (const data of list) {
    if (!data.vendorId) continue;
    const source =
      stayMap.get(data.vendorId) ||
      activityMap.get(data.vendorId) ||
      caravanMap.get(data.vendorId);
    if (!source) continue;
    data.brandName = source.brandName || source.businessName || data.brandName;
    if (source.firstName || source.lastName) {
      data.personName = `${source.firstName || ""} ${source.lastName || ""}`.trim();
    }
  }
  return list;
}

async function enrichVendor(vendor) {
  if (!vendor) return null;
  const [enriched] = await enrichVendors([vendor]);
  return enriched ?? null;
}

/**
 * Replace polymorphic `refId` / `senderId` values with display objects, for any
 * number of participants across any number of conversations, in 3 queries
 * (+3 for vendor enrichment) rather than 1-4 per participant.
 *
 * `refs` is a list of `{ kind, id, apply(displayObject) }` — the caller decides
 * where the resolved object gets written back.
 */
async function resolveRefs(refs) {
  if (!refs.length) return;

  const idsFor = (kind) => [
    ...new Set(refs.filter((r) => r.kind === kind && r.id).map((r) => String(r.id))),
  ];
  const userIds = idsFor("User");
  const vendorIds = idsFor("Vendor");
  const registerIds = idsFor("Register");

  const [users, vendorDocs, registers] = await Promise.all([
    userIds.length ? User.find({ _id: { $in: userIds } }).select("name photo email").lean() : [],
    vendorIds.length ? Vendor.find({ _id: { $in: vendorIds } }).lean() : [],
    registerIds.length
      ? Register.find({ _id: { $in: registerIds } })
          .select("firstName lastName email")
          .lean()
      : [],
  ]);

  const vendors = await enrichVendors(vendorDocs);

  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));
  const registerMap = new Map(registers.map((r) => [String(r._id), r]));

  for (const ref of refs) {
    const key = String(ref.id);
    if (ref.kind === "User") {
      const u = userMap.get(key);
      if (u) ref.apply({ _id: u._id, name: u.name, photo: u.photo, email: u.email });
    } else if (ref.kind === "Vendor") {
      const v = vendorMap.get(key);
      if (v) {
        ref.apply({
          _id: v._id,
          name: v.brandName || v.personName,
          photo: v.photo,
          email: v.email,
        });
      }
    } else if (ref.kind === "Register") {
      const r = registerMap.get(key);
      if (r) {
        ref.apply({
          _id: r._id,
          name: `${r.firstName} ${r.lastName}`.trim(),
          email: r.email,
        });
      }
    }
  }
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
  await resolveRefs(
    messages.map((msg) => ({
      kind: msg.senderKind,
      id: msg.senderId,
      apply: (display) => {
        msg.senderId = display;
      },
    })),
  );
}

async function getMessages(conversationId, { page, limit }) {
  const filter = { conversationId: toObjectId(conversationId) };

  // The page and its total are independent — no reason to pay for them in series.
  const [messages, total] = await Promise.all([
    VendorChatMessage.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    VendorChatMessage.countDocuments(filter),
  ]);

  await populateSenders(messages);

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

  // One batched resolve across every participant of every conversation. This
  // was a nested loop issuing 1-4 queries per participant.
  await resolveRefs(
    conversations.flatMap((conv) =>
      conv.participants.map((p) => ({
        kind: p.kind,
        id: p.refId,
        apply: (display) => {
          p.refId = display;
        },
      })),
    ),
  );

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

  // Note: no Register branch here, matching the original — this endpoint only
  // resolved User and Vendor participants.
  await resolveRefs(
    conversation.participants
      .filter((p) => p.kind === "User" || p.kind === "Vendor")
      .map((p) => ({
        kind: p.kind,
        id: p.refId,
        apply: (display) => {
          p.refId = display;
        },
      })),
  );

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
