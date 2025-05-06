const commentModel = require('../models/commentModel');
const postModel = require('../models/postModel');

const commentController = {
    // Créer un nouveau commentaire
    async create(req, res) {
        try {
            const { contenu, estAnonyme } = req.body;
            const postId = req.params.postId;
            const utilisateurId = req.user.id;

            // Validation des données
            if (!contenu) {
                return res.status(400).json({ message: 'Le contenu du commentaire est requis' });
            }

            // Vérifier si le post existe
            const post = await postModel.getById(postId);
            if (!post) {
                return res.status(404).json({ message: 'Post non trouvé' });
            }

            // Créer le commentaire
            const newComment = await commentModel.create(
                contenu,
                utilisateurId,
                postId,
                estAnonyme || false
            );

            res.status(201).json({
                message: 'Commentaire créé avec succès',
                commentaire: newComment
            });
        } catch (error) {
            console.error('Erreur lors de la création du commentaire:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la création du commentaire' });
        }
    },

    // Récupérer tous les commentaires d'un post
    async getByPostId(req, res) {
        try {
            const postId = req.params.postId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            // Vérifier si le post existe
            const post = await postModel.getById(postId);
            if (!post) {
                return res.status(404).json({ message: 'Post non trouvé' });
            }

            const commentaires = await commentModel.getByPostId(postId, page, limit);

            res.status(200).json({
                message: 'Commentaires récupérés avec succès',
                page,
                limit,
                commentaires
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des commentaires:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la récupération des commentaires' });
        }
    },

    // Mettre à jour un commentaire
    async update(req, res) {
        try {
            const commentaireId = req.params.id;
            const { contenu, estAnonyme } = req.body;
            const utilisateurId = req.user.id;

            // Vérifier si l'utilisateur est l'auteur du commentaire
            const isAuthor = await commentModel.isAuthor(commentaireId, utilisateurId);

            if (!isAuthor) {
                return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce commentaire' });
            }

            // Validation des données
            if (!contenu) {
                return res.status(400).json({ message: 'Le contenu du commentaire est requis' });
            }

            // Mettre à jour le commentaire
            const updatedComment = await commentModel.update(
                commentaireId,
                contenu,
                estAnonyme || false
            );

            if (!updatedComment) {
                return res.status(404).json({ message: 'Commentaire non trouvé' });
            }

            res.status(200).json({
                message: 'Commentaire mis à jour avec succès',
                commentaire: updatedComment
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du commentaire:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du commentaire' });
        }
    },

    // Supprimer un commentaire
    async delete(req, res) {
        try {
            const commentaireId = req.params.id;
            const utilisateurId = req.user.id;

            // Vérifier si l'utilisateur est l'auteur du commentaire
            const isAuthor = await commentModel.isAuthor(commentaireId, utilisateurId);

            if (!isAuthor) {
                return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce commentaire' });
            }

            // Supprimer le commentaire
            const deletedComment = await commentModel.delete(commentaireId);

            if (!deletedComment) {
                return res.status(404).json({ message: 'Commentaire non trouvé' });
            }

            res.status(200).json({
                message: 'Commentaire supprimé avec succès',
                id: deletedComment.id
            });
        } catch (error) {
            console.error('Erreur lors de la suppression du commentaire:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la suppression du commentaire' });
        }
    },

    // Ajouter un like à un commentaire
    async addLike(req, res) {
        try {
            const commentaireId = req.params.id;
            const utilisateurId = req.user.id;

            // Vérifier si le commentaire existe
            const commentaire = await commentModel.getById(commentaireId);
            if (!commentaire) {
                return res.status(404).json({ message: 'Commentaire non trouvé' });
            }

            // Vérifier si l'utilisateur a déjà liké ce commentaire
            const hasLiked = await commentModel.hasLiked(commentaireId, utilisateurId);

            if (hasLiked) {
                return res.status(400).json({ message: 'Vous avez déjà liké ce commentaire' });
            }

            // Ajouter le like
            await commentModel.addLike(commentaireId, utilisateurId);

            res.status(200).json({
                message: 'Like ajouté avec succès'
            });
        } catch (error) {
            console.error('Erreur lors de l\'ajout du like:', error);
            res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du like' });
        }
    },

    // Retirer un like d'un commentaire
    async removeLike(req, res) {
        try {
            const commentaireId = req.params.id;
            const utilisateurId = req.user.id;

            // Vérifier si l'utilisateur a liké ce commentaire
            const hasLiked = await commentModel.hasLiked(commentaireId, utilisateurId);

            if (!hasLiked) {
                return res.status(400).json({ message: 'Vous n\'avez pas liké ce commentaire' });
            }

            // Retirer le like
            await commentModel.removeLike(commentaireId, utilisateurId);

            res.status(200).json({
                message: 'Like retiré avec succès'
            });
        } catch (error) {
            console.error('Erreur lors du retrait du like:', error);
            res.status(500).json({ message: 'Erreur serveur lors du retrait du like' });
        }
    }
};

module.exports = commentController; 