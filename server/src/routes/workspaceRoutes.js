const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireWorkspaceMember, requireWorkspaceRole } = require('../middleware/workspaceMiddleware');
const {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  addMember,
  listMembers,
  updateMemberRole,
  removeMember,
} = require('../controllers/workspaceController');

const router = Router();

// All workspace routes require authentication.
router.use(authMiddleware);

// ─── Workspace CRUD ───────────────────────────────────────────────────────────
router.post('/', createWorkspace);
router.get('/', listWorkspaces);
router.get('/:workspaceId', requireWorkspaceMember, getWorkspace);

// ─── Member management ────────────────────────────────────────────────────────
// List members — any member can view.
router.get(
  '/:workspaceId/members',
  requireWorkspaceMember,
  listMembers
);

// Add member — OWNER or ADMIN only.
router.post(
  '/:workspaceId/members',
  requireWorkspaceMember,
  requireWorkspaceRole('OWNER', 'ADMIN'),
  addMember
);

// Update member role — OWNER only.
router.patch(
  '/:workspaceId/members/:userId',
  requireWorkspaceMember,
  requireWorkspaceRole('OWNER'),
  updateMemberRole
);

// Remove member — OWNER or ADMIN (further rules enforced in controller).
router.delete(
  '/:workspaceId/members/:userId',
  requireWorkspaceMember,
  requireWorkspaceRole('OWNER', 'ADMIN'),
  removeMember
);

// ─── Project management ───────────────────────────────────────────────────────
const {
  createProject,
  listWorkspaceProjects,
} = require('../controllers/projectController');

router.post(
  '/:workspaceId/projects',
  requireWorkspaceMember,
  createProject
);

router.get(
  '/:workspaceId/projects',
  requireWorkspaceMember,
  listWorkspaceProjects
);

module.exports = router;
