/**
 * Notifications service.
 *
 * Authorization:
 *   - Admins see/modify everything; can filter by recipientRole.
 *   - Non-admins (vendors/users) are scoped to documents whose
 *     `recipientId` matches their user id.
 *
 * The legacy controller branched on user.userType / user.type / user.role
 * across four checks at every endpoint; this service consolidates that into
 * one helper.
 */
const Notification = require("../../models/Notification");
const { NotFoundError } = require("../../shared/errors");

function isAdmin(user) {
  return (
    user.userType === "admin" ||
    user.type === "admin" ||
    user.type === "superadmin" ||
    user.role === "admin"
  );
}

// Returns the filter additions that scope a query to "rows the caller may
// touch". Admins get unrestricted scope (or `{ recipientRole }` filter
// applied by the caller); non-admins are pinned to their own recipientId.
function ownershipFilter(user) {
  if (isAdmin(user)) return null;
  return { recipientId: user.id || user._id };
}

async function list({ unreadOnly = false, limit = 50, recipientRole }, user) {
  const query = {};
  if (unreadOnly) query.isRead = false;

  const ownership = ownershipFilter(user);
  if (ownership) {
    Object.assign(query, ownership);
  } else if (recipientRole) {
    query.recipientRole = recipientRole;
  } else {
    // Default admin view: notifications targeted at admins.
    query.recipientRole = "admin";
  }

  const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(limit);
  const totalUnread = await Notification.countDocuments({ ...query, isRead: false });
  return { data: notifications, totalUnread };
}

async function markRead(id, user) {
  const query = { _id: id, ...(ownershipFilter(user) ?? {}) };
  const notification = await Notification.findOneAndUpdate(query, { isRead: true }, { new: true });
  if (!notification) throw new NotFoundError("Notification", id);
  return { data: notification };
}

async function markAllRead(user) {
  const query = { isRead: false, ...(ownershipFilter(user) ?? {}) };
  await Notification.updateMany(query, { $set: { isRead: true } });
  return { message: "All notifications marked as read" };
}

async function remove(id, user) {
  const query = { _id: id, ...(ownershipFilter(user) ?? {}) };
  const result = await Notification.deleteOne(query);
  if (result.deletedCount === 0) throw new NotFoundError("Notification", id);
  return { message: "Notification deleted" };
}

async function bulkDelete(ids, user) {
  const query = { _id: { $in: ids }, ...(ownershipFilter(user) ?? {}) };
  const result = await Notification.deleteMany(query);
  return {
    message: `${result.deletedCount} notifications deleted`,
    deletedCount: result.deletedCount,
  };
}

module.exports = { list, markRead, markAllRead, remove, bulkDelete };
