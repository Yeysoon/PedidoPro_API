const usuarioModel = require('../models/usuarioModel');

const getUsuarios = async (req, res) => {
    try {
        const usuarios = await usuarioModel.getAllUsuarios();
        res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error del servidor al obtener usuarios' });
    }
};

const getUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await usuarioModel.getUsuarioById(id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};

const createUsuario = async (req, res) => {
    try {
        const { id_rol, nombre, email, password } = req.body;
        if (!id_rol || !nombre || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const id = await usuarioModel.createUsuario({ id_rol, nombre, email, password });
        res.status(201).json({ message: 'Usuario creado exitosamente', id_usuario: id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El correo electrÃ³nico ya estÃ¡ registrado' });
        }
        res.status(500).json({ message: 'Error al crear usuario' });
    }
};

const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_rol, nombre, email, password } = req.body;
        
        await usuarioModel.updateUsuario(id, { id_rol, nombre, email });
        
        if (password) {
            await usuarioModel.updatePassword(id, password);
        }
        
        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};

const toggleUser = async (req, res) => {
    try {
        const { id } = req.params;
        let { activo } = req.body;
        if (activo === undefined) {
            const user = await usuarioModel.getUsuarioById(id);
            if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
            activo = user.activo ? 0 : 1;
        } else {
            activo = activo ? 1 : 0;
        }
        await usuarioModel.toggleActivo(id, activo);
        res.json({ message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`, activo: !!activo });
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({ message: 'Error al cambiar estado del usuario' });
    }
};


const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { nueva_password } = req.body;
        if (!nueva_password || nueva_password.length < 6) {
            return res.status(400).json({ message: 'La nueva contrasena debe tener al menos 6 caracteres' });
        }
        await usuarioModel.updatePassword(id, nueva_password);
        res.json({ message: 'Contrasena actualizada exitosamente' });
    } catch (error) {
        console.error('Error al cambiar contrasena:', error);
        res.status(500).json({ message: 'Error al cambiar contrasena' });
    }
};
module.exports = {
    getUsuarios,
    getUsuario,
    createUsuario,
    updateUsuario,
    toggleUser,
    changePassword
};

