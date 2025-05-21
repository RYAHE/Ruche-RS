//importation du module jwt
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

//creation du middleware d'authentification
const authMiddleware = async (req, res, next) => {
    try {
        // Vérifier si le token est présent dans les headers
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' });
        }

        // Extraire le token
        const token = authHeader.split(' ')[1];

        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Récupérer l'utilisateur
        const user = await userModel.getById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur non trouvé.' });
        }

        // Ajouter l'utilisateur à la requête
        req.user = user;
        next();
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        return res.status(401).json({ message: 'Token invalide ou expiré.' });
    }
};

module.exports = authMiddleware;