const db = require('../config/db');

const getMenu = async () => {
    const query = `
        SELECT p.id_producto, p.nombre_producto, p.descripcion, p.precio, p.disponible, c.nombre_categoria
        FROM Productos p
        JOIN Categorias_Menu c ON p.id_categoria = c.id_categoria
        WHERE p.disponible = 1
    `;
    const [rows] = await db.execute(query);
    return rows;
};

const createProducto = async (producto) => {
    const { id_categoria, nombre_producto, descripcion, precio, disponible } = producto;
    const query = `
        INSERT INTO Productos (id_categoria, nombre_producto, descripcion, precio, disponible)
        VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [id_categoria, nombre_producto, descripcion, precio, disponible !== undefined ? disponible : 1]);
    return result;
};

const updateProducto = async (id, producto) => {
    const { id_categoria, nombre_producto, descripcion, precio, disponible } = producto;
    const query = `
        UPDATE Productos 
        SET id_categoria = ?, nombre_producto = ?, descripcion = ?, precio = ?, disponible = ?
        WHERE id_producto = ?
    `;
    const [result] = await db.execute(query, [id_categoria, nombre_producto, descripcion, precio, disponible, id]);
    return result;
};

const deleteProducto = async (id) => {
    const query = `UPDATE Productos SET disponible = 0 WHERE id_producto = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

// Categorias
const getCategorias = async () => {
    const query = `SELECT * FROM Categorias_Menu`;
    const [rows] = await db.execute(query);
    return rows;
};

const createCategoria = async (nombre_categoria) => {
    const query = `INSERT INTO Categorias_Menu (nombre_categoria) VALUES (?)`;
    const [result] = await db.execute(query, [nombre_categoria]);
    return result.insertId;
};

const updateCategoria = async (id, nombre_categoria) => {
    const query = `UPDATE Categorias_Menu SET nombre_categoria = ? WHERE id_categoria = ?`;
    const [result] = await db.execute(query, [nombre_categoria, id]);
    return result;
};

const deleteCategoria = async (id) => {
    const query = `DELETE FROM Categorias_Menu WHERE id_categoria = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

module.exports = {
    getMenu,
    createProducto,
    updateProducto,
    deleteProducto,
    getCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria
};

