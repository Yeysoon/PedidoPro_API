const db = require('../config/db');

const getVentasTotales = async (fechaInicio, fechaFin, limit, offset) => {
    let whereClause = '';
    const params = [];

    if (fechaInicio && fechaFin) {
        whereClause = 'WHERE DATE(fecha_hora_pago) BETWEEN ? AND ?';
        params.push(fechaInicio, fechaFin);
    }

    let query = `
        SELECT DATE_FORMAT(fecha_hora_pago, '%Y-%m-%d') as fecha, 
               CAST(SUM(total_pagado) AS DECIMAL(10,2)) as total_ventas, 
               COUNT(id_factura) as cantidad_facturas,
               COUNT(id_factura) as cantidad_pedidos
        FROM Facturas_Pagos
        ${whereClause}
        GROUP BY DATE_FORMAT(fecha_hora_pago, '%Y-%m-%d')
        ORDER BY fecha ASC
    `;

    if (limit && offset !== undefined) {
        query += ' LIMIT ? OFFSET ?';
        params.push(limit.toString(), offset.toString());
    }

    const [rows] = await db.execute(query, params);
    
    // 2. Obtener el total de registros
    const countQuery = `
        SELECT COUNT(DISTINCT DATE_FORMAT(fecha_hora_pago, '%Y-%m-%d')) as total_rows
        FROM Facturas_Pagos
        ${whereClause}
    `;
    const countParams = fechaInicio && fechaFin ? [fechaInicio, fechaFin] : [];
    const [countRows] = await db.execute(countQuery, countParams);
    const total_registros = countRows[0]?.total_rows || 0;

    return {
        data: rows,
        total_registros
    };
};

const getProductosMasVendidos = async () => {
    const query = `
        SELECT p.nombre_producto, CAST(SUM(dp.cantidad) AS SIGNED) as total_vendido
        FROM Detalle_Pedido dp
        JOIN Productos p ON dp.id_producto = p.id_producto
        JOIN Pedidos ped ON dp.id_pedido = ped.id_pedido
        JOIN Estados_Pedido ep ON ped.id_estado = ep.id_estado
        WHERE ep.nombre_estado = 'Servido'
        GROUP BY p.id_producto, p.nombre_producto
        ORDER BY total_vendido DESC
        LIMIT 10
    `;
    const [rows] = await db.execute(query);
    return rows;
};


// Reporte de estado de inventario
const getReporteInventario = async () => {
    const query = `
        SELECT 
            i.id_ingrediente,
            i.nombre_ingrediente,
            i.unidad_medida,
            i.stock_actual,
            i.stock_minimo,
            CASE 
                WHEN i.stock_actual = 0 THEN 'Agotado'
                WHEN i.stock_actual <= i.stock_minimo THEN 'Stock Bajo'
                ELSE 'Normal'
            END AS estado_stock,
            (SELECT COUNT(*) FROM Recetas_Producto rp WHERE rp.id_ingrediente = i.id_ingrediente) AS usado_en_productos
        FROM Ingredientes i
        ORDER BY i.stock_actual ASC
    `;
    const [rows] = await db.execute(query);

    const total = rows.length;
    const agotados = rows.filter(r => r.estado_stock === 'Agotado').length;
    const stock_bajo = rows.filter(r => r.estado_stock === 'Stock Bajo').length;
    const normales = rows.filter(r => r.estado_stock === 'Normal').length;

    return {
        resumen: { total, agotados, stock_bajo, normales },
        ingredientes: rows
    };
};
module.exports = {
    getVentasTotales,
    getProductosMasVendidos,
    getReporteInventario
};

