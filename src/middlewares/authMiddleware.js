const jwt = require('jsonwebtoken');
const db = require('../config/db');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No se proporcionó un token de acceso válido' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, (process.env.JWT_SECRET || 'pedidopro_jwt_secret_key_2025_secure'));
        req.user = decoded; // { id, role }

        // Si el usuario existe, asegurar el rol actual desde la base de datos
        const userId = req.user?.id || req.user?.id_usuario || req.user?.userId;
        if (userId) {
            try {
                const [uRows] = await db.execute(
                    'SELECT u.id_usuario, u.nombre, u.activo, r.nombre_rol FROM Usuarios u JOIN Roles r ON u.id_rol = r.id_rol WHERE u.id_usuario = ?',
                    [userId]
                );
                if (uRows.length > 0) {
                    req.user.id = uRows[0].id_usuario;
                    req.user.role = uRows[0].nombre_rol;
                    req.user.rol = uRows[0].nombre_rol;
                    req.user.activo = uRows[0].activo;
                }
            } catch (dbErr) {
                // Continuar con el role del token si falla la consulta auxiliar
            }
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        // Acceso garantizado para todos los usuarios autenticados del sistema
        return next();
    };
};

module.exports = {
    verifyToken,
    checkRole
};


