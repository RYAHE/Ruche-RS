-- Ajouter le champ est_admin à la table utilisateurs s'il n'existe pas déjà
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS est_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Mettre à jour le token JWT pour inclure cette information 