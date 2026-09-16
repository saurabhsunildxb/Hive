/**
 * commentController.js
 *
 * Handles Comment CRUD operations.
 *
 * Assumes:
 *  - authMiddleware has run → req.user.id is set
 *  - requireTaskAccess or requireCommentAccess has run → req.membership, req.task, (and req.comment) are set
 */

const prisma = require('../lib/prisma');
const { createNotification, getNotificationTargets } = require('../utils/notificationUtils');

const ALLOWED_UPDATE_KEYS = ['content'];

const SAFE_USER_SELECT = {
  select: {
    id: true,
    name: true,
    email: true,
  },
};

// ─── POST /api/v1/tasks/:taskId/comments ──────────────────────────────────────

async function createComment(req, res) {
  const { taskId } = req.params;
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Comment content is required.' });
  }

  if (content.trim().length > 1000) {
    return res.status(400).json({ success: false, message: 'Comment content must not exceed 1000 characters.' });
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        taskId,
        userId: req.user.id,
      },
      include: {
        user: SAFE_USER_SELECT,
      },
    });

    // Notify task creator and current assignee (excluding comment author)
    if (req.task) {
      const targets = getNotificationTargets([req.task.creatorId, req.task.assigneeId], req.user.id);
      for (const targetUserId of targets) {
        await createNotification({
          userId: targetUserId,
          type: 'COMMENT_ADDED',
          message: `New comment on task: ${req.task.title}`,
          taskId: req.task.id,
          actorId: req.user.id,
        }, req.app.get('io')).catch((err) => console.error('[commentController] Notification error:', err.message));
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.task.projectId}`).emit('comment:created', comment);
    }

    return res.status(201).json({
      success: true,
      data: { comment },
    });
  } catch (err) {
    console.error('[commentController] createComment error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

// ─── GET /api/v1/tasks/:taskId/comments ───────────────────────────────────────

async function listTaskComments(req, res) {
  const { taskId } = req.params;

  try {
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: SAFE_USER_SELECT,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: { comments },
    });
  } catch (err) {
    console.error('[commentController] listTaskComments error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

// ─── PATCH /api/v1/comments/:commentId ───────────────────────────────────────

async function updateComment(req, res) {
  if (req.body.taskId !== undefined) {
    return res.status(400).json({ success: false, message: 'Cannot change task ID.' });
  }

  if (req.body.userId !== undefined) {
    return res.status(400).json({ success: false, message: 'Cannot change user ID.' });
  }

  const bodyKeys = Object.keys(req.body);
  const invalidKeys = bodyKeys.filter((k) => !ALLOWED_UPDATE_KEYS.includes(k));

  if (invalidKeys.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Invalid field(s) in update body: ${invalidKeys.join(', ')}.`,
    });
  }

  if (bodyKeys.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one field must be provided to update.' });
  }

  // ONLY the comment author can edit their own comment.
  if (req.comment.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the comment author can edit this comment.',
    });
  }

  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Comment content must be a non-empty string.' });
  }

  if (content.trim().length > 1000) {
    return res.status(400).json({ success: false, message: 'Comment content must not exceed 1000 characters.' });
  }

  try {
    const updated = await prisma.comment.update({
      where: { id: req.comment.id },
      data: { content: content.trim() },
      include: {
        user: SAFE_USER_SELECT,
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.project.id}`).emit('comment:updated', updated);
    }

    return res.status(200).json({
      success: true,
      data: { comment: updated },
    });
  } catch (err) {
    console.error('[commentController] updateComment error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

// ─── DELETE /api/v1/comments/:commentId ──────────────────────────────────────

async function deleteComment(req, res) {
  const isAuthor = req.comment.userId === req.user.id;
  const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(req.membership.role);

  if (!isAuthor && !isOwnerOrAdmin) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to delete this comment.',
    });
  }

    try {
      await prisma.comment.delete({
        where: { id: req.comment.id },
      });
  
      const io = req.app.get('io');
      if (io) {
        io.to(`project:${req.project.id}`).emit('comment:deleted', {
          id: req.comment.id,
          taskId: req.comment.taskId,
          projectId: req.project.id,
        });
      }
  
      return res.status(200).json({
        success: true,
        message: 'Comment deleted successfully.',
      });
    } catch (err) {
      console.error('[commentController] deleteComment error:', err.message);
      return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
    }
  }

module.exports = {
  createComment,
  listTaskComments,
  updateComment,
  deleteComment,
};
