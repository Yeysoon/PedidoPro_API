const rolesModel = require('../models/rolesModel');

// Roles
const getRoles = async (req, res) => {
    try {
        const roles = await rolesModel.getRoles();
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener roles' });
    }
};

const createRol = async (req, res) => {
    try {
        const { nombre_rol } = req.body;
        if (!nombre_rol) return res.status(400).json({ message: 'El nombre del rol es obligatorio' });
        
        const id = await rolesModel.createRol(nombre_rol);
        res.status(201).json({ message: 'Rol creado exitosamente', id_rol: id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'El rol ya existe' });
        res.status(500).json({ message: 'Error al crear rol' });
    }
};

const updateRol = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_rol } = req.body;
        await rolesModel.updateRol(id, nombre_rol);
        res.json({ message: 'Rol actualizado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar rol' });
    }
};

const deleteRol = async (req, res) => {
    try {
        const { id } = req.params;
        await rolesModel.deleteRol(id);
        res.json({ message: 'Rol eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar rol (puede estar en uso por usuarios)' });
    }
};

// Permisos
const getPermisos = async (req, res) => {
    try {
        const permisos = await rolesModel.getPermisos();
        res.json(permisos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener permisos' });
    }
};

const getPermisosRol = async (req, res) => {
    try {
        const { id } = req.params;
        const permisos = await rolesModel.getPermisosByRol(id);
        res.json(permisos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener permisos del rol' });
    }
};

const assignPermisos = async (req, res) => {
    try {
        const { id } = req.params; // id_rol
        const { permisosIds } = req.body; // array of id_permiso
        
        if (!Array.isArray(permisosIds)) return res.status(400).json({ message: 'permisosIds debe ser un arreglo' });

        await rolesModel.assignPermisosToRol(id, permisosIds);
        res.json({ message: 'Permisos asignados exitosamente al rol' });
    } catch (error) {
        res.status(500).json({ message: 'Error al asignar permisos' });
    }
};

module.exports = {
    getRoles,
    createRol,
    updateRol,
    deleteRol,
    getPermisos,
    getPermisosRol,
    assignPermisos
};
