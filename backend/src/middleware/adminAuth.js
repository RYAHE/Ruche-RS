const userModel = require('../models/userModel');

const adminAuth = async (req, res, next) => {
    try {
        // Vérifier si l'utilisateur est authentifié
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Accès non autorisé' });
        }

        // Vérifier si l'utilisateur est administrateur
        const isAdmin = await userModel.isAdmin(req.user.id);
        
        if (!isAdmin) {
            return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
        }

        // Ajouter l'information admin au request
        req.user.isAdmin = true;
        next();
    } catch (error) {
        console.error('Erreur lors de la vérification des droits d\'administrateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la vérification des permissions' });
    }
};

module.exports = adminAuth; 