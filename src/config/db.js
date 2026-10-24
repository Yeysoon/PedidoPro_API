const mysql = require('mysql2/promise');

const host = process.env.DB_HOST || 'caboose.proxy.rlwy.net';
const user = process.env.DB_USER || 'ybarillas';
const password = process.env.DB_PASSWORD || 'Umg1234!';
const database = process.env.DB_NAME || 'railway';
const port = parseInt(process.env.DB_PORT) || 42857;

console.log(`[DB] Conectando a MySQL en ${host}:${port} como ${user}...`);

const pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 15,
    maxIdle: 10,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 25000,
    timezone: 'Z',
    ssl: {
        rejectUnauthorized: false
    }
});

pool.getConnection()
    .then(async (connection) => {
        console.log(`[DB] ✅ Conectado exitosamente a MySQL (${database}) en ${host}:${port}`);
        try {
            await connection.execute("UPDATE Roles SET nombre_rol = 'Cocinero' WHERE nombre_rol = 'Cocina'");
            await connection.execute("UPDATE Facturas_Pagos SET total_pagado = ROUND(subtotal + COALESCE(propina, 0), 2), impuestos = ROUND((subtotal / 1.12) * 0.12, 2) WHERE total_pagado > subtotal + COALESCE(propina, 0)");
            await connection.execute("DELETE FROM Mesas WHERE numero_mesa < 1 AND id_mesa NOT IN (SELECT DISTINCT id_mesa FROM Pedidos)");
            await connection.execute("UPDATE Mesas SET numero_mesa = ABS(numero_mesa) WHERE numero_mesa < 1");

            // Insumos requeridos para Camarones al Ajillo, Limonada con Hierbabuena y Pastel de Chocolate Volcán
            const nuevosIngredientes = [
                ['Camarones Jumbo Limpios', 'Libras (lb)', 40.00],
                ['Dientes de Ajo Fresco', 'Libras (lb)', 15.00],
                ['Aceite de Oliva Extra Virgen', 'Litros (L)', 20.00],
                ['Perejil Fresco Picado', 'Libras (lb)', 10.00],
                ['Limón Persa Fresco', 'Libras (lb)', 35.00],
                ['Hierbabuena Fresca en Hoja', 'Libras (lb)', 15.00],
                ['Jarabe de Azúcar de Caña', 'Litros (L)', 25.00],
                ['Chocolate Amargo 70% Repostería', 'Libras (lb)', 30.00],
                ['Harina de Trigo para Bizcocho', 'Libras (lb)', 40.00],
                ['Helado Artesanal de Vainilla', 'Litros (L)', 20.00],
                ['Mantequilla sin Sal', 'Libras (lb)', 25.00]
            ];

            for (const [nom, unidad, stock] of nuevosIngredientes) {
                await connection.execute(
                    "INSERT INTO Ingredientes (nombre_ingrediente, unidad_medida, stock_actual) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE nombre_ingrediente = VALUES(nombre_ingrediente)",
                    [nom, unidad, stock]
                );
            }

            // Mapeo de IDs
            const [ingRows] = await connection.execute("SELECT id_ingrediente, nombre_ingrediente FROM Ingredientes");
            const ingMap = {};
            ingRows.forEach(r => { ingMap[r.nombre_ingrediente] = r.id_ingrediente; });

            const [prodRows] = await connection.execute("SELECT id_producto, nombre_producto FROM Productos");
            const prodMap = {};
            prodRows.forEach(r => { prodMap[r.nombre_producto.toLowerCase().trim()] = r.id_producto; });

            const recetas = [
                {
                    nombre: 'camarones al ajillo',
                    items: [
                        ['Camarones Jumbo Limpios', 0.50],
                        ['Dientes de Ajo Fresco', 0.05],
                        ['Aceite de Oliva Extra Virgen', 0.05],
                        ['Perejil Fresco Picado', 0.02]
                    ]
                },
                {
                    nombre: 'limonada con hierbabuena',
                    items: [
                        ['Limón Persa Fresco', 0.25],
                        ['Hierbabuena Fresca en Hoja', 0.05],
                        ['Jarabe de Azúcar de Caña', 0.05]
                    ]
                },
                {
                    nombre: 'pastel de chocolate volcán',
                    items: [
                        ['Chocolate Amargo 70% Repostería', 0.25],
                        ['Harina de Trigo para Bizcocho', 0.15],
                        ['Helado Artesanal de Vainilla', 0.10],
                        ['Mantequilla sin Sal', 0.08]
                    ]
                }
            ];

            for (const rec of recetas) {
                let idProd = prodMap[rec.nombre];
                if (!idProd) {
                    const matchKey = Object.keys(prodMap).find(k => k.includes(rec.nombre.slice(0, 10)));
                    if (matchKey) idProd = prodMap[matchKey];
                }
                if (idProd) {
                    for (const [nomIng, cant] of rec.items) {
                        const idIng = ingMap[nomIng];
                        if (idIng) {
                            await connection.execute(
                                "INSERT INTO Recetas_Producto (id_producto, id_ingrediente, cantidad_necesaria) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE cantidad_necesaria = VALUES(cantidad_necesaria)",
                                [idProd, idIng, cant]
                            );
                        }
                    }
                }
            }
        } catch (_) {}
        connection.release();
    })
    .catch((err) => {
        console.error('[DB] ❌ Error de conexión:', err.message);
    });

module.exports = pool;
