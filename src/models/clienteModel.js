const db = require('../config/db');

const getAllClientes = async () => {
    const query = `SELECT * FROM Clientes`;
    const [rows] = await db.execute(query);
    return rows;
};

const getClienteById = async (id) => {
    const query = `SELECT * FROM Clientes WHERE id_cliente = ?`;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
};

const createCliente = async (cliente) => {
    const { nit_documento, nombre_completo } = cliente;
    const nit = (nit_documento && String(nit_documento).trim()) ? String(nit_documento).trim() : null;
    const query = `
        INSERT INTO Clientes (nit_documento, nombre_completo)
        VALUES (?, ?)
    `;
    const [result] = await db.execute(query, [nit, nombre_completo.trim()]);
    return result.insertId;
};

const updateCliente = async (id, cliente) => {
    const { nit_documento, nombre_completo } = cliente;
    const nit = (nit_documento && String(nit_documento).trim()) ? String(nit_documento).trim() : null;
    const query = `
        UPDATE Clientes 
        SET nit_documento = ?, nombre_completo = ?
        WHERE id_cliente = ?
    `;
    const [result] = await db.execute(query, [nit, nombre_completo.trim(), id]);
    return result;
};

const deleteCliente = async (id) => {
    const query = `DELETE FROM Clientes WHERE id_cliente = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

module.exports = {
    getAllClientes,
    getClienteById,
    createCliente,
    updateCliente,
    deleteCliente
};
