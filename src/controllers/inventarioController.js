const inventarioModel = require('../models/inventarioModel');

// Ingredientes
const getIngredientes = async (req, res) => {
    try {
        const ingredientes = await inventarioModel.getIngredientes();
        res.json(ingredientes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener ingredientes' });
    }
};

const createIngrediente = async (req, res) => {
    try {
        const { nombre_ingrediente, unidad_medida, stock_actual } = req.body;
        if (!nombre_ingrediente || !unidad_medida) {
            return res.status(400).json({ message: 'Nombre y unidad de medida son obligatorios' });
        }
        const id = await inventarioModel.createIngrediente({ nombre_ingrediente, unidad_medida, stock_actual });
        res.status(201).json({ message: 'Ingrediente creado', id_ingrediente: id });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear ingrediente' });
    }
};

const updateIngrediente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_ingrediente, unidad_medida, stock_actual } = req.body;
        await inventarioModel.updateIngrediente(id, { nombre_ingrediente, unidad_medida, stock_actual });
        res.json({ message: 'Ingrediente actualizado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar ingrediente' });
    }
};

const deleteIngrediente = async (req, res) => {
    try {
        const { id } = req.params;
        await inventarioModel.deleteIngrediente(id);
        res.json({ message: 'Ingrediente eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar ingrediente' });
    }
};

// Recetas
const getReceta = async (req, res) => {
    try {
        const { id_producto } = req.params;
        const receta = await inventarioModel.getRecetaProducto(id_producto);
        res.json(receta);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener receta' });
    }
};

const saveReceta = async (req, res) => {
    try {
        const { id_producto } = req.params;
        const { ingredientes } = req.body; // Array de { id_ingrediente, cantidad_necesaria }

        if (!Array.isArray(ingredientes)) {
            return res.status(400).json({ message: 'ingredientes debe ser un array' });
        }

        await inventarioModel.saveRecetaProducto(id_producto, ingredientes);
        res.json({ message: 'Receta guardada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar receta' });
    }
};

module.exports = {
    getIngredientes,
    createIngrediente,
    updateIngrediente,
    deleteIngrediente,
    getReceta,
    saveReceta
};
