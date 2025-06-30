-- Ajouter la colonne est_admin à la table utilisateurs
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS est_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Créer un administrateur par défaut (mot de passe: admin123)
-- Note: Le mot de passe doit être hashé avec bcrypt
INSERT INTO utilisateurs (username, email, password, est_admin, est_actif) VALUES
('admin', 'admin@ruche.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', true, true)
ON CONFLICT (email) DO UPDATE SET est_admin = true;

-- Créer un index pour optimiser les requêtes d'administration
CREATE INDEX IF NOT EXISTS idx_utilisateurs_admin ON utilisateurs(est_admin) WHERE est_admin = true; 