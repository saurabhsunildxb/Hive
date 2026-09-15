const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireWorkspaceRole } = require('../middleware/workspaceMiddleware');
const { requireProjectAccess } = require('../middleware/projectMiddleware');
const {
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

const router = Router();

// All project routes require authentication
router.use(authMiddleware);

router.get('/:projectId', requireProjectAccess, getProject);
router.patch('/:projectId', requireProjectAccess, updateProject);
router.delete(
  '/:projectId',
  requireProjectAccess,
  requireWorkspaceRole('OWNER', 'ADMIN'),
  deleteProject
);

// ─── Project-scoped Task routes ───────────────────────────────────────────────
const {
  createTask,
  listProjectTasks,
} = require('../controllers/taskController');

router.post(
  '/:projectId/tasks',
  requireProjectAccess,
  createTask
);

router.get(
  '/:projectId/tasks',
  requireProjectAccess,
  listProjectTasks
);

module.exports = router;
