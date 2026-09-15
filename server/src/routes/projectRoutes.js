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

module.exports = router;
