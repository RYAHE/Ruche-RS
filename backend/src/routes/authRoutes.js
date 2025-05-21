//importation du module express
const express = require('express');
//creation du router
const router = express.Router();
//importation du controller auth
const authController = require('../controllers/authController');
//importation du middleware auth
const authMiddleware = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimitMiddleware');

// Routes d'authentification
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/user', authMiddleware, authController.getUser);

//export du router
module.exports = router;