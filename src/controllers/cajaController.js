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

module.exports = {
    getPedidosListos,
    facturar,
    anularFactura
};
