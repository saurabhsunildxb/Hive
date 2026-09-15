/**
 * commentMiddleware.js
 *
 * Reusable comment authorization middleware.
 *
 * requireCommentAccess — verifies that:
 * 1. The requested comment (req.params.commentId) exists.
 * 2. Resolves comment → task → project → workspace.
 * 3. The caller (req.user.id) is a member of the workspace.
 *
 * On success, attaches:
 * - req.comment    — the Comment record (with task & project included)
 * - req.task       — the Task record
 * - req.project    — the Project record
 * - req.membership — the caller's WorkspaceMember record
 */

const prisma = require('../lib/prisma');

async function requireCommentAccess(req, res, next) {
  const { commentId } = req.params;

  if (!commentId) {
    return res.status(400).json({ success: false, message: 'Comment ID is required.' });
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: comment.task.project.workspaceId,
        userId: req.user.id,
      },
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    req.comment = comment;
    req.task = comment.task;
    req.project = comment.task.project;
    req.membership = membership;
    return next();
  } catch (err) {
    console.error('[commentMiddleware] requireCommentAccess error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

module.exports = { requireCommentAccess };
