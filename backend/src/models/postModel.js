//importation du module db
const db = require('../config/db');

//creation du model post
const postModel = {
    // Créer un nouveau post (version simplifiée pour débogage)
    async create(titre, contenu, utilisateur_id, categorie_id) {
        try {
            const query = `
                INSERT INTO posts (titre, contenu, utilisateur_id, categorie_id)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;

            const result = await db.query(query, [titre, contenu, utilisateur_id, categorie_id]);

            console.log("Résultat de la création du post:", result.rows[0]);

            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la création du post:', error);
            throw error;
        }
    },

    // Récupérer tous les posts (non supprimés)
    async getAll(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const query = `
            SELECT p.id, p.titre, p.contenu, p.date_creation, p.date_modification, 
                   p.est_anonyme, p.categorie_id, c.nom as categorie_nom,
                   CASE WHEN p.est_anonyme = false THEN u.username ELSE 'Anonyme' END as auteur,
                   CASE WHEN p.est_anonyme = false THEN u.id ELSE NULL END as auteur_id,
                   (SELECT COUNT(*) FROM commentaires WHERE post_id = p.id AND est_supprime = false) as nombre_commentaires,
                   (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) as nombre_likes
            FROM posts p
            LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
            LEFT JOIN categories c ON p.categorie_id = c.id
            WHERE p.est_supprime = false
            ORDER BY p.date_creation DESC
            LIMIT $1 OFFSET $2
        `;
        const result = await db.query(query, [limit, offset]);
        return result.rows;
    },

    // Récupérer un post par son ID
    async getById(postId) {
        const query = `
            SELECT p.id, p.titre, p.contenu, p.date_creation, p.date_modification, 
                   p.est_anonyme, p.categorie_id, c.nom as categorie_nom,
                   CASE WHEN p.est_anonyme = false THEN u.username ELSE 'Anonyme' END as auteur,
                   CASE WHEN p.est_anonyme = false THEN u.id ELSE NULL END as auteur_id,
                   (SELECT COUNT(*) FROM commentaires WHERE post_id = p.id AND est_supprime = false) as nombre_commentaires,
                   (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) as nombre_likes
            FROM posts p
            LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
            LEFT JOIN categories c ON p.categorie_id = c.id
            WHERE p.id = $1 AND p.est_supprime = false
        `;
        const result = await db.query(query, [postId]);
        return result.rows[0];
    },

    // Mettre à jour un post
    async update(postId, titre, contenu, categorieId, estAnonyme) {
        const query = `
            UPDATE posts
            SET titre = $1, contenu = $2, categorie_id = $3, est_anonyme = $4, date_modification = CURRENT_TIMESTAMP
            WHERE id = $5 AND est_supprime = false
            RETURNING id, titre, contenu, date_creation, date_modification, est_anonyme, categorie_id
        `;
        const result = await db.query(query, [titre, contenu, categorieId, estAnonyme, postId]);
        return result.rows[0];
    },

    // Supprimer un post (suppression logique)
    async delete(postId) {
        const query = `
            UPDATE posts
            SET est_supprime = true
            WHERE id = $1
            RETURNING id
        `;
        const result = await db.query(query, [postId]);
        return result.rows[0];
    },

    // Vérifier si un utilisateur est l'auteur d'un post
    async isAuthor(postId, utilisateurId) {
        const query = `
            SELECT COUNT(*) 
            FROM posts 
            WHERE id = $1 AND utilisateur_id = $2
        `;
        const result = await db.query(query, [postId, utilisateurId]);
        return parseInt(result.rows[0].count) > 0;
    },

    // Ajouter un like à un post
    async addLike(postId, utilisateurId) {
        try {
            const query = `
                INSERT INTO likes_posts (post_id, utilisateur_id)
                VALUES ($1, $2)
                ON CONFLICT (utilisateur_id, post_id) DO NOTHING
                RETURNING id
            `;
            const result = await db.query(query, [postId, utilisateurId]);
            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de l\'ajout du like:', error);
            throw error;
        }
    },

    // Retirer un like d'un post
    async removeLike(postId, utilisateurId) {
        const query = `
            DELETE FROM likes_posts
            WHERE post_id = $1 AND utilisateur_id = $2
            RETURNING id
        `;
        const result = await db.query(query, [postId, utilisateurId]);
        return result.rows[0];
    },

    // Vérifier si un utilisateur a liké un post
    async hasLiked(postId, utilisateurId) {
        const query = `
            SELECT COUNT(*) 
            FROM likes_posts 
            WHERE post_id = $1 AND utilisateur_id = $2
        `;
        const result = await db.query(query, [postId, utilisateurId]);
        return parseInt(result.rows[0].count) > 0;
    },

    // Récupérer les posts par catégorie
    async getByCategory(categorieId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const query = `
            SELECT p.id, p.titre, p.contenu, p.date_creation, p.date_modification, 
                   p.est_anonyme, p.categorie_id, c.nom as categorie_nom,
                   CASE WHEN p.est_anonyme = false THEN u.username ELSE 'Anonyme' END as auteur,
                   CASE WHEN p.est_anonyme = false THEN u.id ELSE NULL END as auteur_id,
                   (SELECT COUNT(*) FROM commentaires WHERE post_id = p.id AND est_supprime = false) as nombre_commentaires,
                   (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) as nombre_likes
            FROM posts p
            LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
            LEFT JOIN categories c ON p.categorie_id = c.id
            WHERE p.categorie_id = $1 AND p.est_supprime = false
            ORDER BY p.date_creation DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await db.query(query, [categorieId, limit, offset]);
        return result.rows;
    },

    // Récupérer les posts d'un utilisateur
    async getByUser(utilisateurId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const query = `
            SELECT p.id, p.titre, p.contenu, p.date_creation, p.date_modification, 
                   p.est_anonyme, p.categorie_id, c.nom as categorie_nom,
                   u.username as auteur, u.id as auteur_id,
                   (SELECT COUNT(*) FROM commentaires WHERE post_id = p.id AND est_supprime = false) as nombre_commentaires,
                   (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) as nombre_likes
            FROM posts p
            LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
            LEFT JOIN categories c ON p.categorie_id = c.id
            WHERE p.utilisateur_id = $1 AND p.est_supprime = false
            ORDER BY p.date_creation DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await db.query(query, [utilisateurId, limit, offset]);
        return result.rows;
    },

    // Rechercher des posts
    async search(searchTerm, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const query = `
            SELECT p.id, p.titre, p.contenu, p.date_creation, p.date_modification, 
                   p.est_anonyme, p.categorie_id, c.nom as categorie_nom,
                   CASE WHEN p.est_anonyme = false THEN u.username ELSE 'Anonyme' END as auteur,
                   CASE WHEN p.est_anonyme = false THEN u.id ELSE NULL END as auteur_id,
                   (SELECT COUNT(*) FROM commentaires WHERE post_id = p.id AND est_supprime = false) as nombre_commentaires,
                   (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) as nombre_likes
            FROM posts p
            LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
            LEFT JOIN categories c ON p.categorie_id = c.id
            WHERE (p.titre ILIKE $1 OR p.contenu ILIKE $1) AND p.est_supprime = false
            ORDER BY p.date_creation DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await db.query(query, [`%${searchTerm}%`, limit, offset]);
        return result.rows;
    },

    // Rechercher des posts avancés
    async searchAdvanced(options, page = 1, limit = 10) {
        const { searchTerm, categorieId, dateDebut, dateFin, triPar, ordre } = options;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.id, p.titre, p.contenu, p.date_creation, p.date_modification, 
                   p.est_anonyme, p.categorie_id, c.nom as categorie_nom,
                   CASE WHEN p.est_anonyme = false THEN u.username ELSE 'Anonyme' END as auteur,
                   CASE WHEN p.est_anonyme = false THEN u.id ELSE NULL END as auteur_id,
                   (SELECT COUNT(*) FROM commentaires WHERE post_id = p.id AND est_supprime = false) as nombre_commentaires,
                   (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) as nombre_likes
            FROM posts p
            LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
            LEFT JOIN categories c ON p.categorie_id = c.id
            WHERE p.est_supprime = false
        `;

        const params = [];
        let paramIndex = 1;

        if (searchTerm) {
            query += ` AND (p.titre ILIKE $${paramIndex} OR p.contenu ILIKE $${paramIndex})`;
            params.push(`%${searchTerm}%`);
            paramIndex++;
        }

        if (categorieId) {
            query += ` AND p.categorie_id = $${paramIndex}`;
            params.push(categorieId);
            paramIndex++;
        }

        if (dateDebut) {
            query += ` AND p.date_creation >= $${paramIndex}`;
            params.push(dateDebut);
            paramIndex++;
        }

        if (dateFin) {
            query += ` AND p.date_creation <= $${paramIndex}`;
            params.push(dateFin);
            paramIndex++;
        }

        // Tri
        const validTriFields = ['date_creation', 'nombre_likes', 'nombre_commentaires'];
        const validOrdres = ['ASC', 'DESC'];

        const triField = validTriFields.includes(triPar) ? triPar : 'date_creation';
        const triOrdre = validOrdres.includes(ordre) ? ordre : 'DESC';

        if (triField === 'nombre_likes') {
            query += ` ORDER BY (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) ${triOrdre}`;
        } else if (triField === 'nombre_commentaires') {
            query += ` ORDER BY (SELECT COUNT(*) FROM commentaires WHERE post_id = p.id AND est_supprime = false) ${triOrdre}`;
        } else {
            query += ` ORDER BY p.${triField} ${triOrdre}`;
        }

        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        return result.rows;
    }
};

//export du model post
module.exports = postModel; 