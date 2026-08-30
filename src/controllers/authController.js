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
        res.status(500).json({ message: 'Error del servidor: ' + error.message, error: error.stack });
    }
};

const changeMyPassword = async (req, res) => {
    try {
        const { password_actual, nueva_password } = req.body;
        const id_usuario = req.user.id;

        if (!password_actual || !nueva_password || nueva_password.length < 6) {
            return res.status(400).json({ message: 'Se requiere la contrasea actual y la nueva debe tener al menos 6 caracteres' });
        }

        const user = await authModel.getUserByIdForAuth(id_usuario);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const isMatch = await bcrypt.compare(password_actual, user.contrasena_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'La contrasea actual es incorrecta' });
        }

        const usuarioModel = require('../models/usuarioModel');
        await usuarioModel.updatePassword(id_usuario, nueva_password);

        res.json({ message: 'Contrasea cambiada exitosamente' });
    } catch (error) {
        console.error('Error al cambiar mi contrasea:', error);
        res.status(500).json({ message: 'Error del servidor: ' + error.message });
    }
};

module.exports = {
    login,
    changeMyPassword
};



