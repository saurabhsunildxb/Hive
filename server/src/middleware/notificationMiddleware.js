/**
 * notificationMiddleware.js
 *
 * Middleware for notification authorization.
 *
 * requireNotificationAccess — verifies that:
 * 1. The requested notification exists (404).
 * 2. The notification belongs to req.user.id (403).
 *
 * On success, attaches req.notification.
 */

const prisma = require('../lib/prisma');

async function requireNotificationAccess(req, res, next) {
  const { notificationId } = req.params;

  if (!notificationId) {
    return res.status(400).json({ success: false, message: 'Notification ID is required.' });
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    req.notification = notification;
    return next();
  } catch (err) {
    console.error('[notificationMiddleware] requireNotificationAccess error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

module.exports = { requireNotificationAccess };
