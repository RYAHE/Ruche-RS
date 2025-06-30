const bcrypt = require('bcrypt');
const db = require('../config/db');

async function setupAdmin() {
    try {
        console.log('🔧 Configuration de l\'administrateur par défaut...');

        // Vérifier si la colonne est_admin existe
        const checkColumnQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'utilisateurs' AND column_name = 'est_admin'
        `;
        
        const columnExists = await db.query(checkColumnQuery);
        
        if (columnExists.rows.length === 0) {
            console.log('📝 Ajout de la colonne est_admin...');
            await db.query('ALTER TABLE utilisateurs ADD COLUMN est_admin BOOLEAN NOT NULL DEFAULT FALSE');
        }

        // Créer un administrateur par défaut
        const adminPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        const insertAdminQuery = `
            INSERT INTO utilisateurs (username, email, password, est_admin, est_actif) 
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (email) DO UPDATE SET 
                username = EXCLUDED.username,
                password = EXCLUDED.password,
                est_admin = EXCLUDED.est_admin,
                est_actif = EXCLUDED.est_actif
            RETURNING id, username, email, est_admin
        `;
        
        const adminData = [
            'admin',
            'admin@ruche.com',
            hashedPassword,
            true,
            true
        ];
        
        const result = await db.query(insertAdminQuery, adminData);
        
        if (result.rows[0]) {
            console.log('✅ Administrateur créé avec succès!');
            console.log('📋 Informations de connexion:');
            console.log(`   Email: admin@ruche.com`);
            console.log(`   Mot de passe: ${adminPassword}`);
            console.log(`   ID: ${result.rows[0].id}`);
            console.log(`   Admin: ${result.rows[0].est_admin}`);
        }

        // Créer l'index pour optimiser les requêtes
        await db.query('CREATE INDEX IF NOT EXISTS idx_utilisateurs_admin ON utilisateurs(est_admin) WHERE est_admin = true');
        console.log('📊 Index d\'administration créé');

        console.log('🎉 Configuration terminée avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur lors de la configuration:', error);
    } finally {
        process.exit(0);
    }
}

// Exécuter le script
setupAdmin(); 