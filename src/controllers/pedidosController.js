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


const getPedidos = async (req, res) => {
    try {
        const { estado, fechaInicio, fechaFin, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const result = await pedidoModel.getAllPedidos(estado, fechaInicio, fechaFin, pageNum, limitNum);
        const total_paginas = Math.ceil(result.total_registros / limitNum);
        res.json({
            data: result.data,
            meta: { total_registros: result.total_registros, total_paginas, pagina_actual: pageNum, limite_por_pagina: limitNum }
        });
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({ message: 'Error al obtener pedidos' });
    }
};

const getPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const pedido = await pedidoModel.getPedidoById(id);
        if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });
        res.json(pedido);
    } catch (error) {
        console.error('Error al obtener pedido:', error);
        res.status(500).json({ message: 'Error al obtener pedido' });
    }
};
module.exports = {
    createPedido,
    getCuentaMesa,
    cancelPedido,
    getPedidos,
    getPedido
};

