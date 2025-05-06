//importation du module express
const express = require('express');
//creation du router
const router = express.Router();
//importation du controller
const authController = require('../controllers/authController');

// Route d'inscription
router.post('/register', authController.register);

// Route de connexion
router.post('/login', authController.login);

//export du router
module.exports = router;