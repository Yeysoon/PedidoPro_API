const pedidoModel = require('../models/pedidoModel');

const createPedido = async (req, res) => {
    try {
        const { id_mesa, notas_generales, detalles } = req.body;
        const id_usuario_mesero = req.user.id; // Obtenido del token JWT

        if (!id_mesa || !detalles || !detalles.length) {
            return res.status(400).json({ message: 'Mesa y detalles del pedido son obligatorios' });
        }

        const id_pedido = await pedidoModel.createPedido(id_mesa, id_usuario_mesero, notas_generales, detalles);
        res.status(201).json({ message: 'Pedido creado exitosamente', id_pedido });
    } catch (error) {
        console.error('Error al crear pedido:', error);
        res.status(500).json({ message: error.message || 'Error del servidor al crear pedido' });
    }
};

const getCuentaMesa = async (req, res) => {
    try {
        const { id } = req.params;
        const cuenta = await pedidoModel.getCuentaMesa(id);
        
        let total = 0;
        cuenta.forEach(item => {
            total += Number(item.subtotal);
        });

        res.json({ cuenta, total });
    } catch (error) {
        console.error('Error al obtener cuenta de la mesa:', error);
        res.status(500).json({ message: 'Error del servidor al obtener cuenta' });
    }
};

const cancelPedido = async (req, res) => {
    try {
        const { id } = req.params;
        await pedidoModel.cancelPedido(id);
        res.json({ message: 'Pedido cancelado y recursos liberados exitosamente' });
    } catch (error) {
        console.error('Error al cancelar pedido:', error);
        res.status(400).json({ message: error.message || 'Error al cancelar pedido' });
    }
};

module.exports = {
    createPedido,
    getCuentaMesa,
    cancelPedido
};
