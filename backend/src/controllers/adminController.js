const postModel = require('../models/postModel');
const userModel = require('../models/userModel');
const commentModel = require('../models/commentModel');

const adminController = {
    // Récupérer tous les posts avec informations complètes (pour les administrateurs)
    async getAllPosts(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const excludeCategory = req.query.excludeCategory;

            const posts = await postModel.getAllForAdmin(page, limit, excludeCategory);

            res.status(200).json({
                posts,
                page,
                limit
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des posts:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la récupération des posts' });
        }
    },

    // Récupérer un post spécifique avec informations complètes (pour les administrateurs)
    async getPostById(req, res) {
        try {
            const postId = req.params.id;
            const post = await postModel.getByIdForAdmin(postId);

            if (!post) {
                return res.status(404).json({ message: 'Post non trouvé' });
            }

            res.status(200).json({ post });
        } catch (error) {
            console.error('Erreur lors de la récupération du post:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la récupération du post' });
        }
    },

    // Récupérer tous les utilisateurs
    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const users = await userModel.getAll(page, limit);

            res.status(200).json({
                users,
                page,
                limit
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs' });
        }
    },

    // Promouvoir un utilisateur au rang d'administrateur
    async promoteUser(req, res) {
        try {
            const userId = req.params.userId;
            const user = await userModel.promoteToAdmin(userId);

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            res.status(200).json({
                message: 'Utilisateur promu au rang d\'administrateur avec succès',
                user
            });
        } catch (error) {
            console.error('Erreur lors de la promotion de l\'utilisateur:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la promotion de l\'utilisateur' });
        }
    },

    // Rétrograder un administrateur
    async demoteUser(req, res) {
        try {
            const userId = req.params.userId;
            const user = await userModel.demoteFromAdmin(userId);

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            res.status(200).json({
                message: 'Utilisateur rétrogradé avec succès',
                user
            });
        } catch (error) {
            console.error('Erreur lors de la rétrogradation de l\'utilisateur:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la rétrogradation de l\'utilisateur' });
        }
    },

    // Supprimer un utilisateur
    async deleteUser(req, res) {
        try {
            const userId = req.params.userId;
            const user = await userModel.delete(userId);

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            res.status(200).json({
                message: 'Utilisateur supprimé avec succès'
            });
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur' });
        }
    },

    // Statistiques pour les administrateurs
    async getStats(req, res) {
        try {
            const db = require('../config/db');

            // Nombre total d'utilisateurs
            const usersResult = await db.query('SELECT COUNT(*) FROM utilisateurs WHERE est_supprime = false');
            const totalUsers = parseInt(usersResult.rows[0].count);

            // Nombre total de posts
            const postsResult = await db.query('SELECT COUNT(*) FROM posts WHERE est_supprime = false');
            const totalPosts = parseInt(postsResult.rows[0].count);

            // Nombre de posts anonymes
            const anonymousPostsResult = await db.query('SELECT COUNT(*) FROM posts WHERE est_anonyme = true AND est_supprime = false');
            const anonymousPosts = parseInt(anonymousPostsResult.rows[0].count);

            // Nombre total de commentaires
            const commentsResult = await db.query('SELECT COUNT(*) FROM commentaires WHERE est_supprime = false');
            const totalComments = parseInt(commentsResult.rows[0].count);

            // Nombre de commentaires anonymes
            const anonymousCommentsResult = await db.query('SELECT COUNT(*) FROM commentaires WHERE est_anonyme = true AND est_supprime = false');
            const anonymousComments = parseInt(anonymousCommentsResult.rows[0].count);

            // Nombre total de likes
            const likesResult = await db.query('SELECT COUNT(*) FROM likes_posts');
            const totalLikes = parseInt(likesResult.rows[0].count);

            res.status(200).json({
                stats: {
                    totalUsers,
                    totalPosts,
                    anonymousPosts,
                    totalComments,
                    anonymousComments,
                    totalLikes
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la récupération des statistiques' });
        }
    }
};

module.exports = adminController; 