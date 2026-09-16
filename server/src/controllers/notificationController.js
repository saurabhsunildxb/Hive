/**
 * notificationController.js
 *
 * Handles Notification CRUD operations.
 *
 * Assumes:
 *  - authMiddleware has run → req.user.id is set
 *  - requireNotificationAccess has run (where applicable) → req.notification is set
 */

const prisma = require('../lib/prisma');
const { userRoom } = require('../socket');

const SAFE_ACTOR_SELECT = {
  select: {
    id: true,
    name: true,
    email: true,
  },
};

const SAFE_TASK_SELECT = {
  select: {
    id: true,
    title: true,
  },
};

// ─── GET /api/v1/notifications ────────────────────────────────────────────────

async function listNotifications(req, res) {
  const { unread, page = 1, limit = 20 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {
    userId: req.user.id,
  };

  if (unread === 'true') {
    where.read = false;
  } else if (unread === 'false') {
    where.read = true;
  }

  try {
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          actor: SAFE_ACTOR_SELECT,
          task: SAFE_TASK_SELECT,
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: req.user.id, read: false },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages,
        },
      },
    });
  } catch (err) {
    console.error('[notificationController] listNotifications error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

// ─── PATCH /api/v1/notifications/:notificationId/read ────────────────────────

async function markAsRead(req, res) {
  // Reject request body if unexpected fields are provided
  if (req.body && Object.keys(req.body).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Unknown update fields are not permitted on mark-as-read.',
    });
  }

  try {
    const updated = await prisma.notification.update({
      where: { id: req.notification.id },
      data: { read: true },
      include: {
        actor: SAFE_ACTOR_SELECT,
        task: SAFE_TASK_SELECT,
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(userRoom(req.user.id)).emit('notification:read', { id: updated.id });
    }

    return res.status(200).json({
      success: true,
      data: { notification: updated },
    });
  } catch (err) {
    console.error('[notificationController] markAsRead error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

// ─── PATCH /api/v1/notifications/read-all ────────────────────────────────────

async function markAllAsRead(req, res) {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false,
      },
      data: { read: true },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(userRoom(req.user.id)).emit('notification:read-all', { count: result.count });
    }

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      count: result.count,
    });
  } catch (err) {
    console.error('[notificationController] markAllAsRead error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
};
