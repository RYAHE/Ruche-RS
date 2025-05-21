const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes pour les posts
router.get('/', postController.getAllPosts);
router.get('/search', postController.search);
router.get('/category/:categorieId', postController.getByCategory);
router.get('/user/:utilisateurId', postController.getByUser);
router.get('/:id', postController.getPostById);

// Routes protégées par authentification
router.post('/', authMiddleware, postController.createPost);
router.put('/:id', authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);
router.post('/:id/like', authMiddleware, postController.addLike);
router.delete('/:id/like', authMiddleware, postController.removeLike);

// Routes pour les commentaires d'un post
router.get('/:postId/comments', commentController.getByPostId);
router.post('/:postId/comments', authMiddleware, commentController.create);

module.exports = router; 