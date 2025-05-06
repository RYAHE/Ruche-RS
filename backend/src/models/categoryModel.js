//importation du module db
const db = require('../config/db');

//creation du model categorie
const categoryModel = {
    // Récupérer toutes les catégories
    async getAll() {
        const query = `
            SELECT id, nom, description, date_creation
            FROM categories
            ORDER BY nom ASC
        `;
        const result = await db.query(query);
        return result.rows;
    },

    // Récupérer une catégorie par son ID
    async getById(categorieId) {
        const query = `
            SELECT id, nom, description, date_creation
            FROM categories
            WHERE id = $1
        `;
        const result = await db.query(query, [categorieId]);
        return result.rows[0];
    },

    // Créer une nouvelle catégorie
    async create(nom, description) {
        try {
            const query = `
                INSERT INTO categories (nom, description)
                VALUES ($1, $2)
                RETURNING id, nom, description, date_creation
            `;
            const result = await db.query(query, [nom, description]);
            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la création de la catégorie:', error);
            throw error;
        }
    },

    // Mettre à jour une catégorie
    async update(categorieId, nom, description) {
        const query = `
            UPDATE categories
            SET nom = $1, description = $2
            WHERE id = $3
            RETURNING id, nom, description, date_creation
        `;
        const result = await db.query(query, [nom, description, categorieId]);
        return result.rows[0];
    },

    // Supprimer une catégorie
    async delete(categorieId) {
        const query = `
            DELETE FROM categories
            WHERE id = $1
            RETURNING id
        `;
        const result = await db.query(query, [categorieId]);
        return result.rows[0];
    }
};

//export du model categorie
module.exports = categoryModel; 