const mysql = require('mysql2/promise');

let pool;

if (process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL) {
    const connectionUrl = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
    pool = mysql.createPool(connectionUrl);
    console.log('Conectando a MySQL mediante URL de Railway');
} else {
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'railway',
        port: parseInt(process.env.DB_PORT) || 3306,
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
