const db = require('../config/db');

// CRUD Ingredientes
const getIngredientes = async () => {
    const query = `SELECT * FROM Ingredientes`;
    const [rows] = await db.execute(query);
    return rows;
};

const createIngrediente = async (ingrediente) => {
    const { nombre_ingrediente, unidad_medida, stock_actual } = ingrediente;
    const query = `INSERT INTO Ingredientes (nombre_ingrediente, unidad_medida, stock_actual) VALUES (?, ?, ?)`;
    const [result] = await db.execute(query, [nombre_ingrediente, unidad_medida, stock_actual || 0]);
    return result.insertId;
};

const updateIngrediente = async (id, ingrediente) => {
    const { nombre_ingrediente, unidad_medida, stock_actual } = ingrediente;
    const query = `UPDATE Ingredientes SET nombre_ingrediente = ?, unidad_medida = ?, stock_actual = ? WHERE id_ingrediente = ?`;
    const [result] = await db.execute(query, [nombre_ingrediente, unidad_medida, stock_actual, id]);
    return result;
};

const deleteIngrediente = async (id) => {
    const query = `DELETE FROM Ingredientes WHERE id_ingrediente = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

// CRUD Recetas
const getRecetaProducto = async (id_producto) => {
    const query = `
        SELECT r.id_ingrediente, i.nombre_ingrediente, i.unidad_medida, r.cantidad_necesaria
        FROM Recetas_Producto r
        JOIN Ingredientes i ON r.id_ingrediente = i.id_ingrediente
        WHERE r.id_producto = ?
    `;
    const [rows] = await db.execute(query, [Number(id_producto)]);
    return rows;
};

const saveRecetaProducto = async (id_producto, ingredientes) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const prodId = Number(id_producto);
        // Borrar receta anterior
        await connection.execute(`DELETE FROM Recetas_Producto WHERE id_producto = ?`, [prodId]);

        // Insertar nuevos ingredientes de la receta
        if (Array.isArray(ingredientes)) {
            for (const item of ingredientes) {
                if (item && item.id_ingrediente) {
                    await connection.execute(
                        `INSERT INTO Recetas_Producto (id_producto, id_ingrediente, cantidad_necesaria) VALUES (?, ?, ?)`,
                        [prodId, Number(item.id_ingrediente), Number(item.cantidad_necesaria || 1)]
                    );
                }
            }
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        console.error('Error al guardar receta en base de datos:', error);
        throw error;
    } finally {
        connection.release();
    }
};


// Alertas de stock bajo (stock_actual <= 10)
const getIngredientesStockBajo = async () => {
    const query = `
        SELECT id_ingrediente, nombre_ingrediente, unidad_medida, stock_actual, 10 as stock_minimo,
               CASE WHEN stock_actual = 0 THEN 'Agotado' ELSE 'Stock Bajo' END AS alerta
        FROM Ingredientes
        WHERE stock_actual <= 10
        ORDER BY stock_actual ASC
    `;
    const [rows] = await db.execute(query);
    return rows;
};
module.exports = {
    getIngredientes,
    createIngrediente,
    updateIngrediente,
    deleteIngrediente,
    getRecetaProducto,
    saveRecetaProducto,
    getIngredientesStockBajo
};

