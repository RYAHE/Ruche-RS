//importation du module jwt
const jwt = require('jsonwebtoken');

//creation du middleware d'authentification
const authMiddleware = (req, res, next) => {
    try {
        // Récupérer le token du header Authorization
        const authHeader = req.headers.authorization;

        // Déboguer les headers reçus
        console.log('Headers reçus:', req.headers);

        //si le token n'est pas présent ou ne commence pas par Bearer
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Header Authorization invalide:', authHeader);
            //retour d'une erreur 401
            return res.status(401).json({ message: 'Accès non autorisé' });
        }

        const token = authHeader.split(' ')[1];
        console.log('Token extrait:', token.substring(0, 20) + '...');

        // Vérifier le token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt');
            console.log('Token décodé:', decoded);

            // Ajouter les informations de l'utilisateur à la requête
            req.user = decoded;

            //passage au middleware suivant
            next();
        } catch (jwtError) {
            console.error('Erreur de vérification JWT:', jwtError);
            return res.status(401).json({ message: 'Token invalide ou expiré' });
        }
    } catch (error) {
        //affichage de l'erreur
        console.error('Erreur d\'authentification:', error);
        //retour d'une erreur 401
        res.status(401).json({ message: 'Token invalide ou expiré' });
    }
};

module.exports = authMiddleware;