//pool gére un groupe de connexion à la base de données | Importation du module pool de pg
const { Pool } = require('pg');

//configuration de pool de connexion a la BD
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

//export du pool a l'application
module.exports = {
    query: (text, params) => pool.query(text, params),
};