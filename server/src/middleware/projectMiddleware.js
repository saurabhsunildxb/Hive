/**
 * projectMiddleware.js
 *
 * Reusable project authorization middleware.
 *
 * requireProjectAccess — verifies that the project exists (by req.params.projectId)
 *   and that the authenticated caller (req.user.id) is a member of the workspace
 *   that owns the project.
 *
 * On success, attaches:
 *   req.project    — the Project record
 *   req.membership — the caller's WorkspaceMember record (enabling downstream role checks)
 */

const prisma = require('../lib/prisma');

async function requireProjectAccess(req, res, next) {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ success: false, message: 'Project ID is required.' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: project.workspaceId,
        userId: req.user.id,
      },
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    req.project = project;
    req.membership = membership;
    return next();
  } catch (err) {
    console.error('[projectMiddleware] requireProjectAccess error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

module.exports = { requireProjectAccess };
