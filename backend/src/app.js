//importation du module express
const express = require('express');
//importation du module cors
const cors = require('cors');
//importation du module dotenv
require('dotenv').config();
// Importation du middleware d'erreur
const errorMiddleware = require('./middleware/errorMiddleware');

//creation de l'application express
const app = express();
//port de l'application
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);

// Route de base
app.get('/', (req, res) => {
    res.json({ message: 'API Ruche opérationnelle' });
});

// Route de test simple
app.get('/test', (req, res) => {
    res.send('Test OK');
});

// Middleware de gestion des erreurs (doit être après les routes)
app.use(errorMiddleware);

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré et accessible à http://localhost:${PORT}/`);
    console.log(`Routes disponibles:`);
    console.log(`- GET / : Page d'accueil`);
    console.log(`- GET /api/auth/hello : Hello World`);
    console.log(`- POST /api/auth/register : Inscription`);
    console.log(`- POST /api/auth/login : Connexion`);
    console.log(`Serveur démarré sur le port ${PORT}`);
});