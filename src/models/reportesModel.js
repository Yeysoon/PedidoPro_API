const db = require('../config/db');

const getVentasTotales = async (fechaInicio, fechaFin, limit, offset) => {
    // 1. Obtener los datos paginados
    const query = `
        SELECT DATE(fecha_hora_pago) as fecha, SUM(total_pagado) as total_ventas, COUNT(id_factura) as cantidad_pedidos
        FROM Facturas_Pagos
        WHERE DATE(fecha_hora_pago) BETWEEN ? AND ?
        GROUP BY DATE(fecha_hora_pago)
        ORDER BY fecha DESC
        LIMIT ? OFFSET ?
    `;
    const [rows] = await db.execute(query, [fechaInicio, fechaFin, limit.toString(), offset.toString()]);
    
    // 2. Obtener el total de registros para calcular las páginas
    const countQuery = `
        SELECT COUNT(DISTINCT DATE(fecha_hora_pago)) as total_rows
        FROM Facturas_Pagos
        WHERE DATE(fecha_hora_pago) BETWEEN ? AND ?
    `;
    const [countRows] = await db.execute(countQuery, [fechaInicio, fechaFin]);
    const total_registros = countRows[0].total_rows;

    return {
        data: rows,
        total_registros
    };
};

const getProductosMasVendidos = async () => {
    const query = `
        SELECT p.nombre_producto, SUM(dp.cantidad) as total_vendido
        FROM Detalle_Pedido dp
        JOIN Productos p ON dp.id_producto = p.id_producto
        JOIN Pedidos ped ON dp.id_pedido = ped.id_pedido
        JOIN Estados_Pedido ep ON ped.id_estado = ep.id_estado
        WHERE ep.nombre_estado = 'Servido'
        GROUP BY p.id_producto
        ORDER BY total_vendido DESC
        LIMIT 10
    `;
    const [rows] = await db.execute(query);
    return rows;
};

module.exports = {
    getVentasTotales,
    getProductosMasVendidos
};
