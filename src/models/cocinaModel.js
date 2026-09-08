const db = require('../config/db');

const getComandasPendientes = async () => {
    const query = `
        SELECT p.id_pedido, p.fecha_hora_creacion, p.notas_generales, m.numero_mesa, ep.nombre_estado, ep.id_estado,
               dp.id_detalle, dp.id_producto, prod.nombre_producto, dp.cantidad, dp.notas_especiales,
               u.nombre AS mesero_nombre,
               c.nombre_completo AS cliente_nombre, c.nit_documento AS cliente_nit
        FROM Pedidos p
        JOIN Mesas m ON p.id_mesa = m.id_mesa
        JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
        LEFT JOIN Detalle_Pedido dp ON p.id_pedido = dp.id_pedido
        LEFT JOIN Productos prod ON dp.id_producto = prod.id_producto
        LEFT JOIN Usuarios u ON p.id_usuario_mesero = u.id_usuario
        LEFT JOIN Clientes c ON p.id_cliente = c.id_cliente
        WHERE ep.nombre_estado NOT IN ('Cancelado', 'Cobrado', 'Anulado')
          AND ep.id_estado NOT IN (5, 6)
          AND p.id_pedido NOT IN (SELECT id_pedido FROM Facturas_Pagos)
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
                cliente_nombre: row.cliente_nombre,
                cliente_nit: row.cliente_nit,
                detalles: []
            };
            comandasMap.set(row.id_pedido, nuevaComanda);
            comandas.push(nuevaComanda);
        }
        if (row.id_detalle && row.nombre_producto) {
            comandasMap.get(row.id_pedido).detalles.push({
                id_detalle: row.id_detalle,
                id_producto: row.id_producto,
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
        await connection.beginTransaction();

        let id_estado;
        if (typeof estado_nombre === 'number') {
            id_estado = estado_nombre;
        } else {
            const [estadoRows] = await connection.execute(`SELECT id_estado FROM Estados_Pedido WHERE nombre_estado = ?`, [estado_nombre]);
            if (estadoRows.length === 0) {
                const map = { 'Pendiente': 1, 'En Preparación': 2, 'Listo': 3, 'Servido': 4 };
                id_estado = map[estado_nombre] || 1;
            } else {
                id_estado = estadoRows[0].id_estado;
            }
        }

        // Obtener estado anterior del pedido
        const [currentPedido] = await connection.execute(`SELECT id_estado FROM Pedidos WHERE id_pedido = ?`, [id_pedido]);
        const estadoAnterior = currentPedido.length > 0 ? Number(currentPedido[0].id_estado) : null;

        // 1. Si pasa de Pendiente (1) a Preparación o superior (>= 2), DESCONTAR inventario
        if (id_estado >= 2 && estadoAnterior === 1) {
            const [detalles] = await connection.execute(
                `SELECT id_producto, cantidad FROM Detalle_Pedido WHERE id_pedido = ?`,
                [id_pedido]
            );
            for (const d of detalles) {
                if (d.id_producto) {
                    const [recetas] = await connection.execute(
                        `SELECT id_ingrediente, cantidad_necesaria FROM Recetas_Producto WHERE id_producto = ?`,
                        [d.id_producto]
                    );
                    for (const r of recetas) {
                        const cantADescontar = parseFloat(r.cantidad_necesaria || 1) * parseFloat(d.cantidad || 1);
                        await connection.execute(
                            `UPDATE Ingredientes SET stock_actual = GREATEST(0, stock_actual - ?) WHERE id_ingrediente = ?`,
                            [cantADescontar, r.id_ingrediente]
                        );
                        console.log(`[Cocina] Stock rebajado - Pedido #${id_pedido}, Ingrediente #${r.id_ingrediente}: -${cantADescontar}`);
                    }
                }
            }
        }
        // 2. Si se regresa de Preparación o superior (>= 2) hacia Pendiente (1), RESTAURAR/SUMAR inventario
        else if (id_estado === 1 && estadoAnterior !== null && estadoAnterior >= 2) {
            const [detalles] = await connection.execute(
                `SELECT id_producto, cantidad FROM Detalle_Pedido WHERE id_pedido = ?`,
                [id_pedido]
            );
            for (const d of detalles) {
                if (d.id_producto) {
                    const [recetas] = await connection.execute(
                        `SELECT id_ingrediente, cantidad_necesaria FROM Recetas_Producto WHERE id_producto = ?`,
                        [d.id_producto]
                    );
                    for (const r of recetas) {
                        const cantARestaurar = parseFloat(r.cantidad_necesaria || 1) * parseFloat(d.cantidad || 1);
                        await connection.execute(
                            `UPDATE Ingredientes SET stock_actual = stock_actual + ? WHERE id_ingrediente = ?`,
                            [cantARestaurar, r.id_ingrediente]
                        );
                        console.log(`[Cocina] Stock restaurado - Pedido #${id_pedido}, Ingrediente #${r.id_ingrediente}: +${cantARestaurar}`);
                    }
                }
            }
        }

        const [result] = await connection.execute(`UPDATE Pedidos SET id_estado = ? WHERE id_pedido = ?`, [id_estado, id_pedido]);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        console.error('Error al actualizar estado de comanda e inventario:', error);
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    getComandasPendientes,
    updateEstadoComanda
};
