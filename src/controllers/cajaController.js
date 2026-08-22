const cajaModel = require('../models/cajaModel');

const getPedidosListos = async (req, res) => {
    try {
        const pedidos = await cajaModel.getPedidosListos();
        res.json(pedidos);
    } catch (error) {
        console.error('Error al obtener pedidos listos:', error);
        res.status(500).json({ message: 'Error del servidor al obtener pedidos listos' });
    }
};

const facturar = async (req, res) => {
    try {
        const { id_pedido, id_cliente, id_metodo_pago, propina } = req.body;
        const id_usuario_cajero = req.user.id;

        if (!id_pedido || !id_metodo_pago) {
            return res.status(400).json({ message: 'Pedido y método de pago son obligatorios' });
        }

        const id_factura = await cajaModel.facturarPedido({
            id_pedido,
            id_cliente,
            id_usuario_cajero,
            id_metodo_pago,
            propina
        });

        res.status(201).json({ message: 'Facturación procesada exitosamente', id_factura });
    } catch (error) {
        console.error('Error al facturar:', error);
        res.status(500).json({ message: error.message || 'Error del servidor al procesar facturación' });
    }
};

const anularFactura = async (req, res) => {
    try {
        const { id } = req.params;
        await cajaModel.anularFactura(id);
        res.json({ message: 'Factura anulada exitosamente. El pedido ha vuelto a estado "Listo" y la mesa está "Ocupada".' });
    } catch (error) {
        console.error('Error al anular factura:', error);
        res.status(500).json({ message: error.message || 'Error al anular la factura' });
    }
};


const getFacturas = async (req, res) => {
    try {
        const { fechaInicio, fechaFin, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const result = await cajaModel.getFacturas(fechaInicio, fechaFin, pageNum, limitNum);
        const total_paginas = Math.ceil(result.total_registros / limitNum);
        res.json({
            data: result.data,
            meta: { total_registros: result.total_registros, total_paginas, pagina_actual: pageNum, limite_por_pagina: limitNum }
        });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({ message: 'Error al obtener facturas' });
    }
};

const getFacturaById = async (req, res) => {
    try {
        const { id } = req.params;
        const factura = await cajaModel.getFacturaById(id);
        if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });
        res.json(factura);
    } catch (error) {
        console.error('Error al obtener factura:', error);
        res.status(500).json({ message: 'Error al obtener factura' });
    }
};
module.exports = {
    getPedidosListos,
    facturar,
    anularFactura,
    getFacturas,
    getFacturaById
};

