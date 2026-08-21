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
    const [rows] = await db.execute(query, [id_producto]);
    return rows;
};

const saveRecetaProducto = async (id_producto, ingredientes) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Borrar receta anterior
        await connection.execute(`DELETE FROM Recetas_Producto WHERE id_producto = ?`, [id_producto]);

        // Insertar nuevos ingredientes de la receta
        for (const item of ingredientes) {
            await connection.execute(
                `INSERT INTO Recetas_Producto (id_producto, id_ingrediente, cantidad_necesaria) VALUES (?, ?, ?)`,
                [id_producto, item.id_ingrediente, item.cantidad_necesaria]
            );
        }

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
    getIngredientes,
    createIngrediente,
    updateIngrediente,
    deleteIngrediente,
    getRecetaProducto,
    saveRecetaProducto
};
