const mysql = require('mysql2/promise');

const host = process.env.DB_HOST || 'caboose.proxy.rlwy.net';
const user = process.env.DB_USER || 'ybarillas';
const password = process.env.DB_PASSWORD || 'Umg1234!';
const database = process.env.DB_NAME || 'railway';
const port = parseInt(process.env.DB_PORT) || 42857;

console.log(`[DB] Conectando a MySQL en ${host}:${port} como ${user}...`);

const pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 25000,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.getConnection()
    .then((connection) => {
        console.log(`[DB] ✅ Conectado exitosamente a MySQL (${database}) en ${host}:${port}`);
        connection.release();
    })
    .catch((err) => {
        console.error('[DB] ❌ Error de conexión:', err.message);
    });

module.exports = pool;
