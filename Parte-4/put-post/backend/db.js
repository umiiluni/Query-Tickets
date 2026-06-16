const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',          // Tu usuario de Postgres
    host: 'localhost',
    database: 'query_tickets',   // El nombre de tu base de datos
    password: '123456',         // Tu contraseña de Postgres
    port: 5432,
});

module.exports = pool;