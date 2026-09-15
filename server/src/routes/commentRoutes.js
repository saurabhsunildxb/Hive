const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireCommentAccess } = require('../middleware/commentMiddleware');
const {
  updateComment,
  deleteComment,
} = require('../controllers/commentController');

const router = Router();

// All comment routes require authentication
router.use(authMiddleware);

router.patch('/:commentId', requireCommentAccess, updateComment);
router.delete('/:commentId', requireCommentAccess, deleteComment);

module.exports = router;
