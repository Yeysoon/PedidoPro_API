const db = require('../config/db');

const getComandasPendientes = async () => {
    const query = `
        SELECT p.id_pedido, p.fecha_hora_creacion, p.notas_generales, m.numero_mesa, ep.nombre_estado,
               dp.id_detalle, prod.nombre_producto, dp.cantidad, dp.notas_especiales
        FROM Pedidos p
        JOIN Mesas m ON p.id_mesa = m.id_mesa
        JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
        JOIN Detalle_Pedido dp ON p.id_pedido = dp.id_pedido
        JOIN Productos prod ON dp.id_producto = prod.id_producto
        WHERE ep.nombre_estado IN ('Pendiente', 'En Preparación')
        ORDER BY p.fecha_hora_creacion ASC
    `;
    const [rows] = await db.execute(query);
    
    // Agrupar por pedido
    const comandas = [];
    const comandasMap = new Map();

    rows.forEach(row => {
        if (!comandasMap.has(row.id_pedido)) {
            const nuevaComanda = {
                id_pedido: row.id_pedido,
                fecha_hora_creacion: row.fecha_hora_creacion,
                notas_generales: row.notas_generales,
                numero_mesa: row.numero_mesa,
                estado: row.nombre_estado,
                detalles: []
            };
            comandasMap.set(row.id_pedido, nuevaComanda);
            comandas.push(nuevaComanda);
        }
        comandasMap.get(row.id_pedido).detalles.push({
            id_detalle: row.id_detalle,
            nombre_producto: row.nombre_producto,
            cantidad: row.cantidad,
            notas_especiales: row.notas_especiales
        });
    });

    return comandas;
};

const updateEstadoComanda = async (id_pedido, estado_nombre) => {
    const connection = await db.getConnection();
    try {
        const [estadoRows] = await connection.execute(`SELECT id_estado FROM Estados_Pedido WHERE nombre_estado = ?`, [estado_nombre]);
        if (estadoRows.length === 0) throw new Error(`Estado '${estado_nombre}' no encontrado.`);
        const id_estado = estadoRows[0].id_estado;

        const [result] = await connection.execute(`UPDATE Pedidos SET id_estado = ? WHERE id_pedido = ?`, [id_estado, id_pedido]);
        return result;
    } finally {
        connection.release();
    }
};

module.exports = {
    getComandasPendientes,
    updateEstadoComanda
};
