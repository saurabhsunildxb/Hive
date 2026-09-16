/**
 * notificationUtils.js
 *
 * Helper for creating notifications and determining target recipients.
 */

const prisma = require('../lib/prisma');

const { userRoom } = require('../socket');

const SAFE_USER_SELECT = {
  select: {
    id: true,
    name: true,
    email: true,
  },
};

/**
 * Create a single notification record.
 */
async function createNotification({ userId, type, message, taskId = null, actorId = null }, io = null, tx = prisma) {
  if (!userId || !type || !message) {
    throw new Error('userId, type, and message are required to create a notification.');
  }

  const notification = await tx.notification.create({
    data: {
      userId,
      type,
      message,
      taskId: taskId || null,
      actorId: actorId || null,
    },
    include: {
      actor: SAFE_USER_SELECT,
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (io) {
    io.to(userRoom(userId)).emit('notification:new', notification);
  }

  return notification;
}

/**
 * Returns a deduplicated array of user IDs, excluding null/undefined and excluding the actor.
 */
function getNotificationTargets(userArray, actorId) {
  if (!Array.isArray(userArray)) return [];
  const unique = new Set();
  for (const id of userArray) {
    if (id && id !== actorId) {
      unique.add(id);
    }
  }
  return Array.from(unique);
}

module.exports = {
  createNotification,
  getNotificationTargets,
};
