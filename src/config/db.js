const mysql = require('mysql2/promise');

let pool;

if (process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL) {
    const connectionUrl = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
    pool = mysql.createPool({
        uri: connectionUrl,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: {
            rejectUnauthorized: false
        }
    });
    console.log('Conectado a MySQL vía URL de Railway con SSL permisivo');
} else {
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'caboose.proxy.rlwy.net',
        user: process.env.DB_USER || 'ybarillas',
        password: process.env.DB_PASSWORD || 'Umg1234!',
        database: process.env.DB_NAME || 'railway',
        port: parseInt(process.env.DB_PORT) || 42857,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: {
            rejectUnauthorized: false
        }
    });
}

pool.getConnection()
    .then((connection) => {
        console.log('Conexión a la base de datos MySQL establecida exitosamente');
        connection.release();
    })
    .catch((err) => {
        console.error('Error al conectar a la base de datos:', err.message);
    });

module.exports = pool;
