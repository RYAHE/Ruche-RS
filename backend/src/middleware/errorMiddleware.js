const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);

    // Erreurs spécifiques à PostgreSQL
    if (err.code) {
        switch (err.code) {
            case '23505': // Violation de contrainte unique
                return res.status(400).json({ message: 'Cette valeur existe déjà' });
            case '23503': // Violation de clé étrangère
                return res.status(400).json({ message: 'Référence invalide' });
            default:
                break;
        }
    }

    // Erreurs d'authentification JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token invalide' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expiré' });
    }

    // Erreur par défaut
    res.status(500).json({
        message: 'Erreur serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

module.exports = errorMiddleware; 