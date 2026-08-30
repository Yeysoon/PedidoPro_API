const mesaModel = require('../models/mesaModel');

const getMesas = async (req, res) => {
    try {
        const mesas = await mesaModel.getAllMesas();
        res.json(mesas);
    } catch (error) {
        console.error('Error al obtener mesas:', error);
        res.status(500).json({ message: 'Error del servidor al obtener mesas' });
    }
};

const updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const validEstados = ['Libre', 'Ocupada', 'Reservada', 'Mantenimiento'];
        if (!validEstados.includes(estado)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }

        const result = await mesaModel.updateMesaEstado(id, estado);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Mesa no encontrada' });
        }

        res.json({ message: 'Estado de la mesa actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar mesa:', error);
        res.status(500).json({ message: 'Error del servidor al actualizar mesa' });
    }
};

const createMesa = async (req, res) => {
    try {
        const { id_zona, numero_mesa, capacidad, estado } = req.body;
        if (!id_zona || !numero_mesa || !capacidad) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }
        const id = await mesaModel.createMesa({ id_zona, numero_mesa, capacidad, estado });
        res.status(201).json({ message: 'Mesa creada exitosamente', id_mesa: id });
    } catch (error) {
        console.error('Error al crear mesa:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El número de mesa ya existe' });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
            return res.status(400).json({ message: 'La zona seleccionada no existe' });
        }
        res.status(500).json({ message: error.sqlMessage || 'Error al crear mesa' });
    }
};

const updateMesa = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_zona, numero_mesa, capacidad, estado } = req.body;
        await mesaModel.updateMesa(id, { id_zona, numero_mesa, capacidad, estado });
        res.json({ message: 'Mesa actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar mesa:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El número de mesa ya existe' });
        }
        res.status(500).json({ message: error.sqlMessage || 'Error al actualizar mesa' });
    }
};

const deleteMesa = async (req, res) => {
    try {
        const { id } = req.params;
        await mesaModel.deleteMesa(id);
        res.json({ message: 'Mesa eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar mesa' });
    }
};

// Zonas
const getZonas = async (req, res) => {
    try {
        const zonas = await mesaModel.getAllZonas();
        res.json(zonas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener zonas' });
    }
};

const createZona = async (req, res) => {
    try {
        const { nombre_zona } = req.body;
        if (!nombre_zona) return res.status(400).json({ message: 'El nombre es obligatorio' });
        const id = await mesaModel.createZona(nombre_zona);
        res.status(201).json({ message: 'Zona creada', id_zona: id });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear zona' });
    }
};

const updateZona = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_zona } = req.body;
        await mesaModel.updateZona(id, nombre_zona);
        res.json({ message: 'Zona actualizada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar zona' });
    }
};

const deleteZona = async (req, res) => {
    try {
        const { id } = req.params;
        await mesaModel.deleteZona(id);
        res.json({ message: 'Zona eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar zona (asegúrate de que no tenga mesas asignadas)' });
    }
};

module.exports = {
    getMesas,
    updateEstado,
    createMesa,
    updateMesa,
    deleteMesa,
    getZonas,
    createZona,
    updateZona,
    deleteZona
};
