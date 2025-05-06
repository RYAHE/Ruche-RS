const postModel = require('../models/postModel');
const commentModel = require('../models/commentModel');

const postController = {
    // Créer un nouveau post
    async create(req, res) {
        try {
            console.log("Création de post - Requête reçue:", req.body);
            console.log("Utilisateur authentifié:", req.user);

            const { titre, contenu, categorieId, estAnonyme } = req.body;
            const utilisateurId = req.user.id;

            // Validation des données
            if (!titre || !contenu || !categorieId) {
                console.log("Validation échouée:", { titre: !!titre, contenu: !!contenu, categorieId: !!categorieId });
                return res.status(400).json({ message: 'Titre, contenu et catégorie sont requis' });
            }

            // Vérifier si la catégorie existe
            const db = require('../config/db');
            const catResult = await db.query('SELECT id FROM categories WHERE id = $1', [categorieId]);
            if (catResult.rows.length === 0) {
                console.log(`Catégorie ${categorieId} non trouvée`);
                return res.status(404).json({ message: 'Catégorie non trouvée' });
            }

            console.log("Tentative de création du post avec:", {
                titre,
                contenu: contenu.substring(0, 30) + "...",
                utilisateurId,
                categorieId,
                estAnonyme: estAnonyme || false
            });

            // Créer le post
            const newPost = await postModel.create(
                titre,
                contenu,
                utilisateurId,
                categorieId,
                estAnonyme || false
            );

            console.log("Post créé avec succès:", newPost);

            res.status(201).json({
                message: 'Post créé avec succès',
                post: newPost
            });
        } catch (error) {
            console.error('Erreur détaillée lors de la création du post:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la création du post' });
        }
    },

    // Récupérer tous les posts
    async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const posts = await postModel.getAll(page, limit);

            res.status(200).json({
                message: 'Posts récupérés avec succès',
                page,
                limit,
                posts
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des posts:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la récupération des posts' });
        }
    },

    // Récupérer un post par son ID
    async getById(req, res) {
        try {
            const postId = req.params.id;

            const post = await postModel.getById(postId);

            if (!post) {
                return res.status(404).json({ message: 'Post non trouvé' });
            }

            // Récupérer les commentaires du post
            const commentaires = await commentModel.getByPostId(postId);

            res.status(200).json({
                message: 'Post récupéré avec succès',
                post,
                commentaires
            });
        } catch (error) {
            console.error('Erreur lors de la récupération du post:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la récupération du post' });
        }
    },

    // Mettre à jour un post
    async update(req, res) {
        try {
            const postId = req.params.id;
            const { titre, contenu, categorieId, estAnonyme } = req.body;
            const utilisateurId = req.user.id;

            // Vérifier si l'utilisateur est l'auteur du post
            const isAuthor = await postModel.isAuthor(postId, utilisateurId);

            if (!isAuthor) {
                return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce post' });
            }

            // Validation des données
            if (!titre || !contenu || !categorieId) {
                return res.status(400).json({ message: 'Titre, contenu et catégorie sont requis' });
            }

            // Mettre à jour le post
            const updatedPost = await postModel.update(
                postId,
                titre,
                contenu,
                categorieId,
                estAnonyme || false
            );

            if (!updatedPost) {
                return res.status(404).json({ message: 'Post non trouvé' });
            }

            res.status(200).json({
                message: 'Post mis à jour avec succès',
                post: updatedPost
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du post:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du post' });
        }
    },

    // Supprimer un post
    async delete(req, res) {
        try {
            const postId = req.params.id;
            const utilisateurId = req.user.id;

            // Vérifier si l'utilisateur est l'auteur du post
            const isAuthor = await postModel.isAuthor(postId, utilisateurId);

            if (!isAuthor) {
                return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce post' });
            }

            // Supprimer le post
            const deletedPost = await postModel.delete(postId);

            if (!deletedPost) {
                return res.status(404).json({ message: 'Post non trouvé' });
            }

            res.status(200).json({
                message: 'Post supprimé avec succès',
                id: deletedPost.id
            });
        } catch (error) {
            console.error('Erreur lors de la suppression du post:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la suppression du post' });
        }
    },

    // Ajouter un like à un post
    async addLike(req, res) {
        try {
            const postId = req.params.id;
            const utilisateurId = req.user.id;

            // Vérifier si l'utilisateur a déjà liké ce post
            const hasLiked = await postModel.hasLiked(postId, utilisateurId);

            if (hasLiked) {
                return res.status(400).json({ message: 'Vous avez déjà liké ce post' });
            }

            // Ajouter le like
            await postModel.addLike(postId, utilisateurId);

            res.status(200).json({
                message: 'Like ajouté avec succès'
            });
        } catch (error) {
            console.error('Erreur lors de l\'ajout du like:', error);
            res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du like' });
        }
    },

    // Retirer un like d'un post
    async removeLike(req, res) {
        try {
            const postId = req.params.id;
            const utilisateurId = req.user.id;

            // Vérifier si l'utilisateur a liké ce post
            const hasLiked = await postModel.hasLiked(postId, utilisateurId);

            if (!hasLiked) {
                return res.status(400).json({ message: 'Vous n\'avez pas liké ce post' });
            }

            // Retirer le like
            await postModel.removeLike(postId, utilisateurId);

            res.status(200).json({
                message: 'Like retiré avec succès'
            });
        } catch (error) {
            console.error('Erreur lors du retrait du like:', error);
            res.status(500).json({ message: 'Erreur serveur lors du retrait du like' });
        }
    },

    // Récupérer les posts par catégorie
    async getByCategory(req, res) {
        try {
            const categorieId = req.params.categorieId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const posts = await postModel.getByCategory(categorieId, page, limit);

            res.status(200).json({
                message: 'Posts récupérés avec succès',
                page,
                limit,
                posts
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des posts par catégorie:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la récupération des posts' });
        }
    },

    // Récupérer les posts d'un utilisateur
    async getByUser(req, res) {
        try {
            const utilisateurId = req.params.utilisateurId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const posts = await postModel.getByUser(utilisateurId, page, limit);

            res.status(200).json({
                message: 'Posts récupérés avec succès',
                page,
                limit,
                posts
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des posts par utilisateur:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la récupération des posts' });
        }
    },

    // Rechercher des posts
    async search(req, res) {
        try {
            const searchTerm = req.query.q;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (!searchTerm) {
                return res.status(400).json({ message: 'Terme de recherche requis' });
            }

            const posts = await postModel.search(searchTerm, page, limit);

            res.status(200).json({
                message: 'Recherche effectuée avec succès',
                page,
                limit,
                searchTerm,
                posts
            });
        } catch (error) {
            console.error('Erreur lors de la recherche de posts:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la recherche de posts' });
        }
    }
};

module.exports = postController; 