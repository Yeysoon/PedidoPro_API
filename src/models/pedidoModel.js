const db = require('../config/db');

const createPedido = async (id_mesa, id_usuario_mesero, notas_generales, detalles) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Obtener el id_estado para 'Pendiente'
        const [estadoRows] = await connection.execute(`SELECT id_estado FROM Estados_Pedido WHERE nombre_estado = 'Pendiente'`);
        if (estadoRows.length === 0) throw new Error("Estado 'Pendiente' no encontrado en la base de datos.");
        const id_estado = estadoRows[0].id_estado;

        // Insertar en Pedidos
        const [pedidoResult] = await connection.execute(
            `INSERT INTO Pedidos (id_mesa, id_usuario_mesero, id_estado, notas_generales) VALUES (?, ?, ?, ?)`,
            [id_mesa, id_usuario_mesero, id_estado, notas_generales || '']
        );
        const id_pedido = pedidoResult.insertId;

        // Insertar en Detalle_Pedido
        for (const detalle of detalles) {
            // Obtener precio actual del producto
            const [productoRows] = await connection.execute(`SELECT precio FROM Productos WHERE id_producto = ?`, [detalle.id_producto]);
            if (productoRows.length === 0) throw new Error(`Producto ${detalle.id_producto} no encontrado.`);
            const precio_unitario_historico = productoRows[0].precio;

            await connection.execute(
                `INSERT INTO Detalle_Pedido (id_pedido, id_producto, cantidad, precio_unitario_historico, notas_especiales) VALUES (?, ?, ?, ?, ?)`,
                [id_pedido, detalle.id_producto, detalle.cantidad, precio_unitario_historico, detalle.notas_especiales || '']
            );

            // Deducción de Inventario (Recetas)
            const [recetaRows] = await connection.execute(
                `SELECT id_ingrediente, cantidad_necesaria FROM Recetas_Producto WHERE id_producto = ?`,
                [detalle.id_producto]
            );

            for (const receta of recetaRows) {
                const cantidadADescontar = receta.cantidad_necesaria * detalle.cantidad;
                await connection.execute(
                    `UPDATE Ingredientes SET stock_actual = stock_actual - ? WHERE id_ingrediente = ?`,
                    [cantidadADescontar, receta.id_ingrediente]
                );
            }
        }

        // Actualizar estado de la mesa a 'Ocupada'
        await connection.execute(`UPDATE Mesas SET estado = 'Ocupada' WHERE id_mesa = ?`, [id_mesa]);

        await connection.commit();
        return id_pedido;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getCuentaMesa = async (id_mesa) => {
    const query = `
        SELECT p.id_pedido, p.fecha_hora_creacion, ep.nombre_estado, 
               dp.id_detalle, prod.nombre_producto, dp.cantidad, dp.precio_unitario_historico,
               (dp.cantidad * dp.precio_unitario_historico) as subtotal
        FROM Pedidos p
        JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
        JOIN Detalle_Pedido dp ON p.id_pedido = dp.id_pedido
        JOIN Productos prod ON dp.id_producto = prod.id_producto
        WHERE p.id_mesa = ? AND ep.nombre_estado NOT IN ('Servido', 'Cancelado')
    `;
    const [rows] = await db.execute(query, [id_mesa]);
    return rows;
};

const cancelPedido = async (id_pedido) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Obtener estado 'Cancelado'
        const [estadoRows] = await connection.execute(`SELECT id_estado FROM Estados_Pedido WHERE nombre_estado = 'Cancelado'`);
        const id_estado_cancelado = estadoRows[0].id_estado;

        // Verificar si el pedido no está ya cancelado o servido
        const [pedidoRows] = await connection.execute(`
            SELECT p.id_mesa, ep.nombre_estado 
            FROM Pedidos p 
            JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado 
            WHERE p.id_pedido = ?
        `, [id_pedido]);

        if (pedidoRows.length === 0) throw new Error("Pedido no encontrado.");
        if (['Cancelado', 'Servido'].includes(pedidoRows[0].nombre_estado)) {
            throw new Error(`No se puede cancelar un pedido con estado: ${pedidoRows[0].nombre_estado}`);
        }

        const id_mesa = pedidoRows[0].id_mesa;

        // Cambiar estado a Cancelado
        await connection.execute(`UPDATE Pedidos SET id_estado = ? WHERE id_pedido = ?`, [id_estado_cancelado, id_pedido]);

        // Devolver ingredientes al inventario
        const [detalleRows] = await connection.execute(`SELECT id_producto, cantidad FROM Detalle_Pedido WHERE id_pedido = ?`, [id_pedido]);
        
        for (const detalle of detalleRows) {
            const [recetaRows] = await connection.execute(
                `SELECT id_ingrediente, cantidad_necesaria FROM Recetas_Producto WHERE id_producto = ?`,
                [detalle.id_producto]
            );

            for (const receta of recetaRows) {
                const cantidadADevolver = receta.cantidad_necesaria * detalle.cantidad;
                await connection.execute(
                    `UPDATE Ingredientes SET stock_actual = stock_actual + ? WHERE id_ingrediente = ?`,
                    [cantidadADevolver, receta.id_ingrediente]
                );
            }
        }

        // Liberar mesa (asumiendo que era el único pedido activo, para simplificar)
        // En la vida real, se revisaría si no hay otros pedidos activos en la misma mesa.
        await connection.execute(`UPDATE Mesas SET estado = 'Libre' WHERE id_mesa = ?`, [id_mesa]);

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
    createPedido,
    getCuentaMesa,
    cancelPedido
};
