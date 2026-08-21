const db = require('../config/db');
const bcrypt = require('bcryptjs');

const getAllUsuarios = async () => {
    const query = `
        SELECT u.id_usuario, u.nombre, u.email, u.activo, r.nombre_rol 
        FROM Usuarios u
        JOIN Roles r ON u.id_rol = r.id_rol
    `;
    const [rows] = await db.execute(query);
    return rows;
};

const getUsuarioById = async (id) => {
    const query = `
        SELECT u.id_usuario, u.nombre, u.email, u.activo, r.nombre_rol, u.id_rol
        FROM Usuarios u
        JOIN Roles r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
};

const createUsuario = async (usuario) => {
    const { id_rol, nombre, email, password } = usuario;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const query = `
        INSERT INTO Usuarios (id_rol, nombre, email, contrasena_hash, activo)
        VALUES (?, ?, ?, ?, 1)
    `;
    const [result] = await db.execute(query, [id_rol, nombre, email, hash]);
    return result.insertId;
};

const updateUsuario = async (id, usuario) => {
    const { id_rol, nombre, email } = usuario;
    const query = `
        UPDATE Usuarios 
        SET id_rol = ?, nombre = ?, email = ?
        WHERE id_usuario = ?
    `;
    const [result] = await db.execute(query, [id_rol, nombre, email, id]);
    return result;
};

const updatePassword = async (id, newPassword) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    const query = `UPDATE Usuarios SET contrasena_hash = ? WHERE id_usuario = ?`;
    const [result] = await db.execute(query, [hash, id]);
    return result;
};

const toggleActivo = async (id, activo) => {
    const query = `UPDATE Usuarios SET activo = ? WHERE id_usuario = ?`;
    const [result] = await db.execute(query, [activo, id]);
    return result;
};

module.exports = {
    getAllUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    updatePassword,
    toggleActivo
};
