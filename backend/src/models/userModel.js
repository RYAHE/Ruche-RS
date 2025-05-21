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
    }
};

//export du model user
module.exports = userModel;