const db = require('../config/db');

// CRUD Roles
const getRoles = async () => {
    const query = `SELECT * FROM Roles`;
    const [rows] = await db.execute(query);
    return rows;
};

const createRol = async (nombre_rol) => {
    const query = `INSERT INTO Roles (nombre_rol) VALUES (?)`;
    const [result] = await db.execute(query, [nombre_rol]);
    return result.insertId;
};

const updateRol = async (id, nombre_rol) => {
    const query = `UPDATE Roles SET nombre_rol = ? WHERE id_rol = ?`;
    const [result] = await db.execute(query, [nombre_rol, id]);
    return result;
};

const deleteRol = async (id) => {
    const query = `DELETE FROM Roles WHERE id_rol = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

// Permisos
const getPermisos = async () => {
    const query = `SELECT * FROM Permisos`;
    const [rows] = await db.execute(query);
    return rows;
};

const getPermisosByRol = async (id_rol) => {
    const query = `
        SELECT p.id_permiso, p.nombre_permiso, p.descripcion
        FROM Permisos p
        JOIN Rol_Permisos rp ON p.id_permiso = rp.id_permiso
        WHERE rp.id_rol = ?
    `;
    const [rows] = await db.execute(query, [id_rol]);
    return rows;
};

const assignPermisosToRol = async (id_rol, permisosIds) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Borrar permisos anteriores
        await connection.execute(`DELETE FROM Rol_Permisos WHERE id_rol = ?`, [id_rol]);

        // Insertar nuevos permisos
        for (const id_permiso of permisosIds) {
            await connection.execute(
                `INSERT INTO Rol_Permisos (id_rol, id_permiso) VALUES (?, ?)`,
                [id_rol, id_permiso]
            );
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    getRoles,
    createRol,
    updateRol,
    deleteRol,
    getPermisos,
    getPermisosByRol,
    assignPermisosToRol
};
