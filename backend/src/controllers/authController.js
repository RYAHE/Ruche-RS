const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authController = {
    // Inscription d'un nouvel utilisateur
    async register(req, res) {
        try {
            const { username, email, password } = req.body;

            console.log("Tentative d'inscription avec:", { username, email });

            // Validation des données
            if (!username) {
                return res.status(400).json({ message: 'Le nom d\'utilisateur est requis' });
            }

            if (username.length < 3 || username.length > 20) {
                return res.status(400).json({ message: 'Le nom d\'utilisateur doit contenir entre 3 et 20 caractères' });
            }

            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                return res.status(400).json({ message: 'Le nom d\'utilisateur ne peut contenir que des lettres, des chiffres et des underscores' });
            }

            if (!email) {
                return res.status(400).json({ message: 'L\'email est requis' });
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ message: 'Format d\'email invalide' });
            }

            if (!password) {
                return res.status(400).json({ message: 'Le mot de passe est requis' });
            }

            if (password.length < 8) {
                return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
            }

            if (!/[A-Z]/.test(password)) {
                return res.status(400).json({ message: 'Le mot de passe doit contenir au moins une lettre majuscule' });
            }

            if (!/[0-9]/.test(password)) {
                return res.status(400).json({ message: 'Le mot de passe doit contenir au moins un chiffre' });
            }

            // Vérifier si l'email existe déjà
            const emailExists = await userModel.emailExists(email);
            if (emailExists) {
                console.log("Email déjà utilisé:", email);
                return res.status(400).json({ message: 'Cet email est déjà utilisé' });
            }

            // Vérifier si le nom d'utilisateur existe déjà
            const usernameExists = await userModel.usernameExists(username);
            if (usernameExists) {
                console.log("Nom d'utilisateur déjà utilisé:", username);
                return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà utilisé' });
            }

            // Créer l'utilisateur
            const user = await userModel.create(username, email, password);
            console.log("Utilisateur créé avec succès:", { id: user.id, username: user.username });

            // Générer un token JWT
            const token = jwt.sign(
                { userId: user.id, username: user.username },
                process.env.JWT_SECRET || 'votre_secret_jwt',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Inscription réussie',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                },
                token
            });
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
        }
    },

    // Connexion d'un utilisateur
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Logs pour le débogage
            console.log("Tentative de connexion pour:", email);

            // Validation des données
            if (!email || !password) {
                console.log("Données manquantes:", { email: !!email, password: !!password });
                return res.status(400).json({ message: 'Email et mot de passe requis' });
            }

            // Trouver l'utilisateur par email
            const user = await userModel.findByEmail(email);
            if (!user) {
                console.log("Utilisateur non trouvé pour l'email:", email);
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            // Vérifier le mot de passe
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                console.log("Mot de passe incorrect pour l'utilisateur:", email);
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            console.log("Connexion réussie pour l'utilisateur:", email);

            // Mettre à jour la dernière connexion
            await db.query(
                'UPDATE utilisateurs SET derniere_connexion = CURRENT_TIMESTAMP WHERE id = $1',
                [user.id]
            );

            // Générer un token JWT
            const token = jwt.sign(
                { userId: user.id, username: user.username, est_admin: user.est_admin || false },
                process.env.JWT_SECRET || 'votre_secret_jwt',
                { expiresIn: '24h' }
            );

            res.status(200).json({
                message: 'Connexion réussie',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                },
                token
            });
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
        }
    },

    // Vérifiez que la méthode getUser existe
    async getUser(req, res) {
        try {
            // Puisque nous avons désactivé le middleware d'authentification,
            // nous devons vérifier si req.user existe
            if (!req.user) {
                // Pour le débogage, retournons un utilisateur fictif
                return res.status(200).json({
                    user: {
                        id: 1,
                        username: 'utilisateur_test',
                        email: 'test@example.com',
                        estAdmin: false,
                        dateInscription: new Date().toISOString()
                    }
                });
            }

            // Si req.user existe, continuez normalement
            const userWithoutPassword = {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                estAdmin: req.user.est_admin,
                dateInscription: req.user.date_inscription
            };

            res.status(200).json({ user: userWithoutPassword });
        } catch (error) {
            console.error('Erreur lors de la récupération des informations utilisateur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = authController;