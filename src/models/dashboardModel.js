const db = require('../config/db');

// Helper para filtrar por período del calendario actual
const getPeriodCondition = (period, column = 'fecha_hora_pago') => {
    if (period === 'weekly') {
        return `YEARWEEK(${column}, 1) = YEARWEEK(CURDATE(), 1)`;
    } else if (period === 'yearly') {
        return `YEAR(${column}) = YEAR(CURDATE())`;
    } else {
        // Mensual por defecto (mes y año actual)
        return `YEAR(${column}) = YEAR(CURDATE()) AND MONTH(${column}) = MONTH(CURDATE())`;
    }
};

const getAdminStats = async (period = 'monthly') => {
    const periodWhereFP = getPeriodCondition(period, 'fp.fecha_hora_pago');
    const periodWhereStandalone = getPeriodCondition(period, 'fecha_hora_pago');
    const periodWherePed = getPeriodCondition(period, 'ped.fecha_hora_creacion');
    const periodWhereP = getPeriodCondition(period, 'p.fecha_hora_creacion');

    // 1. Métricas generales / KPIs
    const [ventasHoyRows] = await db.execute(`SELECT COALESCE(SUM(total_pagado), 0) AS ventas_hoy FROM Facturas_Pagos WHERE DATE(fecha_hora_pago) = CURDATE()`);
    const [ventasPeriodoRows] = await db.execute(`SELECT COALESCE(SUM(total_pagado), 0) AS ventas_periodo, COUNT(id_factura) as facturas_periodo FROM Facturas_Pagos WHERE ${periodWhereStandalone}`);
    const [pedidosRows] = await db.execute(`SELECT COUNT(*) as pedidos_activos FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE ep.nombre_estado IN ('Pendiente', 'En Preparación', 'Listo')`);
    const [mesasOcupadasRows] = await db.execute(`SELECT COUNT(*) as mesas_ocupadas FROM Mesas WHERE estado = 'Ocupada'`);
    const [mesasLibresRows] = await db.execute(`SELECT COUNT(*) as mesas_libres FROM Mesas WHERE estado = 'Libre'`);
    const [mesasTotalRows] = await db.execute(`SELECT COUNT(*) as total_mesas FROM Mesas`);
    const [alertasRows] = await db.execute(`SELECT COUNT(*) as alertas_inventario FROM Ingredientes WHERE stock_actual <= 10`);

    // 2. Gráfica de Ventas e Ingresos (serie temporal según período)
    let timeGroupFormat = '%Y-%m-%d';
    if (period === 'yearly') {
        timeGroupFormat = '%Y-%m';
    }
    const [chartRows] = await db.execute(`
        SELECT DATE_FORMAT(fecha_hora_pago, '${timeGroupFormat}') as fecha,
               CAST(COALESCE(SUM(total_pagado), 0) AS DECIMAL(10,2)) as total_ventas,
               COUNT(id_factura) as cantidad_facturas
        FROM Facturas_Pagos
        WHERE ${periodWhereStandalone}
        GROUP BY DATE_FORMAT(fecha_hora_pago, '${timeGroupFormat}')
        ORDER BY fecha ASC
    `);

    // 3. Mix de Facturación por Categoría
    const [mixRows] = await db.execute(`
        SELECT 
            c.id_categoria,
            c.nombre_categoria,
            CAST(COALESCE(SUM(dp.cantidad * dp.precio_unitario_historico), 0) AS DECIMAL(10,2)) AS total_categoria,
            CAST(COALESCE(SUM(dp.cantidad), 0) AS SIGNED) AS cantidad_vendida
        FROM Categorias_Menu c
        JOIN Productos p ON c.id_categoria = p.id_categoria
        JOIN Detalle_Pedido dp ON p.id_producto = dp.id_producto
        JOIN Pedidos ped ON dp.id_pedido = ped.id_pedido
        JOIN Estados_Pedido ep ON ped.id_estado = ep.id_estado
        LEFT JOIN Facturas_Pagos fp ON ped.id_pedido = fp.id_pedido
        WHERE ep.nombre_estado != 'Cancelado' AND (${periodWhereFP} OR fp.id_factura IS NULL)
        GROUP BY c.id_categoria, c.nombre_categoria
        HAVING total_categoria > 0
        ORDER BY total_categoria DESC
    `);

    const totalMixSales = mixRows.reduce((acc, curr) => acc + Number(curr.total_categoria), 0);
    const mixFacturacion = mixRows.map(m => {
        const total = Number(m.total_categoria);
        const pct = totalMixSales > 0 ? Math.round((total / totalMixSales) * 100) : 0;
        return {
            id_categoria: m.id_categoria,
            nombre_categoria: m.nombre_categoria,
            total_categoria: total,
            cantidad_vendida: Number(m.cantidad_vendida),
            porcentaje: pct
        };
    });

    // 4. Platillos Más Pedidos en el período seleccionado (Top 5)
    const [topDishesRows] = await db.execute(`
        SELECT 
            p.id_producto,
            p.nombre_producto,
            c.nombre_categoria,
            CAST(SUM(dp.cantidad) AS SIGNED) as total_vendido,
            CAST(SUM(dp.cantidad * dp.precio_unitario_historico) AS DECIMAL(10,2)) as total_ingresos
        FROM Detalle_Pedido dp
        JOIN Productos p ON dp.id_producto = p.id_producto
        JOIN Categorias_Menu c ON p.id_categoria = c.id_categoria
        JOIN Pedidos ped ON dp.id_pedido = ped.id_pedido
        JOIN Estados_Pedido ep ON ped.id_estado = ep.id_estado
        WHERE ep.nombre_estado != 'Cancelado' AND ${periodWherePed}
        GROUP BY p.id_producto, p.nombre_producto, c.nombre_categoria
        ORDER BY total_vendido DESC
        LIMIT 5
    `);

    // 5. Actividad Reciente de Comandas en el período seleccionado
    const [recentOrdersRows] = await db.execute(`
        SELECT 
            p.id_pedido,
            u.nombre as atendido_por,
            m.numero_mesa,
            COALESCE(z.nombre_zona, 'Salón') as nombre_zona,
            DATE_FORMAT(p.fecha_hora_creacion, '%Y-%m-%d %H:%i') as fecha_hora,
            ep.nombre_estado as estado,
            COALESCE(
                fp.total_pagado,
                (SELECT SUM(dp.cantidad * dp.precio_unitario_historico) FROM Detalle_Pedido dp WHERE dp.id_pedido = p.id_pedido),
                0
            ) as total
        FROM Pedidos p
        JOIN Usuarios u ON p.id_usuario_mesero = u.id_usuario
        JOIN Mesas m ON p.id_mesa = m.id_mesa
        LEFT JOIN Zonas_Restaurante z ON m.id_zona = z.id_zona
        JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
        LEFT JOIN Facturas_Pagos fp ON p.id_pedido = fp.id_pedido
        WHERE ${periodWhereP}
        ORDER BY p.id_pedido DESC
        LIMIT 25
    `);

    return {
        ventas_hoy: Number(ventasHoyRows[0]?.ventas_hoy || 0),
        ventas_periodo: Number(ventasPeriodoRows[0]?.ventas_periodo || 0),
        facturas_periodo: Number(ventasPeriodoRows[0]?.facturas_periodo || 0),
        pedidos_activos: Number(pedidosRows[0]?.pedidos_activos || 0),
        mesas_ocupadas: Number(mesasOcupadasRows[0]?.mesas_ocupadas || 0),
        mesas_libres: Number(mesasLibresRows[0]?.mesas_libres || 0),
        total_mesas: Number(mesasTotalRows[0]?.total_mesas || 0),
        alertas_inventario: Number(alertasRows[0]?.alertas_inventario || 0),
        actividad_ventas: chartRows,
        mix_facturacion: mixFacturacion,
        total_mix_facturacion: totalMixSales,
        platillos_top: topDishesRows,
        actividad_reciente: recentOrdersRows
    };
};

const getMeseroStats = async (id_usuario_mesero, period = 'monthly') => {
    const periodWhereP = getPeriodCondition(period, 'p.fecha_hora_creacion');
    const periodWherePed = getPeriodCondition(period, 'ped.fecha_hora_creacion');

    const [mesasResumen] = await db.execute(`SELECT estado, COUNT(*) as cantidad FROM Mesas GROUP BY estado`);
    let mis_pedidos_activos = 0;
    let mis_comandas_recientes = [];

    if (id_usuario_mesero) {
        const [misPedidosRows] = await db.execute(`
            SELECT COUNT(*) as activos 
            FROM Pedidos p 
            JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado 
            WHERE p.id_usuario_mesero = ? AND ep.nombre_estado NOT IN ('Cancelado') AND ${periodWhereP}
        `, [id_usuario_mesero]);
        mis_pedidos_activos = misPedidosRows[0]?.activos || 0;

        const [comandasRows] = await db.execute(`
            SELECT 
                p.id_pedido,
                m.numero_mesa,
                COALESCE(z.nombre_zona, 'Salón') as nombre_zona,
                DATE_FORMAT(p.fecha_hora_creacion, '%Y-%m-%d %H:%i') as fecha_hora,
                ep.nombre_estado as estado,
                COALESCE((SELECT SUM(dp.cantidad * dp.precio_unitario_historico) FROM Detalle_Pedido dp WHERE dp.id_pedido = p.id_pedido), 0) as total
            FROM Pedidos p
            JOIN Mesas m ON p.id_mesa = m.id_mesa
            LEFT JOIN Zonas_Restaurante z ON m.id_zona = z.id_zona
            JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
            WHERE p.id_usuario_mesero = ? AND ${periodWhereP}
            ORDER BY p.id_pedido DESC
            LIMIT 15
        `, [id_usuario_mesero]);
        mis_comandas_recientes = comandasRows;
    }

    const [mesasDetalle] = await db.execute(`
        SELECT m.id_mesa, m.numero_mesa, m.estado, m.capacidad, z.nombre_zona 
        FROM Mesas m 
        LEFT JOIN Zonas_Restaurante z ON m.id_zona = z.id_zona 
        ORDER BY m.numero_mesa ASC
    `);

    const [topDishesRows] = await db.execute(`
        SELECT 
            p.id_producto,
            p.nombre_producto,
            c.nombre_categoria,
            CAST(SUM(dp.cantidad) AS SIGNED) as total_vendido,
            CAST(SUM(dp.cantidad * dp.precio_unitario_historico) AS DECIMAL(10,2)) as total_ingresos
        FROM Detalle_Pedido dp
        JOIN Productos p ON dp.id_producto = p.id_producto
        JOIN Categorias_Menu c ON p.id_categoria = c.id_categoria
        JOIN Pedidos ped ON dp.id_pedido = ped.id_pedido
        JOIN Estados_Pedido ep ON ped.id_estado = ep.id_estado
        WHERE ep.nombre_estado != 'Cancelado' AND ${periodWherePed}
        GROUP BY p.id_producto, p.nombre_producto, c.nombre_categoria
        ORDER BY total_vendido DESC
        LIMIT 5
    `);

    return { 
        resumen_mesas: mesasResumen, 
        mis_pedidos_activos, 
        mesas: mesasDetalle,
        mis_comandas: mis_comandas_recientes,
        platillos_top: topDishesRows
    };
};

const getCocinaStats = async () => {
    const [comandasPendientes] = await db.execute(`SELECT COUNT(*) as pendientes FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE ep.nombre_estado = 'Pendiente'`);
    const [comandasEnPreparacion] = await db.execute(`SELECT COUNT(*) as en_preparacion FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE ep.nombre_estado = 'En Preparación'`);
    const [comandasListasHoy] = await db.execute(`SELECT COUNT(*) as listas_hoy FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE ep.nombre_estado IN ('Listo', 'Servido') AND DATE(p.fecha_hora_creacion) = CURDATE()`);
    
    const [alertasInsumos] = await db.execute(`
        SELECT id_ingrediente, nombre_ingrediente, unidad_medida, stock_actual, 10 as stock_minimo
        FROM Ingredientes
        WHERE stock_actual <= 10
        ORDER BY stock_actual ASC
    `);

    return { 
        comandas_pendientes: comandasPendientes[0]?.pendientes || 0, 
        comandas_en_preparacion: comandasEnPreparacion[0]?.en_preparacion || 0,
        comandas_listas_hoy: comandasListasHoy[0]?.listas_hoy || 0,
        insumos_criticos: alertasInsumos
    };
};

const getCajaStats = async (period = 'monthly') => {
    const periodWhere = getPeriodCondition(period, 'fecha_hora_pago');
    const [pedidosListos] = await db.execute(`SELECT COUNT(*) as listos FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE ep.nombre_estado = 'Listo'`);
    const [cajaHoy] = await db.execute(`SELECT COALESCE(SUM(total_pagado), 0) AS total_ingresado, COUNT(*) as facturas_emitidas FROM Facturas_Pagos WHERE DATE(fecha_hora_pago) = CURDATE()`);
    const [cajaPeriodo] = await db.execute(`SELECT COALESCE(SUM(total_pagado), 0) AS total_periodo, COUNT(*) as facturas_periodo FROM Facturas_Pagos WHERE ${periodWhere}`);

    const [metodosResumen] = await db.execute(`
        SELECT mp.nombre_metodo, COALESCE(SUM(fp.total_pagado), 0) as total, COUNT(fp.id_factura) as cantidad
        FROM Metodos_Pago mp
        LEFT JOIN Facturas_Pagos fp ON mp.id_metodo = fp.id_metodo_pago AND ${periodWhere}
        GROUP BY mp.id_metodo, mp.nombre_metodo
        ORDER BY total DESC
    `);

    return { 
        pedidos_listos: pedidosListos[0]?.listos || 0, 
        ingresos_hoy: Number(cajaHoy[0]?.total_ingresado || 0), 
        facturas_emitidas_hoy: cajaHoy[0]?.facturas_emitidas || 0,
        ingresos_periodo: Number(cajaPeriodo[0]?.total_periodo || 0),
        facturas_periodo: cajaPeriodo[0]?.facturas_periodo || 0,
        metodos_pago: metodosResumen
    };
};

module.exports = { 
    getAdminStats, 
    getMeseroStats, 
    getCocinaStats, 
    getCajaStats 
};
