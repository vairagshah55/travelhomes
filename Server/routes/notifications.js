const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { requireJwt } = require('../middleware/auth');

// Helper to validate object ID (simple check)
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// GET /api/notifications - Get all notifications for current user/vendor or admin
router.get('/', requireJwt(), async (req, res) => {
  try {
    const { unreadOnly, limit = 50, recipientRole } = req.query;
    
    const query = {};
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    // If not admin, force recipientId to current user's ID
    const user = req.user;
    console.log('[DEBUG] Fetching notifications for user:', user.email, 'Role:', user.userType || user.type);
    
    if (user.userType !== 'admin' && user.type !== 'admin' && user.type !== 'superadmin') {
      query.recipientId = user.id || user._id;
      console.log('[DEBUG] Restricted to recipientId:', query.recipientId);
    } else if (recipientRole) {
      // Admins can filter by role
      query.recipientRole = recipientRole;
      console.log('[DEBUG] Filtering by recipientRole:', query.recipientRole);
    } else {
      // Admin fetching everything for admin panel
      query.recipientRole = 'admin';
      console.log('[DEBUG] Admin fetching admin-role notifications');
    }

    console.log('[DEBUG] Notification query:', JSON.stringify(query));

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    console.log(`[DEBUG] Found ${notifications.length} notifications`);

    const totalUnread = await Notification.countDocuments({ ...query, isRead: false });

    res.json({
      success: true,
      data: notifications,
      totalUnread
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST /api/admin/notifications/bulk-delete - Delete multiple notifications
router.post('/bulk-delete', requireJwt(), async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'Invalid IDs' });
    }

    const query = { _id: { $in: ids } };
    
    // If not admin, only delete if recipientId matches
    const user = req.user;
    if (user.userType !== 'admin' && user.type !== 'admin' && user.type !== 'superadmin') {
      query.recipientId = user.id || user._id;
    }

    await Notification.deleteMany(query);

    res.json({ success: true, message: `${ids.length} notifications deleted` });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/admin/notifications/:id/read - Mark single notification as read
router.put('/:id/read', requireJwt(), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const query = { _id: id };
    // If not admin, only update if recipientId matches
    const user = req.user;
    if (user.userType !== 'admin' && user.type !== 'admin' && user.type !== 'superadmin') {
      query.recipientId = user.id || user._id;
    }

    const notification = await Notification.findOneAndUpdate(
      query,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/admin/notifications/read-all - Mark all as read
router.put('/read-all', requireJwt(), async (req, res) => {
  try {
    const query = { isRead: false };
    
    // If not admin, only update if recipientId matches
    const user = req.user;
    if (user.userType !== 'admin' && user.type !== 'admin' && user.type !== 'superadmin') {
      query.recipientId = user.id || user._id;
    }

    await Notification.updateMany(
      query,
      { $set: { isRead: true } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// DELETE /api/admin/notifications/:id - Delete a notification
router.delete('/:id', requireJwt(), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const query = { _id: id };
    // If not admin, only delete if recipientId matches
    const user = req.user;
    if (user.userType !== 'admin' && user.type !== 'admin' && user.type !== 'superadmin') {
      query.recipientId = user.id || user._id;
    }

    const result = await Notification.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
