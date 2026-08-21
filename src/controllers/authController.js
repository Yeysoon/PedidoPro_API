const authModel = require('../models/authModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseÃ±a son obligatorios' });
        }

        const user = await authModel.getUserByEmail(email);

        if (!user) {
            return res.status(401).json({ message: 'Credenciales invÃ¡lidas' });
        }

        const isMatch = await bcrypt.compare(password, user.contrasena_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales invÃ¡lidas' });
        }

        const payload = {
            id: user.id_usuario,
            role: user.nombre_rol
        };

        const token = jwt.sign(payload, (process.env.JWT_SECRET || 'pedidopro_jwt_secret_key_2025_secure'), { expiresIn: '8h' });

        res.json({
            message: 'AutenticaciÃ³n exitosa',
            token,
            user: {
                id: user.id_usuario,
                nombre: user.nombre,
                email: user.email,
                rol: user.nombre_rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

module.exports = {
    login
};

