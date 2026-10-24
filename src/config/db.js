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
    connectionLimit: 15,
    maxIdle: 10,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 25000,
    timezone: 'Z',
    ssl: {
        rejectUnauthorized: false
    }
});

pool.getConnection()
    .then(async (connection) => {
        console.log(`[DB] ✅ Conectado exitosamente a MySQL (${database}) en ${host}:${port}`);
        try {
            await connection.execute("UPDATE Roles SET nombre_rol = 'Cocinero' WHERE nombre_rol = 'Cocina'");
            await connection.execute("UPDATE Facturas_Pagos SET total_pagado = ROUND(subtotal + COALESCE(propina, 0), 2), impuestos = ROUND((subtotal / 1.12) * 0.12, 2) WHERE total_pagado > subtotal + COALESCE(propina, 0)");
        } catch (_) {}
        connection.release();
    })
    .catch((err) => {
        console.error('[DB] ❌ Error de conexión:', err.message);
    });

module.exports = pool;
