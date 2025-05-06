-- Ajouter le champ est_admin à la table utilisateurs
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS est_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Créer un utilisateur administrateur pour les tests
UPDATE utilisateurs SET est_admin = TRUE WHERE email = 'admin@ruche.fr'; 