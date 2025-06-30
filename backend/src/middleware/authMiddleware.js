//importation du module jwt
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

//creation du middleware d'authentification
const authMiddleware = async (req, res, next) => {
    try {
        // Vérifier si le token est présent dans les headers
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[AUTH-MIDDLEWARE] Token manquant ou format incorrect:', authHeader);
            return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' });
        }

        // Extraire le token
        const token = authHeader.split(' ')[1];
        console.log('[AUTH-MIDDLEWARE] Token reçu:', token.substring(0, 20) + '...');

        // Vérifier et décoder le token avec le même secret que le contrôleur
        const jwtSecret = process.env.JWT_SECRET || 'votre_secret_jwt';
        console.log('[AUTH-MIDDLEWARE] Utilisation du secret JWT:', jwtSecret === 'votre_secret_jwt' ? 'secret par défaut' : 'secret d\'environnement');

        const decoded = jwt.verify(token, jwtSecret);
        console.log('[AUTH-MIDDLEWARE] Token décodé avec succès:', { userId: decoded.userId, username: decoded.username });

        // Récupérer l'utilisateur
        const user = await userModel.getById(decoded.userId);
        if (!user) {
            console.log('[AUTH-MIDDLEWARE] Utilisateur non trouvé pour userId:', decoded.userId);
            return res.status(401).json({ message: 'Utilisateur non trouvé.' });
        }

        console.log('[AUTH-MIDDLEWARE] Authentification réussie pour:', user.username);

        // Ajouter l'utilisateur à la requête
        req.user = user;
        next();
    } catch (error) {
        console.error('[AUTH-MIDDLEWARE] Erreur d\'authentification:', error.message);
        return res.status(401).json({ message: 'Token invalide ou expiré.' });
    }
};

module.exports = authMiddleware;