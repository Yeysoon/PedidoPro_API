const db = require('../config/db');

const getComandasPendientes = async () => {
    const query = `
        SELECT p.id_pedido, p.fecha_hora_creacion, p.notas_generales, m.numero_mesa, ep.nombre_estado, ep.id_estado,
               dp.id_detalle, prod.nombre_producto, dp.cantidad, dp.notas_especiales,
               u.nombre AS mesero_nombre
        FROM Pedidos p
        JOIN Mesas m ON p.id_mesa = m.id_mesa
        JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
        LEFT JOIN Detalle_Pedido dp ON p.id_pedido = dp.id_pedido
        LEFT JOIN Productos prod ON dp.id_producto = prod.id_producto
        LEFT JOIN Usuarios u ON p.id_usuario_mesero = u.id_usuario
        WHERE ep.id_estado IN (1, 2, 3, 4)
           OR ep.nombre_estado IN ('Pendiente', 'En Preparación', 'Listo', 'Servido')
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
                nombre_estado: row.nombre_estado,
                estado: row.nombre_estado,
                id_estado: Number(row.id_estado),
                mesero: row.mesero_nombre,
                detalles: []
            };
            comandasMap.set(row.id_pedido, nuevaComanda);
            comandas.push(nuevaComanda);
        }
        if (row.id_detalle && row.nombre_producto) {
            comandasMap.get(row.id_pedido).detalles.push({
                id_detalle: row.id_detalle,
                nombre_producto: row.nombre_producto,
                cantidad: row.cantidad || 1,
                notas_especiales: row.notas_especiales
            });
        }
    });

    return comandas;
};

const updateEstadoComanda = async (id_pedido, estado_nombre) => {
    const connection = await db.getConnection();
    try {
        let id_estado;
        if (typeof estado_nombre === 'number') {
            id_estado = estado_nombre;
        } else {
            const [estadoRows] = await connection.execute(`SELECT id_estado FROM Estados_Pedido WHERE nombre_estado = ?`, [estado_nombre]);
            if (estadoRows.length === 0) {
                // Fallback por nombre normalizado
                const map = { 'Pendiente': 1, 'En Preparación': 2, 'Listo': 3, 'Servido': 4 };
                id_estado = map[estado_nombre] || 1;
            } else {
                id_estado = estadoRows[0].id_estado;
            }
        }

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
