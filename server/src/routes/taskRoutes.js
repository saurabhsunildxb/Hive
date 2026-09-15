const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireWorkspaceRole } = require('../middleware/workspaceMiddleware');
const { requireTaskAccess } = require('../middleware/taskMiddleware');
const {
  getTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const router = Router();

// All task routes require authentication
router.use(authMiddleware);

router.get('/:taskId', requireTaskAccess, getTask);
router.patch('/:taskId', requireTaskAccess, updateTask);
router.delete(
  '/:taskId',
  requireTaskAccess,
  requireWorkspaceRole('OWNER', 'ADMIN'),
  deleteTask
);

module.exports = router;
