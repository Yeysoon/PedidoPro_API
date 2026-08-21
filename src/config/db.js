const mysql = require('mysql2/promise');

// Credenciales verificadas de MySQL en Railway
const host = process.env.DB_HOST || 'caboose.proxy.rlwy.net';
const user = process.env.DB_USER || 'ybarillas';
const password = process.env.DB_PASSWORD || 'Umg1234!';
const database = process.env.DB_NAME || 'railway';
const port = parseInt(process.env.DB_PORT) || 42857;

console.log(`Conectando a MySQL en ${host}:${port} como usuario ${user}...`);

const pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000
});

pool.getConnection()
    .then((connection) => {
        console.log('✅ Conexión a la base de datos MySQL establecida exitosamente como ' + user);
        connection.release();
    })
    .catch((err) => {
        console.error('❌ Error al conectar a la base de datos:', err.message);
    });

module.exports = pool;
