-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    date_inscription TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion TIMESTAMP,
    est_admin BOOLEAN NOT NULL DEFAULT FALSE
);

-- Création des index pour utilisateurs
CREATE INDEX IF NOT EXISTS idx_utilisateurs_username ON utilisateurs(username);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table des posts
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP,
    est_anonyme BOOLEAN NOT NULL DEFAULT FALSE,
    est_supprime BOOLEAN NOT NULL DEFAULT FALSE,
    utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
    categorie_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
);

-- Table des commentaires
CREATE TABLE IF NOT EXISTS commentaires (
    id SERIAL PRIMARY KEY,
    contenu TEXT NOT NULL,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP,
    est_anonyme BOOLEAN NOT NULL DEFAULT FALSE,
    est_supprime BOOLEAN NOT NULL DEFAULT FALSE,
    utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE
);

-- Table des likes pour les posts
CREATE TABLE IF NOT EXISTS likes_posts (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(utilisateur_id, post_id)
);

-- Table des likes pour les commentaires
CREATE TABLE IF NOT EXISTS likes_commentaires (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
    commentaire_id INTEGER REFERENCES commentaires(id) ON DELETE CASCADE,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(utilisateur_id, commentaire_id)
);

-- Insertion de quelques catégories par défaut
INSERT INTO categories (nom, description) VALUES
('Général', 'Discussions générales'),
('Annonces', 'Annonces importantes'),
('Questions', 'Posez vos questions'),
('Idées', 'Partagez vos idées')
ON CONFLICT (nom) DO NOTHING;

-- Création des index
CREATE INDEX IF NOT EXISTS idx_posts_utilisateur ON posts(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_posts_categorie ON posts(categorie_id);
CREATE INDEX IF NOT EXISTS idx_commentaires_post ON commentaires(post_id);
CREATE INDEX IF NOT EXISTS idx_commentaires_utilisateur ON commentaires(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_likes_posts_post ON likes_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_posts_utilisateur ON likes_posts(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_likes_commentaires_commentaire ON likes_commentaires(commentaire_id);
CREATE INDEX IF NOT EXISTS idx_likes_commentaires_utilisateur ON likes_commentaires(utilisateur_id);

-- Créer un utilisateur administrateur pour les tests
INSERT INTO utilisateurs (username, email, password_hash, est_admin) 
VALUES ('admin', 'admin@ruche.fr', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE)
ON CONFLICT (email) DO UPDATE SET est_admin = TRUE; 