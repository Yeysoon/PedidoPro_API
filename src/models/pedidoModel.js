const db = require('../config/db');

const createPedido = async (id_mesa, id_usuario_mesero, notas_generales, detalles, id_cliente = null) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Obtener el id_estado para 'Pendiente'
        const [estadoRows] = await connection.execute(`SELECT id_estado FROM Estados_Pedido WHERE nombre_estado = 'Pendiente'`);
        if (estadoRows.length === 0) throw new Error("Estado 'Pendiente' no encontrado en la base de datos.");
        const id_estado = estadoRows[0].id_estado;

        // Insertar en Pedidos con id_cliente
        const [pedidoResult] = await connection.execute(
            `INSERT INTO Pedidos (id_mesa, id_usuario_mesero, id_estado, notas_generales, id_cliente) VALUES (?, ?, ?, ?, ?)`,
            [id_mesa, id_usuario_mesero, id_estado, notas_generales || '', id_cliente || null]
        );
        const id_pedido = pedidoResult.insertId;

        // Insertar en Detalle_Pedido de manera optimizada
        if (detalles && detalles.length > 0) {
            const productIds = detalles.map(d => Number(d.id_producto)).filter(Boolean);
            const placeholders = productIds.map(() => '?').join(',');
            const [productoRows] = await connection.execute(
                `SELECT id_producto, precio FROM Productos WHERE id_producto IN (${placeholders})`,
                productIds
            );
            const priceMap = new Map(productoRows.map(p => [Number(p.id_producto), Number(p.precio)]));

            for (const detalle of detalles) {
                const precio = priceMap.get(Number(detalle.id_producto)) || 0;
                await connection.execute(
                    `INSERT INTO Detalle_Pedido (id_pedido, id_producto, cantidad, precio_unitario_historico, notas_especiales) VALUES (?, ?, ?, ?, ?)`,
                    [id_pedido, detalle.id_producto, detalle.cantidad, precio, detalle.notas_especiales || '']
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
        SELECT p.id_pedido, p.fecha_hora_creacion, p.notas_generales, ep.nombre_estado,
               dp.id_detalle, prod.nombre_producto, dp.cantidad, dp.precio_unitario_historico,
               (dp.cantidad * dp.precio_unitario_historico) AS subtotal_linea
        FROM Pedidos p
        JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado
        JOIN Detalle_Pedido dp ON p.id_pedido = dp.id_pedido
        JOIN Productos prod ON dp.id_producto = prod.id_producto
        WHERE p.id_mesa = ? AND ep.nombre_estado NOT IN ('Cobrado', 'Cancelado')
        ORDER BY p.fecha_hora_creacion ASC
    `;
    const [rows] = await db.execute(query, [id_mesa]);
    return rows;
};

const cancelPedido = async (id_pedido) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [estadoRows] = await connection.execute(`SELECT id_estado FROM Estados_Pedido WHERE nombre_estado = 'Cancelado'`);
        if (estadoRows.length === 0) throw new Error("Estado 'Cancelado' no encontrado.");
        const id_estado_cancelado = estadoRows[0].id_estado;

        // Validar estado actual del pedido
        const [pedidoRows] = await connection.execute(
            `SELECT p.id_mesa, p.id_estado, ep.nombre_estado FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE p.id_pedido = ?`,
            [id_pedido]
        );
        if (pedidoRows.length === 0) throw new Error("Pedido no encontrado.");
        if (pedidoRows[0].nombre_estado === 'Cancelado') {
            await connection.rollback();
            return true;
        }
        if (['Servido', 'Cobrado'].includes(pedidoRows[0].nombre_estado)) {
            throw new Error(`No se puede cancelar un pedido con estado: ${pedidoRows[0].nombre_estado}`);
        }

        const id_mesa = pedidoRows[0].id_mesa;
        const id_estado_actual = Number(pedidoRows[0].id_estado);

        // Cambiar estado a Cancelado
        await connection.execute(`UPDATE Pedidos SET id_estado = ? WHERE id_pedido = ?`, [id_estado_cancelado, id_pedido]);

        // Devolver ingredientes al inventario SOLO si ya se habían rebajado (estado >= 2)
        if (id_estado_actual >= 2) {
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
        }

        // Liberar mesa
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


const updatePedido = async (id_pedido, id_mesa, notas_generales, detalles, id_cliente = null) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Verificar que el pedido exista y esté en estado 'Pendiente'
        const [pedidoRows] = await connection.execute(
            `SELECT p.id_mesa, ep.nombre_estado FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE p.id_pedido = ?`,
            [id_pedido]
        );
        if (pedidoRows.length === 0) throw new Error("Pedido no encontrado.");
        if (pedidoRows[0].nombre_estado !== 'Pendiente') {
            throw new Error(`No se puede editar el pedido porque ya está en estado: ${pedidoRows[0].nombre_estado}`);
        }

        const id_mesa_anterior = pedidoRows[0].id_mesa;

        // 1. Eliminar detalles anteriores
        await connection.execute(`DELETE FROM Detalle_Pedido WHERE id_pedido = ?`, [id_pedido]);

        // 2. Actualizar datos principales del pedido
        await connection.execute(
            `UPDATE Pedidos SET id_mesa = ?, notas_generales = ?, id_cliente = ? WHERE id_pedido = ?`,
            [id_mesa, notas_generales || '', id_cliente || null, id_pedido]
        );

        // 3. Insertar nuevos detalles de manera optimizada
        if (detalles && detalles.length > 0) {
            const productIds = detalles.map(d => Number(d.id_producto)).filter(Boolean);
            const placeholders = productIds.map(() => '?').join(',');
            const [productoRows] = await connection.execute(
                `SELECT id_producto, precio FROM Productos WHERE id_producto IN (${placeholders})`,
                productIds
            );
            const priceMap = new Map(productoRows.map(p => [Number(p.id_producto), Number(p.precio)]));

            for (const detalle of detalles) {
                const precio = priceMap.get(Number(detalle.id_producto)) || 0;
                await connection.execute(
                    `INSERT INTO Detalle_Pedido (id_pedido, id_producto, cantidad, precio_unitario_historico, notas_especiales) VALUES (?, ?, ?, ?, ?)`,
                    [id_pedido, detalle.id_producto, detalle.cantidad, precio, detalle.notas_especiales || '']
                );
            }
        }

        // 5. Si cambió de mesa, actualizar estados de mesa
        if (Number(id_mesa_anterior) !== Number(id_mesa)) {
            const [activeOnOld] = await connection.execute(
                `SELECT COUNT(*) as active FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE p.id_mesa = ? AND ep.nombre_estado NOT IN ('Cancelado', 'Cobrado') AND p.id_pedido != ?`,
                [id_mesa_anterior, id_pedido]
            );
            if (activeOnOld[0].active === 0) {
                await connection.execute(`UPDATE Mesas SET estado = 'Libre' WHERE id_mesa = ?`, [id_mesa_anterior]);
            }
            await connection.execute(`UPDATE Mesas SET estado = 'Ocupada' WHERE id_mesa = ?`, [id_mesa]);
        }

        await connection.commit();
        return id_pedido;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// GET todos los pedidos con filtros (Admin/Mesero)
const getAllPedidos = async (estado, fechaInicio, fechaFin, page, limit) => {
    const offset = (page - 1) * limit;
    let whereClause = '1=1';
    const params = [];

    if (estado) {
        whereClause += ' AND ep.nombre_estado = ?';
        params.push(estado);
    }
    if (fechaInicio && fechaFin) {
        whereClause += ' AND DATE(p.fecha_hora_creacion) BETWEEN ? AND ?';
        params.push(fechaInicio, fechaFin);
    }

    const dataQuery = `SELECT p.id_pedido, p.fecha_hora_creacion, p.notas_generales, ep.nombre_estado, m.numero_mesa, u.nombre AS mesero, (SELECT SUM(dp.cantidad * dp.precio_unitario_historico) FROM Detalle_Pedido dp WHERE dp.id_pedido = p.id_pedido) AS total FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado JOIN Mesas m ON p.id_mesa = m.id_mesa JOIN Usuarios u ON p.id_usuario_mesero = u.id_usuario WHERE ${whereClause} ORDER BY p.fecha_hora_creacion DESC LIMIT ? OFFSET ?`;
    const dataParams = [...params, limit.toString(), offset.toString()];

    const countQuery = `SELECT COUNT(*) as total FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado WHERE ${whereClause}`;
    
    const [[rows], [countRows]] = await Promise.all([
        db.execute(dataQuery, dataParams),
        db.execute(countQuery, params)
    ]);

    return { data: rows, total_registros: countRows[0].total };
};

// GET detalle completo de un pedido por ID
const getPedidoById = async (id_pedido) => {
    const [pedidoRows] = await db.execute(`SELECT p.id_pedido, p.id_mesa, p.id_cliente, p.fecha_hora_creacion, p.notas_generales, p.id_estado, ep.nombre_estado, m.numero_mesa, u.nombre AS mesero FROM Pedidos p JOIN Estados_Pedido ep ON p.id_estado = ep.id_estado JOIN Mesas m ON p.id_mesa = m.id_mesa JOIN Usuarios u ON p.id_usuario_mesero = u.id_usuario WHERE p.id_pedido = ?`, [id_pedido]);
    if (pedidoRows.length === 0) return null;

    const [detalleRows] = await db.execute(`SELECT dp.id_detalle, dp.cantidad, dp.precio_unitario_historico, dp.notas_especiales, (dp.cantidad * dp.precio_unitario_historico) AS subtotal, prod.nombre_producto, prod.id_producto, prod.precio FROM Detalle_Pedido dp JOIN Productos prod ON dp.id_producto = prod.id_producto WHERE dp.id_pedido = ?`, [id_pedido]);

    const total = detalleRows.reduce((sum, d) => sum + Number(d.subtotal), 0);
    return { ...pedidoRows[0], detalles: detalleRows, total };
};

module.exports = {
    createPedido,
    updatePedido,
    getCuentaMesa,
    cancelPedido,
    getAllPedidos,
    getPedidoById
};


