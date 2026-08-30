const menuModel = require('../models/menuModel');

const getMenu = async (req, res) => {
    try {
        const menu = await menuModel.getMenu();
        res.json(menu);
    } catch (error) {
        console.error('Error al obtener menú:', error);
        res.status(500).json({ message: 'Error del servidor al obtener menú' });
    }
};

const createProducto = async (req, res) => {
    try {
        const { id_categoria, nombre_producto, descripcion, precio, disponible } = req.body;

        if (!id_categoria || !nombre_producto || !precio) {
            return res.status(400).json({ message: 'Categoría, nombre y precio son obligatorios' });
        }

        const result = await menuModel.createProducto({ id_categoria, nombre_producto, descripcion, precio, disponible });
        res.status(201).json({ message: 'Producto creado exitosamente', id_producto: result.insertId });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ message: 'Error del servidor al crear producto' });
    }
};

const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_categoria, nombre_producto, descripcion, precio, disponible } = req.body;
        await menuModel.updateProducto(id, { id_categoria, nombre_producto, descripcion, precio, disponible });
        res.json({ message: 'Producto actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar producto' });
    }
};

const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;
        await menuModel.deleteProducto(id);
        res.json({ message: 'Producto desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar producto' });
    }
};

// Categorias
const getCategorias = async (req, res) => {
    try {
        const categorias = await menuModel.getCategorias();
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener categorias' });
    }
};

const createCategoria = async (req, res) => {
    try {
        const { nombre_categoria } = req.body;
        if (!nombre_categoria) return res.status(400).json({ message: 'El nombre es obligatorio' });
        const id = await menuModel.createCategoria(nombre_categoria);
        res.status(201).json({ message: 'Categoria creada', id_categoria: id });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear categoria' });
    }
};

const updateCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_categoria } = req.body;
        await menuModel.updateCategoria(id, nombre_categoria);
        res.json({ message: 'Categoria actualizada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar categoria' });
    }
};

const deleteCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        await menuModel.deleteCategoria(id);
        res.json({ message: 'Categoria eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar categoria (asegúrate de que no tenga productos asociados)' });
    }
};

module.exports = {
    getMenu,
    createProducto,
    updateProducto,
    deleteProducto,
    getCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria
};

