const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authController = {
    // Inscription d'un nouvel utilisateur
    async register(req, res) {
        try {
            console.log("Requête reçue:", req.body);

            const { username, email, password } = req.body;

            // Validation des données
            if (!username || !email || !password) {
                console.log("Champs manquants:", { username: !!username, email: !!email, password: !!password });
                return res.status(400).json({ message: 'Tous les champs sont requis' });
            }

            // Vérifier si l'email existe déjà
            const emailExists = await userModel.emailExists(email);
            if (emailExists) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé' });
            }

            // Vérifier si le nom d'utilisateur existe déjà
            const usernameExists = await userModel.usernameExists(username);
            if (usernameExists) {
                return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris' });
            }

            // Créer l'utilisateur
            const newUser = await userModel.create(username, email, password);

            // Générer un token JWT
            const token = jwt.sign(
                { id: newUser.id, username: newUser.username },
                process.env.JWT_SECRET || 'votre_secret_jwt',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Utilisateur créé avec succès',
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    dateInscription: newUser.date_inscription
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

            // Validation des données
            if (!email || !password) {
                return res.status(400).json({ message: 'Email et mot de passe requis' });
            }

            // Trouver l'utilisateur par email
            const user = await userModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            // Vérifier le mot de passe
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            // Mettre à jour la dernière connexion
            await db.query(
                'UPDATE utilisateurs SET derniere_connexion = CURRENT_TIMESTAMP WHERE id = $1',
                [user.id]
            );

            // Générer un token JWT
            const token = jwt.sign(
                { id: user.id, username: user.username, est_admin: user.est_admin || false },
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
    }
};

module.exports = authController;