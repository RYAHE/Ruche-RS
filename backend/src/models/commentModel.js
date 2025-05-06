//importation du module db
const db = require('../config/db');

//creation du model commentaire
const commentModel = {
    // Créer un nouveau commentaire
    async create(contenu, utilisateurId, postId, estAnonyme = false) {
        try {
            const query = `
                INSERT INTO commentaires (contenu, utilisateur_id, post_id, est_anonyme)
                VALUES ($1, $2, $3, $4)
                RETURNING id, contenu, date_creation, est_anonyme, post_id
            `;
            const result = await db.query(query, [contenu, utilisateurId, postId, estAnonyme]);
            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la création du commentaire:', error);
            throw error;
        }
    },

    // Récupérer tous les commentaires d'un post
    async getByPostId(postId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const query = `
            SELECT c.id, c.contenu, c.date_creation, c.date_modification, c.est_anonyme,
                   CASE WHEN c.est_anonyme = false THEN u.username ELSE 'Anonyme' END as auteur,
                   CASE WHEN c.est_anonyme = false THEN u.id ELSE NULL END as auteur_id,
                   (SELECT COUNT(*) FROM likes_commentaires WHERE commentaire_id = c.id) as nombre_likes
            FROM commentaires c
            LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
            WHERE c.post_id = $1 AND c.est_supprime = false
            ORDER BY c.date_creation ASC
            LIMIT $2 OFFSET $3
        `;
        const result = await db.query(query, [postId, limit, offset]);
        return result.rows;
    },

    // Récupérer un commentaire par son ID
    async getById(commentaireId) {
        const query = `
            SELECT c.id, c.contenu, c.date_creation, c.date_modification, c.est_anonyme, c.post_id,
                   CASE WHEN c.est_anonyme = false THEN u.username ELSE 'Anonyme' END as auteur,
                   CASE WHEN c.est_anonyme = false THEN u.id ELSE NULL END as auteur_id,
                   (SELECT COUNT(*) FROM likes_commentaires WHERE commentaire_id = c.id) as nombre_likes
            FROM commentaires c
            LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
            WHERE c.id = $1 AND c.est_supprime = false
        `;
        const result = await db.query(query, [commentaireId]);
        return result.rows[0];
    },

    // Mettre à jour un commentaire
    async update(commentaireId, contenu, estAnonyme) {
        const query = `
            UPDATE commentaires
            SET contenu = $1, est_anonyme = $2, date_modification = CURRENT_TIMESTAMP
            WHERE id = $3 AND est_supprime = false
            RETURNING id, contenu, date_creation, date_modification, est_anonyme, post_id
        `;
        const result = await db.query(query, [contenu, estAnonyme, commentaireId]);
        return result.rows[0];
    },

    // Supprimer un commentaire (suppression logique)
    async delete(commentaireId) {
        const query = `
            UPDATE commentaires
            SET est_supprime = true
            WHERE id = $1
            RETURNING id
        `;
        const result = await db.query(query, [commentaireId]);
        return result.rows[0];
    },

    // Vérifier si un utilisateur est l'auteur d'un commentaire
    async isAuthor(commentaireId, utilisateurId) {
        const query = `
            SELECT COUNT(*) 
            FROM commentaires 
            WHERE id = $1 AND utilisateur_id = $2
        `;
        const result = await db.query(query, [commentaireId, utilisateurId]);
        return parseInt(result.rows[0].count) > 0;
    },

    // Ajouter un like à un commentaire
    async addLike(commentaireId, utilisateurId) {
        try {
            const query = `
                INSERT INTO likes_commentaires (commentaire_id, utilisateur_id)
                VALUES ($1, $2)
                ON CONFLICT (utilisateur_id, commentaire_id) DO NOTHING
                RETURNING id
            `;
            const result = await db.query(query, [commentaireId, utilisateurId]);
            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de l\'ajout du like:', error);
            throw error;
        }
    },

    // Retirer un like d'un commentaire
    async removeLike(commentaireId, utilisateurId) {
        const query = `
            DELETE FROM likes_commentaires
            WHERE commentaire_id = $1 AND utilisateur_id = $2
            RETURNING id
        `;
        const result = await db.query(query, [commentaireId, utilisateurId]);
        return result.rows[0];
    },

    // Vérifier si un utilisateur a liké un commentaire
    async hasLiked(commentaireId, utilisateurId) {
        const query = `
            SELECT COUNT(*) 
            FROM likes_commentaires 
            WHERE commentaire_id = $1 AND utilisateur_id = $2
        `;
        const result = await db.query(query, [commentaireId, utilisateurId]);
        return parseInt(result.rows[0].count) > 0;
    }
};

//export du model commentaire
module.exports = commentModel; 