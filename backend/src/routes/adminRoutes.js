const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

// Toutes les routes d'administration nécessitent une authentification admin
router.use(adminAuth);

// Routes pour les posts
router.get('/posts', adminController.getAllPosts);
router.get('/posts/:id', adminController.getPostById);

// Routes pour les utilisateurs
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/promote', adminController.promoteUser);
router.put('/users/:userId/demote', adminController.demoteUser);
router.delete('/users/:userId', adminController.deleteUser);

// Routes pour les statistiques
router.get('/stats', adminController.getStats);

module.exports = router; 