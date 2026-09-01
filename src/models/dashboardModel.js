const db = require('../config/db');

const getAdminStats = async () => {
    const [ventasRows] = await db.execute(`SELECT COALESCE(SUM(total_pagado), 0) AS ventas_hoy FROM Facturas_Pagos WHERE DATE(fecha_hora_pago) = CURDATE()`);
    const [pedidosRows] = await db.execute(`SELECT COUNT(*) as pedidos_activos FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE ep.nombre_estado IN ('Pendiente', 'En Preparación')`);
    const [mesasRows] = await db.execute(`SELECT COUNT(*) as mesas_ocupadas FROM Mesas WHERE estado = 'Ocupada'`);
    const [alertasRows] = await db.execute(`SELECT COUNT(*) as alertas_inventario FROM Ingredientes WHERE stock_actual <= stock_minimo`);
    return {
        ventas_hoy: Number(ventasRows[0].ventas_hoy),
        pedidos_activos: pedidosRows[0].pedidos_activos,
        mesas_ocupadas: mesasRows[0].mesas_ocupadas,
        alertas_inventario: alertasRows[0].alertas_inventario
    };
};

const getMeseroStats = async (id_usuario_mesero) => {
    const [mesasResumen] = await db.execute(`SELECT estado, COUNT(*) as cantidad FROM Mesas GROUP BY estado`);
    let mis_pedidos_activos = 0;
    if (id_usuario_mesero) {
        const [misPedidosRows] = await db.execute(`SELECT COUNT(*) as activos FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE p.id_usuario_mesero = ? AND ep.nombre_estado NOT IN ('Cancelado', 'Servido')`, [id_usuario_mesero]);
        mis_pedidos_activos = misPedidosRows[0].activos;
    }
    const [mesasDetalle] = await db.execute(`SELECT m.id_mesa, m.numero_mesa, m.estado, z.nombre_zona FROM Mesas m LEFT JOIN Zonas z ON m.id_zona = z.id_zona`);
    return { resumen_mesas: mesasResumen, mis_pedidos_activos, mesas: mesasDetalle };
};

const getCocinaStats = async () => {
    const [comandasPendientes] = await db.execute(`SELECT COUNT(*) as pendientes FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE ep.nombre_estado = 'Pendiente'`);
    const [comandasEnPreparacion] = await db.execute(`SELECT COUNT(*) as en_preparacion FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE ep.nombre_estado = 'En Preparación'`);
    return { comandas_pendientes: comandasPendientes[0].pendientes, comandas_en_preparacion: comandasEnPreparacion[0].en_preparacion };
};

const getCajaStats = async () => {
    const [pedidosListos] = await db.execute(`SELECT COUNT(*) as listos FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE ep.nombre_estado = 'Listo'`);
    const [cajaHoy] = await db.execute(`SELECT COALESCE(SUM(total_pagado), 0) AS total_ingresado, COUNT(*) as facturas_emitidas FROM Facturas_Pagos WHERE DATE(fecha_hora_pago) = CURDATE()`);
    return { pedidos_listos: pedidosListos[0].listos, ingresos_hoy: Number(cajaHoy[0].total_ingresado), facturas_emitidas_hoy: cajaHoy[0].facturas_emitidas };
};

module.exports = { getAdminStats, getMeseroStats, getCocinaStats, getCajaStats };
