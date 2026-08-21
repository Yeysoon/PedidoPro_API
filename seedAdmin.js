require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bd_PedidoPro'
        });

        console.log('Conectado a la base de datos.');

        // Verificar si el rol de Administrador existe (suponiendo que es el id_rol = 1, pero buscaremos su ID)
        const [roles] = await connection.execute(`SELECT id_rol FROM Roles WHERE nombre_rol = 'Administrador'`);
        
        if (roles.length === 0) {
            console.log('Error: El rol "Administrador" no existe en la tabla Roles.');
            process.exit(1);
        }

        const id_rol_admin = roles[0].id_rol;

        // Datos del usuario admin
        const nombre = 'Administrador Principal';
        const email = 'admin@pedidopro.com';
        const password_plano = 'admin123'; // Contraseña por defecto

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const contrasena_hash = await bcrypt.hash(password_plano, salt);

        // Insertar usuario
        const [result] = await connection.execute(
            `INSERT INTO Usuarios (id_rol, nombre, email, contrasena_hash, activo) VALUES (?, ?, ?, ?, ?)`,
            [id_rol_admin, nombre, email, contrasena_hash, 1]
        );

        console.log('✅ ¡Usuario Administrador creado con éxito!');
        console.log('------------------------------------------------');
        console.log(`👤 Email: ${email}`);
        console.log(`🔑 Contraseña: ${password_plano}`);
        console.log('------------------------------------------------');
        console.log('Ya puedes hacer una petición POST a /api/auth/login usando estas credenciales.');

        await connection.end();
        process.exit(0);

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('⚠️ El usuario "admin" ya existe en la base de datos. No se realizaron cambios.');
        } else {
            console.error('❌ Error al crear el usuario administrador:', error);
        }
        process.exit(1);
    }
};

seedAdmin();
