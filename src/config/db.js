const mysql = require('mysql2/promise');

let pool;

const connectionString = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;

if (connectionString) {
    console.log('Inicializando pool MySQL con connection string de Railway');
    pool = mysql.createPool(connectionString);
} else {
    console.log('Inicializando pool MySQL con variables individuales');
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'caboose.proxy.rlwy.net',
        user: process.env.DB_USER || 'ybarillas',
        password: process.env.DB_PASSWORD || 'Umg1234!',
        database: process.env.DB_NAME || 'railway',
        port: parseInt(process.env.DB_PORT) || 42857,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
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
