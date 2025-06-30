//importation du module db
const db = require('../config/db');
//importation du module bcrypt
const bcrypt = require('bcryptjs');

//creation du model user
const userModel = {
    // Créer un nouvel utilisateur
    async create(username, email, password) {
        try {
            // Hasher le mot de passe
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Insérer l'utilisateur dans la base de données
            const query = `
        INSERT INTO utilisateurs (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, date_inscription
      `;

            //insertion de l'utilisateur dans la base de données
            const result = await db.query(query, [username, email, passwordHash]);
            //retour de l'utilisateur
            return result.rows[0];
            //rejet de l'erreur
        } catch (error) {
            //affichage de l'erreur
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            //rejet de l'erreur
            throw error;
        }
    },

    // Trouver un utilisateur par email
    async findByEmail(email) {
        try {
            const result = await db.query(
                'SELECT * FROM utilisateurs WHERE email = $1',
                [email]
            );

            console.log("Recherche utilisateur par email:", email);
            console.log("Résultat:", result.rows.length > 0 ? "Utilisateur trouvé" : "Utilisateur non trouvé");

            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la recherche d\'utilisateur par email:', error);
            throw error;
        }
    },

    // Trouver un utilisateur par nom d'utilisateur
    async findByUsername(username) {
        //requete pour trouver un utilisateur par nom d'utilisateur
        const query = 'SELECT * FROM utilisateurs WHERE username = $1';
        //execution de la requete
        const result = await db.query(query, [username]);
        //retour de l'utilisateur
        return result.rows[0];
    },

    // Vérifier si un email existe déjà
    async emailExists(email) {
        const query = 'SELECT COUNT(*) FROM utilisateurs WHERE email = $1';
        const result = await db.query(query, [email]);
        return parseInt(result.rows[0].count) > 0;
    },

    // Vérifier si un nom d'utilisateur existe déjà
    async usernameExists(username) {
        //requete pour trouver un utilisateur par nom d'utilisateur
        const query = 'SELECT COUNT(*) FROM utilisateurs WHERE username = $1';
        //execution de la requete
        const result = await db.query(query, [username]);
        //retour de l'utilisateur
        return parseInt(result.rows[0].count) > 0;
    },

    // Trouver un utilisateur par ID
    async getById(id) {
        try {
            const query = 'SELECT id, username, email, date_inscription FROM utilisateurs WHERE id = $1';
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la recherche d\'utilisateur par ID:', error);
            throw error;
        }
    },

    // Vérifier si un utilisateur est administrateur
    async isAdmin(userId) {
        const query = `
            SELECT est_admin 
            FROM utilisateurs 
            WHERE id = $1 AND est_supprime = false
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0]?.est_admin || false;
    },

    // Mettre à jour le profil d'un utilisateur
    async updateProfile(userId, username, email) {
        const query = `
            UPDATE utilisateurs
            SET username = $1, email = $2, date_modification = CURRENT_TIMESTAMP
            WHERE id = $3 AND est_supprime = false
            RETURNING id, username, email, date_creation, date_modification
        `;
        const result = await db.query(query, [username, email, userId]);
        return result.rows[0];
    },

    // Changer le mot de passe
    async updatePassword(userId, newPassword) {
        const query = `
            UPDATE utilisateurs
            SET password = $1, date_modification = CURRENT_TIMESTAMP
            WHERE id = $2 AND est_supprime = false
            RETURNING id
        `;
        const result = await db.query(query, [newPassword, userId]);
        return result.rows[0];
    },

    // Supprimer un utilisateur (suppression logique)
    async delete(userId) {
        const query = `
            UPDATE utilisateurs
            SET est_supprime = true, date_modification = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0];
    },

    // Récupérer tous les utilisateurs (pour les administrateurs)
    async getAll(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const query = `
            SELECT id, username, email, est_actif, est_admin, date_creation, date_modification
            FROM utilisateurs 
            WHERE est_supprime = false
            ORDER BY date_creation DESC
            LIMIT $1 OFFSET $2
        `;
        const result = await db.query(query, [limit, offset]);
        return result.rows;
    },

    // Promouvoir un utilisateur au rang d'administrateur
    async promoteToAdmin(userId) {
        const query = `
            UPDATE utilisateurs
            SET est_admin = true, date_modification = CURRENT_TIMESTAMP
            WHERE id = $1 AND est_supprime = false
            RETURNING id, username, email, est_admin
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0];
    },

    // Rétrograder un administrateur
    async demoteFromAdmin(userId) {
        const query = `
            UPDATE utilisateurs
            SET est_admin = false, date_modification = CURRENT_TIMESTAMP
            WHERE id = $1 AND est_supprime = false
            RETURNING id, username, email, est_admin
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0];
    }
};

//export du model user
module.exports = userModel;