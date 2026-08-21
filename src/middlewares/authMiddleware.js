const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No se proporcionÃ³ un token de acceso vÃ¡lido' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, (process.env.JWT_SECRET || 'pedidopro_jwt_secret_key_2025_secure'));
        req.user = decoded; // { id, role }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invÃ¡lido o expirado' });
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    checkRole
};

