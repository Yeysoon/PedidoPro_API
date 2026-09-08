const db = require('../config/db');

const getPedidosListos = async () => {
    const query = `
        SELECT p.id_pedido, p.fecha_hora_creacion, p.notas_generales, m.numero_mesa, m.id_mesa, ep.nombre_estado, ep.id_estado,
               u.nombre AS mesero_nombre, p.id_cliente,
               c.nombre_completo AS cliente_nombre, c.nit_documento AS cliente_nit,
               dp.id_detalle, dp.id_producto, prod.nombre_producto, dp.cantidad, dp.precio_unitario_historico, dp.notas_especiales,
               (dp.cantidad * dp.precio_unitario_historico) AS subtotal_item
        FROM Pedidos p
        JOIN Mesas m ON p.id_mesa = m.id_mesa
        JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
        LEFT JOIN Usuarios u ON p.id_usuario_mesero = u.id_usuario
        LEFT JOIN Clientes c ON p.id_cliente = c.id_cliente
        LEFT JOIN Detalle_Pedido dp ON p.id_pedido = dp.id_pedido
        LEFT JOIN Productos prod ON dp.id_producto = prod.id_producto
        WHERE (ep.nombre_estado IN ('Servido', 'Listo') OR ep.id_estado IN (3, 4))
          AND p.id_pedido NOT IN (SELECT id_pedido FROM Facturas_Pagos)
        ORDER BY p.fecha_hora_creacion ASC
    `;
    const [rows] = await db.execute(query);
    
    const pedidosMap = new Map();
    rows.forEach(row => {
        if (!pedidosMap.has(row.id_pedido)) {
            pedidosMap.set(row.id_pedido, {
                id_pedido: row.id_pedido,
                fecha_hora_creacion: row.fecha_hora_creacion,
                notas_generales: row.notas_generales,
                numero_mesa: row.numero_mesa,
                id_mesa: row.id_mesa,
                nombre_estado: row.nombre_estado,
                estado: row.nombre_estado,
                id_estado: Number(row.id_estado),
                mesero: row.mesero_nombre,
                id_cliente: row.id_cliente,
                cliente_nombre: row.cliente_nombre,
                cliente_nit: row.cliente_nit,
                detalles: [],
                total_estimado: 0
            });
        }
        if (row.id_detalle && row.nombre_producto) {
            const pedido = pedidosMap.get(row.id_pedido);
            const subtotal = Number(row.subtotal_item || (row.cantidad * row.precio_unitario_historico) || 0);
            pedido.detalles.push({
                id_detalle: row.id_detalle,
                id_producto: row.id_producto,
                nombre_producto: row.nombre_producto,
                cantidad: Number(row.cantidad) || 1,
                precio_unitario_historico: Number(row.precio_unitario_historico) || 0,
                subtotal: subtotal,
                notas_especiales: row.notas_especiales
            });
            pedido.total_estimado += subtotal;
        }
    });

    return Array.from(pedidosMap.values());
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

        // 3. Obtener id_estado de 'Cobrado'
        const [estadoRows] = await connection.execute(`SELECT id_estado FROM Estados_Pedido WHERE nombre_estado = 'Cobrado'`);
        const id_estado_cobrado = estadoRows.length ? estadoRows[0].id_estado : 6;

        // 4. Actualizar estado del pedido a 'Cobrado'
        await connection.execute(`UPDATE Pedidos SET id_estado = ? WHERE id_pedido = ?`, [id_estado_cobrado, id_pedido]);

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

        // Obtener estado 'Servido'
        const [estadoRows] = await connection.execute(`SELECT id_estado FROM Estados_Pedido WHERE nombre_estado = 'Servido'`);
        const id_estado_servido = estadoRows.length ? estadoRows[0].id_estado : 4;

        // Revertir el estado del pedido a 'Servido'
        await connection.execute(`UPDATE Pedidos SET id_estado = ? WHERE id_pedido = ?`, [id_estado_servido, id_pedido]);

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


// GET historial de facturas con filtros y paginacion
const getFacturas = async (fechaInicio, fechaFin, page, limit) => {
    const offset = (page - 1) * limit;
    let whereClause = '1=1';
    const params = [];

    if (fechaInicio && fechaFin) {
        whereClause += ' AND DATE(f.fecha_hora_pago) BETWEEN ? AND ?';
        params.push(fechaInicio, fechaFin);
    }

    const dataQuery = `SELECT f.id_factura, f.fecha_hora_pago, f.subtotal, f.impuestos, f.propina, f.total_pagado, mp.nombre_metodo AS metodo_pago, c.nombre_completo AS cliente, u.nombre AS cajero, m.numero_mesa FROM Facturas_Pagos f JOIN Metodos_Pago mp ON f.id_metodo_pago = mp.id_metodo_pago JOIN Pedidos p ON f.id_pedido = p.id_pedido JOIN Mesas m ON p.id_mesa = m.id_mesa JOIN Usuarios u ON f.id_usuario_cajero = u.id_usuario LEFT JOIN Clientes c ON f.id_cliente = c.id_cliente WHERE ${whereClause} ORDER BY f.fecha_hora_pago DESC LIMIT ? OFFSET ?`;
    const dataParams = [...params, limit.toString(), offset.toString()];
    const [rows] = await db.execute(dataQuery, dataParams);

    const countQuery = `SELECT COUNT(*) as total FROM Facturas_Pagos f WHERE ${whereClause}`;
    const [countRows] = await db.execute(countQuery, params);

    return { data: rows, total_registros: countRows[0].total };
};

// GET detalle de una factura por ID
const getFacturaById = async (id_factura) => {
    const [facturaRows] = await db.execute(`SELECT f.id_factura, f.fecha_hora_pago, f.subtotal, f.impuestos, f.propina, f.total_pagado, mp.nombre_metodo AS metodo_pago, c.nombre_completo AS cliente, u.nombre AS cajero, m.numero_mesa, f.id_pedido FROM Facturas_Pagos f JOIN Metodos_Pago mp ON f.id_metodo_pago = mp.id_metodo_pago JOIN Pedidos p ON f.id_pedido = p.id_pedido JOIN Mesas m ON p.id_mesa = m.id_mesa JOIN Usuarios u ON f.id_usuario_cajero = u.id_usuario LEFT JOIN Clientes c ON f.id_cliente = c.id_cliente WHERE f.id_factura = ?`, [id_factura]);
    if (facturaRows.length === 0) return null;

    const [detalleRows] = await db.execute(`SELECT dp.cantidad, dp.precio_unitario_historico, (dp.cantidad * dp.precio_unitario_historico) AS subtotal, prod.nombre_producto FROM Detalle_Pedido dp JOIN Productos prod ON dp.id_producto = prod.id_producto WHERE dp.id_pedido = ?`, [facturaRows[0].id_pedido]);

    return { ...facturaRows[0], detalle_productos: detalleRows };
};
module.exports = {
    getPedidosListos,
    facturarPedido,
    anularFactura,
    getFacturas,
    getFacturaById
};

