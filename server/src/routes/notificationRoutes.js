const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireNotificationAccess } = require('../middleware/notificationMiddleware');
const {
  listNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

const router = Router();

// All notification routes require authentication
router.use(authMiddleware);

router.get('/', listNotifications);
router.patch('/read-all', markAllAsRead); // MUST be placed before /:notificationId/read
router.patch('/:notificationId/read', requireNotificationAccess, markAsRead);

module.exports = router;
