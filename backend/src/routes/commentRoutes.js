const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes protégées par authentification
router.put('/:id', authMiddleware, commentController.update);
router.delete('/:id', authMiddleware, commentController.delete);
router.post('/:id/like', authMiddleware, commentController.addLike);
router.delete('/:id/like', authMiddleware, commentController.removeLike);
router.get('/:id/like/check', authMiddleware, commentController.checkLike);

module.exports = router; 