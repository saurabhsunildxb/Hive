/**
 * workspaceMiddleware.js
 *
 * Reusable workspace authorization middleware.
 *
 * requireWorkspaceMember — verifies the authenticated user is a member of the
 *   workspace identified by req.params.workspaceId. On success, attaches
 *   req.membership = { id, userId, workspaceId, role, workspace } so
 *   controllers do not need to re-query membership.
 *
 * requireWorkspaceRole(...roles) — builds on requireWorkspaceMember to gate
 *   access to specific roles. Must be used AFTER requireWorkspaceMember.
 *
 * Authorization principle kept separate from authentication:
 *   - authMiddleware  → "Who is this user?"   (populates req.user)
 *   - workspaceMiddleware → "Is this user a member, and what role?"
 */

const prisma = require('../lib/prisma');

/**
 * Loads the caller's WorkspaceMember record and attaches it to req.membership.
 *
 * If the caller is not a member — including when the workspace does not exist —
 * this always returns 403 (never 404). That is intentional: a 404 would reveal
 * whether a workspace ID exists to non-members. Controllers should not query
 * the workspace separately just to distinguish those cases.
 */
async function requireWorkspaceMember(req, res, next) {
  const { workspaceId } = req.params;

  if (!workspaceId) {
    return res.status(400).json({ success: false, message: 'Workspace ID is required.' });
  }

  try {
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: req.user.id,
      },
      include: {
        workspace: true,
      },
    });

    if (!membership) {
      // Could mean the workspace doesn't exist OR the user isn't a member.
      // We return 403 to avoid leaking workspace existence to non-members.
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    req.membership = membership;
    return next();
  } catch (err) {
    console.error('[workspaceMiddleware] requireWorkspaceMember error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}

/**
 * Returns middleware that allows only the specified roles.
 * Must be placed after requireWorkspaceMember in the middleware chain.
 *
 * Usage: requireWorkspaceRole('OWNER', 'ADMIN')
 */
function requireWorkspaceRole(...roles) {
  return (req, res, next) => {
    if (!req.membership) {
      // Programming error — requireWorkspaceMember must come first.
      return res.status(500).json({ success: false, message: 'Middleware configuration error.' });
    }

    if (!roles.includes(req.membership.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
    }

    return next();
  };
}

module.exports = { requireWorkspaceMember, requireWorkspaceRole };
