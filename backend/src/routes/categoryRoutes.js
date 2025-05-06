const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes publiques
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Routes protégées par authentification (et réservées aux administrateurs)
router.post('/', authMiddleware, categoryController.create);
router.put('/:id', authMiddleware, categoryController.update);
router.delete('/:id', authMiddleware, categoryController.delete);

module.exports = router; 