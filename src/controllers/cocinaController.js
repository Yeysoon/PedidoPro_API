const cocinaModel = require('../models/cocinaModel');

const getComandas = async (req, res) => {
    try {
        const comandas = await cocinaModel.getComandasPendientes();
        res.json(comandas);
    } catch (error) {
        console.error('Error al obtener comandas:', error);
        res.status(500).json({ message: 'Error del servidor al obtener comandas' });
    }
};

const updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body; // Ej: 'Listo', 'En Preparación'

        const validEstados = ['Pendiente', 'En Preparación', 'Listo'];
        if (!validEstados.includes(estado)) {
            return res.status(400).json({ message: 'Estado inválido para cocina' });
        }

        const result = await cocinaModel.updateEstadoComanda(id, estado);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        res.json({ message: 'Estado de la comanda actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar estado de comanda:', error);
        res.status(500).json({ message: error.message || 'Error del servidor al actualizar estado' });
    }
};

module.exports = {
    getComandas,
    updateEstado
};

