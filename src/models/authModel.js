const db = require('../config/db');

const getUserByEmail = async (email) => {
    const query = `
        SELECT u.*, r.nombre_rol 
        FROM Usuarios u
        JOIN Roles r ON u.id_rol = r.id_rol
        WHERE u.email = ? AND u.activo = 1
    `;
    const [rows] = await db.execute(query, [email]);
    return rows[0];
};

module.exports = {
    getUserByEmail
};
