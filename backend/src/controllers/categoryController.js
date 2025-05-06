const categoryModel = require('../models/categoryModel');

const categoryController = {
    // Récupérer toutes les catégories
    async getAll(req, res) {
        try {
            const categories = await categoryModel.getAll();

            res.status(200).json({
                message: 'Catégories récupérées avec succès',
                categories
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la récupération des catégories' });
        }
    },

    // Récupérer une catégorie par son ID
    async getById(req, res) {
        try {
            const categorieId = req.params.id;

            const categorie = await categoryModel.getById(categorieId);

            if (!categorie) {
                return res.status(404).json({ message: 'Catégorie non trouvée' });
            }

            res.status(200).json({
                message: 'Catégorie récupérée avec succès',
                categorie
            });
        } catch (error) {
            console.error('Erreur lors de la récupération de la catégorie:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la récupération de la catégorie' });
        }
    },

    // Créer une nouvelle catégorie (réservé aux administrateurs)
    async create(req, res) {
        try {
            // Vérifier si l'utilisateur est administrateur
            if (!req.user.est_admin) {
                return res.status(403).json({ message: 'Accès non autorisé. Seuls les administrateurs peuvent créer des catégories.' });
            }

            const { nom, description } = req.body;

            // Validation des données
            if (!nom) {
                return res.status(400).json({ message: 'Le nom de la catégorie est requis' });
            }

            // Créer la catégorie
            const newCategory = await categoryModel.create(nom, description || '');

            res.status(201).json({
                message: 'Catégorie créée avec succès',
                categorie: newCategory
            });
        } catch (error) {
            console.error('Erreur lors de la création de la catégorie:', error);

            // Gestion de l'erreur de contrainte unique
            if (error.code === '23505') { // Code PostgreSQL pour violation de contrainte unique
                return res.status(400).json({ message: 'Une catégorie avec ce nom existe déjà' });
            }

            res.status(500).json({ message: 'Erreur serveur lors de la création de la catégorie' });
        }
    },

    // Mettre à jour une catégorie (réservé aux administrateurs)
    async update(req, res) {
        try {
            // Vérifier si l'utilisateur est administrateur
            if (!req.user.est_admin) {
                return res.status(403).json({ message: 'Accès non autorisé. Seuls les administrateurs peuvent modifier des catégories.' });
            }

            const categorieId = req.params.id;
            const { nom, description } = req.body;

            // Validation des données
            if (!nom) {
                return res.status(400).json({ message: 'Le nom de la catégorie est requis' });
            }

            // Mettre à jour la catégorie
            const updatedCategory = await categoryModel.update(categorieId, nom, description || '');

            if (!updatedCategory) {
                return res.status(404).json({ message: 'Catégorie non trouvée' });
            }

            res.status(200).json({
                message: 'Catégorie mise à jour avec succès',
                categorie: updatedCategory
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la catégorie:', error);

            // Gestion de l'erreur de contrainte unique
            if (error.code === '23505') {
                return res.status(400).json({ message: 'Une catégorie avec ce nom existe déjà' });
            }

            res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la catégorie' });
        }
    },

    // Supprimer une catégorie (réservé aux administrateurs)
    async delete(req, res) {
        try {
            // Vérifier si l'utilisateur est administrateur
            if (!req.user.est_admin) {
                return res.status(403).json({ message: 'Accès non autorisé. Seuls les administrateurs peuvent supprimer des catégories.' });
            }

            const categorieId = req.params.id;

            // Supprimer la catégorie
            const deletedCategory = await categoryModel.delete(categorieId);

            if (!deletedCategory) {
                return res.status(404).json({ message: 'Catégorie non trouvée' });
            }

            res.status(200).json({
                message: 'Catégorie supprimée avec succès',
                id: deletedCategory.id
            });
        } catch (error) {
            console.error('Erreur lors de la suppression de la catégorie:', error);

            // Gestion de l'erreur de contrainte de clé étrangère
            if (error.code === '23503') { // Code PostgreSQL pour violation de contrainte de clé étrangère
                return res.status(400).json({ message: 'Impossible de supprimer cette catégorie car elle est utilisée par des posts' });
            }

            res.status(500).json({ message: 'Erreur serveur lors de la suppression de la catégorie' });
        }
    }
};

module.exports = categoryController; 