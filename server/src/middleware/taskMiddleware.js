/**
 * taskMiddleware.js
 *
 * Reusable task authorization middleware.
 *
 * requireTaskAccess — verifies that:
 * 1. The requested task (req.params.taskId) exists.
 * 2. The task's project exists.
 * 3. The caller (req.user.id) is a member of the workspace owning the task's project.
 *
 * On success, attaches:
 * - req.task       — the Task record (with project included)
 * - req.project    — the Project record
 * - req.membership — the caller's WorkspaceMember record (enabling requireWorkspaceRole downstream)
 */

const prisma = require('../lib/prisma');

async function requireTaskAccess(req, res, next) {
  const { taskId } = req.params;

  if (!taskId) {
    return res.status(400).json({ success: false, message: 'Task ID is required.' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: task.project.workspaceId,
        userId: req.user.id,
      },
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    req.task = task;
    req.project = task.project;
    req.membership = membership;
    return next();
  } catch (err) {
    console.error('[taskMiddleware] requireTaskAccess error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

module.exports = { requireTaskAccess };
