const db = require('../config/db');

const getPedidosListos = async () => {
    const query = `
        SELECT p.id_pedido, p.fecha_hora_creacion, m.numero_mesa, ep.nombre_estado,
               (SELECT SUM(dp.cantidad * dp.precio_unitario_historico) 
                FROM Detalle_Pedido dp WHERE dp.id_pedido = p.id_pedido) as total_estimado
        FROM Pedidos p
        JOIN Mesas m ON p.id_mesa = m.id_mesa
        JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
        WHERE ep.nombre_estado = 'Listo'
        ORDER BY p.fecha_hora_creacion ASC
    `;
    const [rows] = await db.execute(query);
    return rows;
};

const facturarPedido = async (facturaData) => {
    const { id_pedido, id_cliente, id_usuario_cajero, id_metodo_pago, propina } = facturaData;
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Obtener subtotal del pedido
        const [detalleRows] = await connection.execute(`
            SELECT SUM(cantidad * precio_unitario_historico) as subtotal
            FROM Detalle_Pedido WHERE id_pedido = ?
        `, [id_pedido]);
        
        const subtotal = detalleRows[0].subtotal || 0;
        const impuestos = subtotal * 0.13; // Ejemplo: 13% de IVA
        const total_pagado = Number(subtotal) + Number(impuestos) + Number(propina || 0);

        // 2. Insertar Factura
        const [facturaResult] = await connection.execute(`
            INSERT INTO Facturas_Pagos (id_pedido, id_cliente, id_usuario_cajero, id_metodo_pago, subtotal, impuestos, total_pagado, propina)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [id_pedido, id_cliente || null, id_usuario_cajero, id_metodo_pago, subtotal, impuestos, total_pagado, propina || 0]);

        // 3. Obtener id_estado de 'Servido'
        const [estadoRows] = await connection.execute(`SELECT id_estado FROM Estados_Pedido WHERE nombre_estado = 'Servido'`);
        const id_estado_servido = estadoRows[0].id_estado;

        // 4. Actualizar estado del pedido a 'Servido'
        await connection.execute(`UPDATE Pedidos SET id_estado = ? WHERE id_pedido = ?`, [id_estado_servido, id_pedido]);

        // 5. Liberar mesa
        const [pedidoRows] = await connection.execute(`SELECT id_mesa FROM Pedidos WHERE id_pedido = ?`, [id_pedido]);
        const id_mesa = pedidoRows[0].id_mesa;
        await connection.execute(`UPDATE Mesas SET estado = 'Libre' WHERE id_mesa = ?`, [id_mesa]);

        await connection.commit();
        return facturaResult.insertId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const anularFactura = async (id_factura) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Obtener el id_pedido de la factura
        const [facturaRows] = await connection.execute(`SELECT id_pedido FROM Facturas_Pagos WHERE id_factura = ?`, [id_factura]);
        if (facturaRows.length === 0) throw new Error("Factura no encontrada.");
        
        const id_pedido = facturaRows[0].id_pedido;

        // Eliminar la factura
        await connection.execute(`DELETE FROM Facturas_Pagos WHERE id_factura = ?`, [id_factura]);

        // Obtener estado 'Listo'
        const [estadoRows] = await connection.execute(`SELECT id_estado FROM Estados_Pedido WHERE nombre_estado = 'Listo'`);
        const id_estado_listo = estadoRows[0].id_estado;

        // Revertir el estado del pedido a 'Listo'
        await connection.execute(`UPDATE Pedidos SET id_estado = ? WHERE id_pedido = ?`, [id_estado_listo, id_pedido]);

        // Obtener id_mesa del pedido y revertirla a 'Ocupada'
        const [pedidoRows] = await connection.execute(`SELECT id_mesa FROM Pedidos WHERE id_pedido = ?`, [id_pedido]);
        const id_mesa = pedidoRows[0].id_mesa;
        await connection.execute(`UPDATE Mesas SET estado = 'Ocupada' WHERE id_mesa = ?`, [id_mesa]);

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
    getPedidosListos,
    facturarPedido,
    anularFactura
};
